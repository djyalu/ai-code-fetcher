import { useState, useRef, useEffect } from 'react';
import { Message } from '@/types/chat';
import { MODELS, SYNTHESIS_MODELS, getModelById } from '@/constants/models';
import { ModelSelector } from '@/components/chat/ModelSelector';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { sendMessage, sendSynthesisRequest } from '@/services/chatService';
import { Bot, Sparkles, Zap, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [synthesisMode, setSynthesisMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Convert messages to API format
      const conversationHistory = messages.map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      }));

      if (synthesisMode) {
        // Synthesis mode: query multiple models and synthesize
        const result = await sendSynthesisRequest(content, conversationHistory);
        
        // Add individual model responses (collapsed view)
        for (const response of result.responses) {
          const model = getModelById(response.modelId);
          setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response.content,
            modelId: response.modelId,
            timestamp: new Date(),
          }]);
        }

        // Add synthesized response
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `**✨ Synthesized Answer**\n\n${result.synthesis}`,
          timestamp: new Date(),
        }]);
      } else {
        // Single model mode
        const response = await sendMessage(
          [...conversationHistory, { role: 'user', content }],
          selectedModel
        );

        const aiMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.content,
          modelId: selectedModel,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: 'destructive',
        title: '오류 발생',
        description: (error as Error).message || 'AI 응답을 받는 데 실패했습니다.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="glass-strong border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">Multi AI</h1>
            <p className="text-xs text-muted-foreground">여러 AI 모델을 한 곳에서</p>
          </div>
        </div>
        <ModelSelector
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          synthesisMode={synthesisMode}
          onToggleSynthesis={() => setSynthesisMode(!synthesisMode)}
        />
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-6 animate-pulse-slow">
              <Bot className="w-10 h-10 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Multi AI에 오신 것을 환영합니다</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              GPT-4o, Claude, Gemini, DeepSeek 등 다양한 AI 모델과 대화하세요.
              Synthesis 모드로 여러 모델의 답변을 종합할 수도 있습니다.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {['한국의 수도는?', '코딩 도와줘', '아이디어 추천해줘'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSendMessage(suggestion)}
                  className="glass px-4 py-2 rounded-full text-sm hover:bg-secondary transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex gap-4 animate-fade-in">
                <div className="w-9 h-9 rounded-xl glass flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="glass border rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-typing" style={{ animationDelay: '0s' }} />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-typing" style={{ animationDelay: '0.2s' }} />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-typing" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <footer className="p-4 pt-2">
        <ChatInput
          onSend={handleSendMessage}
          isLoading={isLoading}
          placeholder={synthesisMode ? 'Synthesis 모드: 여러 AI 모델에게 동시에 질문합니다...' : '메시지를 입력하세요...'}
        />
        <p className="text-center text-xs text-muted-foreground mt-2">
          {synthesisMode && <Sparkles className="w-3 h-3 inline mr-1" />}
          {synthesisMode ? 'GPT-4o, Claude, Gemini, DeepSeek 동시 쿼리' : MODELS.find(m => m.id === selectedModel)?.name}
        </p>
      </footer>
    </div>
  );
};

export default Index;
