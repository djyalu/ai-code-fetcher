import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModelManagementContent } from "@/components/admin/ModelManagement";

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
                <DialogContent className="max-w-5xl h-[85vh] p-0 gap-0 bg-zinc-950 border-zinc-800">
                    <DialogTitle className="sr-only">System Configuration</DialogTitle>

                    <Tabs defaultValue="synthesis" className="flex flex-col h-full">
                        {/* Header with Tabs */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0 bg-zinc-950">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center">
                                        <Settings2 className="w-5 h-5 text-zinc-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">System Settings</h2>
                                        <p className="text-xs text-zinc-500">Configure AI synthesis and models</p>
                                    </div>
                                </div>
                                <div className="h-8 w-px bg-zinc-800 mx-2" />
                                <TabsList className="bg-zinc-900 border border-zinc-800">
                                    <TabsTrigger value="synthesis" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                                        Synthesis
                                    </TabsTrigger>
                                    {isAdmin && (
                                        <TabsTrigger value="models" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
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
                                            className="gap-2 text-zinc-400 hover:text-white"
                                        >
                                            <History className="w-4 h-4" />
                                            History
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setIsMemberManagementOpen(true)}
                                            className="gap-2 text-zinc-400 hover:text-white"
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
                                    className="text-zinc-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Synthesis Tab Content */}
                        <TabsContent value="synthesis" className="flex-1 overflow-hidden flex flex-col mt-0">
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
                                                                ? 'bg-zinc-900 border-zinc-700'
                                                                : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                                                            }
                                                        `}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    {getHealthIndicator(model.id)}
                                                                    <h3 className="font-medium text-white">{model.name}</h3>
                                                                    <span className="text-xs text-zinc-500">
                                                                        ${model.inputPrice}/1M
                                                                    </span>
                                                                    {isLocked && <Lock className="w-3 h-3 text-zinc-500" />}
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
                                                        onClick={() => toggleModel(model.id, false)}
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
                                                                    {getHealthIndicator(model.id)}
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
                            <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950 mt-auto">
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
                        </TabsContent>

                        {/* Model Management Tab Content */}
                        {isAdmin && (
                            <TabsContent value="models" className="flex-1 overflow-hidden mt-0">
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
