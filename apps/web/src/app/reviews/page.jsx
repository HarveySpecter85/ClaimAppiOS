"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";

export default function ReviewsPage() {
  const [statusFilter, setStatusFilter] = useState("submitted");

  const { data: incidents, isLoading } = useQuery({
    queryKey: ["incidents", statusFilter],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (statusFilter !== "all") {
        searchParams.append("status", statusFilter);
      }
      const res = await fetch(`/api/incidents?${searchParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch incidents");
      return res.json();
    },
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "low":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "submitted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
            <Clock className="w-3.5 h-3.5" />
            Under Review
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
            <CheckCircle className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
            <XCircle className="w-3.5 h-3.5" />
            Returned
          </span>
        );
      case "open":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            Open
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Incident Reviews
            </h1>
            <p className="mt-2 text-gray-500">
              Review and approve submitted incident reports.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
              <button
                onClick={() => setStatusFilter("submitted")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  statusFilter === "submitted"
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Needs Review
              </button>
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  statusFilter === "all"
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                All Incidents
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : incidents?.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                No incidents found
              </h3>
              <p className="mt-1 text-gray-500">
                {statusFilter === "submitted"
                  ? "Great job! All submitted incidents have been reviewed."
                  : "No incidents recorded yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Incident ID</th>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Date & Time</th>
                    <th className="px-6 py-4">Type / Severity</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {incidents.map((incident) => (
                    <tr
                      key={incident.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-medium text-gray-900">
                          {incident.incident_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {incident.employee_name || "Unknown"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {incident.employee_number}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-900">
                            {format(
                              new Date(incident.incident_date),
                              "MMM d, yyyy",
                            )}
                          </span>
                          <span className="text-xs text-gray-500">
                            {incident.incident_time}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-gray-900">
                            {incident.incident_type}
                          </span>
                          <span
                            className={`inline-flex w-fit px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${getSeverityColor(
                              incident.severity,
                            )}`}
                          >
                            {incident.severity}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {incident.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(incident.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <a
                          href={`/reviews/${incident.id}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-sm"
                        >
                          <Eye className="w-4 h-4" />
                          Review
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
