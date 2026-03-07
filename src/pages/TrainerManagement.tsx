import { useState } from "react";
import { useTrainers, Trainer } from "@/hooks/useTrainers";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  UserPlus,
  Shield,
  ShieldOff,
  KeyRound,
  Edit,
  Users,
  Phone,
  Mail,
  Crown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const TrainerManagement = () => {
  const { trainers, activeTrainers, createTrainer, toggleStatus, resetPassword, updateTrainer } =
    useTrainers();
  const { profile } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [addOpen, setAddOpen] = useState(false);
  const [editTrainer, setEditTrainer] = useState<Trainer | null>(null);
  const [resetTrainer, setResetTrainer] = useState<Trainer | null>(null);

  // Add form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  // Reset password state
  const [newPassword, setNewPassword] = useState("");

  const isPro =
    profile?.subscription_plan?.includes("pro") || false;

  if (!isPro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
        <div className="rounded-full bg-primary/10 p-6">
          <Crown className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-xl font-bold font-display text-foreground">
          Pro Plan Feature
        </h2>
        <p className="text-muted-foreground text-center max-w-md">
          Trainer Management is available exclusively in the Pro Plan. Upgrade to
          create trainer accounts, manage staff access, and streamline your gym
          operations.
        </p>
        <Button onClick={() => navigate("/subscription")}>Upgrade to Pro</Button>
      </div>
    );
  }

  const handleAddTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTrainer.mutateAsync({
        trainer_name: name,
        trainer_email: email,
        phone,
        password,
      });
      toast({ title: "✅ Trainer Added", description: `${name} has been added successfully.` });
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setAddOpen(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to add trainer",
        variant: "destructive",
      });
    }
  };

  const handleEditTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTrainer) return;
    try {
      await updateTrainer.mutateAsync({
        id: editTrainer.id,
        trainer_name: editName,
        phone: editPhone,
      });
      toast({ title: "✅ Updated", description: "Trainer details updated." });
      setEditTrainer(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleToggleStatus = async (trainer: Trainer) => {
    const newStatus = trainer.status === "active" ? "inactive" : "active";
    try {
      await toggleStatus.mutateAsync({ trainer_id: trainer.id, new_status: newStatus });
      toast({
        title: newStatus === "active" ? "✅ Activated" : "⚠️ Deactivated",
        description: `${trainer.trainer_name} is now ${newStatus}.`,
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTrainer?.auth_user_id) return;
    try {
      await resetPassword.mutateAsync({
        auth_user_id: resetTrainer.auth_user_id,
        new_password: newPassword,
      });
      toast({ title: "✅ Password Reset", description: "Trainer password has been updated." });
      setNewPassword("");
      setResetTrainer(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const openEdit = (t: Trainer) => {
    setEditName(t.trainer_name);
    setEditPhone(t.phone);
    setEditTrainer(t);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Trainer Management
          </h1>
          <p className="text-muted-foreground">
            Manage your gym trainers and staff access
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Trainer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Trainer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddTrainer} className="space-y-4">
              <div className="space-y-2">
                <Label>Trainer Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email (Login ID)</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trainer@gym.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createTrainer.isPending}
              >
                {createTrainer.isPending ? "Creating..." : "Create Trainer Account"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Trainers
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-card-foreground">
              {trainers.length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Active Trainers
            </CardTitle>
            <Shield className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-success">
              {activeTrainers.length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Inactive
            </CardTitle>
            <ShieldOff className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-destructive">
              {trainers.length - activeTrainers.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trainer List */}
      {trainers.length === 0 ? (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">
              No trainers yet
            </h3>
            <p className="text-muted-foreground text-sm">
              Add your first trainer to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trainers.map((trainer) => (
            <Card
              key={trainer.id}
              className={`border-border bg-card transition-all ${
                trainer.status === "inactive" ? "opacity-60" : ""
              }`}
            >
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">
                      {trainer.trainer_name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <Mail className="h-3 w-3" />
                      {trainer.trainer_email}
                    </div>
                    {trainer.phone && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {trainer.phone}
                      </div>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      trainer.status === "active"
                        ? "bg-success/15 text-success border-success/30"
                        : "bg-destructive/15 text-destructive border-destructive/30"
                    }
                  >
                    {trainer.status}
                  </Badge>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(trainer)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(trainer)}
                    disabled={toggleStatus.isPending}
                  >
                    {trainer.status === "active" ? (
                      <>
                        <ShieldOff className="h-3 w-3 mr-1" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Shield className="h-3 w-3 mr-1" />
                        Activate
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewPassword("");
                      setResetTrainer(trainer);
                    }}
                  >
                    <KeyRound className="h-3 w-3 mr-1" />
                    Reset Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog
        open={!!editTrainer}
        onOpenChange={(open) => !open && setEditTrainer(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Trainer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditTrainer} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={updateTrainer.isPending}
            >
              {updateTrainer.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={!!resetTrainer}
        onOpenChange={(open) => !open && setResetTrainer(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Reset Password — {resetTrainer?.trainer_name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={resetPassword.isPending}
            >
              {resetPassword.isPending ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainerManagement;
