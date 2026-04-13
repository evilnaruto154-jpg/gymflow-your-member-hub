import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMembers } from "@/hooks/useMembers";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addMonths, format } from "date-fns";

const plans = [
  { label: "1 Month", value: "1 month", months: 1 },
  { label: "3 Months", value: "3 months", months: 3 },
  { label: "6 Months", value: "6 months", months: 6 },
  { label: "1 Year", value: "1 year", months: 12 },
  { label: "Custom", value: "custom", months: 0 },
];

const MemberForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { membersQuery, addMember, updateMember } = useMembers();
  const { isPro, getMemberLimit } = useFeatureAccess();
  const limit = getMemberLimit();
  const membersCount = membersQuery.data?.length || 0;
  const canAdd = isEdit || membersCount < limit;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [plan, setPlan] = useState("1 month");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [expiryDate, setExpiryDate] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("unpaid");

  // Auto-calculate expiry
  useEffect(() => {
    const selected = plans.find((p) => p.value === plan);
    if (selected && selected.months > 0 && startDate) {
      setExpiryDate(format(addMonths(new Date(startDate), selected.months), "yyyy-MM-dd"));
    }
  }, [plan, startDate]);

  // Populate for edit
  useEffect(() => {
    if (isEdit && membersQuery.data) {
      const member = membersQuery.data.find((m) => m.id === id);
      if (member) {
        setName(member.name);
        setPhone(member.phone);
        setPlan(member.plan);
        setStartDate(member.start_date);
        setExpiryDate(member.expiry_date);
        setPaymentAmount(String(member.payment_amount));
        setPaymentStatus(member.payment_status);
      }
    }
  }, [isEdit, id, membersQuery.data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: name.trim(),
      phone: phone.trim(),
      plan,
      start_date: startDate,
      expiry_date: expiryDate,
      payment_amount: parseFloat(paymentAmount) || 0,
      payment_status: paymentStatus,
    };

    if (isEdit) {
      await updateMember.mutateAsync({ id, ...data });
    } else {
      await addMember.mutateAsync(data);
    }
    navigate("/members");
  };

  return (
    <div className="max-w-xl mx-auto animate-fade-in">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-display">{isEdit ? "Edit Member" : "Add New Member"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!canAdd && (
              <div className="bg-destructive/10 text-destructive border border-destructive/20 p-4 rounded-lg flex flex-col gap-2">
                <p className="font-semibold text-sm">Member Limit Reached</p>
                <p className="text-xs">Your current plan limits you to {limit} members. Please upgrade to add more members.</p>
                <Button type="button" variant="outline" className="w-fit mt-2 border-destructive text-destructive hover:bg-destructive hover:text-white" onClick={() => navigate("/subscription")}>
                  Upgrade Plan
                </Button>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+91..." maxLength={20} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Membership Plan</Label>
                <Select value={plan} onValueChange={setPlan}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start">Start Date</Label>
                <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input
                id="expiry"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
                disabled={plan !== "custom"}
              />
              {plan !== "custom" && (
                <p className="text-xs text-muted-foreground">Auto-calculated from plan</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Payment Status</Label>
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={!canAdd || addMember.isPending || updateMember.isPending}>
                {isEdit ? "Update Member" : "Add Member"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate("/members")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MemberForm;
