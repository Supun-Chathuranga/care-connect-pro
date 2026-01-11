import { useEffect, useState } from "react";
import { DoctorLayout } from "@/components/doctor/DoctorLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, isToday, startOfToday, endOfToday } from "date-fns";
import { APPOINTMENT_STATUS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, Clock, Users, CheckCircle, ArrowRight, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface DoctorRecord {
  id: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reason: string | null;
  patient?: {
    full_name: string;
    phone: string;
  };
}

interface Stats {
  todayAppointments: number;
  pendingAppointments: number;
  completedThisMonth: number;
  totalPatients: number;
}

export default function DoctorDashboard() {
  const { user, profile } = useAuth();
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [todaysAppointments, setTodaysAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<Stats>({
    todayAppointments: 0,
    pendingAppointments: 0,
    completedThisMonth: 0,
    totalPatients: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDoctorData();
    }
  }, [user]);

  const fetchDoctorData = async () => {
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

      const today = format(new Date(), "yyyy-MM-dd");
      const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");

      // Fetch today's appointments
      const { data: todayApts, error: todayError } = await supabase
        .from("appointments")
        .select("*")
        .eq("doctor_id", doctorData.id)
        .eq("appointment_date", today)
        .in("status", ["pending", "confirmed"])
        .order("appointment_time", { ascending: true });

      if (todayError) throw todayError;

      // Fetch patient profiles for today's appointments
      const aptsWithPatients = await Promise.all(
        (todayApts || []).map(async (apt) => {
          const { data: patientProfile } = await supabase
            .from("profiles")
            .select("full_name, phone")
            .eq("user_id", apt.patient_id)
            .maybeSingle();
          return { ...apt, patient: patientProfile };
        })
      );

      setTodaysAppointments(aptsWithPatients);

      // Fetch stats
      const [pendingResult, completedResult, patientsResult] = await Promise.all([
        supabase
          .from("appointments")
          .select("id", { count: "exact" })
          .eq("doctor_id", doctorData.id)
          .eq("status", "pending"),
        supabase
          .from("appointments")
          .select("id", { count: "exact" })
          .eq("doctor_id", doctorData.id)
          .eq("status", "completed")
          .gte("appointment_date", monthStart),
        supabase
          .from("appointments")
          .select("patient_id")
          .eq("doctor_id", doctorData.id),
      ]);

      const uniquePatients = new Set(patientsResult.data?.map((a) => a.patient_id) || []);

      setStats({
        todayAppointments: aptsWithPatients.length,
        pendingAppointments: pendingResult.count || 0,
        completedThisMonth: completedResult.count || 0,
        totalPatients: uniquePatients.size,
      });
    } catch (error) {
      console.error("Error fetching doctor data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "confirmed" })
        .eq("id", appointmentId);

      if (error) throw error;
      toast.success("Appointment confirmed");
      fetchDoctorData();
    } catch (error) {
      console.error("Error confirming appointment:", error);
      toast.error("Failed to confirm appointment");
    }
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "completed" })
        .eq("id", appointmentId);

      if (error) throw error;
      toast.success("Appointment marked as completed");
      fetchDoctorData();
    } catch (error) {
      console.error("Error completing appointment:", error);
      toast.error("Failed to complete appointment");
    }
  };

  const statsCards = [
    {
      title: "Today's Appointments",
      value: stats.todayAppointments,
      icon: Calendar,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Pending Confirmation",
      value: stats.pendingAppointments,
      icon: AlertCircle,
      color: "bg-warning/10 text-warning",
    },
    {
      title: "Completed This Month",
      value: stats.completedThisMonth,
      icon: CheckCircle,
      color: "bg-success/10 text-success",
    },
    {
      title: "Total Patients",
      value: stats.totalPatients,
      icon: Users,
      color: "bg-accent/10 text-accent-foreground",
    },
  ];

  if (!doctorId && !loading) {
    return (
      <DoctorLayout title="Doctor Dashboard" description="Your account is not set up as a doctor">
        <div className="text-center py-12 bg-card rounded-2xl border border-border">
          <AlertCircle className="w-12 h-12 text-warning mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Doctor Profile Not Found</h3>
          <p className="text-muted-foreground">
            Please contact the administrator to set up your doctor profile.
          </p>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout 
      title={`Good ${new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"}, Dr. ${profile?.full_name?.split(" ")[0] || "Doctor"}!`} 
      description="Here's your schedule for today"
    >
      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card rounded-2xl border border-border shadow-soft p-6"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Today's Appointments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-soft"
        >
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Today's Appointments</h2>
              <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
            </div>
            <Link to="/doctor/appointments">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                    <div className="w-12 h-12 bg-muted rounded-xl" />
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : todaysAppointments.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No appointments scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todaysAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{apt.patient?.full_name || "Unknown Patient"}</p>
                      <p className="text-sm text-muted-foreground">{apt.appointment_time}</p>
                      {apt.reason && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{apt.reason}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={apt.status === "confirmed" ? "default" : "secondary"}>
                        {APPOINTMENT_STATUS[apt.status as keyof typeof APPOINTMENT_STATUS]?.label}
                      </Badge>
                      {apt.status === "pending" && (
                        <Button size="sm" onClick={() => handleConfirmAppointment(apt.id)}>
                          Confirm
                        </Button>
                      )}
                      {apt.status === "confirmed" && (
                        <Button size="sm" variant="outline" onClick={() => handleCompleteAppointment(apt.id)}>
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <div className="bg-card rounded-2xl border border-border shadow-soft p-6">
            <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link to="/doctor/appointments" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Manage Appointments
                </Button>
              </Link>
              <Link to="/doctor/schedule" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="w-4 h-4 mr-2" />
                  View My Schedule
                </Button>
              </Link>
              <Link to="/doctor/profile" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Update Profile
                </Button>
              </Link>
            </div>
          </div>

          {/* Pending Actions Alert */}
          {stats.pendingAppointments > 0 && (
            <div className="bg-warning/10 rounded-2xl border border-warning/20 p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground">Pending Confirmations</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    You have {stats.pendingAppointments} appointment{stats.pendingAppointments > 1 ? "s" : ""} waiting for confirmation.
                  </p>
                  <Link to="/doctor/appointments?status=pending" className="text-sm text-primary font-medium mt-2 inline-block">
                    Review now →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </DoctorLayout>
  );
}
