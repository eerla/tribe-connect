import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, MapPin, Image, ArrowLeft, Loader2, Lock, X } from 'lucide-react';
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
import type { Database } from '@/integrations/supabase/types';

type Tribe = Database['public']['Tables']['tribes']['Row'];

export default function EditGroup() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isNotAuthorized, setIsNotAuthorized] = useState(false);
  const [tribe, setTribe] = useState<Tribe | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string | null>(null);
  const [removeCover, setRemoveCover] = useState(false);

  useEffect(() => {
    const fetchTribe = async () => {
      if (!id) {
        setIsNotAuthorized(true);
        setIsLoading(false);
        return;
      }

      if (isAuthLoading) return;

      if (!user) {
        toast({
          title: 'Not authenticated',
          description: 'Please sign in to edit tribes',
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }

      try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        let data: Tribe | null = null;
        let error: any = null;

        if (isUUID) {
          const result = await supabase
            .from('tribes')
            .select('*')
            .eq('id', id)
            .eq('is_deleted', false)
            .single();
          data = result.data;
          error = result.error;
        } else {
          const result = await supabase
            .from('tribes')
            .select('*')
            .eq('slug', id)
            .eq('is_deleted', false)
            .single();
          data = result.data;
          error = result.error;

          if (!data) {
            const { data: historyData } = await supabase
              .from('slug_history')
              .select('entity_id, new_slug')
              .eq('entity_type', 'tribe')
              .eq('old_slug', id)
              .single();

            if (historyData?.new_slug) {
              navigate(`/groups/${historyData.new_slug}/edit`, { replace: true });
              return;
            }
          }
        }

        if (data && isUUID && data.slug) {
          navigate(`/groups/${data.slug}/edit`, { replace: true });
          return;
        }

        if (error) throw error;
        if (!data) throw new Error('Tribe not found');

        if (data.owner !== user.id) {
          setIsNotAuthorized(true);
          setIsLoading(false);
          return;
        }

        setTribe(data);
        setTitle(data.title || '');
        setDescription(data.description || '');
        setCategory(data.category || '');
        setLocation(data.city || '');
        setIsPrivate(Boolean(data.is_private));
        setCurrentCoverUrl(data.cover_url || null);
      } catch (err: any) {
        console.error('Error loading tribe:', err);
        toast({
          title: 'Error',
          description: err?.message || 'Failed to load tribe',
          variant: 'destructive',
        });
        navigate('/groups');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTribe();
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
      setCoverImage(file);
      setRemoveCover(false);
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadCoverImage = async (tribeId: string): Promise<string | null> => {
    if (!coverImage) return null;
    try {
      const fileExt = coverImage.name.split('.').pop();
      const fileName = `${tribeId}-${Date.now()}.${fileExt}`;
      const filePath = `tribe-covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('tribes')
        .upload(filePath, coverImage);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('tribes')
        .getPublicUrl(filePath);
      return publicUrl;
    } catch (err: any) {
      console.error('Error uploading image:', err);
      toast({
        title: 'Image upload failed',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteOldCover = async (coverUrl: string) => {
    try {
      const url = new URL(coverUrl);
      const parts = url.pathname.split('/');
      const filePath = parts.slice(-2).join('/');
      await supabase.storage.from('tribes').remove([filePath]);
    } catch (err) {
      console.error('Error deleting old cover:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !category || !location) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      let newCoverUrl = currentCoverUrl;

      if (removeCover && currentCoverUrl) {
        await deleteOldCover(currentCoverUrl);
        newCoverUrl = null;
      } else if (coverImage) {
        if (currentCoverUrl) {
          await deleteOldCover(currentCoverUrl);
        }
        newCoverUrl = await uploadCoverImage(tribe?.id || id!);
      }

      const updatePayload: Partial<Tribe> = {
        title,
        description,
        category,
        city: location,
        is_private: isPrivate,
        cover_url: newCoverUrl ?? null,
      };

      const { error } = await supabase
        .from('tribes')
        .update(updatePayload)
        .eq('id', tribe?.id || id)
        .eq('owner', user.id);

      if (error) throw error;

      toast({
        title: 'Tribe updated!',
        description: 'Your changes have been saved',
      });

      navigate(`/groups/${tribe?.slug || id}`);
    } catch (err: any) {
      console.error('Error updating tribe:', err);
      toast({
        title: 'Error',
        description: err?.message || 'Failed to update tribe',
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
          <p className="text-muted-foreground mb-6">You need to be signed in to edit tribes</p>
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
          <p className="text-muted-foreground">Loading tribe...</p>
        </div>
      </Layout>
    );
  }

  if (isNotAuthorized) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Not authorized</h1>
          <p className="text-muted-foreground mb-6">You can only edit tribes you own</p>
          <Button asChild>
            <Link to="/groups">Back to Tribes</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 md:py-12 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" size="sm" className="mb-6" asChild>
            <Link to={`/groups/${tribe?.slug || id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tribe
            </Link>
          </Button>

          <h1 className="text-3xl font-heading font-bold mb-2">Edit Tribe</h1>
          <p className="text-muted-foreground mb-8">Update your tribe details</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
              <h2 className="font-semibold">Basic Information</h2>

              <div className="space-y-2">
                <Label htmlFor="name">Tribe Name</Label>
                <Input
                  id="name"
                  placeholder="Give your tribe a memorable name"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What's your tribe about? Who should join?"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cover">Cover Image</Label>
                {(coverPreview || (currentCoverUrl && !removeCover)) ? (
                  <div className="relative">
                    <img
                      src={coverPreview || currentCoverUrl || ''}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (coverPreview) {
                          setCoverPreview(null);
                          setCoverImage(null);
                        } else {
                          setRemoveCover(true);
                        }
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
                    <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
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

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
              <h2 className="font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </h2>

              <div className="space-y-2">
                <Label htmlFor="location">City / Region</Label>
                <Input
                  id="location"
                  placeholder="e.g., San Francisco, CA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
              <h2 className="font-semibold flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Privacy
              </h2>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Private Tribe</p>
                  <p className="text-sm text-muted-foreground">Members need approval to join</p>
                </div>
                <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" variant="hero" className="flex-1" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
}
