export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  created_at: string;
}

export interface Tribe {
  id: string;
  owner?: string;
  title?: string;
  name?: string;
  description?: string;
  category?: string;
  cover_image?: string;
  cover_url?: string;
  location?: string;
  city?: string;
  member_count?: number;
  is_private?: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  slug?: string;
}

export interface Event {
  id: string;
  title?: string;
  description?: string;
  tribe_id?: string;
  tribe?: Tribe;
  cover_image?: string;
  banner_url?: string;
  location?: string;
  category?: string;
  venue_name?: string;
  starts_at?: string;
  ends_at?: string;
  max_attendees?: number;
  capacity?: number;
  attendee_count?: number;
  is_online?: boolean;
  online_link?: string;
  created_by?: string;
  organizer?: string;
  created_at?: string;
  updated_at?: string;
  slug?: string;
  price?: number;
  is_cancelled?: boolean;
  latitude?: number;
  longitude?: number;
  [key: string]: any;
}

export interface TribeMember {
  id: string;
  tribe_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  user?: User;
}

export interface EventAttendee {
  id: string;
  event_id: string;
  user_id: string;
  status: 'going' | 'maybe' | 'not_going';
  created_at: string;
  user?: User;
}

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  tribe_id?: string;
  event_id?: string;
  created_at: string;
  sender?: User;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'event_invite' | 'tribe_invite' | 'new_message' | 'event_reminder' | 'tribe_update';
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, unknown>;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}
