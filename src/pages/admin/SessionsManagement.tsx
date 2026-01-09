import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Calendar } from "lucide-react";
import { DAYS_OF_WEEK, SPECIALTIES } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface Session {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_patients: number;
  is_active: boolean;
  doctors?: {
    specialty: string;
    profiles?: {
      full_name: string;
    };
  };
}

interface Doctor {
  id: string;
  user_id: string;
  specialty: string;
  profiles?: {
    full_name: string;
  };
}

export default function SessionsManagement() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  
  const [newSession, setNewSession] = useState({
    doctorId: "",
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "17:00",
    maxPatients: 10,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch doctors
      const { data: doctorsData } = await supabase
        .from("doctors")
        .select("id, user_id, specialty")
        .eq("is_active", true);

      // Fetch profiles for doctors
      const doctorsWithProfiles = await Promise.all(
        (doctorsData || []).map(async (doctor) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", doctor.user_id)
            .single();
          return { ...doctor, profiles: profile };
        })
      );

      setDoctors(doctorsWithProfiles as Doctor[]);

      // Fetch sessions
      const { data: sessionsData } = await supabase
        .from("doctor_sessions")
        .select("*, doctors(specialty, user_id)")
        .order("day_of_week", { ascending: true });

      // Fetch profiles for session doctors
      const sessionsWithProfiles = await Promise.all(
        (sessionsData || []).map(async (session) => {
          if (session.doctors?.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("user_id", session.doctors.user_id)
              .single();
            return {
              ...session,
              doctors: { ...session.doctors, profiles: profile },
            };
          }
          return session;
        })
      );

      setSessions(sessionsWithProfiles as Session[]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("doctor_sessions").insert({
        doctor_id: newSession.doctorId,
        day_of_week: newSession.dayOfWeek,
        start_time: newSession.startTime,
        end_time: newSession.endTime,
        max_patients: newSession.maxPatients,
      });

      if (error) throw error;

      toast.success("Session added successfully!");
      setIsDialogOpen(false);
      setNewSession({
        doctorId: "",
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "17:00",
        maxPatients: 10,
      });
      fetchData();
    } catch (error: any) {
      console.error("Error adding session:", error);
      toast.error(error.message || "Failed to add session");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return;

    try {
      const { error } = await supabase
        .from("doctor_sessions")
        .delete()
        .eq("id", sessionId);

      if (error) throw error;

      toast.success("Session deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete session");
    }
  };

  const handleToggleActive = async (sessionId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("doctor_sessions")
        .update({ is_active: !isActive })
        .eq("id", sessionId);

      if (error) throw error;

      toast.success(`Session ${isActive ? "deactivated" : "activated"}`);
      fetchData();
    } catch (error) {
      console.error("Error updating session:", error);
      toast.error("Failed to update session");
    }
  };

  const filteredSessions = selectedDoctor
    ? sessions.filter((s) => s.doctor_id === selectedDoctor)
    : sessions;

  // Group sessions by day of week
  const sessionsByDay = DAYS_OF_WEEK.map((day) => ({
    ...day,
    sessions: filteredSessions.filter((s) => s.day_of_week === day.value),
  }));

  return (
    <AdminLayout title="Session Scheduling" description="Manage doctor availability schedules">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by doctor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Doctors</SelectItem>
            {doctors.map((doctor) => (
              <SelectItem key={doctor.id} value={doctor.id}>
                Dr. {doctor.profiles?.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Session
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Session</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSession} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Doctor</Label>
                <Select
                  value={newSession.doctorId}
                  onValueChange={(v) => setNewSession({ ...newSession, doctorId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        Dr. {doctor.profiles?.full_name} - {SPECIALTIES[doctor.specialty as keyof typeof SPECIALTIES]?.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select
                  value={newSession.dayOfWeek.toString()}
                  onValueChange={(v) => setNewSession({ ...newSession, dayOfWeek: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={newSession.startTime}
                    onChange={(e) => setNewSession({ ...newSession, startTime: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={newSession.endTime}
                    onChange={(e) => setNewSession({ ...newSession, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Max Patients</Label>
                <Input
                  type="number"
                  value={newSession.maxPatients}
                  onChange={(e) => setNewSession({ ...newSession, maxPatients: parseInt(e.target.value) })}
                  min={1}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !newSession.doctorId}>
                  {isSubmitting ? "Adding..." : "Add Session"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sessions by Day */}
      <div className="space-y-6">
        {sessionsByDay.map((day) => (
          <div key={day.value} className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
            <div className="p-4 bg-muted/50 border-b border-border flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">{day.label}</h3>
              <span className="text-sm text-muted-foreground">({day.sessions.length} sessions)</span>
            </div>
            
            {day.sessions.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No sessions scheduled for {day.label}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {day.sessions.map((session) => (
                  <div key={session.id} className="p-4 flex items-center justify-between hover:bg-muted/30">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {session.doctors?.profiles?.full_name?.charAt(0) || "D"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          Dr. {session.doctors?.profiles?.full_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {SPECIALTIES[session.doctors?.specialty as keyof typeof SPECIALTIES]?.label}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-medium text-foreground">
                          {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Max {session.max_patients} patients
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Switch
                          checked={session.is_active}
                          onCheckedChange={() => handleToggleActive(session.id, session.is_active)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteSession(session.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
