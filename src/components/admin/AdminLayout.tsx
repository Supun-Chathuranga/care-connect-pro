import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || role !== "admin")) {
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

  if (!user || role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminSidebar />
      <main className="pl-64">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
