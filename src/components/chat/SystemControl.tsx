import { useState, useEffect, useMemo } from "react";
import { MODELS } from "@/constants/models";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X, Zap, CircuitBoard, Shield, Settings, RotateCcw, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface SystemControlProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedModelIds: string[];
    onApply: (modelIds: string[]) => void;
}

export const SystemControl = ({
    open,
    onOpenChange,
    selectedModelIds,
    onApply,
}: SystemControlProps) => {
    const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedModelIds);

    // Filters
    const [minContext, setMinContext] = useState<number[]>([]); // Empty = no filter, using single value array implementation detail for Slider
    const [maxPrice, setMaxPrice] = useState<number[]>([]);
    const [selectedProviders, setSelectedProviders] = useState<string[]>([]);

    // Reset selected ids when open changes
    useEffect(() => {
        if (open) {
            setLocalSelectedIds(selectedModelIds);
        }
    }, [selectedModelIds, open]);

    const toggleModel = (id: string) => {
        setLocalSelectedIds((prev) =>
            prev.includes(id)
                ? prev.filter((modelId) => modelId !== id)
                : [...prev, id]
        );
    };

    const handleApply = () => {
        onApply(localSelectedIds);
        onOpenChange(false);
    };

    const getIcon = (provider: string) => {
        switch (provider) {
            case "openai": return <Zap className="w-5 h-5" />;
            case "anthropic": return <Zap className="w-5 h-5" />;
            case "google": return <Zap className="w-5 h-5" />;
            case "deepseek": return <CircuitBoard className="w-5 h-5" />;
            default: return <Shield className="w-5 h-5" />;
        }
    };

    // Filter Logic
    const filteredModels = useMemo(() => {
        return MODELS.filter(model => {
            // Context Filter
            // Slider logs: 0 -> 4k, 50 -> 64k, 100 -> 1M (Approximate mapping for UI visual)
            let passesContext = true;
            if (minContext.length > 0 && minContext[0] > 0) {
                // Map slider (0-100) to context values loosely
                const sliderVal = minContext[0];
                let targetContext = 0;
                if (sliderVal <= 33) targetContext = 4096 + (sliderVal / 33) * (64000 - 4096);
                else if (sliderVal <= 66) targetContext = 64000 + ((sliderVal - 33) / 33) * (500000 - 64000);
                else targetContext = 500000 + ((sliderVal - 66) / 34) * (2000000 - 500000);

                passesContext = (model.contextWindow || 0) >= targetContext;
            }

            // Price Filter
            let passesPrice = true;
            if (maxPrice.length > 0) {
                // Map slider (0-100) to price. 0=Free, 50=$0.5, 100=$10+
                const sliderVal = maxPrice[0];
                let limitPrice = 100;
                if (sliderVal <= 10) limitPrice = 0; // Free
                else if (sliderVal <= 50) limitPrice = 0.5;
                else if (sliderVal <= 90) limitPrice = 10;
                else limitPrice = 100; // Big number

                if (limitPrice === 0) passesPrice = (model.inputPrice === 0);
                else passesPrice = model.inputPrice <= limitPrice;
            }

            // Provider Filter
            let passesProvider = true;
            if (selectedProviders.length > 0) {
                passesProvider = selectedProviders.includes(model.provider);
            }

            return passesContext && passesPrice && passesProvider;
        });
    }, [minContext, maxPrice, selectedProviders]);

    const uniqueProviders = Array.from(new Set(MODELS.map(m => m.provider)));
    const providerDisplayNames: Record<string, string> = {
        'openai': 'GPT',
        'anthropic': 'Claude',
        'google': 'Gemini',
        'deepseek': 'DeepSeek',
        'meta': 'Llama',
        'mistral': 'Mistral'
    };

    const toggleProvider = (provider: string) => {
        setSelectedProviders(prev =>
            prev.includes(provider) ? prev.filter(p => p !== provider) : [...prev, provider]
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl bg-[#0A0A0A] border-zinc-800 text-white p-0 gap-0 overflow-hidden sm:rounded-3xl flex h-[85vh] md:h-auto">
                <DialogTitle className="sr-only">System Control</DialogTitle>

                {/* Sidebar */}
                <div className="w-80 border-r border-zinc-800/50 flex flex-col bg-zinc-950/30">
                    <div className="p-6 border-b border-zinc-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800 shrink-0">
                                <Settings className="w-5 h-5 text-zinc-400" />
                            </div>
                            <div>
                                <h2 className="font-bold tracking-tight text-white">System Control</h2>
                                <p className="text-[10px] font-medium text-zinc-500 tracking-wider">V3.0 ORCHESTRATION</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
                        {/* Context Length Filter */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-zinc-200 font-medium">
                                    <CircuitBoard className="w-4 h-4 text-zinc-500" />
                                    Context length
                                </div>
                                <ChevronDown className="w-4 h-4 text-zinc-600" />
                            </div>
                            <div className="px-1">
                                <Slider
                                    defaultValue={[0]}
                                    max={100}
                                    step={1}
                                    className="py-4"
                                    onValueChange={(vals) => setMinContext(vals[0] === 0 ? [] : vals)} // 0 = reset
                                    value={minContext.length ? minContext : [0]}
                                />
                                <div className="flex justify-between text-[10px] text-zinc-500 font-medium px-0.5">
                                    <span>4K</span>
                                    <span>64K</span>
                                    <span>1M</span>
                                </div>
                                {minContext.length > 0 && (
                                    <button
                                        onClick={() => setMinContext([])}
                                        className="mt-2 text-xs text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
                                    >
                                        <RotateCcw className="w-3 h-3" /> Reset
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Pricing Filter */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-zinc-200 font-medium">
                                    <span className="w-4 h-4 text-zinc-500 flex items-center justify-center font-bold text-xs">$</span>
                                    Prompt pricing
                                </div>
                                <ChevronDown className="w-4 h-4 text-zinc-600" />
                            </div>
                            <div className="px-1">
                                <Slider
                                    defaultValue={[100]}
                                    max={100}
                                    step={1}
                                    className="py-4"
                                    onValueChange={(vals) => setMaxPrice(vals[0] === 100 ? [] : vals)}
                                    value={maxPrice.length ? maxPrice : [100]}
                                />
                                <div className="flex justify-between text-[10px] text-zinc-500 font-medium px-0.5">
                                    <span>FREE</span>
                                    <span>$0.5</span>
                                    <span>$10+</span>
                                </div>
                                {maxPrice.length > 0 && (
                                    <button
                                        onClick={() => setMaxPrice([])}
                                        className="mt-2 text-xs text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
                                    >
                                        <RotateCcw className="w-3 h-3" /> Reset
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Series Filter */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-zinc-200 font-medium">
                                    <Shield className="w-4 h-4 text-zinc-500" />
                                    Series
                                </div>
                                <ChevronDown className="w-4 h-4 text-zinc-600" />
                            </div>
                            <div className="space-y-2">
                                {uniqueProviders.map(provider => (
                                    <div key={provider} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`p-${provider}`}
                                            className="border-zinc-700 data-[state=checked]:bg-zinc-200 data-[state=checked]:text-black"
                                            checked={selectedProviders.includes(provider)}
                                            onCheckedChange={() => toggleProvider(provider)}
                                        />
                                        <Label
                                            htmlFor={`p-${provider}`}
                                            className="text-sm text-zinc-400 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer hover:text-zinc-300"
                                        >
                                            {providerDisplayNames[provider] || provider}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col bg-[#0A0A0A]">
                    <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-800/50 h-[88px]">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="text-amber-500"><Zap className="w-4 h-4 fill-current" /></span>
                                Engine Orchestration
                            </h3>
                            <p className="text-zinc-500 text-xs mt-1">Select models to include in synthesis pool</p>
                        </div>
                        <button
                            onClick={() => onOpenChange(false)}
                            className="p-2 hover:bg-zinc-900 rounded-full transition-colors text-zinc-400 hover:text-white"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-10">
                        {/* Premium Models */}
                        {filteredModels.some(m => m.inputPrice > 0) && (
                            <div className="space-y-4">
                                <h4 className="flex items-center gap-2 text-sm font-bold text-zinc-400 uppercase tracking-widest pl-1">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                    Premium Models
                                </h4>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {filteredModels.filter(m => m.inputPrice > 0).map((model) => {
                                        const isSelected = localSelectedIds.includes(model.id);

                                        return (
                                            <div
                                                key={model.id}
                                                onClick={() => toggleModel(model.id)}
                                                className={`
                                                    relative group cursor-pointer rounded-3xl p-4 flex items-center gap-4 border transition-all duration-300
                                                    ${isSelected
                                                        ? 'bg-white border-white text-black'
                                                        : 'bg-zinc-900/30 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-300'
                                                    }
                                                `}
                                            >
                                                <div className={`
                                                    w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shrink-0
                                                    ${isSelected
                                                        ? 'bg-zinc-100 text-black'
                                                        : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-zinc-300'
                                                    }
                                                `}>
                                                    {getIcon(model.provider)}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold truncate text-lg tracking-tight">
                                                            {model.name}
                                                        </h3>
                                                        {model.id === 'gpt-4o' &&
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${isSelected ? 'bg-black text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                                                                PRO
                                                            </span>
                                                        }
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <p className={`text-xs font-medium ${isSelected ? 'text-zinc-500' : 'text-zinc-500'}`}>
                                                            ${model.inputPrice} / 1M
                                                        </p>
                                                        <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                                                        <p className={`text-xs font-medium ${isSelected ? 'text-zinc-500' : 'text-zinc-500'}`}>
                                                            {(model.contextWindow || 0) / 1000}k ctx
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className={`
                                                    w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0
                                                    ${isSelected
                                                        ? 'bg-black border-black'
                                                        : 'border-zinc-700 group-hover:border-zinc-500'
                                                    }
                                                `}>
                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Free Models */}
                        {filteredModels.some(m => m.inputPrice === 0) && (
                            <div className="space-y-4">
                                <h4 className="flex items-center gap-2 text-sm font-bold text-zinc-400 uppercase tracking-widest pl-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    Free Research Models
                                </h4>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {filteredModels.filter(m => m.inputPrice === 0).map((model) => {
                                        const isSelected = localSelectedIds.includes(model.id);

                                        return (
                                            <div
                                                key={model.id}
                                                onClick={() => toggleModel(model.id)}
                                                className={`
                                                    relative group cursor-pointer rounded-3xl p-4 flex items-center gap-4 border transition-all duration-300
                                                    ${isSelected
                                                        ? 'bg-white border-white text-black'
                                                        : 'bg-zinc-900/30 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-300'
                                                    }
                                                `}
                                            >
                                                <div className={`
                                                    w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shrink-0
                                                    ${isSelected
                                                        ? 'bg-zinc-100 text-black'
                                                        : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-zinc-300'
                                                    }
                                                `}>
                                                    {getIcon(model.provider)}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold truncate text-lg tracking-tight">
                                                            {model.name}
                                                        </h3>
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${isSelected ? 'bg-green-100 text-green-700' : 'bg-green-900/30 text-green-500'}`}>
                                                            FREE
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col gap-0.5 mt-1">
                                                        <p className={`text-xs font-medium ${isSelected ? 'text-zinc-500' : 'text-zinc-500'} truncate`}>
                                                            {model.description}
                                                        </p>
                                                        <p className={`text-[10px] font-medium ${isSelected ? 'text-zinc-400' : 'text-zinc-600'} flex items-center gap-2`}>
                                                            <span className="w-1 h-1 rounded-full bg-zinc-500"></span>
                                                            {(model.contextWindow || 0) / 1000}k ctx
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className={`
                                                    w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0
                                                    ${isSelected
                                                        ? 'bg-black border-black'
                                                        : 'border-zinc-700 group-hover:border-zinc-500'
                                                    }
                                                `}>
                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {filteredModels.length === 0 && (
                            <div className="text-center py-20 text-zinc-500">
                                <p>No models match your filters.</p>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-zinc-800/50 bg-[#0A0A0A] flex justify-between items-center">
                        <span className="text-white font-medium text-sm">
                            {localSelectedIds.length} models selected
                        </span>
                        <Button
                            onClick={handleApply}
                            className="bg-white text-black hover:bg-zinc-200 rounded-xl px-8 py-6 font-bold tracking-wider"
                        >
                            APPLY CHANGES
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
