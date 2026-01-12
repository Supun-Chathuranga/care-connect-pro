import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import DoctorsManagement from "./pages/admin/DoctorsManagement";
import PatientsManagement from "./pages/admin/PatientsManagement";
import SessionsManagement from "./pages/admin/SessionsManagement";
import AppointmentsManagement from "./pages/admin/AppointmentsManagement";
import AdminSettings from "./pages/admin/AdminSettings";
import SmsLogsPage from "./pages/admin/SmsLogsPage";
import OtpVerificationsPage from "./pages/admin/OtpVerificationsPage";
import NotificationsPage from "./pages/admin/NotificationsPage";

// Patient Pages
import PatientDashboard from "./pages/patient/PatientDashboard";
import DoctorSearch from "./pages/patient/DoctorSearch";
import BookAppointment from "./pages/patient/BookAppointment";
import MyAppointments from "./pages/patient/MyAppointments";
import PatientProfile from "./pages/patient/PatientProfile";

// Doctor Pages
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import DoctorSchedule from "./pages/doctor/DoctorSchedule";
import DoctorProfile from "./pages/doctor/DoctorProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/doctors" element={<DoctorsManagement />} />
            <Route path="/admin/patients" element={<PatientsManagement />} />
            <Route path="/admin/sessions" element={<SessionsManagement />} />
            <Route path="/admin/appointments" element={<AppointmentsManagement />} />
            <Route path="/admin/sms-logs" element={<SmsLogsPage />} />
            <Route path="/admin/otp-verifications" element={<OtpVerificationsPage />} />
            <Route path="/admin/notifications" element={<NotificationsPage />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            
            {/* Patient Routes */}
            <Route path="/patient" element={<PatientDashboard />} />
            <Route path="/patient/doctors" element={<DoctorSearch />} />
            <Route path="/patient/book/:doctorId" element={<BookAppointment />} />
            <Route path="/patient/appointments" element={<MyAppointments />} />
            <Route path="/patient/profile" element={<PatientProfile />} />
            
            {/* Doctor Routes */}
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/doctor/appointments" element={<DoctorAppointments />} />
            <Route path="/doctor/schedule" element={<DoctorSchedule />} />
            <Route path="/doctor/profile" element={<DoctorProfile />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
