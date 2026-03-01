import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Member {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  plan: string;
  start_date: string;
  expiry_date: string;
  payment_amount: number;
  payment_status: string;
  created_at: string;
  updated_at: string;
}

export type MemberInsert = Omit<Member, "id" | "created_at" | "updated_at">;

export function useMembers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const membersQuery = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Member[];
    },
    enabled: !!user,
  });

  const addMember = useMutation({
    mutationFn: async (member: Omit<MemberInsert, "user_id">) => {
      const { error } = await supabase.from("members").insert({
        ...member,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast({ title: "Member added successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMember = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Member> & { id: string }) => {
      const { error } = await supabase.from("members").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast({ title: "Member updated successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast({ title: "Member deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return { membersQuery, addMember, updateMember, deleteMember };
}

export function getMemberStatus(expiryDate: string): "active" | "expiring" | "expired" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  if (expiry < today) return "expired";

  const sevenDays = new Date(today);
  sevenDays.setDate(sevenDays.getDate() + 7);
  if (expiry <= sevenDays) return "expiring";

  return "active";
}
