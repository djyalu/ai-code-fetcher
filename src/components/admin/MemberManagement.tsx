import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2, UserCog, Shield, X, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Profile {
    id: string;
    email: string;
    role: string;
    created_at: string;
}

interface MemberManagementProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const MemberManagement = ({ open, onOpenChange }: MemberManagementProps) => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const fetchProfiles = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Profiles fetch error:', error);
                toast({
                    variant: 'destructive',
                    title: '회원 목록 조회 실패',
                    description: error.message
                });
                setProfiles([]);
                return;
            }
            setProfiles((data as Profile[]) || []);
        } catch (error: any) {
            console.error('Fatal Profiles error:', error);
            setProfiles([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchProfiles();
        }
    }, [open]);

    const handleRoleChange = async (profileId: string, newRole: string) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', profileId);

            if (error) throw error;
            toast({ title: '역할 변경 완료' });
            fetchProfiles();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: '역할 변경 실패',
                description: error.message
            });
        }
    };

    const handleDelete = async (profileId: string, email: string) => {
        if (!confirm(`정말 ${email} 회원을 삭제하시겠습니까?`)) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', profileId);

            if (error) throw error;
            toast({ title: '회원 삭제 완료' });
            fetchProfiles();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: '삭제 실패',
                description: error.message
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[85vh] p-0 gap-0 bg-card border-border">
                <DialogTitle className="sr-only">Member Management</DialogTitle>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <UserCog className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">회원 관리</h2>
                            <p className="text-xs text-muted-foreground">사용자 계정 및 권한 관리</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={fetchProfiles}
                            disabled={isLoading}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
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

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex h-full items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : profiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20 text-muted-foreground">
                            <Shield className="w-12 h-12 mb-3 opacity-20" />
                            <p>회원 프로필이 없습니다.</p>
                            <p className="text-xs mt-1">profiles 테이블이 생성되었는지 확인하세요.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-muted/50 sticky top-0">
                                <TableRow className="border-border hover:bg-muted/50">
                                    <TableHead className="text-muted-foreground">이메일</TableHead>
                                    <TableHead className="text-muted-foreground">역할</TableHead>
                                    <TableHead className="text-muted-foreground">가입일</TableHead>
                                    <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {profiles.map((profile) => (
                                    <TableRow key={profile.id} className="border-border hover:bg-muted/30">
                                        <TableCell className="font-medium text-foreground">
                                            {profile.email}
                                            {profile.role === 'admin' && (
                                                <Badge variant="default" className="ml-2 text-[10px]">
                                                    ADMIN
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={profile.role}
                                                onValueChange={(value) => handleRoleChange(profile.id, value)}
                                            >
                                                <SelectTrigger className="w-[120px] h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="user">User</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs">
                                            {new Date(profile.created_at).toLocaleDateString('ko-KR')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(profile.id, profile.email)}
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
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
