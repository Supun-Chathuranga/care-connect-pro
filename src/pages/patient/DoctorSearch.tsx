import { useEffect, useState } from "react";
import { PatientLayout } from "@/components/patient/PatientLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SPECIALTIES, DAYS_OF_WEEK, Specialty } from "@/lib/constants";
import { Search, Star, Clock, MapPin, Calendar } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";

interface Doctor {
  id: string;
  user_id: string;
  specialty: Specialty;
  qualification: string;
  experience_years: number | null;
  consultation_fee: number | null;
  bio: string | null;
  is_active: boolean;
  profiles?: {
    full_name: string;
    phone: string;
  };
  sessions?: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
  }[];
}

export default function DoctorSearch() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams] = useSearchParams();
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(
    searchParams.get("specialty") || "all"
  );
  const navigate = useNavigate();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("is_active", true)
        .order("experience_years", { ascending: false });

      if (error) throw error;

      // Fetch profiles and sessions for each doctor
      const doctorsWithDetails = await Promise.all(
        (data || []).map(async (doctor) => {
          const [profileResult, sessionsResult] = await Promise.all([
            supabase
              .from("profiles")
              .select("full_name, phone")
              .eq("user_id", doctor.user_id)
              .single(),
            supabase
              .from("doctor_sessions")
              .select("day_of_week, start_time, end_time, is_active")
              .eq("doctor_id", doctor.id)
              .eq("is_active", true),
          ]);

          return {
            ...doctor,
            profiles: profileResult.data,
            sessions: sessionsResult.data || [],
          };
        })
      );

      setDoctors(doctorsWithDetails as Doctor[]);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch =
      doctor.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      SPECIALTIES[doctor.specialty]?.label.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === "all" || doctor.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  const getAvailableDays = (sessions: Doctor["sessions"]) => {
    if (!sessions || sessions.length === 0) return "No sessions available";
    const days = [...new Set(sessions.map((s) => s.day_of_week))].sort();
    return days.map((d) => DAYS_OF_WEEK.find((day) => day.value === d)?.short).join(", ");
  };

  return (
    <PatientLayout title="Find a Doctor" description="Browse and book appointments with our specialists">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by doctor name or specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="All Specialties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specialties</SelectItem>
            {Object.entries(SPECIALTIES).map(([key, value]) => (
              <SelectItem key={key} value={key}>
                {value.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Doctors Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-6 border border-border animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-muted" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-muted rounded w-full mb-2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          ))
        ) : filteredDoctors.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No doctors found matching your criteria</p>
          </div>
        ) : (
          filteredDoctors.map((doctor, index) => (
            <motion.div
              key={doctor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-2xl p-6 border border-border shadow-soft card-hover"
            >
              <div className="flex items-start gap-4 mb-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {doctor.profiles?.full_name?.charAt(0) || "D"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    Dr. {doctor.profiles?.full_name}
                  </h3>
                  <Badge variant="secondary" className="mt-1">
                    {SPECIALTIES[doctor.specialty]?.label}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {doctor.qualification}
                  </p>
                </div>
              </div>

              {doctor.bio && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {doctor.bio}
                </p>
              )}

              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Star className="w-4 h-4 text-warning" />
                  <span>{doctor.experience_years || 0} years experience</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Available: {getAvailableDays(doctor.sessions)}</span>
                </div>
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <span className="text-lg">LKR {doctor.consultation_fee || 0}</span>
                  <span className="text-muted-foreground text-xs">per consultation</span>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => navigate(`/patient/book/${doctor.id}`)}
                disabled={!doctor.sessions || doctor.sessions.length === 0}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Book Appointment
              </Button>
            </motion.div>
          ))
        )}
      </div>
    </PatientLayout>
  );
}
