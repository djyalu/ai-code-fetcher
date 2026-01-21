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
  const [selectedModel, setSelectedModel] = useState('google/gemma-3-27b-it:free'); // Default to a stable free model
  const [synthesisMode, setSynthesisMode] = useState(false);
  const [synthesisModelIds, setSynthesisModelIds] = useState<string[]>(SYNTHESIS_MODELS);
  const [synthesisAggregatorId, setSynthesisAggregatorId] = useState<string | undefined>(undefined);
  const [isSystemControlOpen, setIsSystemControlOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [promptHistory, setPromptHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('prompt_history');
    return saved ? JSON.parse(saved) : [];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // isAdmin is derived from the server-side profile role. syncProfile will set it.

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
        setSelectedModel(prev => isPremiumModel(prev) ? 'google/gemma-3-27b-it:free' : prev);
        setSynthesisModelIds(prev => prev.filter(id => !isPremiumModel(id)));
      }
    });

    return () => subscription.unsubscribe();
  }, []);


  const syncProfile = async (user: any) => {
    try {
      // Check and upsert profile; derive admin role from profile.role
      const isSystemAdmin = user.email === ADMIN_EMAIL;
      const { data: profile } = await (supabase
        .from('profiles' as any) as any)
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) {
        // Insert with role based on whether this initial user email matches the configured admin
        const role = isSystemAdmin ? 'admin' : 'user';
        await (supabase.from('profiles' as any) as any).insert({
          id: user.id,
          email: user.email,
          role
        });
        setIsAdmin(role === 'admin');
      } else {
        // If profile exists, respect its role value
        if (isSystemAdmin && profile.role !== 'admin') {
          await (supabase.from('profiles' as any) as any).update({ role: 'admin' }).eq('id', user.id);
          setIsAdmin(true);
        } else {
          setIsAdmin(profile.role === 'admin');
        }
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
      // Normalize conversation history to avoid consecutive messages of the same role
      // - Merge consecutive messages with the same role
      // - Ensure there are no consecutive user messages when appending the new user input
      // - If the conversation starts with an assistant message (rare), insert a small
      //   synthetic user placeholder so providers that require strict alternation (eg. Anthropic)
      //   receive a user->assistant pattern.
      const normalizeConversation = (msgs: Message[]) => {
        const out: { role: 'user' | 'assistant' | 'system'; content: string }[] = [];
        for (const m of msgs) {
          // Preserve system messages as-is (they'll be handled/sanitized server-side when needed)
          if (m.role === 'system') {
            out.push({ role: 'system', content: m.content });
            continue;
          }

          const last = out[out.length - 1];
          if (last && last.role === m.role) {
            // Merge consecutive same-role messages
            last.content = `${last.content}\n\n${m.content}`;
          } else {
            out.push({ role: m.role, content: m.content });
          }
        }
        return out;
      };

      const conversationHistory = normalizeConversation(messages);

      // If first non-system role is assistant, insert a small synthetic user placeholder
      // so models that enforce strict alternation receive user -> assistant.
      const firstNonSystemIdx = conversationHistory.findIndex(m => m.role !== 'system');
      if (firstNonSystemIdx >= 0 && conversationHistory[firstNonSystemIdx].role === 'assistant') {
        conversationHistory.splice(firstNonSystemIdx, 0, {
          role: 'user',
          content: '[이전 대화 맥락] 이전 AI 응답이 먼저 존재합니다. 새로운 질문을 아래에 입력합니다.'
        });
      }

      if (synthesisMode) {
        // Double check permissions
        const allowedModelIds = session
          ? synthesisModelIds
          : synthesisModelIds.filter(id => !isPremiumModel(id));

        if (allowedModelIds.length === 0) {
          throw new Error('선택된 모델 중 사용 가능한 모델이 없습니다. (로그인이 필요할 수 있습니다)');
        }

        const result = await sendSynthesisRequest(content, conversationHistory, allowedModelIds, synthesisAggregatorId);

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

        // When appending the new user message, avoid creating consecutive user messages.
        const convoForSend = [...conversationHistory];
        const lastEntry = convoForSend[convoForSend.length - 1];
        if (lastEntry && lastEntry.role === 'user') {
          // Merge the new input into the last user entry
          lastEntry.content = `${lastEntry.content}\n\n${content}`;
        } else {
          convoForSend.push({ role: 'user', content });
        }

        const response = await sendMessage(convoForSend, selectedModel);

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
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10">
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
              <Badge variant="outline" className="text-muted-foreground border-border hidden sm:flex">
                {session.user.email}
              </Badge>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setIsAuthDialogOpen(true)} className="gap-2 text-muted-foreground hover:text-foreground">
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
        onApply={(modelIds, aggregatorId) => {
          setSynthesisModelIds(modelIds);
          setSynthesisAggregatorId(aggregatorId);
        }}
        aggregatorModelId={synthesisAggregatorId}
        isAdmin={isAdmin}
        isLoggedIn={!!session}
      />

      <AuthDialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen} />

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-8 shadow-xl shadow-primary/20">
              <Sparkles className="w-8 h-8 text-white fill-current animate-pulse-slow" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">AI_ALL에 오신 것을 환영합니다</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              GPT-4o, Claude, Gemini, DeepSeek 등 다양한 AI 모델과 대화하세요.
              Synthesis 모드로 여러 모델의 답변을 종합할 수도 있습니다.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {(promptHistory.length > 0 ? promptHistory : ['한국의 수도는?', '코딩 도와줘', '아이디어 추천해줘']).map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSendMessage(suggestion)}
                  className="px-5 py-2.5 rounded-full text-[13px] font-medium bg-card hover:bg-muted transition-all border border-border shadow-sm hover:shadow-md active:scale-95 truncate max-w-[250px] text-foreground"
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
                <div className="w-9 h-9 rounded-xl bg-muted border border-border flex items-center justify-center">
                  <Bot className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
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
      <footer className="p-4 pt-2 bg-background">
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
