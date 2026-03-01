import { useState } from "react";
import { useMembers, getMemberStatus, Member } from "@/hooks/useMembers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Trash2, Pencil, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusStyles = {
  active: "bg-success/15 text-success border-success/30",
  expiring: "bg-warning/15 text-warning border-warning/30",
  expired: "bg-destructive/15 text-destructive border-destructive/30",
};

const Members = () => {
  const { membersQuery, deleteMember } = useMembers();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const navigate = useNavigate();
  const members = membersQuery.data ?? [];

  const filtered = members.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search);
    const status = getMemberStatus(m.expiry_date);
    const matchFilter = filter === "all" || status === filter;
    return matchSearch && matchFilter;
  });

  const sendWhatsApp = (member: Member) => {
    const msg = encodeURIComponent(
      `Hello ${member.name}, your gym membership expires on ${format(new Date(member.expiry_date), "dd MMM yyyy")}. Please renew.`
    );
    window.open(`https://wa.me/${member.phone.replace(/\D/g, "")}?text=${msg}`, "_blank");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Members</h1>
          <p className="text-muted-foreground">{members.length} total members</p>
        </div>
        <Button onClick={() => navigate("/members/new")}>Add Member</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expiring">Expiring Soon</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Name</TableHead>
              <TableHead className="hidden sm:table-cell">Phone</TableHead>
              <TableHead className="hidden md:table-cell">Plan</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead className="hidden md:table-cell">Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No members found
                </TableCell>
              </TableRow>
            )}
            {filtered.map((member) => {
              const status = getMemberStatus(member.expiry_date);
              return (
                <TableRow key={member.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-foreground">{member.name}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">{member.phone}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{member.plan}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(member.expiry_date), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={member.payment_status === "paid" ? "default" : "secondary"}>
                      {member.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusStyles[status]}>
                      {status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => sendWhatsApp(member)} title="WhatsApp Reminder">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => navigate(`/members/${member.id}/edit`)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete member?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete {member.name} from your members list.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMember.mutate(member.id)}>
                              Delete
                            </AlertDialogAction>
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
    </div>
  );
};

export default Members;
