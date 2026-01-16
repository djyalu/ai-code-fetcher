import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ModelHealth {
  model_id: string;
  is_available: boolean;
  last_checked_at: string;
  error_message: string | null;
}

export const useModelHealth = () => {
  const [healthStatus, setHealthStatus] = useState<Record<string, boolean>>({});
  const [lastCheckedMap, setLastCheckedMap] = useState<Record<string, Date>>({});
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const TTL_MS = 10 * 60 * 1000; // 10 minutes

  useEffect(() => {
    const fetchHealthStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('model_health' as never)
          .select('model_id, is_available, last_checked_at');

        if (error) {
          console.error('Error fetching model health:', error);
          return;
        }

        const status: Record<string, boolean> = {};
        let latestCheck: Date | null = null;

  const lastCheckedMapLocal: Record<string, Date> = {};
  (data as ModelHealth[] || []).forEach((row) => {
          status[row.model_id] = row.is_available;
          const checkDate = new Date(row.last_checked_at);
          lastCheckedMapLocal[row.model_id] = checkDate;
          if (!latestCheck || checkDate > latestCheck) {
            latestCheck = checkDate;
          }
        });

        setHealthStatus(status);
        setLastCheckedMap(lastCheckedMapLocal);
        setLastChecked(latestCheck);
      } catch (err) {
        console.error('Error in useModelHealth:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHealthStatus();
  }, []);

  const isModelAvailable = (modelId: string): boolean | undefined => {
    // Determine the canonical id we stored in the health table
    const canonicalId = modelId.startsWith('sonar') ? `perplexity/${modelId}` : modelId;

    const last = lastCheckedMap[canonicalId];
    if (!last) return undefined;
    // If the health information is stale, treat as unknown
    if (Date.now() - last.getTime() > TTL_MS) return undefined;

    return healthStatus[canonicalId];
  };

  return {
    healthStatus,
    lastChecked,
    isLoading,
    isModelAvailable,
  };
};
