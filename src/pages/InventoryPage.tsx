import { useState } from "react";
import { useInventory, INVENTORY_CATEGORIES, InventoryItem } from "@/hooks/useInventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Package, AlertTriangle, Plus, Trash2, Pencil, IndianRupee, Search } from "lucide-react";

const emptyForm = {
  item_name: "",
  category: "General",
  quantity: 0,
  purchase_price: 0,
  selling_price: 0,
  supplier_name: "",
  reorder_level: 5,
};

const InventoryPage = () => {
  const { items, addItem, updateItem, deleteItem, lowStockItems, totalInventoryValue, totalRetailValue, inventoryQuery } = useInventory();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = items.filter((i) => {
    const matchSearch = i.item_name.toLowerCase().includes(search.toLowerCase()) || i.supplier_name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || i.category === catFilter;
    return matchSearch && matchCat;
  });

  const openAdd = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setForm({
      item_name: item.item_name,
      category: item.category,
      quantity: item.quantity,
      purchase_price: item.purchase_price,
      selling_price: item.selling_price,
      supplier_name: item.supplier_name || "",
      reorder_level: item.reorder_level,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      await updateItem.mutateAsync({ id: editingItem.id, ...form });
    } else {
      await addItem.mutateAsync(form);
    }
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Inventory</h1>
          <p className="text-muted-foreground">{items.length} items tracked</p>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Item</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Items</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold font-display">{items.length}</p></CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-warning" />Low Stock</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold font-display text-warning">{lowStockItems.length}</p></CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Cost Value</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold font-display">₹{totalInventoryValue.toLocaleString()}</p></CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Retail Value</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold font-display text-primary">₹{totalRetailValue.toLocaleString()}</p></CardContent>
        </Card>
      </div>

      {/* Low stock alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="py-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            <p className="text-sm"><span className="font-semibold">{lowStockItems.length} item(s)</span> below reorder level: {lowStockItems.map(i => i.item_name).join(", ")}</p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {INVENTORY_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Item</TableHead>
              <TableHead className="hidden sm:table-cell">Category</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead className="hidden md:table-cell">Buy ₹</TableHead>
              <TableHead className="hidden md:table-cell">Sell ₹</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No items found</TableCell></TableRow>
            )}
            {filtered.map((item) => {
              const isLow = item.quantity <= item.reorder_level;
              return (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{item.item_name}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">{item.category}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">₹{item.purchase_price}</TableCell>
                  <TableCell className="hidden md:table-cell">₹{item.selling_price}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={isLow ? "bg-warning/15 text-warning border-warning/30" : "bg-success/15 text-success border-success/30"}>
                      {isLow ? "Low" : "OK"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete item?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently delete {item.item_name}.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteItem.mutate(item.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "Add Inventory Item"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INVENTORY_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: +e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Reorder Level</Label>
                <Input type="number" min={0} value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: +e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Purchase Price (₹)</Label>
                <Input type="number" min={0} value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: +e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Selling Price (₹)</Label>
                <Input type="number" min={0} value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: +e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Supplier Name</Label>
              <Input value={form.supplier_name} onChange={(e) => setForm({ ...form, supplier_name: e.target.value })} />
            </div>
            <Button type="submit" className="w-full" disabled={addItem.isPending || updateItem.isPending}>
              {editingItem ? "Update Item" : "Add Item"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryPage;
