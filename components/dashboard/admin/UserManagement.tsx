"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient, supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Search,
  Filter,
  Shield,
  Loader2,
  RefreshCw,
} from "lucide-react";
import ToastNotification from "@/components/ui/toast-notification";

type UserRole = "requester" | "collector" | "agent" | "admin";

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  verification_tier: string | null;
  created_at: string;
  updated_at: string;
  balance: number;
  total_earnings: number;
  total_submissions: number;
  rating: number;
}

const ROLES: UserRole[] = ["requester", "collector", "agent", "admin"];

const ROLE_COLORS: Record<string, string> = {
  requester: "bg-blue-500",
  collector: "bg-green-500",
  agent: "bg-purple-500",
  admin: "bg-red-500",
};

const TIER_COLORS: Record<string, string> = {
  bronze: "bg-amber-600",
  silver: "bg-gray-400",
  gold: "bg-yellow-500",
  platinum: "bg-purple-500",
};

export default function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const userId = user?.id;

  const fetchUsers = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      // const supabase = createClient();

      const { data, error: rpcError } = await supabase.rpc("admin_get_users", {
        search_term: searchTerm,
        role_filter: roleFilter,
        result_limit: 100,
        result_offset: 0,
      });

      if (rpcError) throw rpcError;

      const result = data as { users: UserRow[]; total: number };
      setUsers(result.users || []);
      setTotal(result.total || 0);
    } catch (err: any) {
      console.error("Error loading users:", err);
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [userId, searchTerm, roleFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchUsers]);

  const handleRoleChange = async (targetUserId: string, newRole: UserRole) => {
    if (targetUserId === userId) {
      setToast({ message: "You cannot change your own role", type: "error" });
      return;
    }

    setUpdatingId(targetUserId);
    try {
      // const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("admin_update_user_role", {
        target_user_id: targetUserId,
        new_role: newRole,
      });

      if (rpcError) throw rpcError;

      setUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, role: newRole } : u))
      );
      setToast({ message: "Role updated successfully", type: "success" });
    } catch (err: any) {
      console.error("Error updating role:", err);
      setToast({ message: err.message || "Failed to update role", type: "error" });
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || "U";
  };

  const statsByRole = ROLES.reduce<Record<string, number>>((acc, role) => {
    acc[role] = users.filter((u) => u.role === role).length;
    return acc;
  }, {});

  return (
    <>
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}

      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage platform users and roles
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="dark:bg-gray-800/50 border-none">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold mt-1">{total}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          {ROLES.map((role) => (
            <Card key={role} className="dark:bg-gray-800/50 border-none">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground capitalize">{role}s</p>
                    <p className="text-2xl font-bold mt-1">{statsByRole[role] || 0}</p>
                  </div>
                  <Badge className={`${ROLE_COLORS[role]} text-white capitalize`}>{role}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="requester">Requester</SelectItem>
                  <SelectItem value="collector">Collector</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <p className="text-sm text-red-500">{error}</p>
                <Button size="sm" variant="outline" onClick={fetchUsers}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Retry
                </Button>
              </div>
            ) : users.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No users found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">User</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tier</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Balance</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9">
                              <AvatarImage src={u.avatar_url || ""} />
                              <AvatarFallback className="bg-cyan-500 text-white text-xs">
                                {getInitials(u.full_name, u.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">
                                {u.full_name || "No name"}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {updatingId === u.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          ) : (
                            <Select
                              value={u.role}
                              onValueChange={(val) => handleRoleChange(u.id, val as UserRole)}
                              disabled={u.id === userId}
                            >
                              <SelectTrigger className="w-32 h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLES.map((role) => (
                                  <SelectItem key={role} value={role} className="text-xs capitalize">
                                    {role}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <Badge
                            className={`${TIER_COLORS[u.verification_tier || "bronze"] || "bg-gray-500"} text-white capitalize text-xs`}
                          >
                            <Shield className="w-3 h-3 mr-1" />
                            {u.verification_tier || "bronze"}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-sm">
                          ${Number(u.balance || 0).toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground">
                          {formatDate(u.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
