import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Trash2, Plus, Edit2, X, Cpu, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIModel {
    id: string;
    model_id: string;
    name: string;
    provider: string;
    description: string | null;
    input_price: number;
    output_price: number;
    context_window: number;
    color: string;
    is_active: boolean;
    created_at: string;
}

interface ModelManagementProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const defaultModel: Omit<AIModel, 'id' | 'created_at'> = {
    model_id: '',
    name: '',
    provider: '',
    description: '',
    input_price: 0,
    output_price: 0,
    context_window: 8192,
    color: '#888888',
    is_active: true,
};

export const ModelManagement = ({ open, onOpenChange }: ModelManagementProps) => {
    const [models, setModels] = useState<AIModel[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [editingModel, setEditingModel] = useState<Partial<AIModel> | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const { toast } = useToast();

    const fetchModels = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('ai_models')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setModels(data || []);
        } catch (error: any) {
            console.error('Models fetch error:', error);
            toast({
                variant: 'destructive',
                title: '모델 목록 조회 실패',
                description: error.message
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchModels();
        }
    }, [open]);

    const handleSave = async () => {
        if (!editingModel) return;

        try {
            if (isCreating) {
                const { error } = await supabase
                    .from('ai_models')
                    .insert({
                        model_id: editingModel.model_id,
                        name: editingModel.name,
                        provider: editingModel.provider,
                        description: editingModel.description,
                        input_price: editingModel.input_price,
                        output_price: editingModel.output_price,
                        context_window: editingModel.context_window,
                        color: editingModel.color,
                        is_active: editingModel.is_active,
                    });
                if (error) throw error;
                toast({ title: '모델 추가 완료' });
            } else {
                const { error } = await supabase
                    .from('ai_models')
                    .update({
                        model_id: editingModel.model_id,
                        name: editingModel.name,
                        provider: editingModel.provider,
                        description: editingModel.description,
                        input_price: editingModel.input_price,
                        output_price: editingModel.output_price,
                        context_window: editingModel.context_window,
                        color: editingModel.color,
                        is_active: editingModel.is_active,
                    })
                    .eq('id', editingModel.id);
                if (error) throw error;
                toast({ title: '모델 수정 완료' });
            }
            setEditingModel(null);
            setIsCreating(false);
            fetchModels();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: '저장 실패',
                description: error.message
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정말 이 모델을 삭제하시겠습니까?')) return;

        try {
            const { error } = await supabase
                .from('ai_models')
                .delete()
                .eq('id', id);
            if (error) throw error;
            toast({ title: '모델 삭제 완료' });
            fetchModels();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: '삭제 실패',
                description: error.message
            });
        }
    };

    const handleToggleActive = async (model: AIModel) => {
        try {
            const { error } = await supabase
                .from('ai_models')
                .update({ is_active: !model.is_active })
                .eq('id', model.id);
            if (error) throw error;
            fetchModels();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: '상태 변경 실패',
                description: error.message
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl h-[90vh] p-0 gap-0 bg-card border-border">
                <DialogTitle className="sr-only">Model Management</DialogTitle>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <Cpu className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">모델 관리</h2>
                            <p className="text-xs text-muted-foreground">AI 모델 추가, 수정, 삭제</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                                setEditingModel(defaultModel);
                                setIsCreating(true);
                            }}
                            className="gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            모델 추가
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Edit Form */}
                {editingModel && (
                    <div className="p-6 border-b border-border bg-muted/30">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <Label className="text-foreground">Model ID</Label>
                                <Input
                                    value={editingModel.model_id || ''}
                                    onChange={(e) => setEditingModel({ ...editingModel, model_id: e.target.value })}
                                    placeholder="예: gpt-4o"
                                    className="bg-background"
                                />
                            </div>
                            <div>
                                <Label className="text-foreground">이름</Label>
                                <Input
                                    value={editingModel.name || ''}
                                    onChange={(e) => setEditingModel({ ...editingModel, name: e.target.value })}
                                    placeholder="예: GPT-4o"
                                    className="bg-background"
                                />
                            </div>
                            <div>
                                <Label className="text-foreground">제공자</Label>
                                <Input
                                    value={editingModel.provider || ''}
                                    onChange={(e) => setEditingModel({ ...editingModel, provider: e.target.value })}
                                    placeholder="예: openai"
                                    className="bg-background"
                                />
                            </div>
                            <div>
                                <Label className="text-foreground">색상</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={editingModel.color || '#888888'}
                                        onChange={(e) => setEditingModel({ ...editingModel, color: e.target.value })}
                                        className="w-12 h-9 p-1 bg-background"
                                    />
                                    <Input
                                        value={editingModel.color || ''}
                                        onChange={(e) => setEditingModel({ ...editingModel, color: e.target.value })}
                                        className="flex-1 bg-background"
                                    />
                                </div>
                            </div>
                            <div className="col-span-2">
                                <Label className="text-foreground">설명</Label>
                                <Input
                                    value={editingModel.description || ''}
                                    onChange={(e) => setEditingModel({ ...editingModel, description: e.target.value })}
                                    placeholder="모델 설명..."
                                    className="bg-background"
                                />
                            </div>
                            <div>
                                <Label className="text-foreground">입력 가격 ($/1M)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={editingModel.input_price || 0}
                                    onChange={(e) => setEditingModel({ ...editingModel, input_price: parseFloat(e.target.value) })}
                                    className="bg-background"
                                />
                            </div>
                            <div>
                                <Label className="text-foreground">출력 가격 ($/1M)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={editingModel.output_price || 0}
                                    onChange={(e) => setEditingModel({ ...editingModel, output_price: parseFloat(e.target.value) })}
                                    className="bg-background"
                                />
                            </div>
                            <div>
                                <Label className="text-foreground">Context Window</Label>
                                <Input
                                    type="number"
                                    value={editingModel.context_window || 8192}
                                    onChange={(e) => setEditingModel({ ...editingModel, context_window: parseInt(e.target.value) })}
                                    className="bg-background"
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <Button onClick={handleSave} className="gap-2">
                                    <Save className="w-4 h-4" />
                                    저장
                                </Button>
                                <Button variant="outline" onClick={() => { setEditingModel(null); setIsCreating(false); }}>
                                    취소
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex h-full items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : models.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20 text-muted-foreground">
                            <Cpu className="w-12 h-12 mb-3 opacity-20" />
                            <p>등록된 모델이 없습니다.</p>
                            <p className="text-xs mt-1">모델 추가 버튼을 클릭하여 시작하세요.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-muted/50 sticky top-0">
                                <TableRow className="border-border hover:bg-muted/50">
                                    <TableHead className="text-muted-foreground">상태</TableHead>
                                    <TableHead className="text-muted-foreground">Model ID</TableHead>
                                    <TableHead className="text-muted-foreground">이름</TableHead>
                                    <TableHead className="text-muted-foreground">제공자</TableHead>
                                    <TableHead className="text-muted-foreground">가격</TableHead>
                                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {models.map((model) => (
                                    <TableRow key={model.id} className="border-border hover:bg-muted/30">
                                        <TableCell>
                                            <Switch
                                                checked={model.is_active}
                                                onCheckedChange={() => handleToggleActive(model)}
                                            />
                                        </TableCell>
                                        <TableCell className="font-mono text-sm text-foreground">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: model.color }}
                                                />
                                                {model.model_id}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-foreground">
                                            {model.name}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {model.provider}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs">
                                            {model.input_price === 0 ? (
                                                <Badge variant="secondary" className="text-green-600">Free</Badge>
                                            ) : (
                                                `$${model.input_price} / $${model.output_price}`
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setEditingModel(model);
                                                        setIsCreating(false);
                                                    }}
                                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(model.id)}
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
