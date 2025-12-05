import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  MapPin, 
  Calendar,
  Share2,
  MessageCircle,
  ArrowLeft,
  Settings,
  Lock
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventCard } from '@/components/cards/EventCard';
import { mockTribes, mockEvents, mockUsers } from '@/data/mockData';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export default function GroupDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const tribe = mockTribes.find(t => t.id === id);
  const tribeEvents = mockEvents.filter(e => e.tribe_id === id);
  const members = mockUsers.slice(0, 6);

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

  const handleJoin = () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to join this tribe",
      });
      return;
    }
    toast({
      title: "Welcome to the tribe!",
      description: `You've joined ${tribe.name}`,
    });
  };

  return (
    <Layout>
      {/* Hero Image */}
      <div className="relative h-[35vh] md:h-[45vh] overflow-hidden">
        <img
          src={tribe.cover_image || `https://picsum.photos/1600/900?random=${tribe.id}`}
          alt={tribe.name}
          className="w-full h-full object-cover"
        />
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
                  {tribe.name}
                </h1>
                {tribe.is_private && (
                  <Badge variant="outline" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Private
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {tribe.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {tribe.member_count.toLocaleString()} members
                </span>
              </div>

              <p className="text-muted-foreground">
                {tribe.description}
              </p>

              <Badge className="mt-4">{tribe.category}</Badge>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="hero" size="lg" onClick={handleJoin}>
                Join Tribe
              </Button>
              <Button variant="outline" size="lg">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
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
                  <Button asChild>
                    <Link to="/events/create">Create Event</Link>
                  </Button>
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
                  Members ({tribe.member_count})
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
              className="bg-card rounded-2xl border border-border p-6 text-center py-16"
            >
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Tribe Chat</h3>
              <p className="text-muted-foreground mb-4">
                {isAuthenticated 
                  ? "Join the tribe to participate in the chat"
                  : "Sign in and join the tribe to chat with members"
                }
              </p>
              {!isAuthenticated && (
                <Button asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
