
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AIModel } from '@/types/chat';
import { MODELS } from '@/constants/models';

export const useAIModels = () => {
    const queryClient = useQueryClient();

    const { data: models = MODELS, isLoading, error } = useQuery({
        queryKey: ['ai_models'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('ai_models' as any)
                .select('*')
                .order('provider', { ascending: true })
                .order('name', { ascending: true });

            if (error) {
                console.warn('Supabase fetch failed, using fallback constants:', error.message);
                return MODELS;
            }

            if (!data || data.length === 0) {
                return MODELS;
            }

            return data.map((m: any) => ({
                id: m.id,
                name: m.name,
                provider: m.provider,
                description: m.description,
                inputPrice: m.input_price,
                outputPrice: m.output_price,
                contextWindow: m.context_window,
                color: m.color
            })) as AIModel[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const refreshModels = () => queryClient.invalidateQueries({ queryKey: ['ai_models'] });

    const seedModels = async () => {
        const rows = MODELS.map(m => ({
            id: m.id,
            name: m.name,
            provider: m.provider,
            description: m.description,
            input_price: m.inputPrice,
            output_price: m.outputPrice,
            context_window: m.contextWindow,
            color: m.color
        }));

        const { error } = await supabase
            .from('ai_models' as any)
            .upsert(rows);

        if (error) throw error;
        await refreshModels();
    };

    return { models, isLoading, error, refreshModels, seedModels };
};
