import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Building2,
  Bell,
  Shield,
  Clock,
  Save,
} from "lucide-react";

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    clinicName: "MediCare Clinic",
    clinicEmail: "contact@medicare.lk",
    clinicPhone: "+94 11 234 5678",
    clinicAddress: "123 Hospital Road, Colombo 03, Sri Lanka",
    appointmentDuration: 30,
    maxAdvanceBookingDays: 30,
    enableEmailNotifications: true,
    enableSMSNotifications: true,
    enableAppointmentReminders: true,
    reminderHoursBefore: 24,
    autoConfirmAppointments: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate saving settings
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("Settings saved successfully!");
    setIsSaving(false);
  };

  return (
    <AdminLayout title="Settings" description="Configure your clinic settings">
      <div className="max-w-3xl space-y-8">
        {/* Clinic Information */}
        <div className="bg-card rounded-2xl border border-border shadow-soft p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Clinic Information</h2>
              <p className="text-sm text-muted-foreground">Basic details about your clinic</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Clinic Name</Label>
                <Input
                  value={settings.clinicName}
                  onChange={(e) => setSettings({ ...settings, clinicName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={settings.clinicEmail}
                  onChange={(e) => setSettings({ ...settings, clinicEmail: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={settings.clinicPhone}
                  onChange={(e) => setSettings({ ...settings, clinicPhone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={settings.clinicAddress}
                  onChange={(e) => setSettings({ ...settings, clinicAddress: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Appointment Settings */}
        <div className="bg-card rounded-2xl border border-border shadow-soft p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Appointment Settings</h2>
              <p className="text-sm text-muted-foreground">Configure appointment booking rules</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Appointment Duration (minutes)</Label>
                <Input
                  type="number"
                  value={settings.appointmentDuration}
                  onChange={(e) => setSettings({ ...settings, appointmentDuration: parseInt(e.target.value) })}
                  min={5}
                  max={120}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Advance Booking (days)</Label>
                <Input
                  type="number"
                  value={settings.maxAdvanceBookingDays}
                  onChange={(e) => setSettings({ ...settings, maxAdvanceBookingDays: parseInt(e.target.value) })}
                  min={1}
                  max={365}
                />
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-confirm Appointments</p>
                <p className="text-sm text-muted-foreground">
                  Automatically confirm new appointment requests
                </p>
              </div>
              <Switch
                checked={settings.autoConfirmAppointments}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, autoConfirmAppointments: checked })
                }
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-card rounded-2xl border border-border shadow-soft p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Notifications</h2>
              <p className="text-sm text-muted-foreground">Configure notification preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Send email notifications for appointments
                </p>
              </div>
              <Switch
                checked={settings.enableEmailNotifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enableEmailNotifications: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">SMS Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Send SMS notifications for appointments
                </p>
              </div>
              <Switch
                checked={settings.enableSMSNotifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enableSMSNotifications: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Appointment Reminders</p>
                <p className="text-sm text-muted-foreground">
                  Send reminders before scheduled appointments
                </p>
              </div>
              <Switch
                checked={settings.enableAppointmentReminders}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enableAppointmentReminders: checked })
                }
              />
            </div>

            {settings.enableAppointmentReminders && (
              <div className="space-y-2 pl-6 border-l-2 border-muted">
                <Label>Send Reminder (hours before appointment)</Label>
                <Input
                  type="number"
                  value={settings.reminderHoursBefore}
                  onChange={(e) =>
                    setSettings({ ...settings, reminderHoursBefore: parseInt(e.target.value) })
                  }
                  min={1}
                  max={72}
                  className="max-w-[200px]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-card rounded-2xl border border-border shadow-soft p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Security</h2>
              <p className="text-sm text-muted-foreground">Security and access settings</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Security settings are managed at the system level. Contact your system administrator
                for changes to authentication and access control policies.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
