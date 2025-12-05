import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, MapPin, Lock } from 'lucide-react';
import { Tribe } from '@/types';
import { Badge } from '@/components/ui/badge';

interface TribeCardProps {
  tribe: Tribe;
  index?: number;
}

export function TribeCard({ tribe, index = 0 }: TribeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link to={`/groups/${tribe.id}`}>
        <motion.div
          whileHover={{ y: -4 }}
          className="group relative overflow-hidden rounded-2xl bg-card border border-border shadow-card transition-all duration-300 hover:shadow-xl"
        >
          {/* Cover Image */}
          <div className="aspect-[16/9] overflow-hidden">
            <img
              src={tribe.cover_image || `https://picsum.photos/800/450?random=${tribe.id}`}
              alt={tribe.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>

          {/* Content */}
          <div className="p-5">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-heading font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                {tribe.name}
              </h3>
              {tribe.is_private && (
                <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {tribe.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="line-clamp-1">{tribe.location}</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{tribe.member_count.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border">
              <Badge variant="secondary" className="text-xs">
                {tribe.category}
              </Badge>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
