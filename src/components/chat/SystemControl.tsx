import { useState, useEffect } from "react";
import { MODELS } from "@/constants/models";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X, Check, Users, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberManagement } from "@/components/admin/MemberManagement";
import { Badge } from "@/components/ui/badge";

interface SystemControlProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedModelIds: string[];
    onApply: (modelIds: string[]) => void;
    isAdmin?: boolean;
}

export const SystemControl = ({
    open,
    onOpenChange,
    selectedModelIds,
    onApply,
    isAdmin = false,
}: SystemControlProps) => {
    const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedModelIds);
    const [isMemberManagementOpen, setIsMemberManagementOpen] = useState(false);

    useEffect(() => {
        if (open) {
            setLocalSelectedIds(selectedModelIds);
        }
    }, [selectedModelIds, open]);

    const toggleModel = (modelId: string) => {
        setLocalSelectedIds(prev =>
            prev.includes(modelId)
                ? prev.filter(id => id !== modelId)
                : [...prev, modelId]
        );
    };

    const handleApply = () => {
        onApply(localSelectedIds);
        onOpenChange(false);
    };

    const freeModels = MODELS.filter(m => m.inputPrice === 0);
    const premiumModels = MODELS.filter(m => m.inputPrice > 0);

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl h-[85vh] p-0 gap-0 bg-zinc-950 border-zinc-800">
                    <DialogTitle className="sr-only">Synthesis Model Configuration</DialogTitle>

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center">
                                <Settings2 className="w-5 h-5 text-zinc-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-white">Synthesis Configuration</h2>
                                <p className="text-xs text-zinc-500">Select models for multi-engine synthesis</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isAdmin && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsMemberManagementOpen(true)}
                                    className="gap-2 text-zinc-400 hover:text-white"
                                >
                                    <Users className="w-4 h-4" />
                                    Members
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onOpenChange(false)}
                                className="text-zinc-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {/* Premium Models */}
                        {premiumModels.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="border-indigo-500/30 text-indigo-400">
                                        Premium
                                    </Badge>
                                    <span className="text-xs text-zinc-500">
                                        {premiumModels.filter(m => localSelectedIds.includes(m.id)).length} / {premiumModels.length} selected
                                    </span>
                                </div>
                                <div className="grid gap-2">
                                    {premiumModels.map((model) => {
                                        const isSelected = localSelectedIds.includes(model.id);
                                        return (
                                            <button
                                                key={model.id}
                                                onClick={() => toggleModel(model.id)}
                                                className={`
                                                    w-full text-left p-4 rounded-lg border transition-all
                                                    ${isSelected
                                                        ? 'bg-zinc-900 border-zinc-700'
                                                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                                                    }
                                                `}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-medium text-white">{model.name}</h3>
                                                            <span className="text-xs text-zinc-500">
                                                                ${model.inputPrice}/1M
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-zinc-500 truncate">
                                                            {model.description}
                                                        </p>
                                                    </div>
                                                    <div className={`
                                                        ml-4 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0
                                                        ${isSelected
                                                            ? 'bg-white border-white'
                                                            : 'border-zinc-700'
                                                        }
                                                    `}>
                                                        {isSelected && <Check className="w-3 h-3 text-black" />}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Free Models */}
                        {freeModels.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="border-green-500/30 text-green-400">
                                        Free
                                    </Badge>
                                    <span className="text-xs text-zinc-500">
                                        {freeModels.filter(m => localSelectedIds.includes(m.id)).length} / {freeModels.length} selected
                                    </span>
                                </div>
                                <div className="grid gap-2">
                                    {freeModels.map((model) => {
                                        const isSelected = localSelectedIds.includes(model.id);
                                        return (
                                            <button
                                                key={model.id}
                                                onClick={() => toggleModel(model.id)}
                                                className={`
                                                    w-full text-left p-4 rounded-lg border transition-all
                                                    ${isSelected
                                                        ? 'bg-zinc-900 border-zinc-700'
                                                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                                                    }
                                                `}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-medium text-white">{model.name}</h3>
                                                            <span className="text-xs text-zinc-600">
                                                                {(model.contextWindow / 1000).toFixed(0)}K ctx
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-zinc-500 truncate">
                                                            {model.description}
                                                        </p>
                                                    </div>
                                                    <div className={`
                                                        ml-4 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0
                                                        ${isSelected
                                                            ? 'bg-white border-white'
                                                            : 'border-zinc-700'
                                                        }
                                                    `}>
                                                        {isSelected && <Check className="w-3 h-3 text-black" />}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950">
                        <span className="text-sm text-zinc-400">
                            {localSelectedIds.length} model{localSelectedIds.length !== 1 ? 's' : ''} selected
                        </span>
                        <Button
                            onClick={handleApply}
                            className="bg-white text-black hover:bg-zinc-200"
                        >
                            Apply Changes
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <MemberManagement
                open={isMemberManagementOpen}
                onOpenChange={setIsMemberManagementOpen}
            />
        </>
    );
};
