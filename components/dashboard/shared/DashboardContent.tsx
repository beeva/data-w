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
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Star,
  TrendingUp,
  Clock,
  Calendar as CalendarIcon,
  Box,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardContent() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];

  return (
    <div className="space-y-3 p-1">
      {/* Top Row - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Completeness Chart */}
        <Card className="lg:col-span-2 dark:bg-gray-800/50 border-none">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Completeness
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] px-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                >
                  1 month
                </Button>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2">
                  6 month
                </Button>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2">
                  Custom
                </Button>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2">
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                <span className="text-[10px] text-muted-foreground">
                  Total View 368
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-[10px] text-muted-foreground">
                  Total Sale 42,653
                </span>
              </div>
            </div>
            <div className="h-36 flex items-end justify-between gap-1">
              {months.map((month, i) => (
                <div
                  key={month}
                  className="flex-1 flex flex-col items-center gap-1 group"
                >
                  <div className="w-full flex flex-col items-center gap-0.5 h-full justify-end">
                    <div
                      className="w-full bg-cyan-500 rounded-t transition-all duration-300 hover:bg-cyan-600 group-hover:opacity-90"
                      style={{ height: `${30 + i * 5}%` }}
                    ></div>
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600 group-hover:opacity-90"
                      style={{ height: `${20 + i * 3}%` }}
                    ></div>
                  </div>
                  <span className="text-[9px] text-muted-foreground font-medium">
                    {month}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Feedback Card */}
        <Card className="dark:bg-gray-800/50 border-none">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-xs font-semibold">
              Feel better with our services?
            </CardTitle>
            <CardDescription className="text-[10px]">
              Let us know about your impressions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 py-2 px-4">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {["Useful", "Clean", "Clear Design", "UI/UX", "Support"].map(
                (tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80 text-[9px] px-1.5 py-0"
                  >
                    {tag}
                  </Badge>
                )
              )}
            </div>
            <div className="flex gap-1.5 pt-1">
              <Button size="sm" className="flex-1 h-7 text-xs">Submit</Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs px-2">
                Not Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {/* Today Queue */}
        <Card className="dark:bg-gray-800/50 border-none">
          <CardHeader className="py-2 px-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium">Today Queue</CardTitle>
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="py-2 px-3">
            <p className="text-xl font-bold mb-1">05:24:12</p>
            <p className="text-[10px] text-muted-foreground mb-2">Remaining</p>
            <div className="flex gap-1">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-7 h-7 bg-secondary rounded-full flex items-center justify-center border border-background"
                >
                  <div className="w-3.5 h-3.5 bg-muted-foreground/30 rounded"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card className="dark:bg-gray-800/50 border-none">
          <CardHeader className="py-2 px-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium">Calendar</CardTitle>
              <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="py-1 px-3">
            <div className="flex items-center justify-between mb-2">
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <ChevronLeft className="w-3 h-3" />
              </Button>
              <span className="text-[10px] font-semibold">August 2023</span>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-[8px]">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                <div
                  key={i}
                  className="text-center text-muted-foreground font-medium py-0.5"
                >
                  {day}
                </div>
              ))}
              {[...Array(21)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "text-center py-0.5 rounded transition-colors cursor-pointer text-[8px]",
                    i === 20
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Data Value Cards */}
        {[
          {
            label: "Data value Aaa",
            value: "$ 12,560",
            icon: Box,
            color: "cyan",
          },
          {
            label: "Data value Bbb",
            value: "$ 54,700",
            icon: FileText,
            color: "blue",
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <Card key={idx} className="dark:bg-gray-800/50 border-none">
              <CardHeader className="py-2 px-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    {item.label}
                  </CardTitle>
                  <div
                    className={cn(
                      "w-7 h-7 rounded-md flex items-center justify-center",
                      item.color === "cyan"
                        ? "bg-cyan-100 dark:bg-cyan-900/30"
                        : "bg-blue-100 dark:bg-blue-900/30"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-3.5 h-3.5",
                        item.color === "cyan"
                          ? "text-cyan-600 dark:text-cyan-400"
                          : "text-blue-600 dark:text-blue-400"
                      )}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="py-2 px-3">
                <p className="text-lg font-bold mb-1">{item.value}</p>
                <div className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400">
                  <TrendingUp className="w-3 h-3" />
                  <span>52.5%</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bottom Row - More Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Donut Chart */}
        <Card className="dark:bg-gray-800/50 border-none">
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-sm font-semibold">Cheese Wheel</CardTitle>
            <CardDescription className="text-[10px]">Total Income</CardDescription>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="flex items-center justify-center h-28">
              <div className="relative w-24 h-24">
                <svg className="transform -rotate-90 w-24 h-24">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="hsl(var(--muted))"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#06b6d4"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40 * 0.4} ${
                      2 * Math.PI * 40
                    }`}
                    className="transition-all duration-500"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#3b82f6"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40 * 0.3} ${
                      2 * Math.PI * 40
                    }`}
                    strokeDashoffset={-2 * Math.PI * 40 * 0.4}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-lg font-bold">70%</p>
                    <p className="text-[9px] text-muted-foreground">Total</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                <span className="text-[9px] text-muted-foreground">Sale</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-[9px] text-muted-foreground">Sport</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                <span className="text-[9px] text-muted-foreground">Other</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Chart */}
        <Card className="dark:bg-gray-800/50 border-none">
          <CardHeader className="py-2 px-4">
            <CardTitle className="text-sm font-semibold">Rising Income</CardTitle>
            <CardDescription className="text-[10px]">Revenue</CardDescription>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <div className="h-28 relative mb-2">
              <svg
                className="w-full h-full"
                viewBox="0 0 200 120"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
                    id="lineGradient"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polyline
                  points="0,100 30,80 60,60 90,40 120,30 150,20 180,15"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="0,100 30,80 60,60 90,40 120,30 150,20 180,15 180,120 0,120"
                  fill="url(#lineGradient)"
                />
              </svg>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold">$ 21,550</p>
              <div className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400">
                <TrendingUp className="w-3 h-3" />
                <span>52.5% Since Last Week</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
