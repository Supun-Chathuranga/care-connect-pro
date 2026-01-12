import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KeyRound, Search, Phone, RefreshCw, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";

interface OtpVerification {
  id: string;
  phone: string;
  otp_code: string;
  verified: boolean | null;
  expires_at: string;
  created_at: string;
}

export default function OtpVerificationsPage() {
  const [verifications, setVerifications] = useState<OtpVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      // Use service role to bypass RLS for admin view
      const { data, error } = await supabase
        .from("otp_verifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setVerifications(data || []);
    } catch (error) {
      console.error("Error fetching OTP verifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  const getStatus = (verification: OtpVerification) => {
    if (verification.verified) return "verified";
    if (isExpired(verification.expires_at)) return "expired";
    return "pending";
  };

  const filteredVerifications = verifications.filter((v) => {
    const matchesSearch = v.phone.toLowerCase().includes(searchQuery.toLowerCase());
    const status = getStatus(v);
    const matchesStatus = statusFilter === "all" || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: verifications.length,
    verified: verifications.filter((v) => v.verified).length,
    expired: verifications.filter((v) => !v.verified && isExpired(v.expires_at)).length,
    pending: verifications.filter((v) => !v.verified && !isExpired(v.expires_at)).length,
  };

  const getStatusBadge = (verification: OtpVerification) => {
    const status = getStatus(verification);
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Expired
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <AdminLayout title="OTP Verifications" description="Monitor phone number verification attempts">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total OTPs</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
              <p className="text-sm text-muted-foreground">Verified</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
              <p className="text-sm text-muted-foreground">Expired</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchVerifications} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Verifications Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredVerifications.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <KeyRound className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No OTP verifications found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Phone</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">OTP Code</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Expires</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredVerifications.map((verification) => (
                  <tr key={verification.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{verification.phone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                        {verification.otp_code}
                      </span>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(verification)}</td>
                    <td className="py-3 px-4">
                      <p className="text-sm">
                        {isExpired(verification.expires_at) ? (
                          <span className="text-destructive">
                            Expired {formatDistanceToNow(new Date(verification.expires_at))} ago
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            In {formatDistanceToNow(new Date(verification.expires_at))}
                          </span>
                        )}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm">{format(new Date(verification.created_at), "MMM d, yyyy")}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(verification.created_at), "HH:mm:ss")}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
