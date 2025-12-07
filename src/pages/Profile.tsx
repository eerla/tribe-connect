import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Users, Settings, Edit } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TribeCard } from '@/components/cards/TribeCard';
import { EventCard } from '@/components/cards/EventCard';
import { mockTribes, mockEvents } from '@/data/mockData';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser, profile, isAuthenticated } = useAuth();
  
  const isOwnProfile = id === 'me' || id === currentUser?.id;
  
  // For own profile, use the authenticated user's profile
  // For other profiles, we'd fetch from the database (simplified for now)
  const displayName = isOwnProfile ? (profile?.full_name || 'User') : 'User';
  const displayAvatar = isOwnProfile ? profile?.avatar_url : null;
  const displayBio = isOwnProfile ? profile?.bio : null;
  const displayLocation = isOwnProfile ? profile?.location : null;
  const createdAt = currentUser?.created_at || new Date().toISOString();
  
  const userTribes = mockTribes.slice(0, 2);
  const userEvents = mockEvents.slice(0, 2);

  if (!isOwnProfile && !id) {
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
                  {userTribes.length} tribes
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-8 p-4 bg-muted/50 rounded-xl">
              <div className="text-center">
                <p className="text-2xl font-bold font-heading">{userTribes.length}</p>
                <p className="text-sm text-muted-foreground">Tribes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold font-heading">{userEvents.length}</p>
                <p className="text-sm text-muted-foreground">Events</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content Tabs */}
        <Tabs defaultValue="tribes">
          <TabsList className="bg-muted/50 p-1 mb-6">
            <TabsTrigger value="tribes" className="gap-2">
              <Users className="h-4 w-4" />
              Tribes
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2">
              <Calendar className="h-4 w-4" />
              Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tribes">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {userTribes.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {userTribes.map((tribe, index) => (
                    <TribeCard key={tribe.id} tribe={tribe} index={index} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-muted/30 rounded-2xl">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tribes yet</h3>
                  <p className="text-muted-foreground mb-4">
                    {isOwnProfile ? "You haven't joined any tribes yet" : `${displayName} hasn't joined any tribes yet`}
                  </p>
                  {isOwnProfile && (
                    <Button asChild>
                      <Link to="/groups">Explore Tribes</Link>
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="events">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {userEvents.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {userEvents.map((event, index) => (
                    <EventCard key={event.id} event={event} index={index} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-muted/30 rounded-2xl">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No events yet</h3>
                  <p className="text-muted-foreground mb-4">
                    {isOwnProfile ? "You haven't attended any events yet" : `${displayName} hasn't attended any events yet`}
                  </p>
                  {isOwnProfile && (
                    <Button asChild>
                      <Link to="/events">Explore Events</Link>
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
