import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatsCard } from "@/components/admin/StatsCard";
import { supabase } from "@/integrations/supabase/client";
import { Users, Stethoscope, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { SPECIALTIES, APPOINTMENT_STATUS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalPatients: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch doctors count
      const { count: doctorsCount } = await supabase
        .from("doctors")
        .select("*", { count: "exact", head: true });

      // Fetch patients count
      const { count: patientsCount } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "patient");

      // Fetch appointments count
      const { count: appointmentsCount } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true });

      // Fetch pending appointments count
      const { count: pendingCount } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Fetch recent appointments
      const { data: appointments } = await supabase
        .from("appointments")
        .select("*, doctors(specialty, user_id)")
        .order("created_at", { ascending: false })
        .limit(5);

      // Fetch profiles for recent appointments
      const appointmentsWithProfiles = await Promise.all(
        (appointments || []).map(async (apt) => {
          let doctorProfile = null;
          if (apt.doctors?.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("user_id", apt.doctors.user_id)
              .single();
            doctorProfile = profile;
          }

          const { data: patientProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", apt.patient_id)
            .single();

          return {
            ...apt,
            doctors: { ...apt.doctors, profiles: doctorProfile },
            patient: patientProfile,
          };
        })
      );

      setStats({
        totalDoctors: doctorsCount || 0,
        totalPatients: patientsCount || 0,
        totalAppointments: appointmentsCount || 0,
        pendingAppointments: pendingCount || 0,
      });

      setRecentAppointments(appointmentsWithProfiles);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = APPOINTMENT_STATUS[status as keyof typeof APPOINTMENT_STATUS];
    return (
      <Badge variant={status === "pending" ? "secondary" : status === "confirmed" ? "default" : "destructive"}>
        {statusInfo?.label || status}
      </Badge>
    );
  };

  return (
    <AdminLayout title="Dashboard" description="Welcome back! Here's an overview of your clinic.">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Doctors"
          value={stats.totalDoctors}
          icon={Stethoscope}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Total Patients"
          value={stats.totalPatients}
          icon={Users}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Total Appointments"
          value={stats.totalAppointments}
          icon={Calendar}
        />
        <StatsCard
          title="Pending Requests"
          value={stats.pendingAppointments}
          icon={Clock}
        />
      </div>

      {/* Recent Appointments */}
      <div className="bg-card rounded-2xl border border-border shadow-soft">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Recent Appointments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Patient</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Doctor</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Specialty</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Date & Time</th>
                <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentAppointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No appointments yet
                  </td>
                </tr>
              ) : (
                recentAppointments.map((appointment) => (
                  <tr key={appointment.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="py-4 px-6">
                      <p className="font-medium">{appointment.patient?.full_name || "N/A"}</p>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
