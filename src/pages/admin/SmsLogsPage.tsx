import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
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
import { MessageSquare, Search, Phone, RefreshCw, Loader2 } from "lucide-react";

interface SmsLog {
  id: string;
  phone: string;
  message: string;
  type: string;
  status: string | null;
  created_at: string;
}

const SMS_TYPES = {
  otp: { label: "OTP", color: "bg-blue-100 text-blue-800" },
  appointment_confirmation: { label: "Confirmation", color: "bg-green-100 text-green-800" },
  appointment_reminder: { label: "Reminder", color: "bg-yellow-100 text-yellow-800" },
  appointment_cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
  appointment_completed: { label: "Completed", color: "bg-purple-100 text-purple-800" },
};

const SMS_STATUS = {
  sent: { label: "Sent", variant: "default" as const },
  failed: { label: "Failed", variant: "destructive" as const },
  pending_config: { label: "Pending Config", variant: "secondary" as const },
  pending: { label: "Pending", variant: "outline" as const },
};

export default function SmsLogsPage() {
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sms_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching SMS logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || log.type === typeFilter;
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeInfo = (type: string) => {
    return SMS_TYPES[type as keyof typeof SMS_TYPES] || { label: type, color: "bg-gray-100 text-gray-800" };
  };

  const getStatusInfo = (status: string | null) => {
    return SMS_STATUS[status as keyof typeof SMS_STATUS] || { label: status || "Unknown", variant: "outline" as const };
  };

  const stats = {
    total: logs.length,
    sent: logs.filter((l) => l.status === "sent").length,
    failed: logs.filter((l) => l.status === "failed").length,
    pendingConfig: logs.filter((l) => l.status === "pending_config").length,
  };

  return (
    <AdminLayout title="SMS Logs" description="Monitor all SMS messages sent from the system">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total SMS</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
              <p className="text-sm text-muted-foreground">Sent</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              <p className="text-sm text-muted-foreground">Failed</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingConfig}</p>
              <p className="text-sm text-muted-foreground">Pending Config</p>
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
              placeholder="Search by phone or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="otp">OTP</SelectItem>
              <SelectItem value="appointment_confirmation">Confirmation</SelectItem>
              <SelectItem value="appointment_reminder">Reminder</SelectItem>
              <SelectItem value="appointment_cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="pending_config">Pending Config</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No SMS logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Phone</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Message</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const typeInfo = getTypeInfo(log.type);
                  const statusInfo = getStatusInfo(log.status);
                  return (
                    <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="font-mono text-sm">{log.phone}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm max-w-md truncate" title={log.message}>
                          {log.message}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm">{format(new Date(log.created_at), "MMM d, yyyy")}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(log.created_at), "HH:mm:ss")}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
