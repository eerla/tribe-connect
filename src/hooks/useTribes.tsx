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
  category: string | null;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export function useTribes() {
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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

  useEffect(() => {
    fetchTribes();
  }, []);

  return { tribes, isLoading, error, refetch: fetchTribes };
}

export function useUserTribes(userId: string | undefined) {
  const [createdTribes, setCreatedTribes] = useState<Tribe[]>([]);
  const [joinedTribes, setJoinedTribes] = useState<Tribe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserTribes = async () => {
    setIsLoading(true);
    try {
      if (!userId) {
        setCreatedTribes([]);
        setJoinedTribes([]);
        setIsLoading(false);
        return;
      }

      // Get tribes the user created
      const { data: createdData, error: createdError } = await supabase
        .from('tribes')
        .select('*')
        .eq('owner', userId);

      if (createdError) throw createdError;
      setCreatedTribes(createdData || []);

      // Get tribes the user joined via tribe_members
      const { data: membersData, error: membersError } = await supabase
        .from('tribe_members')
        .select('tribe_id')
        .eq('user_id', userId);

      if (membersError) throw membersError;

      const joinedTribeIds = membersData?.map(m => m.tribe_id) || [];
      
      if (joinedTribeIds.length > 0) {
        const { data: joinedData, error: joinedError } = await supabase
          .from('tribes')
          .select('*')
          .in('id', joinedTribeIds);

        if (joinedError) throw joinedError;
        setJoinedTribes(joinedData || []);
      } else {
        setJoinedTribes([]);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching user tribes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserTribes();
  }, [userId]);

  return { createdTribes, joinedTribes, isLoading, error, refetch: fetchUserTribes };
}