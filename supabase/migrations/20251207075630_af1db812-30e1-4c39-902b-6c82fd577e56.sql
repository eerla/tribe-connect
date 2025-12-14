-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Create tribes table
CREATE TABLE public.tribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT,
  city TEXT,
  cover_url TEXT,
  is_private BOOLEAN DEFAULT false,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create tribe_members table
CREATE TABLE public.tribe_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tribe_id UUID REFERENCES public.tribes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tribe_id, user_id)
);

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tribe_id UUID REFERENCES public.tribes(id) ON DELETE CASCADE,
  organizer UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  location TEXT,
  city TEXT,
  cover_url TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  is_online BOOLEAN DEFAULT false,
  max_attendees INTEGER,
  attendee_count INTEGER DEFAULT 0,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create event_attendees table
CREATE TABLE public.event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'going',
  rsvp_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

-- Create event_comments table
CREATE TABLE public.event_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create messages table for real-time chat
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tribe_id UUID REFERENCES public.tribes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tribe_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Tribes policies
CREATE POLICY "Tribes are viewable by everyone" ON public.tribes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create tribes" ON public.tribes FOR INSERT WITH CHECK (auth.uid() = owner);
CREATE POLICY "Owners can update their tribes" ON public.tribes FOR UPDATE USING (auth.uid() = owner);
CREATE POLICY "Owners can delete their tribes" ON public.tribes FOR DELETE USING (auth.uid() = owner);

-- Tribe members policies
CREATE POLICY "Tribe members are viewable by everyone" ON public.tribe_members FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join tribes" ON public.tribe_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave tribes" ON public.tribe_members FOR DELETE USING (auth.uid() = user_id);

-- Events policies
CREATE POLICY "Events are viewable by everyone" ON public.events FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create events" ON public.events FOR INSERT WITH CHECK (auth.uid() = organizer);
CREATE POLICY "Organizers can update their events" ON public.events FOR UPDATE USING (auth.uid() = organizer);
CREATE POLICY "Organizers can delete their events" ON public.events FOR DELETE USING (auth.uid() = organizer);

-- Event attendees policies
CREATE POLICY "Event attendees are viewable by everyone" ON public.event_attendees FOR SELECT USING (true);
CREATE POLICY "Authenticated users can RSVP" ON public.event_attendees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their RSVP" ON public.event_attendees FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can cancel their RSVP" ON public.event_attendees FOR DELETE USING (auth.uid() = user_id);

-- Event comments policies
CREATE POLICY "Event comments are viewable by everyone" ON public.event_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON public.event_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.event_comments FOR DELETE USING (auth.uid() = user_id);

-- Messages policies (only tribe members can see/send)
CREATE POLICY "Tribe members can view messages" ON public.messages FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.tribe_members WHERE tribe_id = messages.tribe_id AND user_id = auth.uid()));
CREATE POLICY "Tribe members can send messages" ON public.messages FOR INSERT 
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.tribe_members WHERE tribe_id = messages.tribe_id AND user_id = auth.uid()));

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', '')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tribes_updated_at BEFORE UPDATE ON public.tribes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update member count
CREATE OR REPLACE FUNCTION public.update_tribe_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.tribes SET member_count = member_count + 1 WHERE id = NEW.tribe_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.tribes SET member_count = member_count - 1 WHERE id = OLD.tribe_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_tribe_member_count_trigger
  AFTER INSERT OR DELETE ON public.tribe_members
  FOR EACH ROW EXECUTE FUNCTION public.update_tribe_member_count();

-- Function to update attendee count
CREATE OR REPLACE FUNCTION public.update_event_attendee_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.events SET attendee_count = attendee_count + 1 WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.events SET attendee_count = attendee_count - 1 WHERE id = OLD.event_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_event_attendee_count_trigger
  AFTER INSERT OR DELETE ON public.event_attendees
  FOR EACH ROW EXECUTE FUNCTION public.update_event_attendee_count();

-- Enable realtime for chat and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tribe_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_attendees;

-- Create indexes for performance
CREATE INDEX idx_tribes_owner ON public.tribes(owner);
CREATE INDEX idx_tribes_city ON public.tribes(city);
CREATE INDEX idx_tribe_members_tribe ON public.tribe_members(tribe_id);
CREATE INDEX idx_tribe_members_user ON public.tribe_members(user_id);
CREATE INDEX idx_events_tribe ON public.events(tribe_id);
CREATE INDEX idx_events_organizer ON public.events(organizer);
CREATE INDEX idx_events_starts_at ON public.events(starts_at);
CREATE INDEX idx_event_attendees_event ON public.event_attendees(event_id);
CREATE INDEX idx_event_attendees_user ON public.event_attendees(user_id);
CREATE INDEX idx_messages_tribe ON public.messages(tribe_id);
CREATE INDEX idx_messages_created ON public.messages(created_at DESC);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, is_read);