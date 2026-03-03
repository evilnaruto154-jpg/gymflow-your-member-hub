import { useMemo } from "react";
import { Member, getMemberStatus } from "@/hooks/useMembers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, UserX, Clock, ShieldCheck } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface DashboardAlertsProps {
  members: Member[];
}

export function DashboardAlerts({ members }: DashboardAlertsProps) {
  const { profile, isActive, isTrialing, trialExpired } = useProfile();
  const navigate = useNavigate();

  const { expiringToday, expiringIn3Days, expired } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in3Days = new Date(today);
    in3Days.setDate(in3Days.getDate() + 3);

    let expiringToday = 0;
    let expiringIn3Days = 0;
    let expired = 0;

    members.forEach((m) => {
      const exp = new Date(m.expiry_date);
      exp.setHours(0, 0, 0, 0);

      if (exp < today) {
        expired++;
      } else if (exp.getTime() === today.getTime()) {
        expiringToday++;
      } else if (exp <= in3Days) {
        expiringIn3Days++;
      }
    });

    return { expiringToday, expiringIn3Days, expired };
  }, [members]);

  const subStatus = isActive
    ? { label: "Active", color: "bg-success/15 text-success border-success/30", icon: ShieldCheck }
    : trialExpired
      ? { label: "Expired", color: "bg-destructive/15 text-destructive border-destructive/30", icon: AlertTriangle }
      : isTrialing
        ? { label: "Trial", color: "bg-warning/15 text-warning border-warning/30", icon: Clock }
        : { label: "Expired", color: "bg-destructive/15 text-destructive border-destructive/30", icon: AlertTriangle };

  const alerts = [
    {
      title: "Expiring Today",
      count: expiringToday,
      icon: Clock,
      color: "text-warning",
      bg: "bg-warning/10 border-warning/20",
    },
    {
      title: "Expiring in 3 Days",
      count: expiringIn3Days,
      icon: AlertTriangle,
      color: "text-amber-500",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Expired Members",
      count: expired,
      icon: UserX,
      color: "text-destructive",
      bg: "bg-destructive/10 border-destructive/20",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Subscription Status */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <subStatus.icon className={`h-4 w-4 ${subStatus.color.includes("success") ? "text-success" : subStatus.color.includes("warning") ? "text-warning" : "text-destructive"}`} />
            Subscription
          </CardTitle>
          <Badge variant="outline" className={subStatus.color}>{subStatus.label}</Badge>
        </CardHeader>
      </Card>

      {/* Member Alerts Grid */}
      <div className="grid grid-cols-3 gap-3">
        {alerts.map((a) => (
          <Card key={a.title} className={`border ${a.bg} cursor-pointer transition-all hover:scale-[1.02]`} onClick={() => navigate("/members")}>
            <CardContent className="p-4 text-center">
              <a.icon className={`h-5 w-5 mx-auto mb-1 ${a.color}`} />
              <p className={`text-2xl font-bold font-display ${a.color}`}>{a.count}</p>
              <p className="text-xs text-muted-foreground mt-1">{a.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {(expired > 0 || expiringToday > 0) && (
        <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/members")}>
          View Members →
        </Button>
      )}
    </div>
  );
}
