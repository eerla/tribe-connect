import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Calendar, MapPin, SlidersHorizontal, Plus } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EventCard } from '@/components/cards/EventCard';
import { SkeletonEventCard } from '@/components/common/SkeletonCard';
import { Badge } from '@/components/ui/badge';
import { useEvents } from '@/hooks/useEvents';
import { categories } from '@/data/categories';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Events() {
  const { events, isLoading } = useEvents();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase() || '');
    return matchesSearch;
  });

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
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">Filters</span>
                </Button>
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
            <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80 whitespace-nowrap">
              <Calendar className="h-3 w-3 mr-1" />
              This Week
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-accent whitespace-nowrap">
              <Calendar className="h-3 w-3 mr-1" />
              This Weekend
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-accent whitespace-nowrap">
              <MapPin className="h-3 w-3 mr-1" />
              Near Me
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-accent whitespace-nowrap">
              Online
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-accent whitespace-nowrap">
              Free
            </Badge>
          </div>

          {/* Results Count */}
          <p className="text-sm text-muted-foreground mb-6">
            Showing {filteredEvents.length} events
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
                <Link key={event.id} to={`/events/${event.id}`}>
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
              <h3 className="text-xl font-semibold mb-2">No events found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search or filters
              </p>
              <Button asChild>
                <Link to="/create-event">Create an Event</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
