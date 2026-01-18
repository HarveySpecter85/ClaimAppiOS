"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { useUser } from "@/utils/useUser";
import {
  ChevronLeft,
  Calendar,
  MapPin,
  User,
  Building,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Clock,
  Send,
  X,
  FileDown,
} from "lucide-react";

export default function ReviewDetailsPage({ params }) {
  const { id } = params;
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: incident, isLoading } = useQuery({
    queryKey: ["incident", id],
    queryFn: async () => {
      const res = await fetch(`/api/incidents/${id}`);
      if (!res.ok) throw new Error("Failed to fetch incident");
      return res.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, reason }) => {
      const res = await fetch(`/api/incidents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          rejection_reason: reason || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["incident", id]);
      toast.success(
        variables.status === "approved"
          ? "Incident approved successfully"
          : "Incident returned for corrections",
      );
      setRejectModalOpen(false);
      setRejectionReason("");
    },
    onError: () => {
      toast.error("Failed to update incident status");
    },
  });

  const handleApprove = () => {
    if (confirm("Are you sure you want to approve this incident?")) {
      updateStatusMutation.mutate({ status: "approved" });
    }
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    updateStatusMutation.mutate({
      status: "rejected",
      reason: rejectionReason,
    });
  };

  const handleDownloadDossier = () => {
    window.open(`/incidents/${id}/dossier`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!incident) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <a
                href="/reviews"
                className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </a>
              <div>
                <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  {incident.incident_number}
                  <StatusBadge status={incident.status} />
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownloadDossier}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors shadow-sm"
              >
                <FileDown className="w-4 h-4" />
                Download Dossier
              </button>

              {incident.status === "submitted" && (
                <>
                  <button
                    onClick={() => setRejectModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors shadow-sm"
                  >
                    <XCircle className="w-4 h-4" />
                    Return for Corrections
                  </button>
                  <button
                    onClick={handleApprove}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve Incident
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Rejection Alert */}
        {incident.status === "rejected" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Returned for Corrections
              </h3>
              <p className="mt-1 text-sm text-red-700">
                Reason: {incident.rejection_reason}
              </p>
            </div>
          </div>
        )}

        {/* Submission Info */}
        {incident.submission_date && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-blue-800">
              Submitted for review on{" "}
              <span className="font-medium">
                {format(
                  new Date(incident.submission_date),
                  "MMMM d, yyyy 'at' h:mm a",
                )}
              </span>
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Incident Details Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  Incident Details
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Date & Time
                    </label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {format(new Date(incident.incident_date), "MMM d, yyyy")}{" "}
                      at {incident.incident_time}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Location
                    </label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {incident.location}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm leading-relaxed">
                    {incident.description || "No description provided."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Type
                    </label>
                    <div className="text-gray-900 font-medium">
                      {incident.incident_type}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                      Severity
                    </label>
                    <SeverityBadge severity={incident.severity} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Initial Cause
                  </label>
                  <p className="text-sm text-gray-700">
                    {incident.initial_cause || "N/A"}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                    Injured Body Parts
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {incident.body_parts_injured &&
                    incident.body_parts_injured.length > 0 ? (
                      incident.body_parts_injured.map((part, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs border border-gray-200"
                        >
                          {part}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">
                        None recorded
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Employee Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  Employee
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {incident.employee_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    ID: {incident.employee_number}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Position
                  </label>
                  <div className="text-sm text-gray-900">
                    {incident.employee_position || "N/A"}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Phone
                  </label>
                  <div className="text-sm text-gray-900">
                    {incident.employee_phone || "N/A"}
                  </div>
                </div>
              </div>
            </div>

            {/* Client Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-500" />
                  Client
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {incident.client_logo_url && (
                  <img
                    src={incident.client_logo_url}
                    alt="Client Logo"
                    className="h-8 object-contain mb-2"
                  />
                )}
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {incident.client_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {incident.client_location}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Contact
                  </label>
                  <div className="text-sm text-gray-900">
                    {incident.client_contact}
                  </div>
                  <div className="text-xs text-gray-500">
                    {incident.client_phone}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Return for Corrections
              </h3>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason why this incident is being returned. The
                employee will be notified to make corrections.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Description is too vague, please add more details about..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                autoFocus
              />
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={
                  !rejectionReason.trim() || updateStatusMutation.isPending
                }
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {updateStatusMutation.isPending
                  ? "Sending..."
                  : "Return Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    submitted: "bg-yellow-100 text-yellow-800 border-yellow-200",
    approved: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    open: "bg-blue-100 text-blue-800 border-blue-200",
  };

  const labels = {
    submitted: "Under Review",
    approved: "Approved",
    rejected: "Returned",
    open: "Open",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
        styles[status] || "bg-gray-100 text-gray-800 border-gray-200"
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

function SeverityBadge({ severity }) {
  const styles = {
    critical: "bg-red-100 text-red-800 border-red-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    medium: "bg-blue-100 text-blue-800 border-blue-200",
    low: "bg-green-100 text-green-800 border-green-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase border ${
        styles[severity] || "bg-gray-100 text-gray-800 border-gray-200"
      }`}
    >
      {severity}
    </span>
  );
}
