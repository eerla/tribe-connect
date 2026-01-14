import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
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
  Loader2,
  X,
  AlertCircle
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { useUserEvents } from '@/hooks/useEvents';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import useShare from '@/hooks/useShare';
import { format } from 'date-fns';
import useSavedEvents from '@/hooks/useSavedEvents';
import { EventComments } from '@/components/event/EventComments';
import { SEO } from '@/components/common/SEO';


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
  is_deleted?: boolean;
  [key: string]: any;
}

export default function EventDetail() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { refetch: refetchUserEvents } = useUserEvents(user?.id);
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRSVPed, setIsRSVPed] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const { share } = useShare();
  const { checkSaved, toggleSave, savingIds } = useSavedEvents();
  const [isSaved, setIsSaved] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const goBack = () => {
    const maybeFrom = (location.state as any)?.from;
    if (typeof maybeFrom === 'string') {
      navigate(maybeFrom);
    } else {
      navigate(-1);
    }
  };

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      
      try {
        // Try to fetch by ID first (UUID)
        let data = null;
        let error = null;
        
        // Check if id is a UUID format
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        
        if (isUUID) {
          const result = await supabase
            .from('events')
            .select('*')
            .eq('id', id)
            .single();
          data = result.data;
          error = result.error;
        } else {
          // Try to fetch by slug
          const result = await supabase
            .from('events')
            .select('*')
            .eq('slug', id)
            .single();
          data = result.data;
          error = result.error;
          
          // If not found, check slug_history for redirects
          if (error || !data) {
            const { data: historyData } = await supabase
              .from('slug_history')
              .select('entity_id, new_slug')
              .eq('entity_type', 'event')
              .eq('old_slug', id)
              .single();
            
            if (historyData?.new_slug) {
              // Redirect to new slug
              navigate(`/events/${historyData.new_slug}`, { replace: true });
              return;
            }
          }
        }

        if (error) throw error;
        
        // If fetched by UUID and has a slug, redirect to slug URL
        if (data && isUUID && data.slug) {
          navigate(`/events/${data.slug}`, { replace: true });
          return;
        }
        
        setEvent(data);
        try {
          const saved = await checkSaved(data.id);
          setIsSaved(saved);
        } catch {}
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [id, navigate]);

  const handleSaveToggle = async () => {
    if (!event || !event.id) return;
    const result = await toggleSave(event.id);
    setIsSaved(result);
  };

  // Check if current user is attending
  useEffect(() => {
    if (!event?.id) return;

    if (!user?.id) {
      setIsRSVPed(false);
      return;
    }

    const checkAttendance = async () => {
      try {
        const { data, error } = await supabase
          .from('event_attendees')
          .select('id')
          .match({ event_id: event.id, user_id: user.id }) // <-- FIX: use event.id
          .limit(1);
  
        if (error) {
          setIsRSVPed(false);
          return;
        }
  
        setIsRSVPed(Boolean(data && data.length > 0));
      } catch (err) {
        console.error('Error checking attendance:', err);
        setIsRSVPed(false);
      }
    };
  
    checkAttendance();
  }, [event?.id, user?.id]);

  // Fetch attendee count
  useEffect(() => {
    if (!event?.id) return;

    const fetchAttendeeCount = async () => {
      try {
        const { count, error } = await supabase
          .from('event_attendees')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id);

        if (error) {
          console.error('Error fetching attendee count:', error);
          setAttendeeCount(0);
          return;
        }

        setAttendeeCount(count || 0);
      } catch (err) {
        console.error('Error fetching attendee count:', err);
        setAttendeeCount(0);
      }
    };

    fetchAttendeeCount();
  }, [event?.id]);

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
  const eventDateLabel = format(startDate, 'MMM d, yyyy h:mm a');
  
  // Check if current user is the organizer
  const isOrganizer = user?.id === event.organizer;
  
  // Check if event has started
  const isEventStarted = startDate < new Date();
  
  // Check if event can be cancelled (organizer, not started, not already cancelled)
  const canCancel = isOrganizer && !isEventStarted && !event.is_cancelled;

  const handleRSVP = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to RSVP to this event",
      });
      return;
    }

    if (!user?.id || !event?.id) {
      toast({
        title: "Error",
        description: "Missing user or event information",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('event_attendees')
        .insert({
          event_id: event.id,
          user_id: user.id,
          status: 'going',
        });

      if (error) {
        if (error.code === '23505' || (error.message || '').includes('duplicate')) {
          setIsRSVPed(true);
          return;
        }
        throw error;
      }

      setIsRSVPed(true);
      setAttendeeCount(prev => prev + 1);
      if (typeof refetchUserEvents === 'function') {
        try { await refetchUserEvents(); } catch {}
      }

      // Notify event organizer (only if not self-RSVP)
      if (event.organizer && event.organizer !== user.id) {
        await supabase.from('notifications').insert({
          user_id: event.organizer,
          actor_id: user.id,
          type: 'event_rsvp',
          payload: {
            event_id: event.id,
            event_title: event.title,
          },
        });
      }

      toast({
        title: "RSVP Confirmed!",
        description: `You're going to ${event.title}`,
      });
    } catch (error: any) {
      console.error('Error RSVPing to event:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to RSVP",
        variant: "destructive",
      });
    }
  };

  const handleUnRSVP = async () => {
    if (!isAuthenticated) {
      toast({ title: 'Sign in required', description: 'Please sign in to change attendance' });
      return;
    }
    if (!user?.id || !event?.id) return;

    try {
      const { error } = await supabase
        .from('event_attendees')
        .delete()
        .match({ event_id: event.id, user_id: user.id });

      if (error) throw error;

      setIsRSVPed(false);
      setAttendeeCount(prev => Math.max(0, prev - 1));
      if (typeof refetchUserEvents === 'function') {
        try { await refetchUserEvents(); } catch {};
      }
      toast({ title: "You're no longer attending", description: `You left ${event.title}` });
    } catch (err: any) {
      console.error('Error leaving event:', err);
      toast({ title: 'Error', description: err.message || 'Failed to leave event', variant: 'destructive' });
    }
  };

  const handleCancelEvent = async () => {
    if (!event?.id) return;
    
    setIsCancelling(true);
    try {
      // Update event to cancelled
      const { error } = await supabase
        .from('events')
        .update({ is_cancelled: true })
        .eq('id', event.id);

      if (error) throw error;

      // Update local state
      setEvent({ ...event, is_cancelled: true });
      setShowCancelDialog(false);
      
      // Fetch all attendees and notify them
      const { data: attendees, error: attendeesError } = await supabase
        .from('event_attendees')
        .select('user_id')
        .eq('event_id', event.id);
      
      if (!attendeesError && attendees && attendees.length > 0) {
        // Send notifications to all attendees (except organizer)
        const notificationsToInsert = attendees
          .filter(attendee => attendee.user_id !== user?.id)
          .map(attendee => ({
            user_id: attendee.user_id,
            actor_id: user?.id,
            type: 'event_cancelled',
            payload: {
              event_id: event.id,
              event_title: event.title,
            },
          }));

        if (notificationsToInsert.length > 0) {
          await supabase.from('notifications').insert(notificationsToInsert);
        }
      }
      
      toast({
        title: "Event Cancelled",
        description: "The event has been cancelled successfully",
      });
    } catch (error: any) {
      console.error('Error cancelling event:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel event",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  

  return (
    <>
      <SEO
        title={event.title}
        description={event.description || `Join ${event.title} on ${eventDateLabel}`}
        image={event.banner_url || undefined}
        url={`/events/${event.slug || event.id}`}
        type="article"
      />
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
          <Button variant="secondary" size="sm" onClick={goBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Badges */}
        <div className="absolute top-4 right-4 flex gap-2 flex-wrap justify-end">
          {event.is_cancelled && (
            <Badge variant="destructive" className="gap-1">
              <X className="h-3 w-3" />
              Cancelled
            </Badge>
          )}
          {event.location === 'Online' && !event.is_cancelled && (
            <Badge className="bg-secondary text-secondary-foreground">
              Online
            </Badge>
          )}
          {isFull && !event.is_cancelled && (
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
                <div className="flex items-center justify-between">
                  <h3 className="font-heading mb-0">About this event</h3>
                  {!event.is_cancelled && attendeeCount > 0 && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{attendeeCount} attending</span>
                    </div>
                  )}
                </div>
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
                {/* Show cancelled message if event is cancelled */}
                {event.is_cancelled ? (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
                    <AlertCircle className="h-5 w-5 mx-auto mb-2 text-destructive" />
                    <p className="text-sm font-medium text-destructive mb-1">This event has been cancelled</p>
                    <p className="text-xs text-muted-foreground">
                      RSVP is no longer available for this event
                    </p>
                  </div>
                ) : (
                  <Button
                    variant={isRSVPed ? 'destructive' : 'hero'}
                    size="lg"
                    className="w-full"
                    onClick={isRSVPed ? handleUnRSVP : handleRSVP}
                    disabled={isFull}
                  >
                    {isFull ? 'Event Full' : (isRSVPed ? 'Attending — Cancel' : 'RSVP Now')}
                  </Button>
                )}

                {/* Cancel Event Button - Only visible to organizer before event starts */}
                {canCancel && (
                  <>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                      asChild
                    >
                      <Link to={`/events/${event.slug || event.id}/edit`}>
                        Edit Event
                      </Link>
                    </Button>

                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => setShowCancelDialog(true)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel Event
                    </Button>
                  </>
                )}

                <div className="flex gap-2">
                  <Button
                    variant={isSaved ? 'destructive' : 'outline'}
                    className="flex-1"
                    onClick={handleSaveToggle}
                    disabled={Boolean(savingIds[event?.id || ''])}
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    {isSaved ? 'Saved' : 'Save'}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => share({ title: event.title, text: event.description, url: window.location.href })}
                  >
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

      {/* Cancel Event Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel "{event.title}"? This action cannot be undone. 
              All attendees will be notified that the event has been cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Keep Event</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelEvent}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? 'Cancelling...' : 'Yes, Cancel Event'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Comments Section */}
      {event && (
        <section className="container py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl font-heading font-bold mb-6">Comments</h2>
            <EventComments 
              eventId={event.id}
              eventTitle={event.title}
              organizerId={event.organizer}
              isAttendee={isRSVPed}
              isOrganizer={user?.id === event.organizer}
              isCancelled={event.is_cancelled}
            />
          </motion.div>
        </section>
      )}
      </Layout>
      </>
  );
}
