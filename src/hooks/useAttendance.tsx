import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Attendance {
  id: string;
  member_id: string;
  user_id: string;
  check_in_date: string;
  created_at: string;
}

export function useAttendance() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const attendanceQuery = useQuery({
    queryKey: ["attendance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .order("check_in_date", { ascending: false });
      if (error) throw error;
      return data as Attendance[];
    },
    enabled: !!user,
  });

  const checkIn = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from("attendance").insert({
        member_id: memberId,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast({ title: "Check-in recorded" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return { attendanceQuery, checkIn };
}
