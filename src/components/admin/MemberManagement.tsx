import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, UserCog, Shield, X } from "lucide-react";
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
            // Note: profiles table may not exist - this is handled gracefully
            const { data, error } = await supabase
                .from('profiles' as never)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.log('Profiles not available:', error.message);
                setProfiles([]);
                return;
            }
            setProfiles((data as Profile[]) || []);
        } catch (error: unknown) {
            console.log('Profiles table not available');
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[85vh] p-0 gap-0 bg-zinc-950 border-zinc-800">
                <DialogTitle className="sr-only">Member Management</DialogTitle>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center">
                            <UserCog className="w-5 h-5 text-zinc-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Member Management</h2>
                            <p className="text-xs text-zinc-500">Manage user accounts and permissions</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onOpenChange(false)}
                        className="text-zinc-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex h-full items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                        </div>
                    ) : profiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20 text-zinc-500">
                            <Shield className="w-12 h-12 mb-3 opacity-20" />
                            <p>No member profiles found.</p>
                            <p className="text-xs mt-1">Ensure the profiles table is created in Supabase.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-zinc-900/50 sticky top-0">
                                <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                                    <TableHead className="text-zinc-400">Email</TableHead>
                                    <TableHead className="text-zinc-400">Role</TableHead>
                                    <TableHead className="text-zinc-400">Joined</TableHead>
                                    <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {profiles.map((profile) => (
                                    <TableRow key={profile.id} className="border-zinc-800 hover:bg-zinc-900/30">
                                        <TableCell className="font-medium text-zinc-300">
                                            {profile.email}
                                            {profile.email === 'go41@naver.com' && (
                                                <Badge variant="outline" className="ml-2 border-indigo-500/30 text-indigo-400 text-[10px]">
                                                    YOU
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`
                        ${profile.email === 'go41@naver.com'
                                                    ? 'border-indigo-500/30 text-indigo-400'
                                                    : 'border-zinc-700 text-zinc-400'}
                      `}>
                                                {profile.email === 'go41@naver.com' ? 'Admin' : 'User'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-zinc-500 text-xs">
                                            {new Date(profile.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-zinc-600 hover:text-red-400 hover:bg-red-900/10"
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
