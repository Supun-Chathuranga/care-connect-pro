import { useState, useEffect } from "react";
import { PatientLayout } from "@/components/patient/PatientLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { User, Mail, Phone, Save, Loader2, Bell, Shield, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function PatientProfile() {
  const { user, profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
  });
  const [notifications, setNotifications] = useState({
    appointmentReminders: true,
    smsNotifications: true,
    emailNotifications: false,
  });

  // Sync form data with profile when profile loads or changes
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PatientLayout title="My Profile" description="Manage your personal information">
      <div className="max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border shadow-soft"
        >
          {/* Profile Header */}
          <div className="p-8 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                  {profile?.full_name?.charAt(0) || "P"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{profile?.full_name}</h2>
                <p className="text-muted-foreground">Patient Account</p>
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

        {/* Notification Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border shadow-soft mt-6 p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Notification Preferences</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium">Appointment Reminders</p>
                <p className="text-sm text-muted-foreground">
                  Get reminded before your appointments
                </p>
              </div>
              <Switch
                checked={notifications.appointmentReminders}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, appointmentReminders: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium">SMS Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive updates via SMS
                </p>
              </div>
              <Switch
                checked={notifications.smsNotifications}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, smsNotifications: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive updates via email
                </p>
              </div>
              <Switch
                checked={notifications.emailNotifications}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, emailNotifications: checked })
                }
              />
            </div>
          </div>
        </motion.div>

        {/* Account Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border shadow-soft mt-6 p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Account Settings</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="font-medium">Account ID</p>
                <p className="text-sm text-muted-foreground font-mono">{user?.id?.slice(0, 8)}...</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Member Since</p>
                  <p className="text-sm text-muted-foreground">
                    {user?.created_at ? format(new Date(user.created_at), "MMMM d, yyyy") : "N/A"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-destructive">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button variant="destructive" size="sm">
                Delete
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </PatientLayout>
  );
}
