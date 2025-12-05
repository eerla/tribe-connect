import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Share2, 
  Heart,
  Video,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockEvents, mockUsers } from '@/data/mockData';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export default function EventDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const event = mockEvents.find(e => e.id === id);

  if (!event) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Event not found</h1>
          <Button asChild>
            <Link to="/events">Browse Events</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const startDate = new Date(event.start_date);
  const endDate = event.end_date ? new Date(event.end_date) : null;
  const attendees = mockUsers.slice(0, 5);
  const isFull = event.max_attendees ? event.attendee_count >= event.max_attendees : false;

  const handleRSVP = () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to RSVP to this event",
      });
      return;
    }
    toast({
      title: "You're going!",
      description: "We've added this event to your calendar",
    });
  };

  return (
    <Layout>
      {/* Hero Image */}
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        <img
          src={event.cover_image || `https://picsum.photos/1600/900?random=${event.id}`}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        {/* Back Button */}
        <div className="absolute top-4 left-4">
          <Button variant="secondary" size="sm" asChild>
            <Link to="/events">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>

        {/* Badges */}
        <div className="absolute top-4 right-4 flex gap-2">
          {event.is_online && (
            <Badge className="bg-secondary text-secondary-foreground">
              <Video className="h-3 w-3 mr-1" />
              Online
            </Badge>
          )}
          {isFull && (
            <Badge variant="destructive">Full</Badge>
          )}
        </div>
      </div>

      <div className="container -mt-20 relative z-10 pb-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card mb-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary/10 text-primary rounded-xl p-3 text-center min-w-[70px]">
                  <span className="block text-xs font-medium uppercase">
                    {format(startDate, 'MMM')}
                  </span>
                  <span className="block text-2xl font-bold font-heading">
                    {format(startDate, 'd')}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {format(startDate, 'EEEE')}
                  </p>
                  <p className="font-medium">
                    {format(startDate, 'h:mm a')}
                    {endDate && ` - ${format(endDate, 'h:mm a')}`}
                  </p>
                </div>
              </div>

              <h1 className="text-2xl md:text-3xl font-heading font-bold mb-4">
                {event.title}
              </h1>

              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{event.venue_name || event.location}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{event.attendee_count} attending</span>
                </div>
              </div>

              <div className="prose prose-sm dark:prose-invert max-w-none">
                <h3 className="font-heading">About this event</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {event.description}
                </p>
              </div>
            </motion.div>

            {/* Attendees */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl border border-border p-6 shadow-card"
            >
              <h3 className="font-heading font-semibold mb-4">
                Attendees ({event.attendee_count})
              </h3>
              <div className="flex flex-wrap gap-3">
                {attendees.map((user) => (
                  <Link
                    key={user.id}
                    to={`/profile/${user.id}`}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user.name}</span>
                  </Link>
                ))}
                {event.attendee_count > 5 && (
                  <div className="flex items-center gap-2 p-2">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-sm font-medium">+{event.attendee_count - 5}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-2xl border border-border p-6 shadow-card sticky top-24"
            >
              <div className="space-y-4">
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
                  onClick={handleRSVP}
                  disabled={isFull}
                >
                  {isFull ? 'Event Full' : 'RSVP Now'}
                </Button>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Heart className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Location</p>
                  <p className="font-medium">{event.venue_name}</p>
                  <p className="text-sm text-muted-foreground">{event.location}</p>
                  {event.is_online && event.online_link && (
                    <Button variant="link" className="p-0 h-auto mt-2" asChild>
                      <a href={event.online_link} target="_blank" rel="noopener noreferrer">
                        Join online <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  )}
                </div>

                {event.max_attendees && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Spots Available</p>
                    <p className="font-medium">
                      {event.max_attendees - event.attendee_count} of {event.max_attendees}
                    </p>
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-secondary rounded-full transition-all"
                        style={{ width: `${(event.attendee_count / event.max_attendees) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
