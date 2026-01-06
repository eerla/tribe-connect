import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Trash2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  body: string;
  user_id: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface EventCommentsProps {
  eventId: string;
  eventTitle?: string;
  organizerId?: string;
  isAttendee?: boolean;
  isOrganizer?: boolean;
}

export function EventComments({ 
  eventId, 
  eventTitle,
  organizerId,
  isAttendee = false, 
  isOrganizer = false 
}: EventCommentsProps) {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch comments on mount
  useEffect(() => {
    fetchComments();

    // Set up realtime subscription
    const channel = supabase
      .channel(`event-comments-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_comments',
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          // Fetch the profile for the new comment
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', (payload.new as Comment).user_id)
            .maybeSingle();

          const newCommentData = {
            ...(payload.new as Comment),
            profile: profile || undefined,
          };

          setComments(prev => [...prev, newCommentData]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('event_comments')
        .select(`
          id,
          body,
          user_id,
          created_at
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      if (!data || data.length === 0) {
        setComments([]);
        setIsLoading(false);
        return;
      }

      // Fetch profiles for all unique user IDs
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      const commentsWithProfiles = data.map(comment => ({
        ...comment,
        profile: profileMap.get(comment.user_id),
      }));

      setComments(commentsWithProfiles);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load comments',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || isSending) return;

    if (!isAttendee && !isOrganizer) {
      toast({
        title: 'Not allowed',
        description: 'You must be an event attendee to comment',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase.from('event_comments').insert({
        event_id: eventId,
        user_id: user.id,
        body: newComment.trim(),
      });

      if (error) throw error;

      // Notify event organizer (only if not commenting on own event)
      if (organizerId && organizerId !== user.id) {
        await supabase.from('notifications').insert({
          user_id: organizerId,
          actor_id: user.id,
          type: 'event_comment',
          payload: {
            event_id: eventId,
            event_title: eventTitle || 'an event',
            comment_preview: newComment.trim().slice(0, 100),
          },
        });
      }

      setNewComment('');
    } catch (error: any) {
      console.error('Error posting comment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to post comment',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const deleteComment = async (commentId: string, commentUserId: string) => {
    // Only allow deletion if you're the comment author or event organizer
    if (!user || (user.id !== commentUserId && !isOrganizer)) {
      toast({
        title: 'Not allowed',
        description: 'You can only delete your own comments',
        variant: 'destructive',
      });
      return;
    }

    setIsDeleting(commentId);
    try {
      const { error } = await supabase
        .from('event_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setComments(prev => prev.filter(c => c.id !== commentId));
      toast({
        title: 'Comment deleted',
      });
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete comment',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">Sign in to view and post comments</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comments List */}
      <div className="bg-muted/30 rounded-2xl p-6 space-y-4 min-h-[200px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-center">
            <div>
              <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">No comments yet</p>
              <p className="text-sm text-muted-foreground/70">Be the first to share your thoughts!</p>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {comments.map((comment) => {
              const canDelete = user?.id === comment.user_id || isOrganizer;
              return (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 transition-colors"
                >
                  <div className="flex gap-4">
                    {/* Avatar */}
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={comment.profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {comment.profile?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    {/* Comment Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {comment.profile?.full_name || 'Anonymous'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                        {comment.body}
                      </p>
                    </div>

                    {/* Delete Button */}
                    {canDelete && (
                      <button
                        onClick={() => deleteComment(comment.id, comment.user_id)}
                        disabled={isDeleting === comment.id}
                        className="ml-2 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors flex-shrink-0"
                        title="Delete comment"
                      >
                        {isDeleting === comment.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Comment Composer */}
      {(isAttendee || isOrganizer) && (
        <form onSubmit={sendComment} className="space-y-3">
          <Textarea
            placeholder="Share your thoughts about this event..."
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={isSending}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!newComment.trim() || isSending}
              className="gap-2"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Post Comment
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {!isAttendee && !isOrganizer && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Join this event to post comments</p>
        </div>
      )}
    </div>
  );
}
