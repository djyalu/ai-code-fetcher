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
                .order('input_price', { ascending: true })
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
                // IMPORTANT:
                // UI와 chat 호출에서 사용하는 값은 DB의 uuid(id)가 아니라 실제 모델 식별자(model_id)여야 합니다.
                // (uuid를 보내면 backend에서 "not a valid model ID" 400이 발생)
                id: m.model_id,
                name: m.name,
                provider: m.provider,
                description: m.description,
                inputPrice: m.input_price,
                outputPrice: m.output_price,
                contextWindow: m.context_window,
                color: m.color,
                isActive: m.is_active !== false
            })) as (AIModel & { isActive: boolean })[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const refreshModels = () => queryClient.invalidateQueries({ queryKey: ['ai_models'] });

    const seedModels = async () => {
        const rows = MODELS.map(m => ({
            id: m.id,
            model_id: m.id,
            name: m.name,
            provider: m.provider,
            description: m.description,
            input_price: m.inputPrice,
            output_price: m.outputPrice,
            context_window: m.contextWindow,
            color: m.color,
            is_active: true
        }));

        const { error } = await supabase
            .from('ai_models' as any)
            .upsert(rows, { onConflict: 'id' });

        if (error) throw error;
        await refreshModels();
    };

    // Filter only active models for UI consumption
    const activeModels = models.filter((m: any) => m.isActive !== false);

    return { models, activeModels, isLoading, error, refreshModels, seedModels };
};

