import { useEffect, useState } from "react";
import { DoctorLayout } from "@/components/doctor/DoctorLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { APPOINTMENT_STATUS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar, Clock, Phone, Search, CheckCircle, XCircle, FileText, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reason: string | null;
  notes: string | null;
  patient_id: string;
  patient?: {
    full_name: string;
    phone: string;
    email: string | null;
  };
}

export default function DoctorAppointments() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDoctorAndAppointments();
    }
  }, [user]);

  const fetchDoctorAndAppointments = async () => {
    try {
      // Get doctor record
      const { data: doctorData, error: doctorError } = await supabase
        .from("doctors")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (doctorError) throw doctorError;
      if (!doctorData) {
        setLoading(false);
        return;
      }

      setDoctorId(doctorData.id);

      // Fetch all appointments
      const { data: aptsData, error: aptsError } = await supabase
        .from("appointments")
        .select("*")
        .eq("doctor_id", doctorData.id)
        .order("appointment_date", { ascending: false })
        .order("appointment_time", { ascending: true });

      if (aptsError) throw aptsError;

      // Fetch patient profiles
      const aptsWithPatients = await Promise.all(
        (aptsData || []).map(async (apt) => {
          const { data: patientProfile } = await supabase
            .from("profiles")
            .select("full_name, phone, email")
            .eq("user_id", apt.patient_id)
            .maybeSingle();
          return { ...apt, patient: patientProfile };
        })
      );

      setAppointments(aptsWithPatients);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appointmentId: string, newStatus: "pending" | "confirmed" | "cancelled" | "completed") => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: newStatus })
        .eq("id", appointmentId);

      if (error) throw error;
      toast.success(`Appointment ${newStatus}`);
      fetchDoctorAndAppointments();
    } catch (error) {
      console.error("Error updating appointment:", error);
      toast.error("Failed to update appointment");
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedAppointment) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("appointments")
        .update({ notes })
        .eq("id", selectedAppointment.id);

      if (error) throw error;
      toast.success("Notes saved successfully");
      setSelectedAppointment(null);
      fetchDoctorAndAppointments();
    } catch (error) {
      console.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    } finally {
      setIsSaving(false);
    }
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, MMM d");
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.patient?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.patient?.phone?.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const upcomingAppointments = filteredAppointments.filter(
    (apt) =>
      !isPast(new Date(`${apt.appointment_date}T${apt.appointment_time}`)) &&
      apt.status !== "cancelled" &&
      apt.status !== "completed"
  );

  const pastAppointments = filteredAppointments.filter(
    (apt) =>
      isPast(new Date(`${apt.appointment_date}T${apt.appointment_time}`)) ||
      apt.status === "completed" ||
      apt.status === "cancelled"
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "default",
      cancelled: "destructive",
      completed: "outline",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {APPOINTMENT_STATUS[status as keyof typeof APPOINTMENT_STATUS]?.label || status}
      </Badge>
    );
  };

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-4 hover:shadow-soft transition-shadow"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
            <span className="text-xs text-primary font-medium">
              {format(new Date(appointment.appointment_date), "MMM")}
            </span>
            <span className="text-lg font-bold text-primary">
              {format(new Date(appointment.appointment_date), "d")}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground">{appointment.patient?.full_name || "Unknown Patient"}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Clock className="w-3 h-3" />
              <span>{getDateLabel(appointment.appointment_date)} at {appointment.appointment_time}</span>
            </div>
            {appointment.patient?.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-3 h-3" />
                <span>{appointment.patient.phone}</span>
              </div>
            )}
            {appointment.reason && (
              <p className="text-sm text-muted-foreground mt-2 bg-muted/50 rounded px-2 py-1">
                {appointment.reason}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:flex-col sm:items-end">
          {getStatusBadge(appointment.status)}
          <div className="flex gap-2 mt-2">
            {appointment.status === "pending" && (
              <>
                <Button size="sm" onClick={() => handleUpdateStatus(appointment.id, "confirmed")}>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Confirm
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(appointment.id, "cancelled")}>
                  <XCircle className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              </>
            )}
            {appointment.status === "confirmed" && (
              <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(appointment.id, "completed")}>
                <CheckCircle className="w-3 h-3 mr-1" />
                Complete
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedAppointment(appointment);
                setNotes(appointment.notes || "");
              }}
            >
              <FileText className="w-3 h-3 mr-1" />
              Notes
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <DoctorLayout title="Appointments" description="Manage your patient appointments">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by patient name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
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
      </div>

      {/* Appointments Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming">Upcoming ({upcomingAppointments.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastAppointments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-xl p-4 border border-border animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-muted rounded-xl" />
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No Upcoming Appointments</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all"
                  ? "No appointments match your filters"
                  : "You don't have any scheduled appointments"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((apt) => (
                <AppointmentCard key={apt.id} appointment={apt} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-card rounded-xl p-4 border border-border animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-muted rounded-xl" />
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : pastAppointments.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">No Past Appointments</h3>
              <p className="text-muted-foreground">Your appointment history will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pastAppointments.map((apt) => (
                <AppointmentCard key={apt.id} appointment={apt} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Notes Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appointment Notes</DialogTitle>
            <DialogDescription>
              {selectedAppointment?.patient?.full_name} - {selectedAppointment?.appointment_date} at {selectedAppointment?.appointment_time}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedAppointment?.reason && (
              <div>
                <Label className="text-muted-foreground">Patient's Reason</Label>
                <p className="text-sm mt-1 p-3 bg-muted/50 rounded-lg">{selectedAppointment.reason}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Doctor's Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your notes about this appointment..."
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAppointment(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Notes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DoctorLayout>
  );
}
