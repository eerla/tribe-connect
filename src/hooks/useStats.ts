import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type Stats = { tribes: number; members: number; eventsPerMonth: number };

async function fetchStats(): Promise<Stats> {
  const now = new Date().toISOString();
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  
  const [tribes, members, events] = await Promise.all([
    supabase.from('tribes').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .gte('starts_at', now)
      .lt('starts_at', thirtyDaysFromNow)
      .eq('is_cancelled', false),
  ]);

  // Apply elevated numbers until actual counts reach targets
  // Targets: tribes 50+, members 10000+, events 80+
  const tribeCount = tribes.count ?? 0;
  const memberCount = members.count ?? 0;
  const eventCount = events.count ?? 0;

  return {
    tribes: Math.max(tribeCount, 50),
    members: Math.max(memberCount, 10000),
    eventsPerMonth: Math.max(eventCount, 80),
  };
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
    staleTime: 5 * 60 * 1000, // cache 5 min
  });
}