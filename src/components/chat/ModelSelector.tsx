import { MODELS } from '@/constants/models';
import { AIModel } from '@/types/chat';
import { Check, ChevronDown, Sparkles, Settings, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  synthesisMode: boolean;
  onToggleSynthesis: () => void;
  onConfigureSynthesis?: () => void;
  isLoggedIn?: boolean;
  isAdmin?: boolean;
  synthesisModelIds?: string[];
  onUpdateSynthesisModels?: (modelIds: string[]) => void;
}

const getProviderColor = (provider: string) => {
  switch (provider) {
    case 'openai': return 'bg-openai';
    case 'anthropic': return 'bg-anthropic';
    case 'google': return 'bg-google';
    case 'deepseek': return 'bg-deepseek';
    case 'perplexity': return 'bg-emerald-500';
    default: return 'bg-primary';
  }
};

export const ModelSelector = ({
  selectedModel,
  onSelectModel,
  synthesisMode,
  onToggleSynthesis,
  onConfigureSynthesis,
  isLoggedIn = false,
  isAdmin = false,
  synthesisModelIds = [],
  onUpdateSynthesisModels,
}: ModelSelectorProps) => {
  const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];

  const freeModels = MODELS.filter(m => m.inputPrice === 0);
  const premiumModels = MODELS.filter(m => m.inputPrice > 0);

  const handleModelClick = (modelId: string, isLocked: boolean) => {
    if (isLocked) return;

    if (synthesisMode && onUpdateSynthesisModels) {
      const newIds = synthesisModelIds.includes(modelId)
        ? synthesisModelIds.filter(id => id !== modelId)
        : [...synthesisModelIds, modelId];
      onUpdateSynthesisModels(newIds);
    } else {
      onSelectModel(modelId);
    }
  };

  const renderModelItem = (model: AIModel) => {
    const isLocked = model.inputPrice > 0 && !isLoggedIn;
    const isSelected = synthesisMode
      ? synthesisModelIds.includes(model.id)
      : selectedModel === model.id;

    return (
      <TooltipProvider key={model.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                handleModelClick(model.id, isLocked);
              }}
              className={`flex items-start gap-3 p-3 cursor-pointer transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/50 ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {synthesisMode ? (
                <Checkbox
                  checked={isSelected}
                  disabled={isLocked}
                  className="mt-1"
                />
              ) : (
                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${getProviderColor(model.provider)}`} />
              )}

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{model.name}</span>
                  {!synthesisMode && isSelected && <Check className="w-4 h-4 text-primary" />}
                  {isLocked && <Lock className="w-3 h-3 text-zinc-500" />}
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {model.description}
                </p>
              </div>
            </DropdownMenuItem>
          </TooltipTrigger>
          {isLocked && (
            <TooltipContent side="left">
              <p>Login required for Premium models</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 glass min-w-[160px] justify-between h-10 px-4">
            <div className="flex items-center gap-2 truncate">
              {synthesisMode ? (
                <>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="truncate font-medium">{synthesisModelIds.length} Models</span>
                </>
              ) : (
                <>
                  <div className={`w-2.5 h-2.5 rounded-full ${getProviderColor(currentModel.provider)} shadow-sm`} />
                  <span className="truncate font-medium">{currentModel.name}</span>
                </>
              )}
            </div>
            <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[320px] glass-strong p-1 p-b-2">
          <div className="p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {synthesisMode ? 'Select Models for Synthesis' : 'Select Chat Model'}
          </div>

          <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
            {/* Premium Models Group */}
            {premiumModels.length > 0 && (
              <div className="space-y-0.5">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-amber-600/80 dark:text-amber-400/80 flex items-center gap-1.5">
                  <div className="h-px flex-1 bg-amber-500/10" />
                  PREMIUM MODELS
                  <div className="h-px flex-1 bg-amber-500/10" />
                </div>
                {premiumModels.map(renderModelItem)}
              </div>
            )}

            {premiumModels.length > 0 && freeModels.length > 0 && <DropdownMenuSeparator className="my-1 bg-zinc-500/10" />}

            {/* Free Models Group */}
            {freeModels.length > 0 && (
              <div className="space-y-0.5">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-emerald-600/80 dark:text-emerald-400/80 flex items-center gap-1.5">
                  <div className="h-px flex-1 bg-emerald-500/10" />
                  FREE RESEARCH MODELS
                  <div className="h-px flex-1 bg-emerald-500/10" />
                </div>
                {freeModels.map(renderModelItem)}
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={synthesisMode ? 'default' : 'outline'}
                size="sm"
                onClick={onToggleSynthesis}
                className={`gap-2 h-10 px-4 transition-all duration-300 ${synthesisMode
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                  : 'glass hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
              >
                <Sparkles className={`w-4 h-4 ${synthesisMode ? 'animate-pulse' : 'text-zinc-400'}`} />
                <span className="hidden sm:inline font-medium">Synthesis</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{synthesisMode ? 'Disable' : 'Enable'} Multi-Model Synthesis</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {synthesisMode && onConfigureSynthesis && isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onConfigureSynthesis}
            className="h-10 w-10 glass hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Configure Synthesis Models"
          >
            <Settings className="w-4 h-4 text-zinc-400" />
          </Button>
        )}
      </div>
    </div>
  );
};

