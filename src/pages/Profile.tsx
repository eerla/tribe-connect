import { useParams, Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users, Settings, Edit, ChevronDown, User as UserIcon, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TribeCard } from '@/components/cards/TribeCard';
import { EventCard } from '@/components/cards/EventCard';
import useSavedEvents from '@/hooks/useSavedEvents';
import { useUserTribes } from '@/hooks/useTribes';
import { useUserEvents } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import type { Profile } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser, profile, isAuthenticated, isLoading } = useAuth();
  const [openSections, setOpenSections] = useState({
    createdTribes: true,
    joinedTribes: true,
    organizedEvents: true,
    attendingEvents: true,
  });

  const [viewedProfile, setViewedProfile] = useState<Profile | null>(null);
  const [viewedUserId, setViewedUserId] = useState<string | null>(null);
  const [isViewedProfileLoading, setIsViewedProfileLoading] = useState(true);

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }));
  };
  
  const isOwnProfile = username === 'me' || username === currentUser?.id || username === profile?.username;
  
  const currentProfileToDisplay = isOwnProfile ? profile : viewedProfile;
  const displayName = currentProfileToDisplay?.full_name || 'User';
  const displayAvatar = currentProfileToDisplay?.avatar_url || undefined;
  const displayBio = currentProfileToDisplay?.bio || null;
  const displayLocation = currentProfileToDisplay?.location || null;
  const createdAt = currentProfileToDisplay?.created_at || new Date().toISOString();
  
  const userIdForHooks = isOwnProfile ? currentUser?.id : viewedUserId;
  // Add loading states for tribe/event hooks
  const { createdTribes, joinedTribes, isLoading: tribesLoading } = useUserTribes(userIdForHooks);
  const { organizedEvents, attendingEvents, isLoading: eventsLoading } = useUserEvents(userIdForHooks);
  
  const { savedEvents, fetchSavedEvents, toggleSave } = useSavedEvents();
  const location = useLocation();

  const totalTribes = createdTribes.length + joinedTribes.length;
  const totalEvents = organizedEvents.length + attendingEvents.length;
  const totalSaved = savedEvents.length;

  useEffect(() => {
    // Fetch saved events when viewing your own profile
    if (isOwnProfile && currentUser?.id) {
      fetchSavedEvents(currentUser.id).catch(() => {});
    }
  }, [isOwnProfile, currentUser?.id, fetchSavedEvents]);

  useEffect(() => {
    const fetchViewedProfile = async () => {
      setIsViewedProfileLoading(true);
      if (isOwnProfile) {
        setViewedProfile(profile);
        setViewedUserId(currentUser?.id || null);
      } else if (username) {
        try {
          const { data: fetchedProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', username)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            throw profileError;
          }
          setViewedProfile(fetchedProfile);
          setViewedUserId(fetchedProfile?.id || null);
        } catch (error) {
          console.error('Error fetching viewed profile:', error);
          setViewedProfile(null);
          setViewedUserId(null);
        }
      } else {
        setViewedProfile(null);
      }
      setIsViewedProfileLoading(false);
    };

    fetchViewedProfile();
  }, [username, isOwnProfile, profile, currentUser]);

  if (isViewedProfileLoading || isLoading) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        </div>
      </Layout>
    );
  }

  if (!isOwnProfile && !username) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Profile not found</h1>
          <Button asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  if (isOwnProfile && !isAuthenticated) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <p className="text-muted-foreground mb-6">
            You need to be signed in to view your profile
          </p>
          <Button asChild>
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-3xl border border-border p-6 md:p-8 shadow-card mb-8"
        >
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background shadow-lg">
              <AvatarImage src={displayAvatar || undefined} alt={displayName} />
              <AvatarFallback className="text-2xl">{displayName.charAt(0)}</AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                <h1 className="text-2xl md:text-3xl font-heading font-bold">
                  {displayName}
                </h1>
                {isOwnProfile && isAuthenticated && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/settings">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/settings">
                        <Settings className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                )}
              </div>

              {displayBio && (
                <p className="text-muted-foreground mb-4">{displayBio}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {displayLocation && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {displayLocation}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Joined {format(new Date(createdAt), 'MMMM yyyy')}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {totalTribes} tribes
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-8 p-4 bg-muted/50 rounded-xl">
              <div className="text-center">
                {tribesLoading ? (
                  <div className="text-2xl font-bold font-heading flex items-center justify-center">
                    <Skeleton className="h-8 w-12" />
                  </div>
                ) : (
                  <p className="text-2xl font-bold font-heading">{totalTribes}</p>
                )}
                <p className="text-sm text-muted-foreground">Tribes</p>
              </div>
              <div className="text-center">
                {eventsLoading ? (
                  <div className="text-2xl font-bold font-heading flex items-center justify-center">
                    <Skeleton className="h-8 w-12" />
                  </div>
                ) : (
                  <p className="text-2xl font-bold font-heading">{totalEvents}</p>
                )}
                <p className="text-sm text-muted-foreground">Events</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs Section */}
        <Tabs defaultValue="tribes" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 w-full sm:w-auto">
            <TabsTrigger value="tribes" className="gap-2 flex-1 sm:flex-none">
              <Users className="h-4 w-4" />
              Tribes
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2 flex-1 sm:flex-none">
              <Calendar className="h-4 w-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-2 flex-1 sm:flex-none">
              <Calendar className="h-4 w-4" />
              Saved
            </TabsTrigger>
          </TabsList>

          {/* Tribes Tab */}
          <TabsContent value="tribes" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              {isOwnProfile && totalTribes === 0 && (
                <Button asChild size="sm">
                  <Link to="/groups/create">Create Tribe</Link>
                </Button>
              )}
            </div>

            {/* Created Tribes Subsection */}
            <Collapsible
              open={openSections.createdTribes}
              onOpenChange={() => toggleSection('createdTribes')}
              className="border border-border rounded-lg"
            >
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors group">
                  <h3 className="text-lg font-semibold group-hover:text-primary">
                    Created by Me ({createdTribes.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    {isOwnProfile && (
                      <Button asChild size="sm" variant="outline" className="h-8">
                        <Link to="/groups/create">+ Create</Link>
                      </Button>
                    )}
                    <ChevronDown className={`h-5 w-5 transition-transform ${openSections.createdTribes ? 'rotate-180' : ''}`} />
                  </div>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {createdTribes.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid md:grid-cols-2 gap-6 p-4 border-t border-border"
                  >
                    {createdTribes.map((tribe, index) => (
                      <TribeCard key={tribe.id} tribe={tribe} index={index} linkState={{ from: location.pathname }} />
                    ))}
                  </motion.div>
                ) : (
                  <div className="text-center py-8 bg-muted/20 px-4 border-t border-border">
                    <p className="text-muted-foreground">
                      {isOwnProfile ? "You haven't created any tribes yet" : `${displayName} hasn't created any tribes yet`}
                    </p>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Joined Tribes Subsection */}
            <Collapsible
              open={openSections.joinedTribes}
              onOpenChange={() => toggleSection('joinedTribes')}
              className="border border-border rounded-lg"
            >
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors group">
                  <h3 className="text-lg font-semibold group-hover:text-primary">
                    I've Joined ({joinedTribes.length})
                  </h3>
                  <ChevronDown className={`h-5 w-5 transition-transform ${openSections.joinedTribes ? 'rotate-180' : ''}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {joinedTribes.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid md:grid-cols-2 gap-6 p-4 border-t border-border"
                  >
                    {joinedTribes.map((tribe, index) => (
                      <TribeCard key={tribe.id} tribe={tribe} index={index} linkState={{ from: location.pathname }} />
                    ))}
                  </motion.div>
                ) : (
                  <div className="text-center py-8 bg-muted/20 px-4 border-t border-border">
                    <p className="text-muted-foreground mb-4">
                      {isOwnProfile ? "You haven't joined any tribes yet" : `${displayName} hasn't joined any tribes yet`}
                    </p>
                    {isOwnProfile && (
                      <Button asChild size="sm" variant="outline">
                        <Link to="/groups">Explore Tribes</Link>
                      </Button>
                    )}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              {isOwnProfile && totalEvents === 0 && (
                <Button asChild size="sm">
                  <Link to="/events/create">Create Event</Link>
                </Button>
              )}
            </div>

            {/* Organized Events Subsection */}
            <Collapsible
              open={openSections.organizedEvents}
              onOpenChange={() => toggleSection('organizedEvents')}
              className="border border-border rounded-lg"
            >
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors group">
                  <h3 className="text-lg font-semibold group-hover:text-primary">
                    Organized by Me ({organizedEvents.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    {isOwnProfile && (
                      <Button asChild size="sm" variant="outline" className="h-8">
                        <Link to="/events/create">+ Create</Link>
                      </Button>
                    )}
                    <ChevronDown className={`h-5 w-5 transition-transform ${openSections.organizedEvents ? 'rotate-180' : ''}`} />
                  </div>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {organizedEvents.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid md:grid-cols-2 gap-6 p-4 border-t border-border"
                  >
                    {organizedEvents.map((event, index) => (
                      <EventCard key={event.id} event={event} index={index} linkState={{ from: location.pathname }} />
                    ))}
                  </motion.div>
                ) : (
                  <div className="text-center py-8 bg-muted/20 px-4 border-t border-border">
                    <p className="text-muted-foreground">
                      {isOwnProfile ? "You haven't organized any events yet" : `${displayName} hasn't organized any events yet`}
                    </p>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            {/* Attending Events Subsection */}
            <Collapsible
              open={openSections.attendingEvents}
              onOpenChange={() => toggleSection('attendingEvents')}
              className="border border-border rounded-lg"
            >
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors group">
                  <h3 className="text-lg font-semibold group-hover:text-primary">
                    I'm Attending ({attendingEvents.length})
                  </h3>
                  <ChevronDown className={`h-5 w-5 transition-transform ${openSections.attendingEvents ? 'rotate-180' : ''}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {attendingEvents.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid md:grid-cols-2 gap-6 p-4 border-t border-border"
                  >
                    {attendingEvents.map((event, index) => (
                      <EventCard key={event.id} event={event} index={index} linkState={{ from: location.pathname }} />
                    ))}
                  </motion.div>
                ) : (
                  <div className="text-center py-8 bg-muted/20 px-4 border-t border-border">
                    <p className="text-muted-foreground mb-4">
                      {isOwnProfile ? "You haven't attended any events yet" : `${displayName} hasn't attended any events yet`}
                    </p>
                    {isOwnProfile && (
                      <Button asChild size="sm" variant="outline">
                        <Link to="/events">Explore Events</Link>
                      </Button>
                    )}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>

          {/* Saved Tab */}
          <TabsContent value="saved" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              {isOwnProfile && totalSaved === 0 && (
                <Button asChild size="sm">
                  <Link to="/events">Explore Events</Link>
                </Button>
              )}
            </div>

            <div className="border border-border rounded-lg">
              {savedEvents.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid md:grid-cols-2 gap-6 p-4"
                >
                  {savedEvents.map((event: any, index: number) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      index={index}
                      isSaved={true}
                      onToggleSave={async (id: string) => {
                        await toggleSave(id);
                        await fetchSavedEvents();
                      }}
                      linkState={{ from: location.pathname }}
                    />
                  ))}
                </motion.div>
              ) : (
                <div className="text-center py-8 bg-muted/20 px-4">
                  <p className="text-muted-foreground mb-4">
                    {isOwnProfile ? "You haven't saved any events yet" : `${displayName} hasn't saved any events yet`}
                  </p>
                  {isOwnProfile && (
                    <Button asChild size="sm" variant="outline">
                      <Link to="/events">Explore Events</Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}