import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Payment {
  id: string;
  user_id: string;
  member_id: string;
  amount: number;
  payment_date: string;
  method: string;
  note: string;
  created_at: string;
}

export function usePayments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const paymentsQuery = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!user,
  });

  const addPayment = useMutation({
    mutationFn: async (payment: Omit<Payment, "id" | "user_id" | "created_at">) => {
      const { error } = await supabase.from("payments").insert({
        ...payment,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast({ title: "Payment recorded" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deletePayment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast({ title: "Payment deleted" });
    },
  });

  return { paymentsQuery, addPayment, deletePayment };
}
