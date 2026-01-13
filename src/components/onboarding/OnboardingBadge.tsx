import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingBadgeProps {
  isNewUser: boolean | null;
  onDismiss?: () => void;
}

export const OnboardingBadge = ({ isNewUser, onDismiss }: OnboardingBadgeProps) => {
  const { user } = useAuth();

  const handleDismiss = async () => {
    if (!user?.id) return;
    
    try {
      await supabase
        .from('profiles')
        .update({ is_new_user: false })
        .eq('id', user.id);
      
      onDismiss?.();
    } catch (error) {
      console.error('Error dismissing onboarding:', error);
    }
  };

  if (!isNewUser) return null;

  return (
    <Alert className="mb-6 border-2 border-primary bg-primary/5 w-full p-2">
      <Lightbulb className="h-4 w-4 text-primary" />
      <AlertDescription className="flex items-center justify-between gap-3 whitespace-nowrap">
        <div className="flex-1 truncate">
          <span className="font-semibold">🎉 Welcome to TribeVibe!</span>
          <span className="ml-2 text-sm text-muted-foreground">Get started by creating your first tribe and connecting with like-minded people.</span>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button size="sm" asChild>
            <Link to="/groups/create">Create Tribe</Link>
          </Button>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
