import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  MapPin, 
  Calendar,
  Share2,
  MessageCircle,
  ArrowLeft,
  Lock,
  Loader2
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TribeChat } from '@/components/chat/TribeChat';
import { EventCard } from '@/components/cards/EventCard';
import { useAuth } from '@/hooks/useAuth';
import { useUserTribes } from '@/hooks/useTribes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Tribe {
  id: string;
  owner: string;
  title: string;
  slug?: string;
  description?: string | null;
  cover_url?: string | null;
  city?: string | null;
  is_private?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export default function GroupDetail() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { refetch: refetchUserTribes } = useUserTribes(user?.id);
  const [tribe, setTribe] = useState<Tribe | null>(null);
  const [tribeEvents, setTribeEvents] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    const fetchTribe = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('tribes')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setTribe(data);
      } catch (error) {
        console.error('Error fetching tribe:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTribe();
  }, [id]);

  // Fetch tribe events
  useEffect(() => {
    if (!tribe?.id) return;

    const fetchTribeEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('tribe_id', tribe.id)
          .eq('is_cancelled', false)
          .order('starts_at', { ascending: true });

        if (error) throw error;
        setTribeEvents((data as any[]) || []);
      } catch (error) {
        console.error('Error fetching tribe events:', error);
      }
    };

    fetchTribeEvents();
  }, [tribe?.id]);

  // Fetch tribe members
  useEffect(() => {
    if (!tribe?.id) return;

    const fetchMembers = async () => {
      try {
        const { data, error } = await supabase
          .from('tribe_members')
          .select('user_id')
          .eq('tribe_id', tribe.id);

        if (error) throw error;

        const userIds = (data || []).map((item: any) => item.user_id);
        setIsMember(Boolean(user?.id && userIds.includes(user.id)));

        if (userIds.length === 0) {
          setMembers([]);
          return;
        }

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, bio')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        const membersList = (profilesData || []).map((profile: any) => ({
          id: profile.id,
          name: profile.full_name || 'Unknown User',
          avatar_url: profile.avatar_url,
          location: profile.bio || 'Member'
        }));

        setMembers(membersList);
      } catch (error) {
        console.error('Error fetching tribe members:', error);
      }
    };

    fetchMembers();
  }, [tribe?.id, user?.id]);

  const handleJoin = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to join this tribe",
      });
      return;
    }

    if (!user?.id || !tribe?.id) {
      toast({
        title: "Error",
        description: "Missing user or tribe information",
        variant: "destructive",
      });
      return;
    }

      try {
      const { error } = await supabase
        .from('tribe_members')
        .insert({
          tribe_id: tribe.id,
          user_id: user.id,
          role: 'member',
        });

      if (error) {
        // treat duplicate key as success
        if (error.code === '23505' || (error.message || '').includes('duplicate')) {
          setIsMember(true);
          return;
        }
        throw error;
      }

      // refresh members list
      setIsMember(true);
      if (typeof refetchUserTribes === 'function') {
        try { await refetchUserTribes(); } catch {};
      }
      try {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, bio')
          .in('id', [user.id]);

        if (profilesData && profilesData.length > 0) {
          setMembers(prev => [{
            id: profilesData[0].id,
            name: profilesData[0].full_name || 'You',
            avatar_url: profilesData[0].avatar_url,
            location: profilesData[0].bio || 'Member'
          }, ...prev]);
        }
      } catch (err) {
        // ignore member refresh errors
      }

      toast({
        title: "Welcome to the tribe!",
        description: `You've joined ${tribe.title || 'this tribe'}`,
      });
    } catch (error: any) {
      console.error('Error joining tribe:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to join tribe",
        variant: "destructive",
      });
    }
  };

  const handleLeave = async () => {
    if (!isAuthenticated) {
      toast({ title: "Sign in required", description: "Please sign in to leave this tribe" });
      return;
    }
    if (!user?.id || !tribe?.id) return;

    try {
      const { error } = await supabase
        .from('tribe_members')
        .delete()
        .match({ tribe_id: tribe.id, user_id: user.id });

      if (error) throw error;

      setIsMember(false);
      setMembers(prev => prev.filter(m => m.id !== user.id));
      // refetch profile lists if available:
      if (typeof refetchUserTribes === 'function') {
        try { await refetchUserTribes(); } catch {}
      }
      toast({ title: "Left tribe", description: `You left ${tribe.title || 'this tribe'}` });
    } catch (err: any) {
      console.error('Error leaving tribe:', err);
      toast({ 
        title: "Error", 
        description: err.message || "Failed to leave tribe", 
        variant: "destructive" 
      });
    }
};

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        </div>
      </Layout>
    );
  }

  if (!tribe) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Tribe not found</h1>
          <Button asChild>
            <Link to="/groups">Browse Tribes</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Image */}
      <div className="relative h-[35vh] md:h-[45vh] overflow-hidden bg-muted">
        {tribe.cover_url ? (
          <img
            src={tribe.cover_url}
            alt={tribe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <Users className="h-20 w-20 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        {/* Back Button */}
        <div className="absolute top-4 left-4">
          <Button variant="secondary" size="sm" asChild>
            <Link to="/groups">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
      </div>

      <div className="container -mt-16 relative z-10 pb-16">
        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-2xl md:text-3xl font-heading font-bold">
                  {tribe.title}
                </h1>
                {tribe.is_private && (
                  <Badge variant="outline" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Private
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                {tribe.city && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {tribe.city}
                  </span>
                )}
                {tribe.created_at && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    Created {new Date(tribe.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              <p className="text-muted-foreground">
                {tribe.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* {isMember ? (
                <Button variant="destructive" size="lg" onClick={handleLeave}>
                  Leave Tribe
                </Button>
              ) : (
                <Button variant="hero" size="lg" onClick={handleJoin}>
                  Join Tribe
                </Button>
              )} */}
              {isMember ? (
                <Button variant="destructive" size="lg" onClick={handleLeave}>
                  Leave Tribe</Button>
              ) : (
                <Button variant="hero" size="lg" onClick={handleJoin}>
                  Join Tribe</Button>
              )}
              <Button variant="outline" size="lg">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              {user?.id === tribe.owner && (
                <Button asChild size="lg" className="ml-2">
                  <Link to={`/events/create?tribe=${tribe.id}`}>Create Event</Link>
                </Button>
              )}
            </div>
          </div>
        </motion.div>


        {/* Tabs */}
        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="events" className="gap-2">
              <Calendar className="h-4 w-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Chat
            </TabsTrigger>
          </TabsList>

          {/* Events Tab */}
          <TabsContent value="events">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {tribeEvents.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {tribeEvents.map((event, index) => (
                        <EventCard key={event.id} event={event} index={index} />
                      ))}
                    </div>
              ) : (
                <div className="text-center py-16 bg-muted/30 rounded-2xl">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
                  <p className="text-muted-foreground mb-4">
                    Be the first to create an event for this tribe
                  </p>
                  {user?.id === tribe.owner && (
                    <Button asChild>
                      <Link to={`/events/create?tribe=${tribe.id}`}>Create Event</Link>
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card rounded-2xl border border-border p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-heading font-semibold">
                  Members ({members.length})
                </h3>
              </div>
              
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {members.map((user) => (
                  <Link
                    key={user.id}
                    to={`/profile/${user.id}`}
                    className="flex items-center gap-3 p-4 rounded-xl hover:bg-muted transition-colors"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar_url} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.location}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card rounded-2xl border border-border overflow-hidden"
            >
              <TribeChat tribeId={tribe.id} isMember={isAuthenticated} />
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
