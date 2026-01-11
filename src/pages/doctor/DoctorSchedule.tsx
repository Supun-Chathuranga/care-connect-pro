import { useEffect, useState } from "react";
import { DoctorLayout } from "@/components/doctor/DoctorLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Clock, Calendar, Users, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface Session {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_patients: number | null;
  is_active: boolean;
}

interface UpcomingSession {
  dayLabel: string;
  date: string;
  session: Session;
  appointmentCount: number;
}

export default function DoctorSchedule() {
  const { user } = useAuth();
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSchedule();
    }
  }, [user]);

  const fetchSchedule = async () => {
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

      // Fetch sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("doctor_sessions")
        .select("*")
        .eq("doctor_id", doctorData.id)
        .order("day_of_week", { ascending: true });

      if (sessionsError) throw sessionsError;
      setSessions(sessionsData || []);

      // Calculate upcoming sessions for the next 7 days
      const upcoming: UpcomingSession[] = [];
      const today = new Date();

      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dayOfWeek = date.getDay();

        const sessionForDay = sessionsData?.find(
          (s) => s.day_of_week === dayOfWeek && s.is_active
        );

        if (sessionForDay) {
          const dateStr = date.toISOString().split("T")[0];
          
          // Count appointments for this date
          const { count } = await supabase
            .from("appointments")
            .select("id", { count: "exact" })
            .eq("doctor_id", doctorData.id)
            .eq("appointment_date", dateStr)
            .in("status", ["pending", "confirmed"]);

          upcoming.push({
            dayLabel: i === 0 ? "Today" : i === 1 ? "Tomorrow" : DAYS_OF_WEEK.find((d) => d.value === dayOfWeek)?.label || "",
            date: dateStr,
            session: sessionForDay,
            appointmentCount: count || 0,
          });
        }
      }

      setUpcomingSessions(upcoming);
    } catch (error) {
      console.error("Error fetching schedule:", error);
      toast.error("Failed to load schedule");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSession = async (sessionId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("doctor_sessions")
        .update({ is_active: isActive })
        .eq("id", sessionId);

      if (error) throw error;
      toast.success(`Session ${isActive ? "activated" : "deactivated"}`);
      fetchSchedule();
    } catch (error) {
      console.error("Error updating session:", error);
      toast.error("Failed to update session");
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  if (!doctorId && !loading) {
    return (
      <DoctorLayout title="My Schedule" description="Your doctor profile is not set up">
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
    <DoctorLayout title="My Schedule" description="View and manage your availability">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Weekly Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-soft"
        >
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">Weekly Schedule</h2>
            <p className="text-sm text-muted-foreground">Your regular consultation hours</p>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                    <div className="w-20 h-10 bg-muted rounded" />
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No sessions configured</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Contact the admin to set up your schedule
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {DAYS_OF_WEEK.map((day) => {
                  const sessionsForDay = sessions.filter((s) => s.day_of_week === day.value);
                  
                  if (sessionsForDay.length === 0) {
                    return (
                      <div
                        key={day.value}
                        className="flex items-center gap-4 p-4 rounded-xl bg-muted/30"
                      >
                        <div className="w-24 font-medium text-muted-foreground">{day.label}</div>
                        <span className="text-muted-foreground text-sm">No sessions</span>
                      </div>
                    );
                  }

                  return sessionsForDay.map((session) => (
                    <div
                      key={session.id}
                      className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                        session.is_active ? "bg-primary/5 border border-primary/20" : "bg-muted/30"
                      }`}
                    >
                      <div className="w-24 font-medium text-foreground">{day.label}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {formatTime(session.start_time)} - {formatTime(session.end_time)}
                          </span>
                        </div>
                        {session.max_patients && (
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <Users className="w-3 h-3" />
                            <span>Max {session.max_patients} patients</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={session.is_active ? "default" : "secondary"}>
                          {session.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Switch
                          checked={session.is_active}
                          onCheckedChange={(checked) => handleToggleSession(session.id, checked)}
                        />
                      </div>
                    </div>
                  ));
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Upcoming Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="bg-card rounded-2xl border border-border shadow-soft p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Upcoming Sessions
            </h3>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse p-3 rounded-lg bg-muted/50">
                    <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : upcomingSessions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No upcoming sessions this week</p>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.map((upcoming, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground">{upcoming.dayLabel}</span>
                      <Badge variant="outline" className="text-xs">
                        {upcoming.appointmentCount} booked
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(upcoming.session.start_time)} - {formatTime(upcoming.session.end_time)}
                    </p>
                    {upcoming.session.max_patients && (
                      <div className="mt-2">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{
                              width: `${Math.min((upcoming.appointmentCount / upcoming.session.max_patients) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {upcoming.appointmentCount} / {upcoming.session.max_patients} slots filled
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Schedule Note */}
          <div className="bg-primary/5 rounded-2xl border border-primary/20 p-6">
            <h4 className="font-medium text-foreground mb-2">Need to change your schedule?</h4>
            <p className="text-sm text-muted-foreground">
              Contact the clinic administrator to modify your regular consultation hours or add new sessions.
            </p>
          </div>
        </motion.div>
      </div>
    </DoctorLayout>
  );
}
