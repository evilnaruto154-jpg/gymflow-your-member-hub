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
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Trainer[];
    },
    enabled: !!user,
  });

  const createTrainer = useMutation({
    mutationFn: async (payload: {
      trainer_name: string;
      trainer_email: string;
      phone: string;
      password: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("manage-trainer", {
        body: { action: "create", ...payload },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trainers"] }),
  });

  const resetPassword = useMutation({
    mutationFn: async (payload: { auth_user_id: string; new_password: string }) => {
      const { data, error } = await supabase.functions.invoke("manage-trainer", {
        body: { action: "reset_password", ...payload },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async (payload: { trainer_id: string; new_status: string }) => {
      const { data, error } = await supabase.functions.invoke("manage-trainer", {
        body: { action: "toggle_status", ...payload },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
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

  const trainers = trainersQuery.data ?? [];
  const activeTrainers = trainers.filter((t) => t.status === "active");

  return {
    trainersQuery,
    trainers,
    activeTrainers,
    createTrainer,
    updateTrainer,
    resetPassword,
    toggleStatus,
  };
}
