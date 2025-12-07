import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, Users, ArrowLeft } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface TribeWithLastMessage {
  id: string;
  title: string;
  cover_url: string | null;
  last_message: string | null;
  last_message_at: string | null;
}

export default function Messages() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tribes, setTribes] = useState<TribeWithLastMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user) {
      fetchTribeConversations();
    }
  }, [user, isAuthenticated, authLoading, navigate]);

  const fetchTribeConversations = async () => {
    if (!user) return;

    // Get tribes the user is a member of
    const { data: memberships, error: memberError } = await supabase
      .from('tribe_members')
      .select('tribe_id')
      .eq('user_id', user.id);

    if (memberError || !memberships?.length) {
      setIsLoading(false);
      return;
    }

    const tribeIds = memberships.map(m => m.tribe_id);

    // Get tribe details
    const { data: tribesData, error: tribesError } = await supabase
      .from('tribes')
      .select('id, title, cover_url')
      .in('id', tribeIds);

    if (tribesError || !tribesData) {
      setIsLoading(false);
      return;
    }

    // Get last message for each tribe
    const tribesWithMessages: TribeWithLastMessage[] = await Promise.all(
      tribesData.map(async (tribe) => {
        const { data: messages } = await supabase
          .from('messages')
          .select('content, created_at')
          .eq('tribe_id', tribe.id)
          .order('created_at', { ascending: false })
          .limit(1);

        return {
          ...tribe,
          last_message: messages?.[0]?.content || null,
          last_message_at: messages?.[0]?.created_at || null,
        };
      })
    );

    // Sort by last message time
    tribesWithMessages.sort((a, b) => {
      if (!a.last_message_at) return 1;
      if (!b.last_message_at) return -1;
      return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
    });

    setTribes(tribesWithMessages);
    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-heading font-bold">Messages</h1>
        </div>

        {/* Conversations List */}
        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-card rounded-xl border border-border p-4 animate-pulse"
              >
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))
          ) : tribes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-muted/30 rounded-2xl"
            >
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
              <p className="text-muted-foreground mb-4">
                Join a tribe to start chatting with members
              </p>
              <Button asChild>
                <Link to="/groups">Browse Tribes</Link>
              </Button>
            </motion.div>
          ) : (
            tribes.map((tribe, index) => (
              <motion.div
                key={tribe.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={`/groups/${tribe.id}?tab=chat`}
                  className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage 
                      src={tribe.cover_url || `https://picsum.photos/200/200?random=${tribe.id}`} 
                      alt={tribe.title} 
                    />
                    <AvatarFallback>
                      <Users className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{tribe.title}</p>
                      {tribe.last_message_at && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(tribe.last_message_at), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {tribe.last_message || 'No messages yet'}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
