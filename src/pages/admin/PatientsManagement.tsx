import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Eye, Mail, Phone } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Patient {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string;
  created_at: string;
  appointments_count: number;
}

export default function PatientsManagement() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientAppointments, setPatientAppointments] = useState<any[]>([]);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      // Fetch all patient role users
      const { data: patientRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "patient");

      if (rolesError) throw rolesError;

      // Fetch profiles for patients
      const patientsWithDetails = await Promise.all(
        (patientRoles || []).map(async (role) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", role.user_id)
            .single();

          // Count appointments for this patient
          const { count } = await supabase
            .from("appointments")
            .select("*", { count: "exact", head: true })
            .eq("patient_id", role.user_id);

          return {
            ...profile,
            appointments_count: count || 0,
          };
        })
      );

      setPatients(patientsWithDetails.filter(Boolean) as Patient[]);
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  const handleViewPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    
    // Fetch patient's appointments
    try {
      const { data } = await supabase
        .from("appointments")
        .select("*, doctors(specialty, user_id)")
        .eq("patient_id", patient.user_id)
        .order("appointment_date", { ascending: false })
        .limit(10);

      // Fetch doctor profiles
      const appointmentsWithDoctors = await Promise.all(
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

      setPatientAppointments(appointmentsWithDoctors);
    } catch (error) {
      console.error("Error fetching patient appointments:", error);
    }
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phone?.includes(searchQuery)
  );

  return (
    <AdminLayout title="Patients" description="View and manage patient records">
      {/* Search */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search patients by name, email or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-6 border border-border animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-muted" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            </div>
          ))
        ) : filteredPatients.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No patients found
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <div key={patient.id} className="bg-card rounded-2xl p-6 border border-border shadow-soft card-hover">
              <div className="flex items-start gap-4">
                <Avatar className="w-14 h-14">
                  <AvatarFallback className="bg-accent/10 text-accent text-lg">
                    {patient.full_name?.charAt(0) || "P"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {patient.full_name}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <Phone className="w-3 h-3" />
                    <span>{patient.phone}</span>
                  </div>
                  {patient.email && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{patient.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Appointments</p>
                  <Badge variant="secondary" className="mt-1">
                    {patient.appointments_count} bookings
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewPatient(patient)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Patient Details Dialog */}
      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-6 mt-4">
              {/* Patient Info */}
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-accent/10 text-accent text-xl">
                    {selectedPatient.full_name?.charAt(0) || "P"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedPatient.full_name}</h3>
                  <p className="text-muted-foreground">{selectedPatient.phone}</p>
                  {selectedPatient.email && (
                    <p className="text-muted-foreground">{selectedPatient.email}</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">
                  {format(new Date(selectedPatient.created_at), "MMMM d, yyyy")}
                </p>
              </div>

              {/* Recent Appointments */}
              <div>
                <h4 className="font-semibold mb-3">Recent Appointments</h4>
                {patientAppointments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No appointments yet</p>
                ) : (
                  <div className="space-y-3">
                    {patientAppointments.map((apt) => (
                      <div key={apt.id} className="p-3 bg-muted/30 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            Dr. {apt.doctors?.profiles?.full_name || "N/A"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(apt.appointment_date), "MMM d, yyyy")} at {apt.appointment_time}
                          </p>
                        </div>
                        <Badge variant={
                          apt.status === "completed" ? "outline" :
                          apt.status === "confirmed" ? "default" :
                          apt.status === "cancelled" ? "destructive" : "secondary"
                        }>
                          {apt.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
