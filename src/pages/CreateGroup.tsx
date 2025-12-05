import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, MapPin, Image, ArrowLeft, Loader2, Lock } from 'lucide-react';
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
import { categories } from '@/data/mockData';

export default function CreateGroup() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <p className="text-muted-foreground mb-6">
            You need to be signed in to create a tribe
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
      title: "Tribe created!",
      description: "Your tribe is now live. Start inviting members!",
    });
    
    navigate('/groups');
  };

  return (
    <Layout>
      <div className="container py-8 md:py-12 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button variant="ghost" size="sm" className="mb-6" asChild>
            <Link to="/groups">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tribes
            </Link>
          </Button>

          <h1 className="text-3xl font-heading font-bold mb-2">Create a Tribe</h1>
          <p className="text-muted-foreground mb-8">
            Start your own community and bring people together
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
              <h2 className="font-semibold">Basic Information</h2>
              
              <div className="space-y-2">
                <Label htmlFor="name">Tribe Name</Label>
                <Input id="name" placeholder="Give your tribe a memorable name" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What's your tribe about? Who should join?"
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select required>
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

            {/* Location */}
            <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
              <h2 className="font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </h2>
              
              <div className="space-y-2">
                <Label htmlFor="location">City / Region</Label>
                <Input id="location" placeholder="e.g., San Francisco, CA" required />
              </div>
            </div>

            {/* Privacy */}
            <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
              <h2 className="font-semibold flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Privacy
              </h2>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Private Tribe</p>
                  <p className="text-sm text-muted-foreground">
                    Members need approval to join
                  </p>
                </div>
                <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
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
                  'Create Tribe'
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </Layout>
  );
}
