import { MODELS } from '@/constants/models';
import { AIModel } from '@/types/chat';
import { Check, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  synthesisMode: boolean;
  onToggleSynthesis: () => void;
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
}: ModelSelectorProps) => {
  const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 glass">
            <span className={`w-2 h-2 rounded-full ${getProviderColor(currentModel.provider)}`} />
            <span className="font-medium">{currentModel.name}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 glass-strong">
          {MODELS.map((model) => (
            <DropdownMenuItem
              key={model.id}
              onClick={() => onSelectModel(model.id)}
              className="flex items-center gap-3 py-2.5 cursor-pointer"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${getProviderColor(model.provider)}`} />
              <div className="flex-1">
                <div className="font-medium">{model.name}</div>
                <div className="text-xs text-muted-foreground">{model.description}</div>
              </div>
              {selectedModel === model.id && <Check className="w-4 h-4 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant={synthesisMode ? 'default' : 'outline'}
        size="sm"
        onClick={onToggleSynthesis}
        className={`gap-2 ${synthesisMode ? 'gradient-primary text-primary-foreground' : 'glass'}`}
      >
        <Sparkles className="w-4 h-4" />
        <span className="hidden sm:inline">Synthesis</span>
      </Button>
    </div>
  );
};
