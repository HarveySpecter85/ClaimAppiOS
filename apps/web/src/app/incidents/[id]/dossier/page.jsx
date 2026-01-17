"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Printer,
  ChevronLeft,
  MapPin,
  Calendar,
  User,
  FileText,
  AlertTriangle,
  CheckCircle,
  Camera,
  MessageSquare,
} from "lucide-react";
import IncidentChat from "@/components/IncidentChat";

export default function IncidentDossierPage({ params }) {
  const { id } = params;
  const [isPrinting, setIsPrinting] = useState(false);

  // Fetch Incident Details
  const { data: incident, isLoading: incidentLoading } = useQuery({
    queryKey: ["incident", id],
    queryFn: async () => {
      const res = await fetch(`/api/incidents/${id}`);
      if (!res.ok) throw new Error("Failed to fetch incident");
      return res.json();
    },
  });

  // Fetch Evidence
  const { data: evidence } = useQuery({
    queryKey: ["evidence", id],
    queryFn: async () => {
      const res = await fetch(`/api/evidence?incident_id=${id}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch Corrective Actions
  const { data: actions } = useQuery({
    queryKey: ["corrective-actions", id],
    queryFn: async () => {
      const res = await fetch(`/api/corrective-actions?incident_id=${id}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch Interviews (assuming endpoint exists)
  const { data: interviews } = useQuery({
    queryKey: ["interviews", id],
    queryFn: async () => {
      const res = await fetch(`/api/interviews?incident_id=${id}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch Root Cause (assuming endpoint exists)
  const { data: rootCause } = useQuery({
    queryKey: ["root-cause", id],
    queryFn: async () => {
      const res = await fetch(`/api/root-cause?incident_id=${id}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  if (incidentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!incident)
    return <div className="p-8 text-center">Incident not found</div>;

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white print:min-h-0 pb-20 print:pb-0">
      {/* Navigation / Actions Bar (Hidden on Print) */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 print:hidden">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.close()}
                className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-bold text-gray-900">
                Incident Dossier
              </h1>
            </div>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Main Document (Left) */}
          <div className="flex-1 w-full min-w-0 flex justify-center lg:justify-center">
            {/* Printable Content */}
            <div className="w-full max-w-[210mm] bg-white shadow-lg print:shadow-none min-h-[297mm] print:w-full print:max-w-none">
              <div className="p-12 print:p-8 space-y-8">
                {/* Header */}
                <div className="border-b-2 border-black pb-6 flex justify-between items-end">
                  <div>
                    <h1 className="text-3xl font-bold text-black uppercase tracking-tight mb-2">
                      Incident Report
                    </h1>
                    <div className="text-sm text-gray-500 font-mono">
                      CASE #{incident.incident_number}
                    </div>
                  </div>
                  <div className="text-right">
                    {incident.client_logo_url && (
                      <img
                        src={incident.client_logo_url}
                        alt="Client Logo"
                        className="h-12 object-contain mb-2 ml-auto"
                      />
                    )}
                    <div className="text-sm text-gray-600">
                      Generated: {format(new Date(), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>

                {/* Section 1: Overview */}
                <section className="space-y-4">
                  <h2 className="text-lg font-bold text-black uppercase border-b border-gray-200 pb-1 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Incident Overview
                  </h2>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                    <div>
                      <span className="block text-gray-500 text-xs uppercase tracking-wider mb-1">
                        Date & Time
                      </span>
                      <span className="font-medium">
                        {format(
                          new Date(incident.incident_date),
                          "MMMM d, yyyy",
                        )}{" "}
                        at {incident.incident_time}
                      </span>
                    </div>
                    <div>
                      <span className="block text-gray-500 text-xs uppercase tracking-wider mb-1">
                        Location
                      </span>
                      <span className="font-medium">{incident.location}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500 text-xs uppercase tracking-wider mb-1">
                        Type
                      </span>
                      <span className="font-medium">
                        {incident.incident_type}
                      </span>
                    </div>
                    <div>
                      <span className="block text-gray-500 text-xs uppercase tracking-wider mb-1">
                        Severity
                      </span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase ${
                          incident.severity === "critical"
                            ? "bg-red-100 text-red-800"
                            : incident.severity === "high"
                              ? "bg-orange-100 text-orange-800"
                              : incident.severity === "medium"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                        } print:bg-transparent print:text-black print:border print:border-black print:px-1`}
                      >
                        {incident.severity}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-gray-500 text-xs uppercase tracking-wider mb-1">
                        Description
                      </span>
                      <p className="text-gray-900 leading-relaxed bg-gray-50 p-3 rounded print:bg-transparent print:p-0 print:border-l-2 print:border-gray-300 print:pl-3">
                        {incident.description}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-gray-500 text-xs uppercase tracking-wider mb-1">
                        Initial Cause
                      </span>
                      <p className="text-gray-900">
                        {incident.initial_cause || "N/A"}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 2: People */}
                <section className="space-y-4 break-inside-avoid">
                  <h2 className="text-lg font-bold text-black uppercase border-b border-gray-200 pb-1 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Personnel Involved
                  </h2>
                  <div className="grid grid-cols-2 gap-8 text-sm bg-gray-50 p-4 rounded print:bg-transparent print:border print:border-gray-200">
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3">Employee</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Name:</span>
                          <span className="font-medium">
                            {incident.employee_name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">ID:</span>
                          <span className="font-medium">
                            {incident.employee_number}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Position:</span>
                          <span className="font-medium">
                            {incident.employee_position || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Phone:</span>
                          <span className="font-medium">
                            {incident.employee_phone || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3">
                        Client / Site
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Client:</span>
                          <span className="font-medium">
                            {incident.client_name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Location:</span>
                          <span className="font-medium">
                            {incident.client_location}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Contact:</span>
                          <span className="font-medium">
                            {incident.client_contact || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 3: Evidence */}
                {evidence && evidence.length > 0 && (
                  <section className="space-y-4 break-before-page">
                    <h2 className="text-lg font-bold text-black uppercase border-b border-gray-200 pb-1 flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Photographic Evidence
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      {evidence.map((item, i) => (
                        <div
                          key={i}
                          className="break-inside-avoid border border-gray-200 rounded p-2"
                        >
                          <div className="aspect-video bg-gray-100 rounded overflow-hidden mb-2 relative">
                            {/* We use img tag for printing support */}
                            <img
                              src={item.file_url}
                              alt={item.file_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="text-xs">
                            <p className="font-medium text-gray-900 truncate">
                              {item.file_name}
                            </p>
                            {item.note_content && (
                              <p className="text-gray-600 mt-1 italic">
                                "{item.note_content}"
                              </p>
                            )}
                            <p className="text-gray-400 mt-1">
                              {format(
                                new Date(item.created_at),
                                "MMM d, HH:mm",
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Section 4: Investigation & Root Cause */}
                {(interviews?.length > 0 || rootCause?.length > 0) && (
                  <section className="space-y-4 break-inside-avoid">
                    <h2 className="text-lg font-bold text-black uppercase border-b border-gray-200 pb-1 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Investigation Details
                    </h2>

                    {/* Interviews */}
                    {interviews && interviews.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">
                          Witness Statements
                        </h3>
                        <div className="space-y-4">
                          {interviews.map((interview, i) => (
                            <div
                              key={i}
                              className="bg-gray-50 p-4 rounded print:bg-transparent print:border print:border-gray-200"
                            >
                              <div className="flex justify-between mb-2">
                                <span className="font-semibold text-sm">
                                  Interview #{interview.id}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {format(
                                    new Date(interview.created_at),
                                    "MMM d, yyyy",
                                  )}
                                </span>
                              </div>
                              <p className="text-sm text-gray-800 italic">
                                "
                                {interview.written_statement ||
                                  "No written statement recorded."}
                                "
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Root Cause */}
                    {rootCause && rootCause.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">
                          Root Cause Analysis (5 Whys)
                        </h3>
                        <table className="w-full text-sm border-collapse border border-gray-200">
                          <thead>
                            <tr className="bg-gray-100 print:bg-gray-200">
                              <th className="border border-gray-300 px-2 py-1 text-left w-12">
                                Level
                              </th>
                              <th className="border border-gray-300 px-2 py-1 text-left">
                                Question & Answer
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {rootCause.map((rc, i) => (
                              <tr key={i}>
                                <td className="border border-gray-300 px-2 py-1 font-bold text-center">
                                  {rc.why_level}
                                </td>
                                <td className="border border-gray-300 px-2 py-1">
                                  <div className="font-medium text-gray-900">
                                    Q: {rc.question}
                                  </div>
                                  <div className="text-gray-600 mt-0.5">
                                    A: {rc.answer}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                )}

                {/* Section 5: Corrective Actions */}
                {actions && actions.length > 0 && (
                  <section className="space-y-4 break-inside-avoid">
                    <h2 className="text-lg font-bold text-black uppercase border-b border-gray-200 pb-1 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Corrective Actions
                    </h2>
                    <table className="w-full text-sm text-left">
                      <thead className="text-gray-500 border-b border-gray-200">
                        <tr>
                          <th className="py-2 font-medium">Action Item</th>
                          <th className="py-2 font-medium">Assignee</th>
                          <th className="py-2 font-medium">Due Date</th>
                          <th className="py-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {actions.map((action, i) => (
                          <tr key={i}>
                            <td className="py-2 pr-4 align-top">
                              <div className="font-medium text-gray-900">
                                {action.title}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {action.description}
                              </div>
                            </td>
                            <td className="py-2 align-top">
                              {action.assignee_name || "Unassigned"}
                            </td>
                            <td className="py-2 align-top">
                              {action.due_date
                                ? format(new Date(action.due_date), "MMM d")
                                : "-"}
                            </td>
                            <td className="py-2 align-top">
                              <span className="uppercase text-xs font-bold">
                                {action.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                )}

                {/* Footer / Signatures */}
                <div className="mt-12 pt-12 border-t-2 border-black break-inside-avoid">
                  <div className="grid grid-cols-2 gap-12">
                    <div>
                      <div className="h-16 border-b border-gray-400 mb-2"></div>
                      <p className="text-xs uppercase font-bold text-gray-500">
                        Supervisor Signature
                      </p>
                    </div>
                    <div>
                      <div className="h-16 border-b border-gray-400 mb-2"></div>
                      <p className="text-xs uppercase font-bold text-gray-500">
                        Date
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar (Right) - Print Hidden */}
          <div className="w-full lg:w-96 print:hidden">
            <IncidentChat incidentId={id} />

            {/* Quick Actions / Tips could go here */}
            <div className="mt-6 bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
              <h4 className="font-bold flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" />
                Admin Note
              </h4>
              <p>
                Use the chat to request missing evidence or clarify details with
                the investigator. They will receive a notification on their
                device.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
