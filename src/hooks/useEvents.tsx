import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Event {
  id: string;
  tribe_id?: string | null;
  organizer?: string;
  title?: string;
  slug?: string;
  description?: string | null;
  banner_url?: string | null;
  location?: string | null;
  category?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  starts_at?: string;
  ends_at?: string | null;
  capacity?: number | null;
  price?: number;
  is_cancelled?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const resp = await supabase
        .from('events')
        .select('*')
        .eq('is_cancelled', false)
        .order('starts_at', { ascending: true });
      const data = resp.data as Event[] | null;
      const error = resp.error;
      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return { events, isLoading, error, refetch: fetchEvents };
}

export function useEventById(eventId: string) {
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!eventId) {
      setIsLoading(false);
      return;
    }

    const fetchEvent = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();

        if (error) throw error;
        setEvent(data);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching event:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  return { event, isLoading, error };
}

export function useUserEvents(userId: string | undefined) {
  const [organizedEvents, setOrganizedEvents] = useState<Event[]>([]);
  const [attendingEvents, setAttendingEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserEvents = async () => {
    setIsLoading(true);
    try {
      if (!userId) {
        setOrganizedEvents([]);
        setAttendingEvents([]);
        setIsLoading(false);
        return;
      }

      // Get events the user organized
      const organizedResp = await supabase
        .from('events')
        .select('*')
        .eq('organizer', userId)
        .eq('is_cancelled', false);
      const organizedData = organizedResp.data as Event[] | null;
      const organizedError = organizedResp.error;
      if (organizedError) throw organizedError;
      setOrganizedEvents(organizedData || []);

      // Get events the user is attending via event_attendees
      const attendeesResp = await supabase
        .from('event_attendees')
        .select('event_id')
        .eq('user_id', userId);
      const attendeesData = attendeesResp.data as any[] | null;
      const attendeesError = attendeesResp.error;
      if (attendeesError) throw attendeesError;

      const attendeeEventIds = attendeesData?.map(a => a.event_id) || [];
      
      if (attendeeEventIds.length > 0) {
        const attendingResp = await supabase
          .from('events')
          .select('*')
          .in('id', attendeeEventIds)
          .eq('is_cancelled', false);
        const attendingData = attendingResp.data as Event[] | null;
        const attendingError = attendingResp.error;
        if (attendingError) throw attendingError;
        setAttendingEvents(attendingData || []);
      } else {
        setAttendingEvents([]);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching user events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserEvents();
  }, [userId]);

  return { organizedEvents, attendingEvents, isLoading, error, refetch: fetchUserEvents };
}
