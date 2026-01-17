"use client";

import { useEffect, useState } from "react";

export default function AutoLoginPage() {
  const [status, setStatus] = useState("validating"); // validating, success, error
  const [message, setMessage] = useState("Validating access token...");

  useEffect(() => {
    // Get token from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("No access token provided");
      return;
    }

    validateAndLogin(token);
  }, []);

  const validateAndLogin = async (token) => {
    try {
      const response = await fetch(
        `/api/auth/validate-temporary-access?token=${token}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setStatus("success");
        setMessage("Access granted! Redirecting to admin panel...");

        // Wait a moment then redirect
        setTimeout(() => {
          window.location.href = "/settings/users";
        }, 2000);
      } else {
        const error = await response.json();
        setStatus("error");
        setMessage(error.error || "Invalid or expired access token");
      }
    } catch (error) {
      console.error("Error validating token:", error);
      setStatus("error");
      setMessage("Failed to validate access token");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Admin Access
          </h1>
          <p className="text-gray-600 text-sm">
            Authenticating your mobile app session...
          </p>
        </div>

        {/* Status Indicator */}
        <div className="mb-6">
          {status === "validating" && (
            <div className="flex justify-center mb-4">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          )}

          {status === "success" && (
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Message */}
        <p
          className={`text-sm mb-6 ${
            status === "error"
              ? "text-red-600"
              : status === "success"
                ? "text-green-600"
                : "text-gray-600"
          }`}
        >
          {message}
        </p>

        {/* Actions */}
        {status === "error" && (
          <div className="space-y-3">
            <button
              onClick={() => (window.location.href = "/login")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Go to Login
            </button>
            <button
              onClick={() => window.close()}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
            >
              Close Window
            </button>
          </div>
        )}

        {status === "success" && (
          <div className="text-xs text-gray-500">
            You will be redirected automatically in a few seconds...
          </div>
        )}

        {status === "validating" && (
          <div className="text-xs text-gray-500">
            Please wait while we verify your access...
          </div>
        )}
      </div>
    </div>
  );
}
