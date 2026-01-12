import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bell, Search, RefreshCw, Loader2, Send, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import { sendAppointmentNotification } from "@/lib/sms";
import { SPECIALTIES, APPOINTMENT_STATUS } from "@/lib/constants";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  patient_id: string;
  doctor_id: string;
  patient?: { full_name: string; phone: string };
  doctor?: { specialty: string; profile?: { full_name: string } };
}

export default function NotificationsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sendingNotification, setSendingNotification] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [notificationType, setNotificationType] = useState<string>("confirmation");

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("appointment_date", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch patient and doctor profiles
      const appointmentsWithProfiles = await Promise.all(
        (data || []).map(async (apt) => {
          const { data: patientProfile } = await supabase
            .from("profiles")
            .select("full_name, phone")
            .eq("user_id", apt.patient_id)
            .single();

          const { data: doctor } = await supabase
            .from("doctors")
            .select("specialty, user_id")
            .eq("id", apt.doctor_id)
            .single();

          let doctorProfile = null;
          if (doctor?.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("user_id", doctor.user_id)
              .single();
            doctorProfile = profile;
          }

          return {
            ...apt,
            patient: patientProfile,
            doctor: { ...doctor, profile: doctorProfile },
          };
        })
      );

      setAppointments(appointmentsWithProfiles);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!selectedAppointment) return;

    setSendingNotification(selectedAppointment.id);
    try {
      const result = await sendAppointmentNotification(
        selectedAppointment.id,
        notificationType as "confirmation" | "reminder" | "cancelled" | "completed"
      );

      if (result.success) {
        toast.success(`${notificationType} notification sent successfully!`);
      } else {
        toast.error(result.error || "Failed to send notification");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send notification");
    } finally {
      setSendingNotification(null);
      setSelectedAppointment(null);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.patient?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.patient?.phone?.includes(searchQuery) ||
      apt.doctor?.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusInfo = APPOINTMENT_STATUS[status as keyof typeof APPOINTMENT_STATUS];
    return (
      <Badge
        variant={
          status === "pending"
            ? "secondary"
            : status === "confirmed"
            ? "default"
            : status === "completed"
            ? "outline"
            : "destructive"
        }
      >
        {statusInfo?.label || status}
      </Badge>
    );
  };

  return (
    <AdminLayout title="Notifications" description="Send and manage appointment notifications">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Send className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium">Confirmations</p>
              <p className="text-sm text-muted-foreground">Send booking confirmations</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="font-medium">Reminders</p>
              <p className="text-sm text-muted-foreground">Send appointment reminders</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium">Updates</p>
              <p className="text-sm text-muted-foreground">Send status updates</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by patient or doctor name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAppointments} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No appointments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Patient</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Doctor</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date & Time</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{appointment.patient?.full_name || "N/A"}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {appointment.patient?.phone || "No phone"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-sm">Dr. {appointment.doctor?.profile?.full_name || "N/A"}</p>
                      <p className="text-xs text-muted-foreground">
                        {SPECIALTIES[appointment.doctor?.specialty as keyof typeof SPECIALTIES]?.label || "N/A"}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm">{format(new Date(appointment.appointment_date), "MMM d, yyyy")}</p>
                      <p className="text-xs text-muted-foreground">{appointment.appointment_time}</p>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(appointment.status)}</td>
                    <td className="py-3 px-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedAppointment(appointment)}
                        disabled={sendingNotification === appointment.id}
                      >
                        {sendingNotification === appointment.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-1" />
                            Notify
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Send Notification Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
            <DialogDescription>
              Send an SMS notification to {selectedAppointment?.patient?.full_name} about their appointment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Appointment Details</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Patient: {selectedAppointment?.patient?.full_name}</p>
                <p>Phone: {selectedAppointment?.patient?.phone}</p>
                <p>Doctor: Dr. {selectedAppointment?.doctor?.profile?.full_name}</p>
                <p>
                  Date: {selectedAppointment && format(new Date(selectedAppointment.appointment_date), "MMMM d, yyyy")}
                </p>
                <p>Time: {selectedAppointment?.appointment_time}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notification Type</label>
              <Select value={notificationType} onValueChange={setNotificationType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmation">Confirmation</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="cancelled">Cancellation</SelectItem>
                  <SelectItem value="completed">Completion</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAppointment(null)}>
              Cancel
            </Button>
            <Button onClick={handleSendNotification} disabled={!!sendingNotification}>
              {sendingNotification ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Notification
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
