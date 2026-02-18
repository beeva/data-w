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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Server,
  Database,
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Globe,
  Users,
  FileText,
  DollarSign,
} from "lucide-react";

export default function SystemStats() {
  const [refreshing, setRefreshing] = useState(false);

  const systemMetrics = {
    cpu: 45,
    memory: 62,
    disk: 38,
    network: 85,
    uptime: "99.99%",
    responseTime: "125ms",
  };

  const platformStats = {
    totalRequests: 1234567,
    requestsToday: 45678,
    avgResponseTime: 125,
    errorRate: 0.02,
    activeConnections: 2345,
    bandwidth: "1.2 TB",
  };

  const monthlyData = [
    { month: "Aug", users: 8500, projects: 450, revenue: 45000 },
    { month: "Sep", users: 9200, projects: 520, revenue: 52000 },
    { month: "Oct", users: 10100, projects: 580, revenue: 58000 },
    { month: "Nov", users: 11000, projects: 650, revenue: 65000 },
    { month: "Dec", users: 11800, projects: 720, revenue: 72000 },
    { month: "Jan", users: 12543, projects: 892, revenue: 89200 },
  ];

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getHealthColor = (value: number) => {
    if (value < 50) return "text-green-600";
    if (value < 75) return "text-yellow-600";
    return "text-red-600";
  };

  const getHealthBg = (value: number) => {
    if (value < 50) return "bg-green-500";
    if (value < 75) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Statistics</h1>
          <p className="text-muted-foreground mt-1">
            Monitor platform performance and analytics
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw
            className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-500" />
                <span className="font-medium">CPU Usage</span>
              </div>
              <span className={`text-xl font-bold ${getHealthColor(systemMetrics.cpu)}`}>
                {systemMetrics.cpu}%
              </span>
            </div>
            <Progress value={systemMetrics.cpu} className="h-2" />
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-purple-500" />
                <span className="font-medium">Memory</span>
              </div>
              <span className={`text-xl font-bold ${getHealthColor(systemMetrics.memory)}`}>
                {systemMetrics.memory}%
              </span>
            </div>
            <Progress value={systemMetrics.memory} className="h-2" />
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-green-500" />
                <span className="font-medium">Disk Usage</span>
              </div>
              <span className={`text-xl font-bold ${getHealthColor(systemMetrics.disk)}`}>
                {systemMetrics.disk}%
              </span>
            </div>
            <Progress value={systemMetrics.disk} className="h-2" />
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wifi className="w-5 h-5 text-cyan-500" />
                <span className="font-medium">Network</span>
              </div>
              <span className={`text-xl font-bold ${getHealthColor(systemMetrics.network)}`}>
                {systemMetrics.network}%
              </span>
            </div>
            <Progress value={systemMetrics.network} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Platform Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6 text-center">
            <Globe className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {platformStats.totalRequests.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Total Requests</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6 text-center">
            <Activity className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {platformStats.requestsToday.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Requests Today</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6 text-center">
            <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{platformStats.avgResponseTime}ms</p>
            <p className="text-xs text-muted-foreground">Avg Response</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{platformStats.errorRate}%</p>
            <p className="text-xs text-muted-foreground">Error Rate</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6 text-center">
            <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {platformStats.activeConnections.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Active Users</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardContent className="pt-6 text-center">
            <Database className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{platformStats.bandwidth}</p>
            <p className="text-xs text-muted-foreground">Bandwidth Used</p>
          </CardContent>
        </Card>
      </div>

      {/* Growth Charts */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="projects">
            <FileText className="w-4 h-4 mr-2" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="revenue">
            <DollarSign className="w-4 h-4 mr-2" />
            Revenue
          </TabsTrigger>
        </TabsList>

        {["users", "projects", "revenue"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Card className="dark:bg-gray-800/50 border-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  {tab === "users" && "User Growth"}
                  {tab === "projects" && "Project Growth"}
                  {tab === "revenue" && "Revenue Growth"}
                </CardTitle>
                <CardDescription>Last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-4">
                  {monthlyData.map((data, idx) => {
                    const value =
                      tab === "users"
                        ? data.users
                        : tab === "projects"
                        ? data.projects
                        : data.revenue;
                    const maxValue = Math.max(
                      ...monthlyData.map((d) =>
                        tab === "users"
                          ? d.users
                          : tab === "projects"
                          ? d.projects
                          : d.revenue
                      )
                    );
                    const height = (value / maxValue) * 100;

                    return (
                      <div
                        key={data.month}
                        className="flex-1 flex flex-col items-center gap-2"
                      >
                        <div className="w-full flex flex-col items-center justify-end h-48">
                          <p className="text-sm font-medium mb-2">
                            {tab === "revenue"
                              ? `$${(value / 1000).toFixed(0)}k`
                              : value.toLocaleString()}
                          </p>
                          <div
                            className="w-full bg-gradient-to-t from-cyan-500 to-blue-500 rounded-t transition-all duration-300 hover:from-cyan-600 hover:to-blue-600"
                            style={{ height: `${height}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">
                          {data.month}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Growth Summary */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-green-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-bold">+47.5%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">6-month growth</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-green-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-bold">+6.3%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">vs last month</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-lg">
                      {tab === "users" && "12,543"}
                      {tab === "projects" && "892"}
                      {tab === "revenue" && "$89.2k"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Current total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* System Status */}
      <Card className="dark:bg-gray-800/50 border-none">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "Web Server", status: "operational", uptime: "99.99%" },
              { name: "API Server", status: "operational", uptime: "99.98%" },
              { name: "Database", status: "operational", uptime: "99.99%" },
              { name: "Storage", status: "operational", uptime: "100%" },
              { name: "CDN", status: "operational", uptime: "99.95%" },
              { name: "Email Service", status: "operational", uptime: "99.90%" },
              { name: "Payment Gateway", status: "operational", uptime: "99.99%" },
              { name: "AI Services", status: "degraded", uptime: "98.50%" },
            ].map((service) => (
              <div
                key={service.name}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      service.status === "operational"
                        ? "bg-green-500"
                        : service.status === "degraded"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  ></div>
                  <span className="font-medium text-sm">{service.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {service.uptime}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
