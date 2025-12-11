import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Share2, 
  Heart,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Event {
  id: string;
  tribe_id?: string | null;
  organizer?: string;
  title: string;
  slug?: string;
  description?: string | null;
  banner_url?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  starts_at: string;
  ends_at?: string | null;
  capacity?: number | null;
  price?: number;
  is_cancelled?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export default function EventDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setEvent(data);
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        </div>
      </Layout>
    );
  }

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

  const startDate = new Date(event.starts_at);
  const endDate = event.ends_at ? new Date(event.ends_at) : null;
  const isFull = event.capacity ? event.capacity <= 0 : false;

  const handleRSVP = () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to RSVP to this event",
      });
      return;
    }
    toast({
      title: "RSVP Confirmed!",
      description: `You're going to ${event.title}`,
    });
  };

  return (
    <Layout>
      {/* Hero Image */}
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden bg-muted">
        {event.banner_url ? (
          <img
            src={event.banner_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <Calendar className="h-20 w-20 text-muted-foreground/30" />
          </div>
        )}
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
          {event.location === 'Online' && (
            <Badge className="bg-secondary text-secondary-foreground">
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
                {event.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>

              <div className="prose prose-sm dark:prose-invert max-w-none">
                <h3 className="font-heading">About this event</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {event.description || 'No description provided'}
                </p>
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
                {event.location && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Location</p>
                    <p className="font-medium">{event.location}</p>
                  </div>
                )}

                {event.price > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Ticket Price</p>
                    <p className="font-medium">${event.price}</p>
                  </div>
                )}

                {event.capacity && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Capacity</p>
                    <p className="font-medium">{event.capacity} attendees</p>
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
