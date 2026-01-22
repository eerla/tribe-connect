
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Loader2, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';


interface Attendee {
  id: string;
  name: string;
  avatar_url?: string;
  email?: string;
}

export default function EventAttendeesPage() {
  const { id } = useParams<{ id: string }>();
  const { slug } = useParams<{ slug: string }>();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [eventId, setEventId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEventIdAndAttendees() {
      setIsLoading(true);
      // First, fetch the event by slug to get its id
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id')
        .eq('slug', slug)
        .single();
      if (eventError || !eventData) {
        setIsLoading(false);
        setAttendees([]);
        return;
      }
      const event_id = eventData.id;
      setEventId(event_id);
      // Now fetch attendees by event id
      const { data, error } = await supabase
        .from('event_attendees')
        .select('user_id, profiles(full_name, avatar_url, username)')
        .eq('event_id', event_id);
      if (!error && data) {
        setAttendees(
          data.map((row: any) => ({
            id: row.user_id,
            name: row.profiles?.full_name || row.profiles?.username || 'Unknown',
            avatar_url: row.profiles?.avatar_url,
            email: row.profiles?.username, // or null if you don't want to show username as email
          }))
        );
      } else {
        setAttendees([]);
      }
      setIsLoading(false);
    }
    if (slug) {
      fetchEventIdAndAttendees();
    }
  }, [slug]);

  return (
    <Layout>
      <div className="container py-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Attendees</h1>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : attendees.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">No attendees yet.</div>
        ) : (
          <ul className="divide-y divide-border">
            {attendees.map((attendee) => (
              <li key={attendee.id} className="flex items-center gap-4 py-4">
                {attendee.avatar_url ? (
                  <img src={attendee.avatar_url} alt={attendee.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <span className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </span>
                )}
                <div>
                  <div className="font-medium">{attendee.name}</div>
                  {attendee.email && <div className="text-xs text-muted-foreground">{attendee.email}</div>}
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-8">
          <Link to={slug ? `/events/${slug}` : '/events'} className="text-primary hover:underline">← Back to Event</Link>
        </div>
      </div>
    </Layout>
  );
}
