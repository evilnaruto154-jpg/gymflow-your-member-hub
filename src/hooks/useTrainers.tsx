import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Trainer {
  id: string;
  owner_id: string;
  trainer_name: string;
  trainer_email: string;
  phone: string;
  status: string;
  auth_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useTrainers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const trainersQuery = useQuery({
    queryKey: ["trainers", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainers")
        .select("*")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Trainer[];
    },
    enabled: !!user,
  });

  const addTrainer = useMutation({
    mutationFn: async (trainer: { trainer_name: string; trainer_email: string; phone: string }) => {
      const { error } = await supabase.from("trainers").insert({
        ...trainer,
        owner_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trainers"] }),
  });

  const updateTrainer = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Trainer> & { id: string }) => {
      const { error } = await supabase.from("trainers").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trainers"] }),
  });

  const deleteTrainer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trainers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trainers"] }),
  });

  const trainers = trainersQuery.data ?? [];
  const activeTrainers = trainers.filter((t) => t.status === "active");

  return { trainersQuery, trainers, activeTrainers, addTrainer, updateTrainer, deleteTrainer };
}
