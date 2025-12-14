import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, MapPin, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Tribe {
  id: string;
  owner: string;
  title: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  city: string | null;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

interface TribeCardProps {
  tribe: Tribe;
  index?: number;
  linkState?: any;
}

export function TribeCard({ tribe, index = 0, linkState }: TribeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link to={`/groups/${tribe.id}`} state={linkState}>
        <motion.div
          whileHover={{ y: -4 }}
          className="group relative overflow-hidden rounded-2xl bg-card border border-border shadow-card transition-all duration-300 hover:shadow-xl"
        >
          {/* Cover Image */}
          <div className="aspect-[16/9] overflow-hidden bg-muted">
            {tribe.cover_url ? (
              <img
                src={tribe.cover_url}
                alt={tribe.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <Users className="h-12 w-12 text-muted-foreground/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>

          {/* Content */}
          <div className="p-5">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-heading font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                {tribe.title}
              </h3>
              {tribe.is_private && (
                <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {tribe.description || 'No description'}
            </p>

            <div className="flex items-center justify-between">
              {tribe.city && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="line-clamp-1">{tribe.city}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
