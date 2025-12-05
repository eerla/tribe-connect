import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, Users } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TribeCard } from '@/components/cards/TribeCard';
import { SkeletonCard } from '@/components/common/SkeletonCard';
import { Badge } from '@/components/ui/badge';
import { mockTribes, categories } from '@/data/mockData';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Groups() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  const filteredTribes = mockTribes.filter((tribe) => {
    const matchesSearch = tribe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tribe.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tribe.category === selectedCategory;
    return matchesSearch && matchesCategory;
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
              Find Your Tribe
            </h1>
            <p className="text-muted-foreground mb-6">
              Join communities that share your passions
            </p>

            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search tribes..."
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
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
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

      {/* Tribes Grid */}
      <section className="py-8 md:py-12">
        <div className="container">
          {/* Quick Category Filters */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <Badge 
              variant={selectedCategory === 'all' ? 'secondary' : 'outline'}
              className="cursor-pointer hover:bg-secondary/80 whitespace-nowrap"
              onClick={() => setSelectedCategory('all')}
            >
              All
            </Badge>
            {categories.slice(0, 6).map((cat) => (
              <Badge 
                key={cat.id}
                variant={selectedCategory === cat.name ? 'secondary' : 'outline'}
                className="cursor-pointer hover:bg-accent whitespace-nowrap"
                onClick={() => setSelectedCategory(cat.name)}
              >
                {cat.name}
              </Badge>
            ))}
          </div>

          {/* Results Count */}
          <p className="text-sm text-muted-foreground mb-6">
            Showing {filteredTribes.length} tribes
          </p>

          {/* Grid */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredTribes.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTribes.map((tribe, index) => (
                <TribeCard key={tribe.id} tribe={tribe} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No tribes found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search or filters
              </p>
              <Button onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
