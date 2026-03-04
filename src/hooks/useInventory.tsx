import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface InventoryItem {
  id: string;
  user_id: string;
  item_name: string;
  category: string;
  quantity: number;
  purchase_price: number;
  selling_price: number;
  supplier_name: string;
  reorder_level: number;
  created_at: string;
  updated_at: string;
}

export const INVENTORY_CATEGORIES = [
  "Supplements",
  "Merchandise",
  "Equipment",
  "Accessories",
  "General",
] as const;

export function useInventory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const inventoryQuery = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as InventoryItem[];
    },
    enabled: !!user,
  });

  const addItem = useMutation({
    mutationFn: async (item: Omit<InventoryItem, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { error } = await supabase.from("inventory").insert({
        ...item,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({ title: "Item added successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InventoryItem> & { id: string }) => {
      const { error } = await supabase.from("inventory").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({ title: "Item updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inventory").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({ title: "Item deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const items = inventoryQuery.data ?? [];
  const lowStockItems = items.filter((i) => i.quantity <= i.reorder_level);
  const totalInventoryValue = items.reduce((sum, i) => sum + i.quantity * i.purchase_price, 0);
  const totalRetailValue = items.reduce((sum, i) => sum + i.quantity * i.selling_price, 0);

  return { inventoryQuery, items, addItem, updateItem, deleteItem, lowStockItems, totalInventoryValue, totalRetailValue };
}
