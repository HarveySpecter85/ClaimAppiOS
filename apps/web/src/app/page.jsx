"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AlertTriangle, CheckCircle, Clock, Activity } from "lucide-react";
import RoleGuard from "@/components/RoleGuard";

function DashboardContent() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500">Loading dashboard...</div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Dashboard Overview
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Incidents"
          value={stats.total}
          icon={Activity}
          color="bg-blue-500"
        />
        <StatCard
          title="Open Cases"
          value={stats.open}
          icon={Clock}
          color="bg-yellow-500"
        />
        <StatCard
          title="Critical"
          value={stats.critical}
          icon={AlertTriangle}
          color="bg-red-500"
        />
        <StatCard
          title="Closed"
          value={stats.total - stats.open}
          icon={CheckCircle}
          color="bg-green-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Weekly Trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.trend}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "#f3f4f6" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar dataKey="count" fill="#18181b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {stats.recentActivity.map((activity, i) => (
              <div
                key={i}
                className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
              >
                <div
                  className={`
                  w-2 h-2 mt-2 rounded-full
                  ${activity.status === "open" ? "bg-yellow-500" : "bg-green-500"}
                `}
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {activity.incident_type} #{activity.incident_number}
                  </p>
                  <p className="text-xs text-gray-500">
                    {activity.employee_name} • {activity.client_name}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {stats.recentActivity.length === 0 && (
              <p className="text-gray-500 text-sm">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`p-3 rounded-lg text-white ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RoleGuard roles={[]}>
      <DashboardContent />
    </RoleGuard>
  );
}
