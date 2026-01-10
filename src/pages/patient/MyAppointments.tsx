import { useEffect, useState } from "react";
import { PatientLayout } from "@/components/patient/PatientLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, isPast, isToday } from "date-fns";
import { SPECIALTIES, APPOINTMENT_STATUS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Calendar, Clock, Phone, X, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reason: string | null;
  notes: string | null;
  created_at: string;
  doctors?: {
    specialty: string;
    consultation_fee: number;
    qualification: string;
    profiles?: {
      full_name: string;
      phone: string;
    };
  };
}

export default function MyAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, doctors(specialty, consultation_fee, qualification, user_id)")
        .eq("patient_id", user?.id)
        .order("appointment_date", { ascending: false });

      if (error) throw error;

      // Fetch doctor profiles
      const appointmentsWithProfiles = await Promise.all(
        (data || []).map(async (apt) => {
          if (apt.doctors?.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, phone")
              .eq("user_id", apt.doctors.user_id)
              .single();
            return { ...apt, doctors: { ...apt.doctors, profiles: profile } };
          }
          return apt;
        })
      );

      setAppointments(appointmentsWithProfiles);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!appointmentToCancel) return;

    setCancellingId(appointmentToCancel.id);

    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", appointmentToCancel.id);

      if (error) throw error;

      toast.success("Appointment cancelled successfully");
      fetchAppointments();
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast.error("Failed to cancel appointment");
    } finally {
      setCancellingId(null);
      setAppointmentToCancel(null);
    }
  };

  const upcomingAppointments = appointments.filter(
    (apt) =>
      !isPast(new Date(`${apt.appointment_date}T${apt.appointment_time}`)) &&
      apt.status !== "cancelled" &&
      apt.status !== "completed"
  );

  const pastAppointments = appointments.filter(
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

  const AppointmentCard = ({ appointment, showCancel = false }: { appointment: Appointment; showCancel?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border shadow-soft p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
            <span className="text-xs text-primary font-medium">
              {format(new Date(appointment.appointment_date), "MMM")}
            </span>
            <span className="text-xl font-bold text-primary">
              {format(new Date(appointment.appointment_date), "d")}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              Dr. {appointment.doctors?.profiles?.full_name}
            </h3>
            <p className="text-sm text-primary">
              {SPECIALTIES[appointment.doctors?.specialty as keyof typeof SPECIALTIES]?.label}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {appointment.doctors?.qualification}
            </p>
          </div>
        </div>
        {getStatusBadge(appointment.status)}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span>{format(new Date(appointment.appointment_date), "EEEE, MMMM d, yyyy")}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>{appointment.appointment_time}</span>
        </div>
        {appointment.doctors?.profiles?.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span>{appointment.doctors.profiles.phone}</span>
          </div>
        )}
        <div className="text-sm">
          <span className="text-muted-foreground">Fee: </span>
          <span className="font-medium">LKR {appointment.doctors?.consultation_fee}</span>
        </div>
      </div>

      {appointment.reason && (
        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Reason for visit</p>
          <p className="text-sm">{appointment.reason}</p>
        </div>
      )}

      {showCancel && appointment.status !== "cancelled" && (
        <div className="flex justify-end">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setAppointmentToCancel(appointment)}
            disabled={cancellingId === appointment.id}
          >
            <X className="w-4 h-4 mr-1" />
            Cancel Appointment
          </Button>
        </div>
      )}
    </motion.div>
  );

  return (
    <PatientLayout title="My Appointments" description="View and manage your medical appointments">
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastAppointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-2xl p-6 border border-border animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-muted rounded-xl" />
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">No Upcoming Appointments</h3>
              <p className="text-muted-foreground mb-4">You don't have any scheduled appointments</p>
              <Button onClick={() => window.location.href = "/patient/doctors"}>
                Book an Appointment
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((apt) => (
                <AppointmentCard key={apt.id} appointment={apt} showCancel />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-card rounded-2xl p-6 border border-border animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-muted rounded-xl" />
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : pastAppointments.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
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

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={!!appointmentToCancel} onOpenChange={() => setAppointmentToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Cancel Appointment
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your appointment with Dr.{" "}
              {appointmentToCancel?.doctors?.profiles?.full_name} on{" "}
              {appointmentToCancel && format(new Date(appointmentToCancel.appointment_date), "MMMM d, yyyy")}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelAppointment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PatientLayout>
  );
}
