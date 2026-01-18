import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Search, Calendar, User, Cpu, FileText, Loader2, X, Trash2, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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
            const { data, error } = await supabase
                .from('prompt_logs')
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

    const handleDelete = async (id: string) => {
        if (!confirm('이 기록을 삭제하시겠습니까?')) return;

        try {
            const { error } = await supabase
                .from('prompt_logs')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast({ title: '삭제 완료' });
            setLogs(logs.filter(log => log.id !== id));
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: '삭제 실패',
                description: error.message
            });
        }
    };

    const filteredLogs = logs.filter(log =>
        log.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.owner_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.model_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0 bg-card border-border">
                <DialogHeader className="p-6 border-b border-border">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary" />
                                프롬프트 히스토리
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 ml-2 text-muted-foreground hover:text-foreground"
                                    onClick={fetchLogs}
                                    disabled={loading}
                                >
                                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                </Button>
                            </DialogTitle>
                            <p className="text-xs text-muted-foreground">전체 검색 프롬프트 및 결과 탐색</p>
                        </div>
                    </div>

                    <div className="mt-4 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="프롬프트, 사용자, 모델 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-background border-input text-foreground focus:ring-primary"
                        />
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-auto p-0">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                <TableRow className="border-border hover:bg-transparent">
                                    <TableHead className="w-[160px] text-muted-foreground"><Calendar className="w-3 h-3 inline mr-2" />날짜</TableHead>
                                    <TableHead className="w-[150px] text-muted-foreground"><User className="w-3 h-3 inline mr-2" />사용자</TableHead>
                                    <TableHead className="w-[120px] text-muted-foreground"><Cpu className="w-3 h-3 inline mr-2" />모델</TableHead>
                                    <TableHead className="text-muted-foreground"><Search className="w-3 h-3 inline mr-2" />프롬프트 & 결과</TableHead>
                                    <TableHead className="w-[60px] text-muted-foreground"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLogs.map((log) => (
                                    <TableRow key={log.id} className="border-border hover:bg-muted/30 transition-colors">
                                        <TableCell className="text-xs text-muted-foreground align-top">
                                            {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm')}
                                        </TableCell>
                                        <TableCell className="text-xs font-medium text-foreground align-top">
                                            <div className="truncate max-w-[140px]" title={log.owner_email}>
                                                {log.owner_email.split('@')[0]}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground truncate">{log.owner_email}</div>
                                        </TableCell>
                                        <TableCell className="align-top">
                                            <div className={`text-[10px] px-2 py-0.5 rounded-full inline-block font-bold uppercase tracking-wider ${log.model_id === 'synthesis'
                                                ? 'bg-amber-100 text-amber-700 border border-amber-300'
                                                : 'bg-primary/10 text-primary border border-primary/20'
                                                }`}>
                                                {log.model_id.split('/').pop()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="space-y-4 py-4">
                                            <div className="space-y-1">
                                                <span className="text-[10px] text-muted-foreground font-bold uppercase">Prompt</span>
                                                <p className="text-sm text-foreground leading-relaxed bg-muted/50 p-3 rounded-lg border border-border">
                                                    {log.prompt}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] text-muted-foreground font-bold uppercase">Result</span>
                                                <div className="text-xs text-muted-foreground leading-relaxed bg-muted/20 p-3 rounded-lg border border-border max-h-[150px] overflow-y-auto scrollbar-thin">
                                                    {log.result}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="align-top">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(log.id)}
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredLogs.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                            검색 결과가 없습니다.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>

                <div className="p-4 border-t border-border bg-card flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                        총 {filteredLogs.length}개 기록
                    </span>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        닫기
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
