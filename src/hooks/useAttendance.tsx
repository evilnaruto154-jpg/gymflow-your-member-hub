import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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
    queryKey: ["attendance", user?.id],
    queryFn: async () => {
      if (!user) return [] as Attendance[];

      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_id", user.id)
        .order("check_in_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[Attendance] Fetch error:", error.message);
        throw new Error(error.message);
      }

      return (data ?? []) as Attendance[];
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const checkIn = useMutation({
    mutationFn: async (memberId: string) => {
      if (!user) throw new Error("Not authenticated");

      const today = format(new Date(), "yyyy-MM-dd");

      // Check if already checked in today
      const { data: existing, error: checkError } = await supabase
        .from("attendance")
        .select("id")
        .eq("member_id", memberId)
        .eq("user_id", user.id)
        .eq("check_in_date", today)
        .maybeSingle();

      if (checkError) {
        console.error("[Attendance] Check error:", checkError.message);
        throw new Error(checkError.message);
      }

      if (existing) {
        throw new Error("Member is already checked in for today");
      }

      // Insert attendance record
      const { error: insertError } = await supabase
        .from("attendance")
        .insert({
          member_id: memberId,
          user_id: user.id,
          check_in_date: today,
        });

      if (insertError) {
        console.error("[Attendance] Insert error:", insertError.message, insertError.details);
        // Handle unique constraint violation gracefully
        if (insertError.code === "23505") {
          throw new Error("Member is already checked in for today");
        }
        throw new Error(insertError.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", user?.id] });
      toast({ title: "✅ Check-in recorded successfully" });
    },
    onError: (err: Error) => {
      toast({
        title: "Check-in Failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  return { attendanceQuery, checkIn };
}
