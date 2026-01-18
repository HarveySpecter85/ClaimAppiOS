"use client";

import { useRouteError } from "react-router";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { useEffect } from "react";

export default function ErrorPage() {
  const error = useRouteError();

  useEffect(() => {
    // Log error to console for debugging
    console.error("Route Error:", error);
  }, [error]);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Something went wrong
        </h1>
        <p className="text-gray-500 mb-8">
          We encountered an unexpected error. Please try refreshing the page or
          return to the dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Page
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
