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
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  FileCheck,
} from "lucide-react";

export default function AgentDashboard() {
  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="dark:bg-gray-800/50 border-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Validations
              </CardTitle>
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mb-2">24</p>
            <p className="text-sm text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Validated Today
              </CardTitle>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mb-2">18</p>
            <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <TrendingUp className="w-4 h-4" />
              <span>+3 from yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Validations
              </CardTitle>
              <FileCheck className="w-5 h-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mb-2">1,234</p>
            <p className="text-sm text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800/50 border-none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Accuracy Score
              </CardTitle>
              <AlertCircle className="w-5 h-5 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mb-2">98.5%</p>
            <p className="text-sm text-muted-foreground">Validation accuracy</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Validations */}
      <Card className="dark:bg-gray-800/50 border-none">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Pending Validations
          </CardTitle>
          <CardDescription>
            Review and validate submitted data collections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">
                      Street Sign Collection - Submission #{item}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Submitted by Collector • 2 hours ago
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <Badge variant="secondary">12 files</Badge>
                      <Badge variant="outline">Photography</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Review
                    </Button>
                    <Button size="sm">Validate</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
