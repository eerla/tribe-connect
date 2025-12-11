import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Compass, Navigation, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { TribeCard } from '@/components/cards/TribeCard';
import { EventCard } from '@/components/cards/EventCard';
import { useTribes } from '@/hooks/useTribes';
import { useEvents } from '@/hooks/useEvents';
import { toast } from '@/hooks/use-toast';

export default function Explore() {
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [location, setLocation] = useState<string | null>(null);

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
        setLocation(`${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)}`);
        toast({
          title: "Location found!",
          description: "Showing tribes and events near you",
        });
        setIsLoadingLocation(false);
      },
      (error) => {
        toast({
          title: "Location access denied",
          description: "Please enable location access to see nearby content",
          variant: "destructive",
        });
        setIsLoadingLocation(false);
      }
    );
  };

  const { tribes } = useTribes();
  const { events } = useEvents();

  const nearbyTribes = tribes?.slice(0, 4) || [];
  const nearbyEvents = events?.slice(0, 4) || [];

  return (
    <Layout>
      {/* Header */}
      <section className="bg-muted/30 border-b border-border">
        <div className="container py-8 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <Compass className="h-8 w-8 text-primary" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Explore Nearby
            </h1>
            <p className="text-muted-foreground mb-6">
              Discover tribes and events happening in your area
            </p>

            {location ? (
              <div className="flex items-center justify-center gap-2 text-secondary">
                <MapPin className="h-5 w-5" />
                <span className="font-medium">Showing results near you</span>
              </div>
            ) : (
              <Button 
                variant="hero" 
                size="lg" 
                onClick={handleGetLocation}
                disabled={isLoadingLocation}
              >
                {isLoadingLocation ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Getting location...
                  </>
                ) : (
                  <>
                    <Navigation className="h-5 w-5" />
                    Enable Location
                  </>
                )}
              </Button>
            )}
          </motion.div>
        </div>
      </section>

      {/* Nearby Tribes */}
      <section className="py-12">
        <div className="container">
          <h2 className="text-2xl font-heading font-bold mb-6">
            Tribes Near You
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {nearbyTribes.map((tribe, index) => (
              <TribeCard key={tribe.id} tribe={tribe} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Nearby Events */}
      <section className="py-12 bg-muted/30">
        <div className="container">
          <h2 className="text-2xl font-heading font-bold mb-6">
            Events Happening Soon
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {nearbyEvents.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Map Placeholder */}
      <section className="py-12">
        <div className="container">
          <div className="bg-muted/50 rounded-3xl border border-border p-8 md:p-16 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Interactive Map Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              We're working on an interactive map to help you discover tribes and events in your neighborhood.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
