import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Video, Heart } from 'lucide-react';
import { Event } from '@/types';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface EventCardProps {
  event: Event;
  index?: number;
  isSaved?: boolean;
  onToggleSave?: (eventId: string) => Promise<void> | void;
  linkState?: any;
}

export function EventCard({ event, index = 0, isSaved = false, onToggleSave, linkState }: EventCardProps) {
  const startDate = new Date(event.starts_at);
  const isFull = event.max_attendees ? event.attendee_count >= event.max_attendees : false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link to={`/events/${event.id}`} state={linkState}>
        <motion.div
          whileHover={{ y: -4 }}
          className="group relative overflow-hidden rounded-2xl bg-card border border-border shadow-card transition-all duration-300 hover:shadow-xl"
        >
          {/* Cover Image */}
          <div className="aspect-[16/10] overflow-hidden relative">
            <img
              src={event.banner_url || `https://picsum.photos/800/500?random=${event.id}`}
              alt={event.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
            
            {/* Date Badge */}
            <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm rounded-xl p-2 text-center min-w-[60px] border border-border/50">
              <span className="block text-xs font-medium text-primary uppercase">
                {format(startDate, 'MMM')}
              </span>
              <span className="block text-2xl font-bold font-heading">
                {format(startDate, 'd')}
              </span>
            </div>

            {/* Status Badges */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              {event.is_online && (
                <Badge className="bg-secondary text-secondary-foreground">
                  <Video className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              )}
              {isFull && (
                <Badge variant="destructive">Full</Badge>
              )}
            </div>

            {/* Save Button (not part of the link) */}
            {onToggleSave && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(event.id); }}
                className="absolute top-4 left-4 z-20 bg-white/90 dark:bg-card/80 rounded-full p-2 hover:scale-105 transition-transform"
                aria-label={isSaved ? 'Unsave event' : 'Save event'}
              >
                <Heart className={`h-4 w-4 ${isSaved ? 'text-destructive' : 'text-muted-foreground'}`} />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-5">
            <h3 className="font-heading font-semibold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
              {event.title}
            </h3>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>{format(startDate, 'EEEE, MMMM d · h:mm a')}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="line-clamp-1">{event.venue_name || event.location}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-secondary" />
                <span className="text-sm font-medium">
                  {event.attendee_count} going
                  {event.max_attendees && (
                    <span className="text-muted-foreground"> / {event.max_attendees}</span>
                  )}
                </span>
              </div>

              <span className="text-sm font-medium text-primary">View →</span>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
