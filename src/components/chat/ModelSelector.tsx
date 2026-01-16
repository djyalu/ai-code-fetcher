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
    case 'perplexity': return 'bg-teal-500';
    case 'xiaomi': return 'bg-orange-500';
    case 'nvidia': return 'bg-green-500';
    case 'mistral': return 'bg-indigo-500';
    case 'meta': return 'bg-blue-600';
    case 'arcee': return 'bg-purple-500';
    default: return 'bg-zinc-500';
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

  // Hide Perplexity models from non-admin users (admin email is handled by parent)
  const visibleModels = isAdmin ? MODELS : MODELS.filter(m => m.provider !== 'perplexity');

  const freeModels = visibleModels.filter(m => m.inputPrice === 0);
  const premiumModels = visibleModels.filter(m => m.inputPrice > 0);

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
      <Tooltip key={model.id} delayDuration={300}>
        <TooltipTrigger asChild>
          <div>
            <DropdownMenuItem
              onClick={(e) => {
                if (synthesisMode) {
                  e.preventDefault();
                }
                handleModelClick(model.id, isLocked);
              }}
              className={`flex items-start gap-3 p-3 cursor-pointer transition-all duration-200 rounded-lg mx-1 my-0.5
                ${isSelected && !synthesisMode ? 'bg-zinc-100/50 dark:bg-zinc-800/50' : 'hover:bg-zinc-100/30 dark:hover:bg-zinc-800/30'}
                ${isLocked ? 'opacity-40 cursor-not-allowed grayscale-[0.5]' : 'opacity-100'}`}
            >
              {synthesisMode ? (
                <Checkbox
                  checked={isSelected}
                  disabled={isLocked}
                  className="mt-1 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                />
              ) : (
                <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${getProviderColor(model.provider)} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
              )}

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'} transition-colors`}>
                    {model.name}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!synthesisMode && isSelected && <Check className="w-3.5 h-3.5 text-primary animate-in zoom-in-50 duration-300" />}
                    {isLocked && <Lock className="w-3 h-3 text-zinc-500" />}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground/70 line-clamp-2 leading-snug">
                  {model.description}
                </p>
              </div>
            </DropdownMenuItem>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="glass-strong border-zinc-800 text-xs py-2 px-3 max-w-[200px]">
          {isLocked ? (
            <div className="flex items-center gap-2">
              <Lock className="w-3 h-3 text-amber-500" />
              <span>유료 모델은 로그인이 필요합니다.</span>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="font-semibold text-zinc-300">{model.name}</div>
              <div className="text-[10px] text-zinc-400">{model.description}</div>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div className="flex items-center gap-2.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2.5 glass min-w-[180px] justify-between h-10 px-4 group transition-all duration-300 hover:border-zinc-700">
            <div className="flex items-center gap-2.5 truncate">
              {synthesisMode ? (
                <>
                  <div className="relative">
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-ping opacity-75" />
                  </div>
                  <span className="truncate font-semibold text-amber-500/90">{synthesisModelIds.length} 모델 선택중</span>
                </>
              ) : (
                <>
                  <div className={`w-2.5 h-2.5 rounded-full ${getProviderColor(currentModel.provider)} shadow-[0_0_10px_rgba(0,0,0,0.2)] group-hover:scale-110 transition-transform`} />
                  <span className="truncate font-bold text-[13px] text-zinc-900 dark:text-zinc-100">{currentModel.name}</span>
                </>
              )}
            </div>
            <ChevronDown className="w-4 h-4 text-zinc-400 opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[340px] glass-strong p-1.5 border-zinc-800/50 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="px-3 py-2.5 flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.1em]">
              {synthesisMode ? 'SYNTHESIS 모델 멀티 선택' : '메인 AI 모델 선택'}
            </span>
            {synthesisMode && (
              <span className="text-[10px] text-amber-500/80 font-medium">여러 모델을 동시에 질문합니다</span>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 pr-1">
            {/* Premium Models Group */}
            {premiumModels.length > 0 && (
              <div className="mb-2">
                <div className="px-3 py-2 flex items-center gap-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                  <span className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest">Premium AI Suite</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
                </div>
                {premiumModels.map(renderModelItem)}
              </div>
            )}

            {premiumModels.length > 0 && freeModels.length > 0 && <DropdownMenuSeparator className="mx-2 my-1.5 bg-zinc-800/50" />}

            {/* Free Models Group */}
            {freeModels.length > 0 && (
              <div>
                <div className="px-3 py-2 flex items-center gap-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                  <span className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest">Free Research Suite</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
                </div>
                {freeModels.map(renderModelItem)}
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center gap-2.5">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={synthesisMode ? 'default' : 'outline'}
                size="sm"
                onClick={onToggleSynthesis}
                className={`gap-2 h-10 px-5 transition-all duration-500 relative overflow-hidden group/btn ${synthesisMode
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.3)] border-amber-400/50'
                  : 'glass hover:bg-zinc-100/10 hover:border-zinc-600'
                  }`}
              >
                {synthesisMode && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                )}
                <Sparkles className={`w-4 h-4 ${synthesisMode ? 'animate-pulse' : 'text-zinc-500 group-hover:text-amber-500 transition-colors'}`} />
                <span className="hidden sm:inline font-bold tracking-tight">Synthesis</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="glass-strong border-zinc-800">
              <p className="text-xs">{synthesisMode ? 'Synthesis 모드 끄기' : '여러 AI의 답변을 하나로 합치기'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {synthesisMode && onConfigureSynthesis && isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onConfigureSynthesis}
            className="h-10 w-10 glass hover:bg-zinc-100/10 hover:text-white transition-all duration-300"
            title="시스템 설정"
          >
            <Settings className="w-4 h-4 text-zinc-500 hover:rotate-90 transition-transform duration-500" />
          </Button>
        )}
      </div>
    </div>
  );
};
