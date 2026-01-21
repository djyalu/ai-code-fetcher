import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Plus, Database, X, RefreshCw, AlertTriangle, Activity, Pencil, Check, XCircle, Zap } from "lucide-react";
import { useAIModels } from "@/hooks/useAIModels";
import { AIProvider, AIModel } from "@/types/chat";
import { useModelHealth } from "@/hooks/useModelHealth";

interface ModelManagementProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const PROVIDERS: AIProvider[] = [
    'openai',
    'anthropic',
    'google',
    'deepseek',
    'mistral',
    'nvidia',
    'meta',
    'openrouter',
    'perplexity',
    'qwen',
    'microsoft',
    'xiaomi',
    'arcee',
    'alibaba'
];

interface EditableModel {
    id: string;
    name: string;
    provider: AIProvider;
    description: string;
    inputPrice: number;
    outputPrice: number;
    contextWindow: number;
    color: string;
    isActive: boolean;
}

export const ModelManagementContent = () => {
    const { models, isLoading, error, refreshModels, seedModels } = useAIModels();
    const { healthStatus, isModelAvailable } = useModelHealth();
    const { toast } = useToast();
    
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingModel, setEditingModel] = useState<EditableModel | null>(null);
    const [pingingModelId, setPingingModelId] = useState<string | null>(null);
    const [pingAllRunning, setPingAllRunning] = useState(false);
    const [syncRunning, setSyncRunning] = useState(false);

    // New Model State
    const [newModel, setNewModel] = useState<EditableModel>({
        id: '',
        name: '',
        provider: 'openrouter',
        description: '',
        inputPrice: 0,
        outputPrice: 0,
        contextWindow: 4096,
        color: '#888888',
        isActive: true
    });

    // Free sync using OpenRouter /api/v1/models (no API credits consumed)
    const handleFreeSync = async () => {
        setSyncRunning(true);
        try {
            const { data, error } = await supabase.functions.invoke('check-model-health', {
                body: { 
                    mode: 'free',
                    auto_toggle: true,
                    sync_metadata: true
                }
            });

            if (error) throw new Error(error.message);

            const { available, unavailable, toggled, synced } = data || {};
            
            toast({ 
                title: "✅ 무료 동기화 완료", 
                description: `사용 가능: ${available}개, 불가: ${unavailable}개${toggled ? ` | 활성화: ${toggled.activated}, 비활성화: ${toggled.deactivated}` : ''}${synced ? ` | 메타데이터 동기화: ${synced}개` : ''}`
            });
            refreshModels();
        } catch (e: any) {
            toast({ variant: "destructive", title: "동기화 오류", description: e.message });
        } finally {
            setSyncRunning(false);
        }
    };

    const handlePing = async (modelId: string) => {
        setPingingModelId(modelId);
        try {
            const { data, error } = await supabase.functions.invoke('check-model-health', {
                body: { model_ids: [modelId], mode: 'ping' }
            });

            if (error) throw new Error(error.message);

            const result = data?.results?.find((r: any) => 
                r.modelId === modelId || 
                r.modelId === `perplexity/${modelId}` ||
                modelId.includes(r.modelId)
            );

            if (result && result.isAvailable) {
                toast({ title: "✅ Ping 성공", description: `${modelId} 사용 가능` });
            } else {
                toast({ variant: "destructive", title: "❌ Ping 실패", description: result?.errorMessage || "모델 사용 불가" });
            }
            refreshModels();
        } catch (e: any) {
            toast({ variant: "destructive", title: "Ping 오류", description: e.message });
        } finally {
            setPingingModelId(null);
        }
    };

    const handlePingAll = async () => {
        setPingAllRunning(true);
        try {
            const modelIds = models.map(m => m.id);
            const { data, error } = await supabase.functions.invoke('check-model-health', {
                body: { model_ids: modelIds, mode: 'ping' }
            });

            if (error) throw new Error(error.message);

            const available = data?.results?.filter((r: any) => r.isAvailable).length || 0;
            const total = data?.results?.length || 0;

            toast({ 
                title: "전체 Ping 완료", 
                description: `${available}/${total} 모델 사용 가능 (⚠️ API 크레딧 소비됨)` 
            });
            refreshModels();
        } catch (e: any) {
            toast({ variant: "destructive", title: "Ping 오류", description: e.message });
        } finally {
            setPingAllRunning(false);
        }
    };

    const handleSeed = async () => {
        if (!confirm("기본 모델 목록으로 데이터베이스를 동기화합니다. 계속하시겠습니까?")) return;
        try {
            await seedModels();
            toast({ title: "모델 동기화 완료" });
        } catch (e: any) {
            toast({ variant: "destructive", title: "동기화 실패", description: e.message });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("이 모델을 삭제하시겠습니까?")) return;
        try {
            const { error } = await supabase.from('ai_models' as any).delete().eq('id', id);
            if (error) throw error;
            toast({ title: "모델 삭제됨" });
            refreshModels();
        } catch (e: any) {
            toast({ variant: "destructive", title: "삭제 실패", description: e.message });
        }
    };

    const handleAdd = async () => {
        if (!newModel.id || !newModel.name) {
            return toast({ variant: "destructive", title: "필수 항목 누락", description: "ID와 이름은 필수입니다." });
        }
        setIsSaving(true);
        try {
            const { error } = await supabase.from('ai_models' as any).insert({
                id: newModel.id,
                model_id: newModel.id,
                name: newModel.name,
                provider: newModel.provider,
                description: newModel.description,
                input_price: newModel.inputPrice,
                output_price: newModel.outputPrice,
                context_window: newModel.contextWindow,
                color: newModel.color,
                is_active: newModel.isActive
            });

            if (error) throw error;

            toast({ title: "모델 추가 완료" });
            setIsAdding(false);
            setNewModel({
                id: '',
                name: '',
                provider: 'openrouter',
                description: '',
                inputPrice: 0,
                outputPrice: 0,
                contextWindow: 4096,
                color: '#888888',
                isActive: true
            });
            refreshModels();
        } catch (e: any) {
            toast({ variant: "destructive", title: "모델 추가 실패", description: e.message });
        } finally {
            setIsSaving(false);
        }
    };

    const startEditing = (model: AIModel) => {
        setEditingId(model.id);
        setEditingModel({
            id: model.id,
            name: model.name,
            provider: model.provider,
            description: model.description || '',
            inputPrice: model.inputPrice,
            outputPrice: model.outputPrice,
            contextWindow: model.contextWindow,
            color: model.color,
            isActive: (model as any).isActive !== false
        });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingModel(null);
    };

    const saveEditing = async () => {
        if (!editingModel) return;
        setIsSaving(true);
        try {
            const { error } = await supabase.from('ai_models' as any).update({
                name: editingModel.name,
                provider: editingModel.provider,
                description: editingModel.description,
                input_price: editingModel.inputPrice,
                output_price: editingModel.outputPrice,
                context_window: editingModel.contextWindow,
                color: editingModel.color,
                is_active: editingModel.isActive
            }).eq('id', editingId);

            if (error) throw error;

            toast({ title: "모델 수정 완료" });
            cancelEditing();
            refreshModels();
        } catch (e: any) {
            toast({ variant: "destructive", title: "수정 실패", description: e.message });
        } finally {
            setIsSaving(false);
        }
    };

    const toggleModelActive = async (model: AIModel) => {
        const newActiveState = !(model as any).isActive;
        try {
            const { error } = await supabase.from('ai_models' as any).update({
                is_active: newActiveState
            }).eq('id', model.id);

            if (error) throw error;
            refreshModels();
        } catch (e: any) {
            toast({ variant: "destructive", title: "상태 변경 실패", description: e.message });
        }
    };

    const getHealthBadge = (modelId: string) => {
        const available = isModelAvailable(modelId);
        if (available === undefined) {
            return <Badge variant="outline" className="text-muted-foreground border-muted">미확인</Badge>;
        }
        return available 
            ? <Badge className="bg-green-500/20 text-green-400 border-green-500/30">정상</Badge>
            : <Badge className="bg-red-500/20 text-red-400 border-red-500/30">오류</Badge>;
    };

    const ModelForm = ({ model, setModel, isNew = false }: { 
        model: EditableModel, 
        setModel: (m: EditableModel) => void, 
        isNew?: boolean 
    }) => (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Model ID</label>
                <Input
                    value={model.id}
                    onChange={e => setModel({ ...model, id: e.target.value })}
                    placeholder="e.g. gpt-4o-mini"
                    className="bg-muted/50 border-border"
                    disabled={!isNew}
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs text-muted-foreground">표시 이름</label>
                <Input
                    value={model.name}
                    onChange={e => setModel({ ...model, name: e.target.value })}
                    placeholder="Display Name"
                    className="bg-muted/50 border-border"
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Provider</label>
                <Select
                    value={model.provider}
                    onValueChange={(v: AIProvider) => setModel({ ...model, provider: v })}
                >
                    <SelectTrigger className="bg-muted/50 border-border">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {PROVIDERS.map(p => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Context Window</label>
                <Input
                    type="number"
                    value={model.contextWindow}
                    onChange={e => setModel({ ...model, contextWindow: parseInt(e.target.value) || 0 })}
                    className="bg-muted/50 border-border"
                />
            </div>
            <div className="space-y-2 col-span-2">
                <label className="text-xs text-muted-foreground">설명</label>
                <Input
                    value={model.description}
                    onChange={e => setModel({ ...model, description: e.target.value })}
                    placeholder="모델 설명..."
                    className="bg-muted/50 border-border"
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Input ($/1M)</label>
                <Input
                    type="number"
                    step="0.001"
                    value={model.inputPrice}
                    onChange={e => setModel({ ...model, inputPrice: parseFloat(e.target.value) || 0 })}
                    className="bg-muted/50 border-border"
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Output ($/1M)</label>
                <Input
                    type="number"
                    step="0.001"
                    value={model.outputPrice}
                    onChange={e => setModel({ ...model, outputPrice: parseFloat(e.target.value) || 0 })}
                    className="bg-muted/50 border-border"
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs text-muted-foreground">색상</label>
                <div className="flex gap-2">
                    <Input
                        type="color"
                        value={model.color}
                        onChange={e => setModel({ ...model, color: e.target.value })}
                        className="w-12 h-9 p-1 cursor-pointer"
                    />
                    <Input
                        value={model.color}
                        onChange={e => setModel({ ...model, color: e.target.value })}
                        className="bg-muted/50 border-border flex-1"
                    />
                </div>
            </div>
            <div className="space-y-2 flex items-end">
                <div className="flex items-center gap-2">
                    <Switch 
                        checked={model.isActive} 
                        onCheckedChange={(checked) => setModel({ ...model, isActive: checked })}
                    />
                    <span className="text-sm text-muted-foreground">활성화</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <Database className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">AI 모델 관리</h2>
                        <p className="text-xs text-muted-foreground">모델 추가, 수정, 삭제 및 상태 확인</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleFreeSync}
                        disabled={syncRunning}
                        className="text-cyan-500 border-cyan-500/30 hover:bg-cyan-500/10"
                    >
                        {syncRunning ? (
                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        ) : (
                            <RefreshCw className="w-3 h-3 mr-2" />
                        )}
                        모델 동기화 (무료)
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePingAll}
                        disabled={pingAllRunning}
                        className="text-green-500 border-green-500/30 hover:bg-green-500/10"
                    >
                        {pingAllRunning ? (
                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        ) : (
                            <Zap className="w-3 h-3 mr-2" />
                        )}
                        전체 Ping (유료)
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSeed}
                        className="text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
                    >
                        <Database className="w-3 h-3 mr-2" />
                        기본값 동기화
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
                {error && (
                    <div className="mb-4 p-4 rounded bg-destructive/10 border border-destructive/30 text-destructive flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <p className="text-sm">{error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'}</p>
                    </div>
                )}

                {/* Add New Model Form */}
                {isAdding && (
                    <div className="mb-6 p-4 rounded-lg bg-muted/30 border border-border animate-in fade-in slide-in-from-top-2">
                        <h3 className="text-sm font-medium text-foreground mb-4">새 모델 추가</h3>
                        <ModelForm model={newModel} setModel={setNewModel} isNew />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsAdding(false)}>취소</Button>
                            <Button onClick={handleAdd} disabled={isSaving}>
                                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                저장
                            </Button>
                        </div>
                    </div>
                )}

                {/* Edit Model Form */}
                {editingId && editingModel && (
                    <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-top-2">
                        <h3 className="text-sm font-medium text-foreground mb-4">모델 수정: {editingModel.name}</h3>
                        <ModelForm model={editingModel} setModel={setEditingModel} />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={cancelEditing}>취소</Button>
                            <Button onClick={saveEditing} disabled={isSaving}>
                                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                저장
                            </Button>
                        </div>
                    </div>
                )}

                <div className="rounded-md border border-border">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="border-border hover:bg-muted/50">
                                <TableHead className="text-muted-foreground w-10">상태</TableHead>
                                <TableHead className="text-muted-foreground">ID / 이름</TableHead>
                                <TableHead className="text-muted-foreground">Provider</TableHead>
                                <TableHead className="text-muted-foreground">Context</TableHead>
                                <TableHead className="text-muted-foreground">가격 (In/Out)</TableHead>
                                <TableHead className="text-muted-foreground">Health</TableHead>
                                <TableHead className="text-right">
                                    <Button size="sm" onClick={() => setIsAdding(true)} className="h-7" disabled={isAdding}>
                                        <Plus className="w-4 h-4 mr-1" /> 모델 추가
                                    </Button>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : models.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        데이터베이스에 모델이 없습니다. "기본값 동기화"를 사용하세요.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                models.map((model) => {
                                    const isActive = (model as any).isActive !== false;
                                    return (
                                        <TableRow key={model.id} className={`border-border hover:bg-muted/30 ${!isActive ? 'opacity-50' : ''}`}>
                                            <TableCell>
                                                <Switch 
                                                    checked={isActive}
                                                    onCheckedChange={() => toggleModelActive(model)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium text-foreground">{model.name}</div>
                                                <div className="text-xs text-muted-foreground font-mono">{model.id}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge style={{ backgroundColor: model.color }} className="text-white hover:opacity-90">
                                                    {model.provider}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {(model.contextWindow / 1024).toFixed(0)}k
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {model.inputPrice === 0 ? (
                                                    <Badge variant="outline" className="text-green-500 border-green-500/30">FREE</Badge>
                                                ) : (
                                                    <span>${model.inputPrice} / ${model.outputPrice}</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {getHealthBadge(model.id)}
                                            </TableCell>
                                            <TableCell className="text-right whitespace-nowrap">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handlePing(model.id)}
                                                    disabled={pingingModelId === model.id}
                                                    className="h-8 w-8 text-muted-foreground hover:text-green-400 hover:bg-green-500/10"
                                                    title="Ping 테스트"
                                                >
                                                    {pingingModelId === model.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Activity className="w-4 h-4" />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => startEditing(model)}
                                                    disabled={editingId !== null}
                                                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                    title="수정"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(model.id)}
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                    title="삭제"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
};

export const ModelManagement = ({ open, onOpenChange }: ModelManagementProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl h-[85vh] p-0 gap-0 bg-card border-border">
                <DialogTitle className="sr-only">Model Management</DialogTitle>
                <div className="relative h-full">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onOpenChange(false)}
                        className="absolute right-4 top-4 z-10 text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                    <ModelManagementContent />
                </div>
            </DialogContent>
        </Dialog>
    );
};
