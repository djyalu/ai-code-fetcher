
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Plus, Database, X, RefreshCw, AlertTriangle, Activity } from "lucide-react";
import { useAIModels } from "@/hooks/useAIModels";
import { AIProvider } from "@/types/chat";
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
    'arcee'
];

export const ModelManagement = ({ open, onOpenChange }: ModelManagementProps) => {
    const { models, isLoading, error, refreshModels, seedModels } = useAIModels();
    const { toast } = useToast();
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [pingingModelId, setPingingModelId] = useState<string | null>(null);

    // New Model State
    const [newModel, setNewModel] = useState({
        id: '',
        name: '',
        provider: 'openrouter' as AIProvider,
        description: '',
        inputPrice: 0,
        outputPrice: 0,
        contextWindow: 4096,
        color: '#888888'
    });

    const handlePing = async (modelId: string) => {
        setPingingModelId(modelId);
        try {
            const { data, error } = await supabase.functions.invoke('check-model-health', {
                body: { model_id: modelId, force: true }
            });

            if (error) throw new Error(error.message);

            const result = data?.results?.find((r: any) => r.modelId === modelId || r.modelId === `perplexity/${modelId}`);

            if (result && result.isAvailable) {
                toast({ title: "Ping Successful", description: `${modelId} is available.` });
            } else {
                toast({ variant: "destructive", title: "Ping Failed", description: result?.errorMessage || "Model unavailable" });
            }
        } catch (e: any) {
            toast({ variant: "destructive", title: "Ping Error", description: e.message });
        } finally {
            setPingingModelId(null);
        }
    };

    const handleSeed = async () => {
        if (!confirm("This will overwrite/refill the database with the default hardcoded models. Are you sure?")) return;
        try {
            await seedModels();
            toast({ title: "Models synced with defaults" });
        } catch (e: any) {
            toast({ variant: "destructive", title: "Sync failed", description: e.message });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this model?")) return;
        try {
            const { error } = await supabase.from('ai_models' as any).delete().eq('id', id);
            if (error) throw error;
            toast({ title: "Model deleted" });
            refreshModels();
        } catch (e: any) {
            toast({ variant: "destructive", title: "Delete failed", description: e.message });
        }
    };

    const handleAdd = async () => {
        if (!newModel.id || !newModel.name) {
            return toast({ variant: "destructive", title: "Missing fields", description: "ID and Name are required." });
        }
        setIsSaving(true);
        try {
            const { error } = await supabase.from('ai_models' as any).insert({
                id: newModel.id,
                name: newModel.name,
                provider: newModel.provider,
                description: newModel.description,
                input_price: newModel.inputPrice,
                output_price: newModel.outputPrice,
                context_window: newModel.contextWindow,
                color: newModel.color
            });

            if (error) throw error;

            toast({ title: "Model added successfully" });
            setIsAdding(false);
            setNewModel({
                id: '',
                name: '',
                provider: 'openrouter',
                description: '',
                inputPrice: 0,
                outputPrice: 0,
                contextWindow: 4096,
                color: '#888888'
            });
            refreshModels();
        } catch (e: any) {
            toast({ variant: "destructive", title: "Failed to add model", description: e.message });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl h-[85vh] p-0 gap-0 bg-zinc-950 border-zinc-800">
                <DialogTitle className="sr-only">Model Management</DialogTitle>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center">
                            <Database className="w-5 h-5 text-zinc-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">AI Model Management</h2>
                            <p className="text-xs text-zinc-500">Add, edit, or remove AI models dynamically</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSeed}
                            className="text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
                        >
                            <RefreshCw className="w-3 h-3 mr-2" />
                            Sync Defaults
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="text-zinc-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-4 p-4 rounded bg-red-900/20 border border-red-900/50 text-red-400 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            <p className="text-sm">{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
                        </div>
                    )}

                    {isAdding && (
                        <div className="mb-6 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 animate-in fade-in slide-in-from-top-2">
                            <h3 className="text-sm font-medium text-white mb-4">Add New Model</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div className="space-y-2">
                                    <label className="text-xs text-zinc-500">Model ID</label>
                                    <Input
                                        value={newModel.id}
                                        onChange={e => setNewModel({ ...newModel, id: e.target.value })}
                                        placeholder="e.g. gpt-4-turbo"
                                        className="bg-zinc-950 border-zinc-800"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-zinc-500">Name</label>
                                    <Input
                                        value={newModel.name}
                                        onChange={e => setNewModel({ ...newModel, name: e.target.value })}
                                        placeholder="Display Name"
                                        className="bg-zinc-950 border-zinc-800"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-zinc-500">Provider</label>
                                    <Select
                                        value={newModel.provider}
                                        onValueChange={(v: AIProvider) => setNewModel({ ...newModel, provider: v })}
                                    >
                                        <SelectTrigger className="bg-zinc-950 border-zinc-800">
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
                                    <label className="text-xs text-zinc-500">Context Window</label>
                                    <Input
                                        type="number"
                                        value={newModel.contextWindow}
                                        onChange={e => setNewModel({ ...newModel, contextWindow: parseInt(e.target.value) })}
                                        className="bg-zinc-950 border-zinc-800"
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-xs text-zinc-500">Description</label>
                                    <Input
                                        value={newModel.description}
                                        onChange={e => setNewModel({ ...newModel, description: e.target.value })}
                                        placeholder="e.g. Most capable model..."
                                        className="bg-zinc-950 border-zinc-800"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-zinc-500">Input Price ($/1M)</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={newModel.inputPrice}
                                        onChange={e => setNewModel({ ...newModel, inputPrice: parseFloat(e.target.value) })}
                                        className="bg-zinc-950 border-zinc-800"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-zinc-500">Output Price ($/1M)</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={newModel.outputPrice}
                                        onChange={e => setNewModel({ ...newModel, outputPrice: parseFloat(e.target.value) })}
                                        className="bg-zinc-950 border-zinc-800"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                                <Button onClick={handleAdd} disabled={isSaving}>
                                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Save Model
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="rounded-md border border-zinc-800">
                        <Table>
                            <TableHeader className="bg-zinc-900/50">
                                <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                                    <TableHead className="text-zinc-400">ID / Name</TableHead>
                                    <TableHead className="text-zinc-400">Provider</TableHead>
                                    <TableHead className="text-zinc-400">Context</TableHead>
                                    <TableHead className="text-zinc-400">Pricing (In/Out)</TableHead>
                                    <TableHead className="text-right">
                                        <Button size="sm" onClick={() => setIsAdding(true)} className="h-7">
                                            <Plus className="w-4 h-4 mr-1" /> Add Model
                                        </Button>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-zinc-500" />
                                        </TableCell>
                                    </TableRow>
                                ) : models.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-zinc-500">
                                            No models found in database. Use "Sync Defaults" to populate.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    models.map((model) => (
                                        <TableRow key={model.id} className="border-zinc-800 hover:bg-zinc-900/30">
                                            <TableCell>
                                                <div className="font-medium text-zinc-300">{model.name}</div>
                                                <div className="text-xs text-zinc-500">{model.id}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge style={{ backgroundColor: model.color }} className="text-white hover:opacity-90">
                                                    {model.provider}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-zinc-400 text-sm">
                                                {(model.contextWindow / 1024).toFixed(0)}k
                                            </TableCell>
                                            <TableCell className="text-zinc-400 text-sm">
                                                ${model.inputPrice} / ${model.outputPrice}
                                            </TableCell>
                                            <TableCell className="text-right whitespace-nowrap">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handlePing(model.id)}
                                                    disabled={pingingModelId === model.id}
                                                    className="h-8 w-8 text-zinc-600 hover:text-green-400 hover:bg-green-900/10 mr-1"
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
                                                    onClick={() => handleDelete(model.id)}
                                                    className="h-8 w-8 text-zinc-600 hover:text-red-400 hover:bg-red-900/10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
