import { ReactNode, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Home, Search, Calendar, User, LogOut, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PatientLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

const menuItems = [
  { icon: Home, label: "Dashboard", href: "/patient" },
  { icon: Search, label: "Find Doctors", href: "/patient/doctors" },
  { icon: Calendar, label: "My Appointments", href: "/patient/appointments" },
  { icon: User, label: "Profile", href: "/patient/profile" },
];

export function PatientLayout({ children, title, description }: PatientLayoutProps) {
  const { user, role, loading, signOut, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && (!user || role !== "patient")) {
      navigate("/auth");
    }
  }, [user, role, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || role !== "patient") {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/patient" className="flex items-center gap-2">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg text-foreground">MediCare</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground">Patient</p>
              </div>
              <Button variant="ghost" size="icon" onClick={signOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-border">
          <div className="flex justify-around py-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {children}
      </main>
    </div>
  );
}
