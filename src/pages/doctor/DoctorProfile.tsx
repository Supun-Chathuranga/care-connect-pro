import { useState, useEffect } from "react";
import { DoctorLayout } from "@/components/doctor/DoctorLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { SPECIALTIES, Specialty } from "@/lib/constants";
import { User, Mail, Phone, Save, Loader2, Stethoscope, GraduationCap, Clock, Banknote, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface DoctorData {
  id: string;
  specialty: Specialty;
  qualification: string;
  experience_years: number | null;
  consultation_fee: number | null;
  bio: string | null;
  is_active: boolean;
}

export default function DoctorProfile() {
  const { user, profile } = useAuth();
  const [doctorData, setDoctorData] = useState<DoctorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    bio: "",
  });

  useEffect(() => {
    if (user) {
      fetchDoctorProfile();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        full_name: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
      }));
    }
  }, [profile]);

  useEffect(() => {
    if (doctorData) {
      setFormData((prev) => ({
        ...prev,
        bio: doctorData.bio || "",
      }));
    }
  }, [doctorData]);

  const fetchDoctorProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;
      setDoctorData(data);
    } catch (error) {
      console.error("Error fetching doctor profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Update doctor bio if doctor record exists
      if (doctorData) {
        const { error: doctorError } = await supabase
          .from("doctors")
          .update({ bio: formData.bio })
          .eq("id", doctorData.id);

        if (doctorError) throw doctorError;
      }

      toast.success("Profile updated successfully!");
      setIsEditing(false);
      fetchDoctorProfile();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <DoctorLayout title="My Profile" description="Loading...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DoctorLayout>
    );
  }

  if (!doctorData) {
    return (
      <DoctorLayout title="My Profile" description="Doctor profile not found">
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
    <DoctorLayout title="My Profile" description="Manage your professional information">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-soft"
        >
          {/* Profile Header */}
          <div className="p-8 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                  {profile?.full_name?.charAt(0) || "D"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Dr. {profile?.full_name}</h2>
                <Badge variant="secondary" className="mt-2">
                  {SPECIALTIES[doctorData.specialty]?.label}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">{doctorData.qualification}</p>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-foreground">Personal Information</h3>
              {!isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </div>

            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </Label>
                  {isEditing ? (
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                  ) : (
                    <p className="text-foreground py-2">{profile?.full_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  ) : (
                    <p className="text-foreground py-2">{profile?.email || "Not set"}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                {isEditing ? (
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                ) : (
                  <p className="text-foreground py-2">{profile?.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4" />
                  Bio / About
                </Label>
                {isEditing ? (
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell patients about yourself, your experience, and approach to care..."
                    rows={4}
                  />
                ) : (
                  <p className="text-foreground py-2">
                    {doctorData.bio || "No bio added yet"}
                  </p>
                )}
              </div>

              {isEditing && (
                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        full_name: profile?.full_name || "",
                        email: profile?.email || "",
                        phone: profile?.phone || "",
                        bio: doctorData?.bio || "",
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Professional Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="bg-card rounded-2xl border border-border shadow-soft p-6">
            <h3 className="font-semibold text-foreground mb-4">Professional Details</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Specialty</p>
                  <p className="font-medium">{SPECIALTIES[doctorData.specialty]?.label}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Qualification</p>
                  <p className="font-medium">{doctorData.qualification}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Experience</p>
                  <p className="font-medium">{doctorData.experience_years || 0} years</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Consultation Fee</p>
                  <p className="font-medium">LKR {doctorData.consultation_fee || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className={`rounded-2xl border p-6 ${doctorData.is_active ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${doctorData.is_active ? "bg-success" : "bg-destructive"}`} />
              <div>
                <p className="font-medium">{doctorData.is_active ? "Active" : "Inactive"}</p>
                <p className="text-sm text-muted-foreground">
                  {doctorData.is_active
                    ? "Patients can book appointments with you"
                    : "You are not accepting new appointments"}
                </p>
              </div>
            </div>
          </div>

          {/* Help Note */}
          <div className="bg-primary/5 rounded-2xl border border-primary/20 p-6">
            <h4 className="font-medium text-foreground mb-2">Need to update details?</h4>
            <p className="text-sm text-muted-foreground">
              Contact the clinic administrator to update your specialty, qualification, experience, or consultation fee.
            </p>
          </div>
        </motion.div>
      </div>
    </DoctorLayout>
  );
}
