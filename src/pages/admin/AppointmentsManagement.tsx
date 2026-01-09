import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Eye, Filter } from "lucide-react";
import { format } from "date-fns";
import { SPECIALTIES, APPOINTMENT_STATUS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reason: string | null;
  notes: string | null;
  created_at: string;
  doctors?: {
    specialty: string;
    profiles?: {
      full_name: string;
      phone: string;
    };
  };
  patient?: {
    full_name: string;
    phone: string;
    email: string;
  };
}

export default function AppointmentsManagement() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, doctors(specialty, user_id)")
        .order("appointment_date", { ascending: false });

      if (error) throw error;

      // Fetch profiles for doctors and patients
      const appointmentsWithProfiles = await Promise.all(
        (data || []).map(async (apt) => {
          // Fetch doctor profile
          let doctorProfile = null;
          if (apt.doctors?.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, phone")
              .eq("user_id", apt.doctors.user_id)
              .single();
            doctorProfile = profile;
          }

          // Fetch patient profile
          const { data: patientProfile } = await supabase
            .from("profiles")
            .select("full_name, phone, email")
            .eq("user_id", apt.patient_id)
            .single();

          return {
            ...apt,
            doctors: { ...apt.doctors, profiles: doctorProfile },
            patient: patientProfile,
          };
        })
      );

      setAppointments(appointmentsWithProfiles as Appointment[]);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

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

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.patient?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.doctors?.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout title="Appointments" description="View and manage all patient appointments">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by patient or doctor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(APPOINTMENT_STATUS).map(([key, value]) => (
              <SelectItem key={key} value={key}>
                {value.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Appointments Table */}
      <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Patient</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Doctor</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Specialty</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Date & Time</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={6} className="py-4 px-6">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    No appointments found
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium">{appointment.patient?.full_name || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">{appointment.patient?.phone}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-medium">Dr. {appointment.doctors?.profiles?.full_name || "N/A"}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-muted-foreground">
                        {SPECIALTIES[appointment.doctors?.specialty as keyof typeof SPECIALTIES]?.label || "N/A"}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-medium">{format(new Date(appointment.appointment_date), "MMM d, yyyy")}</p>
                      <p className="text-sm text-muted-foreground">{appointment.appointment_time}</p>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(appointment.status)}
                    </td>
                    <td className="py-4 px-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedAppointment(appointment)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Appointment Details Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Patient</p>
                  <p className="font-medium">{selectedAppointment.patient?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedAppointment.patient?.phone}</p>
                  <p className="text-sm text-muted-foreground">{selectedAppointment.patient?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Doctor</p>
                  <p className="font-medium">Dr. {selectedAppointment.doctors?.profiles?.full_name}</p>
                  <p className="text-sm text-primary">
                    {SPECIALTIES[selectedAppointment.doctors?.specialty as keyof typeof SPECIALTIES]?.label}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(selectedAppointment.appointment_date), "MMMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">{selectedAppointment.appointment_time}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge(selectedAppointment.status)}</div>
              </div>

              {selectedAppointment.reason && (
                <div>
                  <p className="text-sm text-muted-foreground">Reason for Visit</p>
                  <p className="font-medium">{selectedAppointment.reason}</p>
                </div>
              )}

              {selectedAppointment.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="font-medium">{selectedAppointment.notes}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Booked On</p>
                <p className="font-medium">
                  {format(new Date(selectedAppointment.created_at), "MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
