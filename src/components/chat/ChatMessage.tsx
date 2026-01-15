import { Message } from '@/types/chat';
import { getModelById } from '@/constants/models';
import { User, Bot, Loader2, Sparkles, Quote, Copy, Check, Table as TableIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ChatMessageProps {
  message: Message;
}

const getProviderStyles = (provider?: string) => {
  switch (provider) {
    case 'openai': return 'border-openai/20 bg-openai/5 shadow-[0_0_15px_rgba(16,163,127,0.05)]';
    case 'anthropic': return 'border-anthropic/20 bg-anthropic/5 shadow-[0_0_15px_rgba(204,120,92,0.05)]';
    case 'google': return 'border-google/20 bg-google/5 shadow-[0_0_15px_rgba(66,133,244,0.05)]';
    case 'deepseek': return 'border-deepseek/20 bg-deepseek/5 shadow-[0_0_15px_rgba(88,101,242,0.05)]';
    case 'perplexity': return 'border-teal-500/20 bg-teal-500/5 shadow-[0_0_15px_rgba(20,178,170,0.05)]';
    default: return 'border-white/10 bg-white/5 shadow-xl';
  }
};

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const isUser = message.role === 'user';
  const model = message.modelId ? getModelById(message.modelId) : null;
  const isSynthesized = message.content.includes('Synthesized Answer');

  // Filter out citation markers like [1], [2], [1][2]
  const cleanContent = (content: string) => {
    return content.replace(/\[\d+\]/g, '').trim();
  };

  const processedContent = cleanContent(message.content);

  const handleCopy = () => {
    navigator.clipboard.writeText(processedContent);
    setCopied(true);
    toast({
      description: "답변이 클립보드에 복사되었습니다.",
      duration: 2000,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-4 animate-fade-in group ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${isUser
        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-lg'
        : isSynthesized
          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/20'
          : 'glass border border-white/10 shadow-lg'
        }`}>
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
          <div className={`text-[10px] font-bold tracking-widest uppercase mb-1.5 flex items-center justify-between group/header`}>
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

        <div className={`inline-block text-left rounded-3xl px-5 py-4 transition-all duration-300 ${isUser
          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tr-sm shadow-md'
          : isSynthesized
            ? 'bg-zinc-900/40 border border-amber-500/30 rounded-tl-sm backdrop-blur-xl shadow-2xl relative overflow-hidden'
            : `glass border ${getProviderStyles(model?.provider)} rounded-tl-sm`
          }`}>
          {isSynthesized && (
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Quote className="w-20 h-20 rotate-180" />
            </div>
          )}

          {message.isStreaming ? (
            <div className="flex items-center gap-3 py-1">
              <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
              <span className="text-sm font-medium text-zinc-500 animate-pulse">상각 중...</span>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed prose-p:leading-relaxed prose-headings:mb-3 prose-headings:mt-4 prose-p:mb-3 prose-table:my-4">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ node, ...props }) => <h1 className="text-xl font-extrabold text-zinc-950 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-5" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-8 mb-4 flex items-center gap-2" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-200 mt-6 mb-3" {...props} />,
                  p: ({ node, ...props }) => <p className="text-zinc-900 dark:text-zinc-100 leading-relaxed mb-4 font-medium" {...props} />,
                  li: ({ node, ...props }) => <li className="text-zinc-900 dark:text-zinc-100 mb-2 font-medium" {...props} />,
                  strong: ({ node, ...props }) => <strong className="font-black text-zinc-950 dark:text-white" {...props} />,
                  code: ({ node, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return (
                      <code className={`${className} bg-zinc-200 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-200 rounded px-1.5 py-0.5 text-[0.85rem] font-mono font-bold`} {...props}>
                        {children}
                      </code>
                    );
                  },
                  pre: ({ node, ...props }) => (
                    <pre className="bg-zinc-100 dark:bg-zinc-950/50 border border-zinc-200 dark:border-white/5 rounded-xl p-5 my-6 overflow-x-auto scrollbar-thin shadow-inner" {...props} />
                  ),
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto my-8 rounded-xl border border-zinc-300 dark:border-white/10 bg-white dark:bg-white/5 shadow-md">
                      <table className="min-w-full divide-y divide-zinc-200 dark:divide-white/10" {...props} />
                    </div>
                  ),
                  thead: ({ node, ...props }) => <thead className="bg-zinc-100 dark:bg-white/5" {...props} />,
                  th: ({ node, ...props }) => <th className="px-4 py-3.5 text-left text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-widest" {...props} />,
                  td: ({ node, ...props }) => <td className="px-4 py-3.5 text-sm text-zinc-950 dark:text-zinc-200 border-t border-zinc-200 dark:border-white/5 font-semibold" {...props} />,
                  tr: ({ node, ...props }) => <tr className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors" {...props} />
                }}
              >
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
};
