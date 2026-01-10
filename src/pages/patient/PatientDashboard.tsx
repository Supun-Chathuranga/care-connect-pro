import { useEffect, useState } from "react";
import { PatientLayout } from "@/components/patient/PatientLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { SPECIALTIES, APPOINTMENT_STATUS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, Clock, Search, ArrowRight, Stethoscope } from "lucide-react";
import { motion } from "framer-motion";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reason: string | null;
  doctors?: {
    specialty: string;
    consultation_fee: number;
    profiles?: {
      full_name: string;
    };
  };
}

export default function PatientDashboard() {
  const { user, profile } = useAuth();
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUpcomingAppointments();
    }
  }, [user]);

  const fetchUpcomingAppointments = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("appointments")
        .select("*, doctors(specialty, consultation_fee, user_id)")
        .eq("patient_id", user?.id)
        .gte("appointment_date", today)
        .in("status", ["pending", "confirmed"])
        .order("appointment_date", { ascending: true })
        .limit(5);

      if (error) throw error;

      // Fetch doctor profiles
      const appointmentsWithProfiles = await Promise.all(
        (data || []).map(async (apt) => {
          if (apt.doctors?.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("user_id", apt.doctors.user_id)
              .single();
            return { ...apt, doctors: { ...apt.doctors, profiles: profile } };
          }
          return apt;
        })
      );

      setUpcomingAppointments(appointmentsWithProfiles);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, MMM d");
  };

  return (
    <PatientLayout title={`Welcome, ${profile?.full_name?.split(" ")[0] || "Patient"}!`} description="Manage your health appointments">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Quick Actions & Appointments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid sm:grid-cols-2 gap-4"
          >
            <Link to="/patient/doctors">
              <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground card-hover">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Find a Doctor</h3>
                <p className="text-primary-foreground/80 text-sm">
                  Browse our specialist doctors and book an appointment
                </p>
                <ArrowRight className="w-5 h-5 mt-4" />
              </div>
            </Link>
            
            <Link to="/patient/appointments">
              <div className="bg-gradient-to-br from-accent to-accent/80 rounded-2xl p-6 text-accent-foreground card-hover">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg mb-1">My Appointments</h3>
                <p className="text-accent-foreground/80 text-sm">
                  View and manage your upcoming appointments
                </p>
                <ArrowRight className="w-5 h-5 mt-4" />
              </div>
            </Link>
          </motion.div>

          {/* Upcoming Appointments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl border border-border shadow-soft"
          >
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Upcoming Appointments</h2>
                <p className="text-sm text-muted-foreground">Your scheduled visits</p>
              </div>
              <Link to="/patient/appointments">
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
                    <div key={i} className="animate-pulse flex items-center gap-4">
                      <div className="w-16 h-16 bg-muted rounded-xl" />
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                        <div className="h-3 bg-muted rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : upcomingAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-4">No upcoming appointments</p>
                  <Link to="/patient/doctors">
                    <Button>Book an Appointment</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="w-16 h-16 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
                        <span className="text-xs text-primary font-medium">
                          {format(new Date(apt.appointment_date), "MMM")}
                        </span>
                        <span className="text-xl font-bold text-primary">
                          {format(new Date(apt.appointment_date), "d")}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">
                          Dr. {apt.doctors?.profiles?.full_name}
                        </p>
                        <p className="text-sm text-primary">
                          {SPECIALTIES[apt.doctors?.specialty as keyof typeof SPECIALTIES]?.label}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {getDateLabel(apt.appointment_date)} at {apt.appointment_time}
                          </span>
                        </div>
                      </div>
                      <Badge variant={apt.status === "confirmed" ? "default" : "secondary"}>
                        {APPOINTMENT_STATUS[apt.status as keyof typeof APPOINTMENT_STATUS]?.label}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column - Specialties */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div className="bg-card rounded-2xl border border-border shadow-soft p-6">
            <h3 className="font-semibold text-foreground mb-4">Browse by Specialty</h3>
            <div className="space-y-2">
              {Object.entries(SPECIALTIES).slice(0, 6).map(([key, value]) => (
                <Link
                  key={key}
                  to={`/patient/doctors?specialty=${key}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{value.label}</span>
                </Link>
              ))}
            </div>
            <Link to="/patient/doctors" className="block mt-4">
              <Button variant="outline" className="w-full">
                View All Specialties
              </Button>
            </Link>
          </div>

          {/* Health Tips */}
          <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-2xl border border-success/20 p-6">
            <h3 className="font-semibold text-foreground mb-2">Health Tip of the Day</h3>
            <p className="text-sm text-muted-foreground">
              Regular health check-ups can help detect potential health issues before they become a problem.
              Book your preventive care appointment today!
            </p>
          </div>
        </motion.div>
      </div>
    </PatientLayout>
  );
}
