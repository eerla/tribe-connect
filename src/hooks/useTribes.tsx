import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Tribe {
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

export function useTribes() {
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTribes = async () => {
      try {
        const { data, error } = await supabase
          .from('tribes')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTribes(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTribes();
  }, []);

  return { tribes, isLoading, error };
}