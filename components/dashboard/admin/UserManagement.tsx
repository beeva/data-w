"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  MoreVertical,
  Mail,
  Shield,
  Ban,
  CheckCircle2,
  XCircle,
  UserPlus,
  Download,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: "requester" | "collector" | "agent" | "admin";
  status: "active" | "suspended" | "pending";
  created_at: string;
  last_login: string | null;
  verification_tier: string;
}

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock users data
  const users: User[] = [
    {
      id: "1",
      email: "john@example.com",
      full_name: "John Doe",
      avatar_url: null,
      role: "requester",
      status: "active",
      created_at: "2025-12-15T10:00:00Z",
      last_login: "2026-01-27T08:30:00Z",
      verification_tier: "gold",
    },
    {
      id: "2",
      email: "jane@example.com",
      full_name: "Jane Smith",
      avatar_url: null,
      role: "collector",
      status: "active",
      created_at: "2025-11-20T14:30:00Z",
      last_login: "2026-01-26T16:45:00Z",
      verification_tier: "silver",
    },
    {
      id: "3",
      email: "mike@example.com",
      full_name: "Mike Johnson",
      avatar_url: null,
      role: "agent",
      status: "active",
      created_at: "2025-10-05T09:15:00Z",
      last_login: "2026-01-27T07:00:00Z",
      verification_tier: "platinum",
    },
    {
      id: "4",
      email: "sarah@example.com",
      full_name: "Sarah Williams",
      avatar_url: null,
      role: "collector",
      status: "suspended",
      created_at: "2025-09-10T11:20:00Z",
      last_login: "2026-01-20T12:00:00Z",
      verification_tier: "bronze",
    },
    {
      id: "5",
      email: "admin@dataw.com",
      full_name: "System Admin",
      avatar_url: null,
      role: "admin",
      status: "active",
      created_at: "2025-01-01T00:00:00Z",
      last_login: "2026-01-27T09:00:00Z",
      verification_tier: "platinum",
    },
  ];

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      requester: "bg-blue-500",
      collector: "bg-green-500",
      agent: "bg-purple-500",
      admin: "bg-red-500",
    };
    return (
      <Badge className={`${colors[role] || "bg-gray-500"} capitalize`}>
        {role}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="secondary" className="bg-green-500/20 text-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case "suspended":
        return (
          <Badge variant="secondary" className="bg-red-500/20 text-red-600">
            <XCircle className="w-3 h-3 mr-1" />
            Suspended
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600">
            Pending
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      bronze: "bg-amber-600",
      silver: "bg-gray-400",
      gold: "bg-yellow-500",
      platinum: "bg-purple-500",
    };
    return (
      <Badge className={`${colors[tier] || "bg-gray-500"} text-white capitalize text-xs`}>
        <Shield className="w-3 h-3 mr-1" />
        {tier}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    suspended: users.filter((u) => u.status === "suspended").length,
    pending: users.filter((u) => u.status === "pending").length,
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage platform users and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  {stats.active}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Suspended</p>
                <p className="text-2xl font-bold mt-1 text-red-600">
                  {stats.suspended}
                </p>
              </div>
              <Ban className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold mt-1 text-yellow-600">
                  {stats.pending}
                </p>
              </div>
              <Shield className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="dark:bg-gray-800/50 border-none">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="dark:bg-gray-800/50 border-none">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    User
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Role
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Tier
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Joined
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                    Last Login
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.avatar_url || ""} />
                          <AvatarFallback className="bg-cyan-500 text-white">
                            {user.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">{getRoleBadge(user.role)}</td>
                    <td className="py-4 px-4">{getStatusBadge(user.status)}</td>
                    <td className="py-4 px-4">
                      {getTierBadge(user.verification_tier)}
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">
                      {formatDate(user.last_login)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="w-4 h-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.status === "active" ? (
                            <DropdownMenuItem className="text-red-600">
                              <Ban className="w-4 h-4 mr-2" />
                              Suspend User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem className="text-green-600">
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Activate User
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
