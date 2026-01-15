import { Message } from '@/types/chat';
import { getModelById } from '@/constants/models';
import { User, Bot, Loader2, Sparkles, Quote, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ChatMessageProps {
  message: Message;
}

const getProviderStyles = (provider?: string) => {
  switch (provider) {
    case 'openai':
      return 'border-openai/20 bg-openai/5 shadow-[0_0_15px_rgba(16,163,127,0.05)]';
    case 'anthropic':
      return 'border-anthropic/20 bg-anthropic/5 shadow-[0_0_15px_rgba(204,120,92,0.05)]';
    case 'google':
      return 'border-google/20 bg-google/5 shadow-[0_0_15px_rgba(66,133,244,0.05)]';
    case 'deepseek':
      return 'border-deepseek/20 bg-deepseek/5 shadow-[0_0_15px_rgba(88,101,242,0.05)]';
    case 'perplexity':
      return 'border-teal-500/20 bg-teal-500/5 shadow-[0_0_15px_rgba(20,178,170,0.05)]';
    default:
      return 'border-white/10 bg-white/5 shadow-xl';
  }
};


export const ChatMessage = React.forwardRef<HTMLDivElement, ChatMessageProps>(
  ({ message }, ref) => {
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();
    const isUser = message.role === 'user';
    const model = message.modelId ? getModelById(message.modelId) : null;
    const isSynthesized = !!message.isSynthesis;

    // Filter out citation markers like [1], [2], [1][2]
    const cleanContent = (content: string) => {
      return content.replace(/\[\d+\]/g, '').trim();
    };

    const processedContent = cleanContent(message.content);

    const handleCopy = () => {
      navigator.clipboard.writeText(processedContent);
      setCopied(true);
      toast({
        description: '답변이 클립보드에 복사되었습니다.',
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div ref={ref} className={`flex gap-4 animate-fade-in group ${isUser ? 'flex-row-reverse' : ''}`}>
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${isUser
            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-lg'
            : isSynthesized
              ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/20'
              : 'glass border border-white/10 shadow-lg'
            }`}
        >
          {isUser ? (
            <User className="w-5 h-5" />
          ) : isSynthesized ? (
            <Sparkles className="w-5 h-5 fill-current" />
          ) : (
            <Bot className="w-5 h-5" />
          )}
        </div>

        <div className={`flex-1 max-w-[85%] ${isUser ? 'text-right' : ''}`}>
          {!isUser && (
            <div className="text-[10px] font-bold tracking-widest uppercase mb-1.5 flex items-center justify-between group/header">
              <div className="flex items-center gap-1.5">
                {model ? (
                  <>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: model.color }} />
                    <span className="text-zinc-400">{model.name}</span>
                  </>
                ) : isSynthesized ? (
                  <>
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span className="text-amber-500/80">Multi-Model Synthesis</span>
                  </>
                ) : (
                  <span className="text-zinc-500 text-[9px]">AI Assistant</span>
                )}
              </div>

              <button
                onClick={handleCopy}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-white/5 rounded-md flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 ring-1 ring-transparent hover:ring-white/10"
                title="결과 복사"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-[9px] text-emerald-500">복사됨</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span className="text-[9px]">복사하기</span>
                  </>
                )}
              </button>
            </div>
          )}

          <div
            className={`w-full text-left rounded-3xl px-5 py-4 transition-all duration-300 ${isUser
              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tr-sm shadow-md ml-auto sm:max-w-[80%]'
              : isSynthesized
                ? 'bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-500/20 rounded-tl-sm backdrop-blur-xl shadow-xl relative overflow-hidden'
                : `bg-white/80 dark:bg-zinc-900/40 border ${getProviderStyles(model?.provider)} rounded-tl-sm shadow-sm backdrop-blur-md`
              }`}
          >
            {isSynthesized && (
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                <Quote className="w-24 h-24 rotate-180 text-amber-500" />
              </div>
            )}

            {isSynthesized && (
              <div className="mb-4 pb-4 border-b border-amber-500/10">
                <h3 className="text-base font-black text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 fill-current" />
                  Synthesized Answer
                </h3>
              </div>
            )}

            {message.isStreaming ? (
              <div className="flex items-center gap-3 py-1">
                <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                <span className="text-sm font-medium text-zinc-500 animate-pulse">생성 중...</span>
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed prose-p:leading-relaxed prose-headings:mb-3 prose-headings:mt-4 prose-p:mb-3 prose-table:my-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {processedContent}
                </ReactMarkdown>
              </div>
            )}
          </div>

          <div className={`text-[9px] text-zinc-500 mt-2 px-2 font-bold tracking-tight ${isUser ? 'text-right' : 'text-left'}`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  }
);

ChatMessage.displayName = 'ChatMessage';
