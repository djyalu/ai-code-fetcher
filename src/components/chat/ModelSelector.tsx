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

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  synthesisMode: boolean;
  onToggleSynthesis: () => void;
  onConfigureSynthesis?: () => void;
  isLoggedIn?: boolean;
  isAdmin?: boolean;
}

const getProviderColor = (provider: string) => {
  switch (provider) {
    case 'openai': return 'bg-openai';
    case 'anthropic': return 'bg-anthropic';
    case 'google': return 'bg-google';
    case 'deepseek': return 'bg-deepseek';
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
}: ModelSelectorProps) => {
  const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 glass min-w-[140px] justify-between">
            <div className="flex items-center gap-2 truncate">
              <div className={`w-2 h-2 rounded-full ${getProviderColor(currentModel.provider)}`} />
              <span className="truncate">{currentModel.name}</span>
            </div>
            <ChevronDown className="w-4 h-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[300px] glass-strong">
          <div className="p-2 text-xs font-semibold text-muted-foreground">Select Model</div>

          <div className="max-h-[300px] overflow-y-auto">
            {/* Free Models First in list if not logged in? Or just visual distinction */}
            {MODELS.map((model) => {
              const isLocked = model.inputPrice > 0 && !isLoggedIn;

              return (
                <div key={model.id}>
                  {model.id === MODELS.find(m => m.provider === 'google')?.id && <DropdownMenuSeparator />}

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuItem
                          onClick={() => !isLocked && onSelectModel(model.id)}
                          className={`flex items-start gap-3 p-3 cursor-pointer ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={isLocked}
                        >
                          <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${getProviderColor(model.provider)}`} />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{model.name}</span>
                              {selectedModel === model.id && <Check className="w-4 h-4" />}
                              {isLocked && <Lock className="w-3 h-3 text-zinc-500" />}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {model.description}
                            </p>
                          </div>
                        </DropdownMenuItem>
                      </TooltipTrigger>
                      {isLocked && (
                        <TooltipContent>
                          <p>Login required for Premium models</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex items-center gap-2">
        <Button
          variant={synthesisMode ? 'default' : 'outline'}
          size="sm"
          onClick={onToggleSynthesis}
          className={`gap-2 ${synthesisMode ? 'gradient-primary text-primary-foreground' : 'glass'}`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">Synthesis</span>
        </Button>
        {synthesisMode && onConfigureSynthesis && isAdmin && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onConfigureSynthesis}
            className="h-9 w-9 glass hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="Configure Synthesis Models"
          >
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
