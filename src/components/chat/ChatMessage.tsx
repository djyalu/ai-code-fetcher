import { Message } from '@/types/chat';
import { getModelById } from '@/constants/models';
import { User, Bot, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: Message;
}

const getProviderColor = (provider?: string) => {
  switch (provider) {
    case 'openai': return 'border-openai/30 bg-openai/5';
    case 'anthropic': return 'border-anthropic/30 bg-anthropic/5';
    case 'google': return 'border-google/30 bg-google/5';
    case 'deepseek': return 'border-deepseek/30 bg-deepseek/5';
    default: return 'border-primary/30 bg-primary/5';
  }
};

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === 'user';
  const model = message.modelId ? getModelById(message.modelId) : null;

  return (
    <div className={`flex gap-4 animate-fade-in ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
        isUser ? 'bg-primary text-primary-foreground' : 'glass'
      }`}>
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>
      
      <div className={`flex-1 max-w-[85%] ${isUser ? 'text-right' : ''}`}>
        {model && (
          <div className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full bg-${model.provider}`} 
                  style={{ backgroundColor: model.color }} />
            {model.name}
          </div>
        )}
        
        <div className={`inline-block text-left rounded-2xl px-4 py-3 ${
          isUser 
            ? 'bg-primary text-primary-foreground rounded-br-md' 
            : `glass border ${model ? getProviderColor(model.provider) : ''} rounded-bl-md`
        }`}>
          {message.isStreaming ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-muted-foreground">Thinking...</span>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
        
        <div className="text-[10px] text-muted-foreground mt-1.5 px-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};
