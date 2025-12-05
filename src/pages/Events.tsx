import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Calendar, MapPin, SlidersHorizontal } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EventCard } from '@/components/cards/EventCard';
import { SkeletonEventCard } from '@/components/common/SkeletonCard';
import { Badge } from '@/components/ui/badge';
import { mockEvents, categories } from '@/data/mockData';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Events() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  const filteredEvents = mockEvents.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
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
            <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">
              Discover Events
            </h1>
            <p className="text-muted-foreground mb-6">
              Find experiences that match your interests
            </p>

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
                <EventCard key={event.id} event={event} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No events found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search or filters
              </p>
              <Button onClick={() => setSearchQuery('')}>Clear Search</Button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
