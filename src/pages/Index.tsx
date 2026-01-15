import { useState, useRef, useEffect } from 'react';
import { Message } from '@/types/chat';
import { MODELS, SYNTHESIS_MODELS, getModelById } from '@/constants/models';
import { ModelSelector } from '@/components/chat/ModelSelector';
import { SystemControl } from '@/components/chat/SystemControl';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { sendMessage, sendSynthesisRequest } from '@/services/chatService';
import { Zap, LogOut, User, Bot, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ADMIN_EMAIL = 'go41@naver.com';

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.0-flash-exp:free'); // Default to a free model
  const [synthesisMode, setSynthesisMode] = useState(false);
  const [synthesisModelIds, setSynthesisModelIds] = useState<string[]>(SYNTHESIS_MODELS);
  const [isSystemControlOpen, setIsSystemControlOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [promptHistory, setPromptHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('prompt_history');
    return saved ? JSON.parse(saved) : [];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  // Helper to check if a model is premium
  const isPremiumModel = (modelId: string) => {
    const model = getModelById(modelId);
    return model ? model.inputPrice > 0 : false;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) syncProfile(session.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) syncProfile(session.user);
      // If user logs out, and current selected model is premium, switch to free
      if (!session) {
        setSelectedModel(prev => isPremiumModel(prev) ? 'google/gemini-2.0-flash-exp:free' : prev);
        setSynthesisModelIds(prev => prev.filter(id => !isPremiumModel(id)));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncProfile = async (user: any) => {
    try {
      const isSystemAdmin = user.email === ADMIN_EMAIL;
      const { data: profile } = await (supabase
        .from('profiles' as any) as any)
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) {
        await (supabase.from('profiles' as any) as any).insert({
          id: user.id,
          email: user.email,
          role: isSystemAdmin ? 'admin' : 'user'
        });
      } else if (isSystemAdmin && profile.role !== 'admin') {
        await (supabase.from('profiles' as any) as any).update({ role: 'admin' }).eq('id', user.id);
      }
    } catch (error) {
      console.error('Error syncing profile:', error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: 'Logged out' });
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Update prompt history (only for free/all users locally)
    setPromptHistory(prev => {
      const filtered = prev.filter(p => p !== content);
      const newHistory = [content, ...filtered].slice(0, 3);
      localStorage.setItem('prompt_history', JSON.stringify(newHistory));
      return newHistory;
    });

    setIsLoading(true);

    try {
      // Clean conversation history to ensure alternating roles and better context
      // This preventing consecutive assistant messages which causes some models to fail
      const conversationHistory: { role: 'user' | 'assistant' | 'system', content: string }[] = [];
      let tempAssistantContent = "";

      messages.forEach(m => {
        if (m.role === 'user') {
          if (tempAssistantContent) {
            conversationHistory.push({ role: 'assistant', content: tempAssistantContent });
            tempAssistantContent = "";
          }
          conversationHistory.push({ role: 'user', content: m.content });
        } else if (m.role === 'assistant') {
          // If it's a synthesis, we prioritize it as the answer for this turn
          if (m.content.includes('Synthesized Answer')) {
            tempAssistantContent = m.content;
          } else if (!tempAssistantContent.includes('Synthesized Answer')) {
            // Otherwise accumulate individual responses but merge them
            tempAssistantContent = tempAssistantContent
              ? `${tempAssistantContent}\n\n${m.content}`
              : m.content;
          }
        }
      });

      if (tempAssistantContent) {
        conversationHistory.push({ role: 'assistant', content: tempAssistantContent });
      }

      if (synthesisMode) {
        // Double check permissions
        const allowedModelIds = session
          ? synthesisModelIds
          : synthesisModelIds.filter(id => !isPremiumModel(id));

        if (allowedModelIds.length === 0) {
          throw new Error('선택된 모델 중 사용 가능한 모델이 없습니다. (로그인이 필요할 수 있습니다)');
        }

        const result = await sendSynthesisRequest(content, conversationHistory, allowedModelIds);

        // Batch all responses to update state once
        const newAssistantMessages: Message[] = [
          ...result.responses.map(response => ({
            id: crypto.randomUUID(),
            role: 'assistant' as const,
            content: response.content,
            modelId: response.modelId,
            timestamp: new Date(),
          })),
          {
            id: crypto.randomUUID(),
            role: 'assistant' as const,
            content: result.synthesis, // Remove prefix here, handled by ChatMessage
            isSynthesis: true,
            timestamp: new Date(),
          }
        ];

        setMessages(prev => [...prev, ...newAssistantMessages]);

        // Save synthesis to DB
        try {
          await (supabase.from('prompt_logs' as any) as any).insert({
            prompt: content,
            result: result.synthesis,
            model_id: 'synthesis',
            owner_email: session?.user?.email || 'anonymous',
          });
        } catch (e) {
          console.warn('Could not save prompt log:', e);
        }
      } else {
        // Check permission for single model
        if (!session && isPremiumModel(selectedModel)) {
          throw new Error('선택하신 모델은 프리미엄 모델입니다. 로그인이 필요합니다.');
        }

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

        // Save to DB
        try {
          await (supabase.from('prompt_logs' as any) as any).insert({
            prompt: content,
            result: response.content,
            model_id: selectedModel,
            owner_email: session?.user?.email || 'anonymous',
          });
        } catch (e) {
          console.warn('Could not save prompt log:', e);
        }
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
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 glass-strong sticky top-0 z-10">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.location.reload()}>
          <img
            src="logo.png"
            alt="AI_ALL Logo"
            className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        <div className="flex items-center gap-2">
          {session ? (
            <div className="flex items-center gap-2 mr-2">
              <Badge variant="outline" className="text-zinc-400 border-zinc-800 hidden sm:flex">
                {session.user.email}
              </Badge>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-zinc-500 hover:text-red-400 hover:bg-red-950/20">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setIsAuthDialogOpen(true)} className="gap-2 text-zinc-500 hover:text-white">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Login</span>
            </Button>
          )}

          <ModelSelector
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            synthesisMode={synthesisMode}
            onToggleSynthesis={() => setSynthesisMode(!synthesisMode)}
            onConfigureSynthesis={() => setIsSystemControlOpen(true)}
            isLoggedIn={!!session}
            isAdmin={isAdmin}
            synthesisModelIds={synthesisModelIds}
            onUpdateSynthesisModels={setSynthesisModelIds}
          />
        </div>
      </header>

      <SystemControl
        open={isSystemControlOpen}
        onOpenChange={setIsSystemControlOpen}
        selectedModelIds={synthesisModelIds}
        onApply={setSynthesisModelIds}
        isAdmin={isAdmin}
        isLoggedIn={!!session}
      />

      <AuthDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} />

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-8 shadow-xl shadow-indigo-500/20">
              <Sparkles className="w-8 h-8 text-white fill-current animate-pulse-slow" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">AI_ALL에 오신 것을 환영합니다</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              GPT-4o, Claude, Gemini, DeepSeek 등 다양한 AI 모델과 대화하세요.
              Synthesis 모드로 여러 모델의 답변을 종합할 수도 있습니다.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {(promptHistory.length > 0 ? promptHistory : ['한국의 수도는?', '코딩 도와줘', '아이디어 추천해줘']).map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSendMessage(suggestion)}
                  className="glass px-5 py-2.5 rounded-full text-[13px] font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md active:scale-95 truncate max-w-[250px]"
                  title={suggestion}
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
