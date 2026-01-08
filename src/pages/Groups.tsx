import { useState } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Plus, Users } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TribeCard } from '@/components/cards/TribeCard';
import { SkeletonCard } from '@/components/common/SkeletonCard';
import { useTribes } from '@/hooks/useTribes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Groups() {
  const { tribes, isLoading } = useTribes();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const categoryFromUrl = searchParams.get('category') || 'all';
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryFromUrl);

  // Get unique categories from tribes data
  const uniqueCategories = Array.from(
    new Set(tribes.map(t => t.category || 'Other').filter(Boolean))
  ).sort();

  const filteredTribes = tribes.filter((tribe) => {
    const matchesSearch = tribe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tribe.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const tribeCategory = tribe.category || 'Other';
    const matchesCategory = selectedCategory === 'all' || tribeCategory === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

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
                  Find Your Tribe
                </h1>
                <p className="text-muted-foreground">
                  Join communities that share your passions
                </p>
              </div>
              <Button asChild className="gap-2">
                <Link to="/groups/create">
                  <Plus className="h-4 w-4" />
                  Create Tribe
                </Link>
              </Button>
            </div>

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

      {/* Tribes Grid */}
      <section className="container py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredTribes.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No tribes found
              {selectedCategory !== 'all' && ` in ${selectedCategory}`}
            </h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your filters or create your own tribe
            </p>
            <Button asChild>
              <Link to="/groups/create">Create Tribe</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTribes.map((tribe) => (
              <TribeCard key={tribe.id} tribe={tribe} linkState={{ from: location.pathname + location.search }} />
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}