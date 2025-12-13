import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, Users, Image, ArrowLeft, Loader2, X } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTribes } from '@/hooks/useTribes';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function CreateEvent() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const { tribes } = useTribes();
  const [selectedTribeId, setSelectedTribeId] = useState<string | null>(null);
  // const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('inherit');
  const [capacity, setCapacity] = useState('');
  const [price, setPrice] = useState('0');
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setBannerImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadBannerImage = async (eventId: string): Promise<string | null> => {
    if (!bannerImage) return null;

    try {
      const fileExt = bannerImage.name.split('.').pop();
      const fileName = `${eventId}-${Date.now()}.${fileExt}`;
      const filePath = `event-banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(filePath, bannerImage);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('events')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Image upload failed",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  if (!isAuthenticated || !user) {
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
    
    if (!title || !description || !startDate || !startTime) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!isOnline && !location) {
      toast({
        title: "Missing location",
        description: "Please enter a location for in-person events",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Combine date and time into ISO strings
      const startsAt = new Date(`${startDate}T${startTime}`).toISOString();
      const endsAt = endDate && endTime 
        ? new Date(`${endDate}T${endTime}`).toISOString()
        : null;

      // Create slug from title
      const slug = title.toLowerCase().replace(/\s+/g, '-');

      // Determine category: explicit selection wins (unless "inherit"), otherwise inherit from tribe if provided
      let eventCategory: string | null = (selectedCategory && selectedCategory !== 'inherit') ? selectedCategory : null;
      if (!eventCategory && selectedTribeId) {
        const t = tribes.find(t => t.id === selectedTribeId);
        eventCategory = t?.category ?? null;
      }

      const { data, error } = await supabase
        .from('events')
        .insert({
          organizer: user.id,
          tribe_id: selectedTribeId || null,
          category: eventCategory,
          title,
          slug,
          description,
          location: isOnline ? 'Online' : location,
          starts_at: startsAt,
          ends_at: endsAt,
          capacity: capacity ? parseInt(capacity) : null,
          price: parseFloat(price || '0'),
        })
        .select()
        .single();

      if (error) throw error;

      // Upload banner image if provided
      if (data && bannerImage) {
        const bannerUrl = await uploadBannerImage(data.id);
        if (bannerUrl) {
          await supabase
            .from('events')
            .update({ banner_url: bannerUrl } as any)
            .eq('id', data.id);
        }
      }

      toast({
        title: "Event created!",
        description: "Your event has been published successfully",
      });
      
      navigate('/events');
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
                <Input 
                  id="title" 
                  placeholder="Give your event a catchy title" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What's your event about? What can attendees expect?"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              {/* Optional: Choose Group / Category */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tribe">Group (optional)</Label>
                  <Select
                    value={selectedTribeId ?? 'none'}
                    onValueChange={(v) => {
                      const val = v === 'none' ? null : v;
                      setSelectedTribeId(val);
                      // If a tribe is chosen and the category is currently "inherit", inherit it
                      if (val) {
                        const t = tribes.find(t => t.id === val);
                        if (t && selectedCategory === 'inherit') setSelectedCategory(t.category || 'inherit');
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No group</SelectItem>
                      {tribes.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.title || t.slug || t.id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category (optional)</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Inherit from group or choose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inherit">Inherit / None</SelectItem>
                    {Array.from(new Set(tribes.map(t => t.category || 'Other').filter(Boolean))).sort().map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cover">Cover Image</Label>
                {bannerPreview ? (
                  <div className="relative">
                    <img
                      src={bannerPreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setBannerImage(null);
                        setBannerPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <Image className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
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
                  <Input 
                    id="start-date" 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input 
                    id="start-time" 
                    type="time" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input 
                    id="end-date" 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <Input 
                    id="end-time" 
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
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
                    <Label htmlFor="location">Location</Label>
                    <Input 
                      id="location" 
                      placeholder="e.g., 123 Main Street, San Francisco, CA"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
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
                <Input 
                  id="max-attendees" 
                  type="number" 
                  placeholder="Leave empty for unlimited"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Ticket Price (optional)</Label>
                <Input 
                  id="price" 
                  type="number" 
                  placeholder="0"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
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
