import { useEffect, useState } from "react";
import { PatientLayout } from "@/components/patient/PatientLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { SPECIALTIES, DAYS_OF_WEEK, Specialty } from "@/lib/constants";
import { format, addDays, isBefore, startOfToday } from "date-fns";
import { Calendar, Clock, ArrowLeft, Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Doctor {
  id: string;
  user_id: string;
  specialty: Specialty;
  qualification: string;
  experience_years: number | null;
  consultation_fee: number | null;
  bio: string | null;
  profiles?: {
    full_name: string;
  };
}

interface Session {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_patients: number | null;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function BookAppointment() {
  const { doctorId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [reason, setReason] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (doctorId) {
      fetchDoctorDetails();
    }
  }, [doctorId]);

  useEffect(() => {
    if (selectedDate && sessions.length > 0) {
      generateTimeSlots();
    }
  }, [selectedDate, sessions]);

  const fetchDoctorDetails = async () => {
    try {
      // Fetch doctor
      const { data: doctorData, error: doctorError } = await supabase
        .from("doctors")
        .select("*")
        .eq("id", doctorId)
        .single();

      if (doctorError) throw doctorError;

      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", doctorData.user_id)
        .single();

      setDoctor({ ...doctorData, profiles: profile });

      // Fetch sessions
      const { data: sessionsData } = await supabase
        .from("doctor_sessions")
        .select("*")
        .eq("doctor_id", doctorId)
        .eq("is_active", true);

      setSessions(sessionsData || []);
    } catch (error) {
      console.error("Error fetching doctor:", error);
      toast.error("Failed to load doctor details");
      navigate("/patient/doctors");
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = async () => {
    if (!selectedDate) return;

    const dayOfWeek = selectedDate.getDay();
    const session = sessions.find((s) => s.day_of_week === dayOfWeek);

    if (!session) {
      setAvailableSlots([]);
      return;
    }

    // Generate 30-minute slots
    const slots: TimeSlot[] = [];
    const [startHour, startMin] = session.start_time.split(":").map(Number);
    const [endHour, endMin] = session.end_time.split(":").map(Number);
    
    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const timeStr = `${currentHour.toString().padStart(2, "0")}:${currentMin.toString().padStart(2, "0")}`;
      slots.push({ time: timeStr, available: true });

      currentMin += 30;
      if (currentMin >= 60) {
        currentHour += 1;
        currentMin = 0;
      }
    }

    // Check existing appointments for this date
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const { data: existingApts } = await supabase
      .from("appointments")
      .select("appointment_time")
      .eq("doctor_id", doctorId)
      .eq("appointment_date", dateStr)
      .in("status", ["pending", "confirmed"]);

    const bookedTimes = new Set(existingApts?.map((a) => a.appointment_time.slice(0, 5)) || []);

    // Mark booked slots
    const slotsWithAvailability = slots.map((slot) => ({
      ...slot,
      available: !bookedTimes.has(slot.time),
    }));

    // Check max patients limit
    if (session.max_patients) {
      const bookedCount = existingApts?.length || 0;
      if (bookedCount >= session.max_patients) {
        setAvailableSlots(slotsWithAvailability.map((s) => ({ ...s, available: false })));
        return;
      }
    }

    setAvailableSlots(slotsWithAvailability);
  };

  const getAvailableDates = () => {
    const dates: Date[] = [];
    const today = startOfToday();
    const availableDays = sessions.map((s) => s.day_of_week);

    for (let i = 0; i < 30; i++) {
      const date = addDays(today, i);
      if (availableDays.includes(date.getDay())) {
        dates.push(date);
      }
    }

    return dates;
  };

  const handleBook = async () => {
    if (!selectedDate || !selectedTime || !user) return;

    setIsBooking(true);

    try {
      const session = sessions.find((s) => s.day_of_week === selectedDate.getDay());
      
      const { error } = await supabase.from("appointments").insert({
        patient_id: user.id,
        doctor_id: doctorId,
        session_id: session?.id,
        appointment_date: format(selectedDate, "yyyy-MM-dd"),
        appointment_time: selectedTime,
        reason: reason || null,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Appointment booked successfully!");
      navigate("/patient/appointments");
    } catch (error: any) {
      console.error("Error booking appointment:", error);
      toast.error(error.message || "Failed to book appointment");
    } finally {
      setIsBooking(false);
    }
  };

  if (loading) {
    return (
      <PatientLayout title="Book Appointment" description="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PatientLayout>
    );
  }

  if (!doctor) {
    return null;
  }

  const availableDates = getAvailableDates();

  return (
    <PatientLayout title="Book Appointment" description={`Schedule your visit with Dr. ${doctor.profiles?.full_name}`}>
      <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Doctor Info Card */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-2xl border border-border shadow-soft p-6 sticky top-24">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {doctor.profiles?.full_name?.charAt(0) || "D"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-foreground">
                  Dr. {doctor.profiles?.full_name}
                </h3>
                <Badge variant="secondary">
                  {SPECIALTIES[doctor.specialty]?.label}
                </Badge>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Qualification</span>
                <span className="font-medium">{doctor.qualification}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Experience</span>
                <span className="font-medium">{doctor.experience_years} years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Consultation Fee</span>
                <span className="font-medium text-primary">LKR {doctor.consultation_fee}</span>
              </div>
            </div>

            {selectedDate && selectedTime && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Selected Slot</p>
                <div className="bg-primary/10 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">{format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-primary mt-1">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Booking Steps */}
        <div className="lg:col-span-2">
          {/* Step 1: Select Date */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border shadow-soft p-6 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {step > 1 ? <Check className="w-4 h-4" /> : "1"}
              </div>
              <h3 className="font-semibold">Select Date</h3>
            </div>

            {availableDates.length === 0 ? (
              <p className="text-muted-foreground">No available dates. Please try again later.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {availableDates.slice(0, 15).map((date) => (
                  <button
                    key={date.toISOString()}
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedTime(null);
                      setStep(2);
                    }}
                    className={cn(
                      "p-3 rounded-xl border text-center transition-colors",
                      selectedDate?.toDateString() === date.toDateString()
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted"
                    )}
                  >
                    <p className="text-xs text-muted-foreground">{format(date, "EEE")}</p>
                    <p className="text-lg font-semibold">{format(date, "d")}</p>
                    <p className="text-xs">{format(date, "MMM")}</p>
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Step 2: Select Time */}
          {selectedDate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl border border-border shadow-soft p-6 mb-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {step > 2 ? <Check className="w-4 h-4" /> : "2"}
                </div>
                <h3 className="font-semibold">Select Time</h3>
              </div>

              {availableSlots.length === 0 ? (
                <p className="text-muted-foreground">No available slots for this date.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => {
                        if (slot.available) {
                          setSelectedTime(slot.time);
                          setStep(3);
                        }
                      }}
                      disabled={!slot.available}
                      className={cn(
                        "p-3 rounded-xl border text-center transition-colors",
                        !slot.available
                          ? "border-border bg-muted text-muted-foreground cursor-not-allowed"
                          : selectedTime === slot.time
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50 hover:bg-muted"
                      )}
                    >
                      <Clock className="w-4 h-4 mx-auto mb-1" />
                      <p className="font-medium">{slot.time}</p>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 3: Reason & Confirm */}
          {selectedTime && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl border border-border shadow-soft p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  3
                </div>
                <h3 className="font-semibold">Reason for Visit (Optional)</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Describe your symptoms or reason for visit</Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Regular check-up, fever and cold symptoms..."
                    rows={4}
                  />
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleBook}
                  disabled={isBooking}
                >
                  {isBooking ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 mr-2" />
                      Confirm Booking
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </PatientLayout>
  );
}
