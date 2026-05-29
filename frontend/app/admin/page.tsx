"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

import { API_URL } from "@/app/lib/config";

import { ContentLayout } from "@/app/components/admin/admin-panel/content-layout";
import { Card, CardContent } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/admin/ui/skeleton";

import { Users, FileText, ArrowUpRight, Loader2 } from "lucide-react";

type DashboardData = {
  totalUsers: number;
  totalBlogs: number;
};

const initialDashboard: DashboardData = {
  totalUsers: 0,
  totalBlogs: 0,
};

export default function PageDashboard() {
  const [loading, setLoading] = useState(true);

  const [dashboard, setDashboard] = useState<DashboardData>(initialDashboard);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/dashboard/summary`, {
        withCredentials: true,
      });

      setDashboard(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const stats = [
    {
      title: "Total Users",
      value: dashboard.totalUsers,
      icon: Users,
      description: "All registered users",
    },
    {
      title: "Total Blogs",
      value: dashboard.totalBlogs,
      icon: FileText,
      description: "Published blog posts",
    },
  ];

  return (
    <ContentLayout title="Dashboard">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="rounded-2xl border bg-background p-6 shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Overview and analytics of your system
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {loading
            ? Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="rounded-2xl border shadow-sm">
                  <CardContent className="p-5">
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-24" />

                      <Skeleton className="h-10 w-28" />

                      <Skeleton className="h-4 w-40" />
                    </div>
                  </CardContent>
                </Card>
              ))
            : stats.map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: index * 0.1,
                    }}
                  >
                    <Card className="rounded-2xl border shadow-sm transition hover:shadow-md">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              {item.title}
                            </p>

                            <h2 className="text-3xl font-bold">{item.value}</h2>

                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <ArrowUpRight className="h-3 w-3" />

                              <span>{item.description}</span>
                            </div>
                          </div>

                          <div className="rounded-xl bg-primary/10 p-3">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </motion.div>
    </ContentLayout>
  );
}
