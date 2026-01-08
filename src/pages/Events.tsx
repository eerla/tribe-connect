import { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Calendar, MapPin, Plus, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EventCard } from '@/components/cards/EventCard';
import { SkeletonEventCard } from '@/components/common/SkeletonCard';
import { Badge } from '@/components/ui/badge';
import { useEvents } from '@/hooks/useEvents';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type FilterType = 'all' | 'this-week' | 'this-weekend' | 'near-me' | 'online' | 'free';

export default function Events() {
  const { events, isLoading } = useEvents();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  
  // Read ?q= from URL and initialize search
  const queryFromUrl = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(queryFromUrl);
  
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  const categoryFromUrl = searchParams.get('category') || 'all';
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryFromUrl);

  // Get unique categories from events data
  const uniqueCategories = Array.from(
    new Set(events.map(e => e.category || 'Other').filter(Boolean))
  ).sort();

  // Helper function to calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // Get user location for "Near Me" filter
  const handleGetLocation = () => {
    setIsLoadingLocation(true);
    
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support location services",
        variant: "destructive",
      });
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setSelectedFilter('near-me');
        toast({
          title: "Location found!",
          description: "Showing events near you",
        });
        setIsLoadingLocation(false);
      },
      (error) => {
        toast({
          title: "Location access denied",
          description: "Please enable location access to see nearby events",
          variant: "destructive",
        });
        setIsLoadingLocation(false);
      }
    );
  };

  // Filter events based on selected filter
  const getFilteredEventsByFilter = (eventsToFilter: typeof events): typeof events => {
    if (selectedFilter === 'all') return eventsToFilter;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Get this weekend (Saturday and Sunday)
    const dayOfWeek = now.getDay();
    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
    const thisSaturday = new Date(today);
    thisSaturday.setDate(today.getDate() + daysUntilSaturday);
    const thisSunday = new Date(thisSaturday);
    thisSunday.setDate(thisSaturday.getDate() + 1);
    const nextMonday = new Date(thisSunday);
    nextMonday.setDate(thisSunday.getDate() + 1);

    return eventsToFilter.filter((event) => {
      if (!event.starts_at) return false;
      const eventDate = new Date(event.starts_at);

      switch (selectedFilter) {
        case 'this-week':
          return eventDate >= today && eventDate < nextWeek;

        case 'this-weekend':
          return eventDate >= thisSaturday && eventDate < nextMonday;

        case 'online':
          return event.location === 'Online';

        case 'free':
          return !event.price || event.price === 0;

        case 'near-me':
          if (!userLocation || !event.latitude || !event.longitude) return false;
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            event.latitude,
            event.longitude
          );
          // Show events within 50km radius
          return distance <= 50;

        default:
          return true;
      }
    });
  };

  const filteredEvents = getFilteredEventsByFilter(events).filter((event) => {
    const matchesSearch = event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase() || '');
    
    const eventCategory = event.category || 'Other';
    const matchesCategory = selectedCategory === 'all' || eventCategory === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Handle filter click
  const handleFilterClick = (filter: FilterType) => {
    if (filter === 'near-me') {
      if (!userLocation) {
        handleGetLocation();
        return;
      }
    }
    setSelectedFilter(filter);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    if (value === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', value);
    }
    setSearchParams(searchParams);
  };

  return (
    <Layout>
      {/* Header */}
      <section className="bg-muted/30 border-b border-border">
        <div className="container py-8 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">
                  Discover Events
                </h1>
                <p className="text-muted-foreground">
                  Find experiences that match your interests
                </p>
              </div>
              <Button asChild className="gap-2">
                <Link to="/events/create">
                  <Plus className="h-4 w-4" />
                  Create Event
                </Link>
              </Button>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  className="pl-12"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex gap-3">
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {uniqueCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-8 md:py-12">
        <div className="container">
          {/* Quick Filters */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <Badge 
              variant={selectedFilter === 'all' ? 'secondary' : 'outline'}
              className="cursor-pointer hover:bg-secondary/80 whitespace-nowrap transition-colors"
              onClick={() => handleFilterClick('all')}
            >
              All Events
            </Badge>
            <Badge 
              variant={selectedFilter === 'this-week' ? 'secondary' : 'outline'}
              className="cursor-pointer hover:bg-accent whitespace-nowrap transition-colors"
              onClick={() => handleFilterClick('this-week')}
            >
              <Calendar className="h-3 w-3 mr-1" />
              This Week
            </Badge>
            <Badge 
              variant={selectedFilter === 'this-weekend' ? 'secondary' : 'outline'}
              className="cursor-pointer hover:bg-accent whitespace-nowrap transition-colors"
              onClick={() => handleFilterClick('this-weekend')}
            >
              <Calendar className="h-3 w-3 mr-1" />
              This Weekend
            </Badge>
            <Badge 
              variant={selectedFilter === 'near-me' ? 'secondary' : 'outline'}
              className="cursor-pointer hover:bg-accent whitespace-nowrap transition-colors"
              onClick={() => handleFilterClick('near-me')}
            >
              {isLoadingLocation ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <MapPin className="h-3 w-3 mr-1" />
              )}
              Near Me
            </Badge>
            <Badge 
              variant={selectedFilter === 'online' ? 'secondary' : 'outline'}
              className="cursor-pointer hover:bg-accent whitespace-nowrap transition-colors"
              onClick={() => handleFilterClick('online')}
            >
              Online
            </Badge>
            <Badge 
              variant={selectedFilter === 'free' ? 'secondary' : 'outline'}
              className="cursor-pointer hover:bg-accent whitespace-nowrap transition-colors"
              onClick={() => handleFilterClick('free')}
            >
              Free
            </Badge>
          </div>

          {/* Results Count */}
          <p className="text-sm text-muted-foreground mb-6">
            Showing {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
            {selectedFilter !== 'all' && (
              <span className="ml-1">
                {selectedFilter === 'this-week' && 'this week'}
                {selectedFilter === 'this-weekend' && 'this weekend'}
                {selectedFilter === 'near-me' && 'near you'}
                {selectedFilter === 'online' && 'online'}
                {selectedFilter === 'free' && 'free'}
              </span>
            )}
          </p>

          {/* Grid */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <SkeletonEventCard key={i} />
              ))}
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event, index) => (
                <Link key={event.id} to={`/events/${event.id}`} state={{ from: location.pathname + location.search }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <motion.div
                      whileHover={{ y: -4 }}
                      className="group relative overflow-hidden rounded-2xl bg-card border border-border shadow-card transition-all duration-300 hover:shadow-xl h-full"
                    >
                      {/* Cover Image */}
                      <div className="aspect-[16/10] overflow-hidden relative bg-muted">
                        {event.banner_url ? (
                          <img
                            src={event.banner_url}
                            alt={event.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                            <Calendar className="h-12 w-12 text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                        
                        {/* Date Badge */}
                        <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm rounded-xl p-2 text-center min-w-[60px] border border-border/50">
                          <span className="block text-xs font-medium text-primary uppercase">
                            {new Date(event.starts_at).toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                          <span className="block text-2xl font-bold font-heading">
                            {new Date(event.starts_at).getDate()}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-3">
                        <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                          {event.title}
                        </h3>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {event.description}
                        </p>

                        {/* Meta */}
                        <div className="space-y-2 text-sm text-muted-foreground">
                          {event.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span>{new Date(event.starts_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                No events found
                {selectedCategory !== 'all' && ` in ${selectedCategory}`}
                {selectedFilter !== 'all' && (
                  <span>
                    {' '}that are{' '}
                    {selectedFilter === 'this-week' && 'this week'}
                    {selectedFilter === 'this-weekend' && 'this weekend'}
                    {selectedFilter === 'near-me' && 'near you'}
                    {selectedFilter === 'online' && 'online'}
                    {selectedFilter === 'free' && 'free'}
                  </span>
                )}
              </h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search or filters
              </p>
              <div className="flex gap-3 justify-center">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSelectedFilter('all');
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                >
                  Clear Filters
                </Button>
                <Button asChild>
                  <Link to="/events/create">Create an Event</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
