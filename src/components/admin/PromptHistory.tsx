import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Search, Calendar, User, Cpu, FileText, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";

interface PromptLog {
    id: string;
    prompt: string;
    result: string;
    model_id: string;
    owner_email: string;
    created_at: string;
}

interface PromptHistoryProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const PromptHistory = ({ open, onOpenChange }: PromptHistoryProps) => {
    const [logs, setLogs] = useState<PromptLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            fetchLogs();
        }
    }, [open]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data, error } = await (supabase
                .from('prompt_logs' as any) as any)
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) {
                console.error('Error fetching logs:', error);
                toast({
                    variant: 'destructive',
                    title: '히스토리 조회 실패',
                    description: error.message || '데이터베이스 연결을 확인해주세요.'
                });
            } else {
                setLogs(data || []);
            }
        } catch (err: any) {
            console.error('Fatal logs error:', err);
            toast({
                variant: 'destructive',
                title: '예상치 못한 오류 발생',
                description: '로그를 불러오는 중 문제가 발생했습니다.'
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log =>
        log.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.owner_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.model_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0 bg-zinc-950 border-zinc-800">
                <DialogHeader className="p-6 border-b border-zinc-800">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-400" />
                                Prompt History
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 ml-2 text-zinc-500 hover:text-white"
                                    onClick={fetchLogs}
                                    disabled={loading}
                                >
                                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                </Button>
                            </DialogTitle>
                            <p className="text-xs text-zinc-500">Explore all search prompts and results across models</p>
                        </div>
                    </div>

                    <div className="mt-4 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <Input
                            placeholder="Search prompts, users, or models..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-zinc-900 border-zinc-800 text-zinc-300 focus:ring-indigo-500"
                        />
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-auto p-0">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-zinc-900/50 sticky top-0 z-10">
                                <TableRow className="border-zinc-800 hover:bg-transparent">
                                    <TableHead className="w-[180px] text-zinc-400"><Calendar className="w-3 h-3 inline mr-2" />Date</TableHead>
                                    <TableHead className="w-[150px] text-zinc-400"><User className="w-3 h-3 inline mr-2" />Owner</TableHead>
                                    <TableHead className="w-[120px] text-zinc-400"><Cpu className="w-3 h-3 inline mr-2" />Model</TableHead>
                                    <TableHead className="text-zinc-400"><Search className="w-3 h-3 inline mr-2" />Prompt & Result</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLogs.map((log) => (
                                    <TableRow key={log.id} className="border-zinc-800 hover:bg-zinc-900/30 transition-colors">
                                        <TableCell className="text-xs text-zinc-500 align-top">
                                            {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                                        </TableCell>
                                        <TableCell className="text-xs font-medium text-zinc-300 align-top">
                                            <div className="truncate max-w-[140px]" title={log.owner_email}>
                                                {log.owner_email.split('@')[0]}
                                            </div>
                                            <div className="text-[10px] text-zinc-600 truncate">{log.owner_email}</div>
                                        </TableCell>
                                        <TableCell className="align-top">
                                            <div className={`text-[10px] px-2 py-0.5 rounded-full inline-block font-bold uppercase tracking-wider ${log.model_id === 'synthesis'
                                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                                }`}>
                                                {log.model_id.split('/').pop()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="space-y-4 py-4">
                                            <div className="space-y-1">
                                                <span className="text-[10px] text-zinc-600 font-bold uppercase">Prompt</span>
                                                <p className="text-sm text-zinc-200 leading-relaxed bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50">
                                                    {log.prompt}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] text-zinc-600 font-bold uppercase">Result</span>
                                                <div className="text-xs text-zinc-400 leading-relaxed bg-zinc-900/20 p-3 rounded-lg border border-zinc-900/50 max-h-[150px] overflow-y-auto scrollbar-thin">
                                                    {log.result}
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredLogs.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-32 text-center text-zinc-600">
                                            No matching history found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>

                <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex justify-end">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-transparent border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white">
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
