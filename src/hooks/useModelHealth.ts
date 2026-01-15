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
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

        (data as ModelHealth[] || []).forEach((row) => {
          status[row.model_id] = row.is_available;
          const checkDate = new Date(row.last_checked_at);
          if (!latestCheck || checkDate > latestCheck) {
            latestCheck = checkDate;
          }
        });

        setHealthStatus(status);
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
    // If we have health data for this model, return it
    if (modelId in healthStatus) {
      return healthStatus[modelId];
    }
    // For Perplexity models, check with prefix
    if (modelId.startsWith('sonar')) {
      const prefixedId = `perplexity/${modelId}`;
      if (prefixedId in healthStatus) {
        return healthStatus[prefixedId];
      }
    }
    // No data means we assume available
    return undefined;
  };

  return {
    healthStatus,
    lastChecked,
    isLoading,
    isModelAvailable,
  };
};
