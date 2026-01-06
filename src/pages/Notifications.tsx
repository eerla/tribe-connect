import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Calendar, 
  Users, 
  MessageCircle, 
  Check, 
  CheckCheck,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  payload: any;
  is_read: boolean;
  created_at: string;
}

interface NotificationWithProfile extends Notification {
  actor_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export default function Notifications() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getNotificationContent = (notif: NotificationWithProfile) => {
    const actorName = notif.actor_profile?.full_name || 'Someone';
    
    switch (notif.type) {
      case 'event_rsvp':
        return {
          title: `${actorName} is attending your event`,
          message: notif.payload?.event_title || 'an event',
          link: `/events/${notif.payload?.event_id}`,
        };
      case 'event_comment':
        return {
          title: `${actorName} commented on your event`,
          message: notif.payload?.comment_preview || notif.payload?.event_title,
          link: `/events/${notif.payload?.event_id}`,
        };
      case 'event_cancelled':
        return {
          title: 'Event cancelled',
          message: `"${notif.payload?.event_title}" has been cancelled`,
          link: `/events/${notif.payload?.event_id}`,
        };
      case 'tribe_join':
        return {
          title: `${actorName} joined your tribe`,
          message: notif.payload?.tribe_title || 'your tribe',
          link: `/groups/${notif.payload?.tribe_id}`,
        };
      default:
        return {
          title: 'New notification',
          message: JSON.stringify(notif.payload),
          link: null,
        };
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user) {
      fetchNotifications();
      
      // Set up realtime subscription
      const channel = supabase
        .channel('notifications-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          async (payload) => {
            const newNotif = payload.new as Notification;
            
            // Fetch the actor profile for the new notification
            let notifWithProfile: NotificationWithProfile = newNotif;
            if (newNotif.actor_id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', newNotif.actor_id)
                .maybeSingle();
              
              notifWithProfile = {
                ...newNotif,
                actor_profile: profile || undefined,
              };
            }
            
            setNotifications(prev => [notifWithProfile, ...prev]);
            
            // Use the getNotificationContent helper to show proper toast
            const content = getNotificationContent(notifWithProfile);
            toast({
              title: content.title,
              description: content.message,
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, isAuthenticated, authLoading, navigate]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50) as { data: Notification[] | null; error: any };

    if (error) {
      console.error('Error fetching notifications:', error);
      setIsLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    // Fetch actor profiles
    const actorIds = [...new Set(data.map(n => n.actor_id).filter(Boolean))];
    if (actorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', actorIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      const notificationsWithProfiles = data.map(notif => ({
        ...notif,
        actor_profile: notif.actor_id ? profileMap.get(notif.actor_id) : undefined,
      }));

      setNotifications(notificationsWithProfiles);
    } else {
      setNotifications(data);
    }

    setIsLoading(false);
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (!error) {
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast({ title: 'All notifications marked as read' });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'event_rsvp':
      case 'event_comment':
      case 'event_cancelled':
      case 'event_reminder':
        return <Calendar className="h-5 w-5" />;
      case 'tribe_join':
      case 'tribe_invite':
        return <Users className="h-5 w-5" />;
      case 'new_message':
        return <MessageCircle className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-heading font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  {unreadCount} unread
                </p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-card rounded-xl border border-border p-4 animate-pulse"
              >
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))
          ) : notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-muted/30 rounded-2xl"
            >
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
              <p className="text-muted-foreground">
                When you get notifications, they'll show up here
              </p>
            </motion.div>
          ) : (
            notifications.map((notification, index) => {
              const content = getNotificationContent(notification);
              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-card rounded-xl border transition-colors ${
                    notification.is_read
                      ? 'border-border'
                      : 'border-primary/30 bg-primary/5'
                  }`}
                >
                  <div className="p-4 flex gap-4">
                    <div
                      className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                        notification.is_read
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{content.title}</p>
                          {content.message && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {content.message}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {content.link && (
                        <Link
                          to={content.link}
                          className="text-sm text-primary hover:underline mt-2 inline-block"
                          onClick={() => markAsRead(notification.id)}
                        >
                          View details →
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}
