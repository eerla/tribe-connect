import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { generateRRule } from '@/lib/rrule';
import { extractRecurrenceState } from '@/lib/recurrenceState';
import { Calendar, MapPin, Clock, Image, ArrowLeft, Loader2, X, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
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
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { categories } from '@/data/categories';



interface Event {
  id: string;
  slug: string | null;
  title: string;
  description: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  starts_at: string;
  ends_at: string | null;
  capacity: number | null;
  price: number;
  banner_url: string | null;
  category: string | null;
  organizer: string;
  tribe_id: string | null;
}

export default function EditEvent() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [isNotAuthorized, setIsNotAuthorized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [capacity, setCapacity] = useState('');
  const [price, setPrice] = useState('0');
  const [isOnline, setIsOnline] = useState(false);
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [currentBannerUrl, setCurrentBannerUrl] = useState<string | null>(null);
  const [removeBanner, setRemoveBanner] = useState(false);

  // Recurrence state
  const [recurrenceType, setRecurrenceType] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceWeekdays, setRecurrenceWeekdays] = useState<string[]>([]);
  const [recurrenceEndType, setRecurrenceEndType] = useState<'never' | 'after' | 'on'>('never');
  const [recurrenceCount, setRecurrenceCount] = useState<number>(1);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  // Location verification state
  const [locationStatus, setLocationStatus] = useState<{
    verified: boolean;
    coords: { lat: number; lng: number } | null;
    message: string;
    isVerifying: boolean;
  }>({ verified: false, coords: null, message: '', isVerifying: false });

  // Derived constraints for date/time pickers
  const todayDate = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toTimeString().slice(0, 5);
  const startTimeMin = startDate === todayDate ? currentTime : undefined;
  const endDateMin = startDate || todayDate;
  const endTimeMin = (endDate && startDate && endDate === startDate && startTime)
    ? startTime
    : undefined;

  // Fetch event on mount
  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) {
        setIsNotAuthorized(true);
        setIsLoading(false);
        return;
      }

      // Wait for auth to load
      if (isAuthLoading) {
        return;
      }

      // Check if user is authenticated
      if (!user) {
        toast({
          title: 'Not authenticated',
          description: 'Please sign in to edit events',
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }

      try {
        // Check if the id is a UUID or slug
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        
        let data, error;
        
        if (isUUID) {
          // Fetch by UUID
          const result = await supabase
            .from('events')
            .select('*')
            .eq('id', id)
            .single();
          data = result.data;
          error = result.error;
        } else {
          // Try to fetch by slug
          const result = await supabase
            .from('events')
            .select('*')
            .eq('slug', id)
            .single();
          data = result.data;
          error = result.error;
          
          // If not found, check slug_history for redirects
          if (!data) {
            const { data: historyData } = await supabase
              .from('slug_history')
              .select('entity_id, new_slug')
              .eq('entity_type', 'event')
              .eq('old_slug', id)
              .single();
            
            if (historyData?.new_slug) {
              // Redirect to new slug
              navigate(`/events/${historyData.new_slug}/edit`, { replace: true });
              return;
            }
          }
        }
        
        // If fetched by UUID and has a slug, redirect to slug URL
        if (data && isUUID && data.slug) {
          navigate(`/events/${data.slug}/edit`, { replace: true });
          return;
        }

        if (error) throw error;

        if (!data) {
          toast({
            title: 'Event not found',
            description: 'This event does not exist',
            variant: 'destructive',
          });
          navigate('/events');
          return;
        }

        // Check if user is the organizer
        if (data.organizer !== user.id) {
          setIsNotAuthorized(true);
          setIsLoading(false);
          return;
        }

        // Check if event is in the past
        const eventStart = new Date(data.starts_at);
        const now = new Date();
        if (eventStart < now) {
          toast({
            title: 'Cannot edit past event',
            description: 'You can only edit future events',
            variant: 'destructive',
          });
          navigate(`/events/${data.slug || id}`);
          return;
        }

        setEvent(data);

        // Populate form fields
        const startDateTime = new Date(data.starts_at);
        setStartDate(startDateTime.toISOString().split('T')[0]);
        setStartTime(startDateTime.toTimeString().slice(0, 5));

        if (data.ends_at) {
          const endDateTime = new Date(data.ends_at);
          setEndDate(endDateTime.toISOString().split('T')[0]);
          setEndTime(endDateTime.toTimeString().slice(0, 5));
        }

        setTitle(data.title || '');
        setDescription(data.description || '');
        setLocation(data.location || '');
        setIsOnline(data.location === 'Online');
        setSelectedCategory(data.category || '');
        setCapacity(data.capacity?.toString() || '');
        setPrice((data.price || 0).toString());

        setCurrentBannerUrl(data.banner_url || null);

        // Recurrence: prepopulate from recurrence_rule if present
        if (data.recurrence_rule) {
          const recur = extractRecurrenceState(data.recurrence_rule);
          setRecurrenceType(recur.recurrenceType as 'none' | 'daily' | 'weekly' | 'monthly');
          setRecurrenceInterval(Number(recur.recurrenceInterval));
          setRecurrenceWeekdays(Array.isArray(recur.recurrenceWeekdays) ? recur.recurrenceWeekdays : []);
          setRecurrenceEndType(recur.recurrenceEndType as 'never' | 'after' | 'on');
          setRecurrenceCount(Number(recur.recurrenceCount));
          setRecurrenceEndDate(recur.recurrenceEndDate || '');
        } else {
          setRecurrenceType('none');
          setRecurrenceInterval(1);
          setRecurrenceWeekdays([]);
          setRecurrenceEndType('never');
          setRecurrenceCount(1);
          setRecurrenceEndDate('');
        }

        // If location exists and has coordinates, mark as verified
        if (data.location && data.latitude && data.longitude) {
          setLocationStatus({
            verified: true,
            coords: { lat: data.latitude, lng: data.longitude },
            message: '✓ Location verified',
            isVerifying: false,
          });
        }
      } catch (error: any) {
        console.error('Error fetching event:', error);
        toast({
          title: 'Error',
          description: 'Failed to load event',
          variant: 'destructive',
        });
        navigate('/events');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [id, user, isAuthLoading, navigate]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Image must be less than 5MB',
          variant: 'destructive',
        });
        return;
      }

      setBannerImage(file);
      setRemoveBanner(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerifyLocation = async () => {
    if (!location || location.trim().length < 3) {
      toast({
        title: 'Location too short',
        description: 'Please enter at least 3 characters',
        variant: 'destructive',
      });
      return;
    }

    setLocationStatus({ ...locationStatus, isVerifying: true });

    const coords = await geocodeLocation(location);

    if (coords.lat && coords.lng) {
      setLocationStatus({
        verified: true,
        coords,
        message: '✓ Location verified',
        isVerifying: false,
      });
      toast({
        title: '✓ Location found',
        description: 'Location verified successfully',
      });
    } else {
      setLocationStatus({
        verified: false,
        coords: null,
        message: '⚠ Location not found. Try a more specific address like "San Francisco, CA"',
        isVerifying: false,
      });
      toast({
        title: '⚠️ Location not found',
        description: 'Please try a more specific address (e.g., "San Francisco, CA")',
        variant: 'destructive',
      });
    }
  };

  const geocodeLocation = async (locationString: string): Promise<{ lat: number | null; lng: number | null }> => {
    try {
      const { data, error } = await supabase.functions.invoke('geocode', {
        body: { location: locationString }
      });

      if (error) {
        console.warn('Geocoding error:', error);
        return { lat: null, lng: null };
      }

      if (data && typeof data === 'object' && 'lat' in data && 'lng' in data) {
        return {
          lat: data.lat,
          lng: data.lng
        };
      }

      console.warn('Invalid geocoding response format:', data);
      return { lat: null, lng: null };
    } catch (error) {
      console.warn('Geocoding failed (network/other error):', error);
      return { lat: null, lng: null };
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
        title: 'Image upload failed',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteOldBanner = async (bannerUrl: string) => {
    try {
      const url = new URL(bannerUrl);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(-2).join('/');

      await supabase.storage
        .from('events')
        .remove([filePath]);
    } catch (error) {
      console.error('Error deleting old banner:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !startDate || !startTime) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if ((endDate && !endTime) || (!endDate && endTime)) {
      toast({
        title: 'Incomplete end time',
        description: 'Please provide both end date and end time or leave both empty',
        variant: 'destructive',
      });
      return;
    }

    if (!isOnline && !location) {
      toast({
        title: 'Missing location',
        description: 'Please enter a location for in-person events',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      const now = new Date();
      const startDateTime = new Date(`${startDate}T${startTime}`);

      if (isNaN(startDateTime.getTime())) {
        throw new Error('Invalid start date/time');
      }

      if (startDateTime <= now) {
        toast({
          title: 'Start time must be in the future',
          description: 'Pick a start date and time later than the current time',
          variant: 'destructive',
        });
        setIsSaving(false);
        return;
      }

      let endsAt: string | null = null;
      if (endDate && endTime) {
        const endDateTime = new Date(`${endDate}T${endTime}`);
        if (isNaN(endDateTime.getTime())) {
          throw new Error('Invalid end date/time');
        }
        if (endDateTime <= startDateTime) {
          toast({
            title: 'End must follow start',
            description: 'Choose an end date/time after the start date/time',
            variant: 'destructive',
          });
          setIsSaving(false);
          return;
        }
        endsAt = endDateTime.toISOString();
      }

      const startsAt = startDateTime.toISOString();

      // Handle location and geocoding for in-person events
      const locationString = isOnline ? 'Online' : location;
      let latitude: number | null = null;
      let longitude: number | null = null;

      if (!isOnline && locationString && locationString.trim() !== '') {
        if (locationStatus.verified && locationStatus.coords) {
          latitude = locationStatus.coords.lat;
          longitude = locationStatus.coords.lng;
        } else {
          const coordinates = await geocodeLocation(locationString);
          latitude = coordinates.lat;
          longitude = coordinates.lng;
        }
      }

      // Prepare update payload
      // const updatePayload: any = {
      //   title,
      //   description,
      //   location: locationString,
      //   latitude,
      //   longitude,
      //   starts_at: startsAt,
      //   ends_at: endsAt,
      //   capacity: capacity ? parseInt(capacity) : null,
      //   price: parseFloat(price || '0'),
      //   category: selectedCategory || null,
      // };

      const updatePayload: any = {
        title,
        description,
        location: locationString,
        latitude,
        longitude,
        starts_at: startsAt,
        ends_at: endsAt,
        capacity: capacity ? parseInt(capacity) : null,
        price: parseFloat(price || '0'),
        category: selectedCategory || null,
        recurrence_rule: recurrenceType !== 'none' ? generateRRule({
          frequency: recurrenceType.toUpperCase() as 'DAILY' | 'WEEKLY' | 'MONTHLY',
          interval: recurrenceInterval,
          byweekday: recurrenceType === 'weekly' ? recurrenceWeekdays : [],
          dtstart: new Date(`${startDate}T${startTime}`),
          until: recurrenceEndType === 'on' && recurrenceEndDate ? new Date(recurrenceEndDate) : undefined,
          count: recurrenceEndType === 'after' ? recurrenceCount : undefined,
        }) : null,
        recurrence_end_date: recurrenceEndType === 'on' && recurrenceEndDate ? recurrenceEndDate : null,
      };

      // Handle banner image
      let newBannerUrl = currentBannerUrl;

      if (removeBanner && currentBannerUrl) {
        // Delete old banner
        await deleteOldBanner(currentBannerUrl);
        newBannerUrl = null;
      } else if (bannerImage) {
        // Upload new banner and delete old one if exists
        if (currentBannerUrl) {
          await deleteOldBanner(currentBannerUrl);
        }
        newBannerUrl = await uploadBannerImage(event?.id || id!);
      }

      if (newBannerUrl !== undefined) {
        updatePayload.banner_url = newBannerUrl;
      }

      // Update event using the event's actual id (not slug)
      const { error } = await supabase
        .from('events')
        .update(updatePayload)
        .eq('id', event?.id || id)
        .eq('organizer', user?.id); // Ensure they own it

      if (error) throw error;

      toast({
        title: 'Event updated!',
        description: 'Your changes have been saved',
      });

      navigate(`/events/${event?.slug || id}`);
    } catch (error: any) {
      console.error('Error updating event:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update event',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <p className="text-muted-foreground mb-6">You need to be signed in to edit events</p>
          <Button asChild>
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </Layout>
    );
  }

  if (isNotAuthorized) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Not authorized</h1>
          <p className="text-muted-foreground mb-6">You can only edit events you created</p>
          <Button asChild>
            <Link to="/events">Back to Events</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 md:py-12 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button variant="ghost" size="sm" className="mb-6" asChild>
            <Link to={`/events/${event?.slug || id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Event
            </Link>
          </Button>

          <h1 className="text-3xl font-heading font-bold mb-2">Edit Event</h1>
          <p className="text-muted-foreground mb-8">Update your event details</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Summer Picnic Meetup"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell people about your event..."
                rows={5}
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category (optional)</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Event Type */}
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <Label className="text-base font-semibold">Online Event</Label>
                <p className="text-sm text-muted-foreground">No physical location required</p>
              </div>
              <Switch checked={isOnline} onCheckedChange={setIsOnline} />
            </div>

            {/* Location */}
            {!isOnline && (
              <div className="space-y-3">
                <Label htmlFor="location">Location *</Label>
                <div className="flex gap-2">
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      setLocationStatus({ verified: false, coords: null, message: '', isVerifying: false });
                    }}
                    placeholder="e.g., San Francisco, CA"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleVerifyLocation}
                    disabled={locationStatus.isVerifying || !location}
                  >
                    {locationStatus.isVerifying ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Verify'
                    )}
                  </Button>
                </div>
                {locationStatus.message && (
                  <div className={`flex items-center gap-2 text-sm ${locationStatus.verified ? 'text-green-600' : 'text-amber-600'}`}>
                    {locationStatus.verified ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    {locationStatus.message}
                  </div>
                )}
              </div>
            )}

            {/* Date and Time */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={todayDate}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  min={startTimeMin}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={endDateMin}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  min={endTimeMin}
                />
              </div>
            </div>

            {/* Capacity */}
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity (optional)</Label>
              <Input
                id="capacity"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="Max number of attendees"
                min="1"
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            {/* Banner Image */}
            <div className="space-y-3">
              <Label>Event Image</Label>

              {(bannerPreview || (currentBannerUrl && !removeBanner)) && (
                <div className="relative">
                  <img
                    src={bannerPreview || currentBannerUrl || ''}
                    alt="Event banner preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (bannerPreview) {
                        setBannerPreview(null);
                        setBannerImage(null);
                      } else {
                        setRemoveBanner(true);
                      }
                    }}
                    className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {!bannerPreview && (!currentBannerUrl || removeBanner) && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <Image className="h-8 w-8 mb-2 text-muted-foreground" />
                  <span className="text-sm font-medium">Click to upload or drag and drop</span>
                  <span className="text-xs text-muted-foreground">PNG, JPG up to 5MB</span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>


            {/* Recurrence Section */}
            <div>
              <Label>Repeat</Label>
              <Select value={recurrenceType} onValueChange={v => setRecurrenceType(v as any)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (One-time)</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              {recurrenceType !== 'none' && (
                <div className="mt-2 space-y-2">
                  <Label>Repeat every</Label>
                  <Input
                    type="number"
                    min={1}
                    value={recurrenceInterval}
                    onChange={e => setRecurrenceInterval(Number(e.target.value))}
                    className="w-24 inline-block ml-2"
                  />
                  <span className="ml-2">{recurrenceType === 'daily' ? 'day(s)' : recurrenceType === 'weekly' ? 'week(s)' : 'month(s)'}</span>
                  {recurrenceType === 'weekly' && (
                    <div className="mt-2 flex gap-2">
                      {['MO','TU','WE','TH','FR','SA','SU'].map(day => (
                        <Button
                          key={day}
                          type="button"
                          variant={recurrenceWeekdays.includes(day) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setRecurrenceWeekdays(
                            recurrenceWeekdays.includes(day)
                              ? recurrenceWeekdays.filter(d => d !== day)
                              : [...recurrenceWeekdays, day]
                          )}
                        >{day}</Button>
                      ))}
                    </div>
                  )}
                  <div className="mt-2">
                    <Label>Ends</Label>
                    <Select value={recurrenceEndType} onValueChange={v => setRecurrenceEndType(v as any)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Never" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Never</SelectItem>
                        <SelectItem value="after">After N occurrences</SelectItem>
                        <SelectItem value="on">On date</SelectItem>
                      </SelectContent>
                    </Select>
                    {recurrenceEndType === 'after' && (
                      <Input
                        type="number"
                        min={1}
                        value={recurrenceCount}
                        onChange={e => setRecurrenceCount(Number(e.target.value))}
                        className="w-24 mt-2"
                      />
                    )}
                    {recurrenceEndType === 'on' && (
                      <Input
                        type="date"
                        value={recurrenceEndDate}
                        onChange={e => setRecurrenceEndDate(e.target.value)}
                        className="w-48 mt-2"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="flex-1"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>

              <Button type="button" variant="outline" size="lg" asChild>
                <Link to={`/events/${event?.slug || id}`}>Cancel</Link>
              </Button>
            </div>

          </form>
        </motion.div>
      </div>
    </Layout>
  );
}
