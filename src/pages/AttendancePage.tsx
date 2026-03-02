import { useState } from "react";
import { FeatureGate } from "@/components/FeatureGate";
import { useAttendance } from "@/hooks/useAttendance";
import { useMembers } from "@/hooks/useMembers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserCheck, CalendarCheck } from "lucide-react";
import { format } from "date-fns";

const AttendancePage = () => {
  const { attendanceQuery, checkIn } = useAttendance();
  const { membersQuery } = useMembers();
  const [selectedMember, setSelectedMember] = useState("");

  const members = membersQuery.data ?? [];
  const records = attendanceQuery.data ?? [];

  const todayCount = records.filter(
    (r) => r.check_in_date === format(new Date(), "yyyy-MM-dd")
  ).length;

  const handleCheckIn = () => {
    if (selectedMember) {
      checkIn.mutate(selectedMember);
      setSelectedMember("");
    }
  };

  const getMemberName = (memberId: string) =>
    members.find((m) => m.id === memberId)?.name ?? "Unknown";

  return (
    <FeatureGate feature="attendance">
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Attendance</h1>
          <p className="text-muted-foreground">Track daily gym check-ins</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today's Check-ins</CardTitle>
              <CalendarCheck className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-display text-card-foreground">{todayCount}</div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Quick Check-in</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleCheckIn} disabled={!selectedMember || checkIn.isPending}>
                <UserCheck className="h-4 w-4 mr-1" /> Check In
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Member</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    No attendance records yet
                  </TableCell>
                </TableRow>
              )}
              {records.slice(0, 50).map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium text-foreground">{getMemberName(record.member_id)}</TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(record.check_in_date), "dd MMM yyyy")}</TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(record.created_at), "hh:mm a")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </FeatureGate>
  );
};

export default AttendancePage;
