import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, Users, Image, ArrowLeft, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export default function CreateEvent() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <p className="text-muted-foreground mb-6">
            You need to be signed in to create an event
          </p>
          <Button asChild>
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Event created!",
      description: "Your event has been published successfully",
    });
    
    navigate('/events');
  };

  return (
    <Layout>
      <div className="container py-8 md:py-12 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button variant="ghost" size="sm" className="mb-6" asChild>
            <Link to="/events">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Link>
          </Button>

          <h1 className="text-3xl font-heading font-bold mb-2">Create Event</h1>
          <p className="text-muted-foreground mb-8">
            Bring your community together with an amazing event
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
              <h2 className="font-semibold">Basic Information</h2>
              
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input id="title" placeholder="Give your event a catchy title" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What's your event about? What can attendees expect?"
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cover">Cover Image</Label>
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
              <h2 className="font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Date & Time
              </h2>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input id="start-date" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input id="start-time" type="time" required />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input id="end-date" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <Input id="end-time" type="time" />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
              <h2 className="font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </h2>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Online Event</p>
                  <p className="text-sm text-muted-foreground">
                    This event will be hosted virtually
                  </p>
                </div>
                <Switch checked={isOnline} onCheckedChange={setIsOnline} />
              </div>

              {isOnline ? (
                <div className="space-y-2">
                  <Label htmlFor="online-link">Meeting Link</Label>
                  <Input id="online-link" placeholder="https://zoom.us/..." />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="venue">Venue Name</Label>
                    <Input id="venue" placeholder="e.g., TechHub SF" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" placeholder="123 Main Street, City, State" />
                  </div>
                </>
              )}
            </div>

            {/* Capacity */}
            <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
              <h2 className="font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Capacity
              </h2>
              
              <div className="space-y-2">
                <Label htmlFor="max-attendees">Maximum Attendees (optional)</Label>
                <Input id="max-attendees" type="number" placeholder="Leave empty for unlimited" />
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" variant="hero" className="flex-1" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Event'
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
}
