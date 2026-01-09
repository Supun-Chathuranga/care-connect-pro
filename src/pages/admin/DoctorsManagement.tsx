import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash2, MoreVertical } from "lucide-react";
import { SPECIALTIES, Specialty } from "@/lib/constants";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Doctor {
  id: string;
  user_id: string;
  specialty: Specialty;
  qualification: string;
  experience_years: number;
  consultation_fee: number;
  bio: string | null;
  is_active: boolean;
  profiles?: {
    full_name: string;
    email: string;
    phone: string;
  };
}

interface NewDoctor {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  specialty: Specialty;
  qualification: string;
  experienceYears: number;
  consultationFee: number;
  bio: string;
}

const initialNewDoctor: NewDoctor = {
  email: "",
  password: "",
  fullName: "",
  phone: "",
  specialty: "general_medicine",
  qualification: "",
  experienceYears: 0,
  consultationFee: 0,
  bio: "",
};

export default function DoctorsManagement() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDoctor, setNewDoctor] = useState<NewDoctor>(initialNewDoctor);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const { data: doctorsData, error } = await supabase
        .from("doctors")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const doctorsWithProfiles = await Promise.all(
        (doctorsData || []).map(async (doctor) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email, phone")
            .eq("user_id", doctor.user_id)
            .single();
          return { ...doctor, profiles: profile };
        })
      );

      setDoctors(doctorsWithProfiles as Doctor[]);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newDoctor.email,
        password: newDoctor.password,
        options: {
          data: {
            full_name: newDoctor.fullName,
            phone: newDoctor.phone,
            role: "doctor",
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create doctor record
        const { error: doctorError } = await supabase.from("doctors").insert({
          user_id: authData.user.id,
          specialty: newDoctor.specialty,
          qualification: newDoctor.qualification,
          experience_years: newDoctor.experienceYears,
          consultation_fee: newDoctor.consultationFee,
          bio: newDoctor.bio,
        });

        if (doctorError) throw doctorError;
      }

      toast.success("Doctor added successfully!");
      setIsDialogOpen(false);
      setNewDoctor(initialNewDoctor);
      fetchDoctors();
    } catch (error: any) {
      console.error("Error adding doctor:", error);
      toast.error(error.message || "Failed to add doctor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    if (!confirm("Are you sure you want to delete this doctor?")) return;

    try {
      const { error } = await supabase
        .from("doctors")
        .delete()
        .eq("id", doctorId);

      if (error) throw error;

      toast.success("Doctor deleted successfully");
      fetchDoctors();
    } catch (error) {
      console.error("Error deleting doctor:", error);
      toast.error("Failed to delete doctor");
    }
  };

  const handleToggleActive = async (doctorId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("doctors")
        .update({ is_active: !isActive })
        .eq("id", doctorId);

      if (error) throw error;

      toast.success(`Doctor ${isActive ? "deactivated" : "activated"} successfully`);
      fetchDoctors();
    } catch (error) {
      console.error("Error updating doctor:", error);
      toast.error("Failed to update doctor");
    }
  };

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      SPECIALTIES[doctor.specialty]?.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout title="Doctors Management" description="Manage your clinic's doctors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search doctors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Doctor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Doctor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddDoctor} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={newDoctor.fullName}
                    onChange={(e) => setNewDoctor({ ...newDoctor, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={newDoctor.phone}
                    onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newDoctor.email}
                    onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={newDoctor.password}
                    onChange={(e) => setNewDoctor({ ...newDoctor, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Specialty</Label>
                <Select
                  value={newDoctor.specialty}
                  onValueChange={(v) => setNewDoctor({ ...newDoctor, specialty: v as Specialty })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SPECIALTIES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Qualification</Label>
                <Input
                  value={newDoctor.qualification}
                  onChange={(e) => setNewDoctor({ ...newDoctor, qualification: e.target.value })}
                  placeholder="e.g., MBBS, MD"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Experience (years)</Label>
                  <Input
                    type="number"
                    value={newDoctor.experienceYears}
                    onChange={(e) => setNewDoctor({ ...newDoctor, experienceYears: parseInt(e.target.value) })}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Consultation Fee (LKR)</Label>
                  <Input
                    type="number"
                    value={newDoctor.consultationFee}
                    onChange={(e) => setNewDoctor({ ...newDoctor, consultationFee: parseFloat(e.target.value) })}
                    min={0}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  value={newDoctor.bio}
                  onChange={(e) => setNewDoctor({ ...newDoctor, bio: e.target.value })}
                  placeholder="Brief description about the doctor..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Doctor"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            </div>
          ))
        ) : filteredDoctors.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No doctors found
          </div>
        ) : (
          filteredDoctors.map((doctor) => (
            <div key={doctor.id} className="bg-card rounded-2xl p-6 border border-border shadow-soft card-hover">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {doctor.profiles?.full_name?.charAt(0) || "D"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Dr. {doctor.profiles?.full_name}
                    </h3>
                    <p className="text-sm text-primary">
                      {SPECIALTIES[doctor.specialty]?.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {doctor.qualification}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleToggleActive(doctor.id, doctor.is_active)}>
                      {doctor.is_active ? "Deactivate" : "Activate"}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => handleDeleteDoctor(doctor.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Experience</span>
                  <span className="font-medium">{doctor.experience_years} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Consultation Fee</span>
                  <span className="font-medium">LKR {doctor.consultation_fee}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    doctor.is_active 
                      ? "bg-success/10 text-success" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {doctor.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
