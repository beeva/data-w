"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Server,
  Database,
  Shield,
  BarChart3,
} from "lucide-react";

export default function AdminDashboard() {
  const stats = {
    totalUsers: 12543,
    activeUsers: 8234,
    totalProjects: 3456,
    activeProjects: 892,
    totalRevenue: 156789.45,
    monthlyRevenue: 23456.78,
    pendingValidations: 156,
    systemHealth: 98.5,
  };

  const recentActivity = [
    {
      type: "user",
      message: "New user registered: john@example.com",
      time: "2 minutes ago",
    },
    {
      type: "project",
      message: "Project 'Street Photography' completed",
      time: "15 minutes ago",
    },
    {
      type: "payment",
      message: "Payment of $250 processed",
      time: "32 minutes ago",
    },
    {
      type: "alert",
      message: "High validation queue detected",
      time: "1 hour ago",
    },
    {
      type: "system",
      message: "Daily backup completed",
      time: "2 hours ago",
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user":
        return <Users className="w-4 h-4 text-blue-500" />;
      case "project":
        return <FileText className="w-4 h-4 text-green-500" />;
      case "payment":
        return <DollarSign className="w-4 h-4 text-yellow-500" />;
      case "alert":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "system":
        return <Server className="w-4 h-4 text-purple-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          System overview and management
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold mt-1">
                  {stats.totalUsers.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.activeUsers.toLocaleString()} active
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold mt-1">
                  {stats.totalProjects.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.activeProjects} active
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold mt-1">
                  ${stats.totalRevenue.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+12.5% this month</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Validations</p>
                <p className="text-2xl font-bold mt-1 text-orange-600">
                  {stats.pendingValidations}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Needs attention
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* System Health */}
        <Card className="dark:bg-gray-800/50 border-none">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="w-5 h-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Overall Health</span>
              <span className="font-bold text-green-600">{stats.systemHealth}%</span>
            </div>
            <Progress value={stats.systemHealth} className="h-2" />

            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Database</span>
                </div>
                <Badge className="bg-green-500">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">API Server</span>
                </div>
                <Badge className="bg-green-500">Healthy</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Security</span>
                </div>
                <Badge className="bg-green-500">Secure</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Distribution */}
        <Card className="dark:bg-gray-800/50 border-none">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              User Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Requesters</span>
                  <span className="font-medium">4,521</span>
                </div>
                <Progress value={36} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Collectors</span>
                  <span className="font-medium">6,892</span>
                </div>
                <Progress value={55} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Agents</span>
                  <span className="font-medium">1,023</span>
                </div>
                <Progress value={8} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Admins</span>
                  <span className="font-medium">107</span>
                </div>
                <Progress value={1} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="dark:bg-gray-800/50 border-none">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" size="sm">
              View All Activity
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="dark:bg-gray-800/50 border-none">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Users className="w-5 h-5" />
              <span>Manage Users</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <FileText className="w-5 h-5" />
              <span>View Projects</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <BarChart3 className="w-5 h-5" />
              <span>Analytics</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Shield className="w-5 h-5" />
              <span>Security</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
