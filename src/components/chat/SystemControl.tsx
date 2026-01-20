import { useState, useEffect } from 'react';
import { Settings2, History, Users, X, Lock, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ModelManagementContent } from "@/components/admin/ModelManagement";
import { MemberManagement } from "@/components/admin/MemberManagement";
import { PromptHistory } from "@/components/admin/PromptHistory";
import { useModelHealth } from "@/hooks/useModelHealth";
import { useAIModels } from "@/hooks/useAIModels";

interface SystemControlProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedModelIds: string[];
    onApply: (modelIds: string[]) => void;
    isAdmin?: boolean;
    isLoggedIn?: boolean;
}

export const SystemControl = ({
    open,
    onOpenChange,
    selectedModelIds,
    onApply,
    isAdmin = false,
    isLoggedIn = false,
}: SystemControlProps) => {
    const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedModelIds);
    const [isMemberManagementOpen, setIsMemberManagementOpen] = useState(false);
    const [isPromptHistoryOpen, setIsPromptHistoryOpen] = useState(false);
    const { isModelAvailable, lastChecked } = useModelHealth();
    const { models } = useAIModels();

    useEffect(() => {
        if (open) {
            setLocalSelectedIds(selectedModelIds);
        }
    }, [selectedModelIds, open]);

    const toggleModel = (modelId: string, isPremium: boolean) => {
        // Block premium models for non-logged-in users
        if (isPremium && !isLoggedIn && !isAdmin) return;

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

    const freeModels = models.filter(m => m.inputPrice === 0);
    const premiumModels = models.filter(m => m.inputPrice > 0);

    const getHealthIndicator = (modelId: string) => {
        const available = isModelAvailable(modelId);
        if (available === undefined) return null;
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${available ? 'bg-green-500' : 'bg-red-500'}`}
                        />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{available ? '사용 가능' : '사용 불가'}</p>
                        {lastChecked && (
                            <p className="text-xs text-muted-foreground">
                                마지막 확인: {lastChecked.toLocaleString('ko-KR')}
                            </p>
                        )}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-5xl h-[85vh] p-0 gap-0 bg-card border-border overflow-hidden">
                    <DialogTitle className="sr-only">System Configuration</DialogTitle>

                    <Tabs defaultValue="synthesis" className="flex flex-col h-full overflow-hidden">
                        {/* Header with Tabs */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0 bg-card">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                        <Settings2 className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-foreground">System Settings</h2>
                                        <p className="text-xs text-muted-foreground">Configure AI synthesis and models</p>
                                    </div>
                                </div>
                                <div className="h-8 w-px bg-border mx-2" />
                                <TabsList className="bg-muted border border-border">
                                    <TabsTrigger value="synthesis" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
                                        Synthesis
                                    </TabsTrigger>
                                    {isAdmin && (
                                        <TabsTrigger value="models" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
                                            Manage Models
                                        </TabsTrigger>
                                    )}
                                </TabsList>
                            </div>

                            <div className="flex items-center gap-2">
                                {isAdmin && (
                                    <div className="flex items-center gap-1 mr-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsPromptHistoryOpen(true)}
                                            className="gap-2 text-muted-foreground hover:text-foreground"
                                        >
                                            <History className="w-4 h-4" />
                                            History
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsMemberManagementOpen(true)}
                                            className="gap-2 text-muted-foreground hover:text-foreground"
                                        >
                                            <Users className="w-4 h-4" />
                                            Members
                                        </Button>
                                    </div>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onOpenChange(false)}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Synthesis Tab Content */}
                        <TabsContent value="synthesis" className="flex-1 overflow-hidden flex flex-col mt-0 min-h-0">
                            <div className="flex-1 overflow-y-auto p-6 space-y-8 min-h-0">
                                {/* Premium Models */}
                                {premiumModels.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="border-indigo-500/30 text-indigo-400">
                                                Premium
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {premiumModels.filter(m => localSelectedIds.includes(m.id)).length} / {premiumModels.length} selected
                                            </span>
                                            {!isLoggedIn && (
                                                <span className="text-xs text-yellow-500 flex items-center gap-1">
                                                    <Lock className="w-3 h-3" /> 로그인 필요
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid gap-2">
                                            {premiumModels.map((model) => {
                                                const isSelected = localSelectedIds.includes(model.id);
                                                const isLocked = !isLoggedIn;
                                                return (
                                                    <button
                                                        key={model.id}
                                                        onClick={() => toggleModel(model.id, true)}
                                                        disabled={isLocked}
                                                        className={`
                                                            w-full text-left p-4 rounded-lg border transition-all
                                                            ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                                                            ${isSelected
                                                                ? 'bg-muted border-border'
                                                                : 'bg-card border-border hover:border-primary/30'
                                                            }
                                                        `}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    {getHealthIndicator(model.id)}
                                                                    <h3 className="font-medium text-foreground">{model.name}</h3>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        ${model.inputPrice}/1M
                                                                    </span>
                                                                    {isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                                                                </div>
                                                                <p className="text-xs text-muted-foreground truncate">
                                                                    {model.description}
                                                                </p>
                                                            </div>
                                                            <div className={`
                                                                ml-4 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0
                                                                ${isSelected
                                                                    ? 'bg-primary border-primary'
                                                                    : 'border-border'
                                                                }
                                                            `}>
                                                                {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
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
                                            <span className="text-xs text-muted-foreground">
                                                {freeModels.filter(m => localSelectedIds.includes(m.id)).length} / {freeModels.length} selected
                                            </span>
                                        </div>
                                        <div className="grid gap-2">
                                            {freeModels.map((model) => {
                                                const isSelected = localSelectedIds.includes(model.id);
                                                return (
                                                    <button
                                                        key={model.id}
                                                        onClick={() => toggleModel(model.id, false)}
                                                        className={`
                                                            w-full text-left p-4 rounded-lg border transition-all
                                                            ${isSelected
                                                                ? 'bg-muted border-border'
                                                                : 'bg-card border-border hover:border-primary/30'
                                                            }
                                                        `}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    {getHealthIndicator(model.id)}
                                                                    <h3 className="font-medium text-foreground">{model.name}</h3>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {(model.contextWindow / 1000).toFixed(0)}K ctx
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-muted-foreground truncate">
                                                                    {model.description}
                                                                </p>
                                                            </div>
                                                            <div className={`
                                                                ml-4 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0
                                                                ${isSelected
                                                                    ? 'bg-primary border-primary'
                                                                    : 'border-border'
                                                                }
                                                            `}>
                                                                {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
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
                            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-card mt-auto shrink-0">
                                <span className="text-sm text-muted-foreground">
                                    {localSelectedIds.length} model{localSelectedIds.length !== 1 ? 's' : ''} selected
                                </span>
                                <Button onClick={handleApply}>
                                    Apply Changes
                                </Button>
                            </div>
                        </TabsContent>

                        {/* Model Management Tab Content */}
                        {isAdmin && (
                            <TabsContent value="models" className="flex-1 overflow-hidden mt-0 min-h-0">
                                <ModelManagementContent />
                            </TabsContent>
                        )}
                    </Tabs>
                </DialogContent>
            </Dialog>

            <MemberManagement
                open={isMemberManagementOpen}
                onOpenChange={setIsMemberManagementOpen}
            />
            <PromptHistory
                open={isPromptHistoryOpen}
                onOpenChange={setIsPromptHistoryOpen}
            />
        </>
    );
};
