import { useMembers, getMemberStatus } from "@/hooks/useMembers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, AlertTriangle } from "lucide-react";

const Dashboard = () => {
  const { membersQuery } = useMembers();
  const members = membersQuery.data ?? [];

  const total = members.length;
  const active = members.filter((m) => getMemberStatus(m.expiry_date) === "active").length;
  const expired = members.filter((m) => getMemberStatus(m.expiry_date) === "expired").length;
  const expiring = members.filter((m) => getMemberStatus(m.expiry_date) === "expiring").length;

  const stats = [
    { title: "Total Members", value: total, icon: Users, color: "text-primary" },
    { title: "Active", value: active, icon: UserCheck, color: "text-success" },
    { title: "Expired", value: expired, icon: UserX, color: "text-destructive" },
    { title: "Expiring Soon", value: expiring, icon: AlertTriangle, color: "text-warning" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your gym</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display text-card-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {membersQuery.isLoading && (
        <p className="text-muted-foreground">Loading...</p>
      )}
    </div>
  );
};

export default Dashboard;
