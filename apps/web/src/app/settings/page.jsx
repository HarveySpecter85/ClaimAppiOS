"use client";

import { useUser } from "@/utils/useUser";
import RoleGuard from "@/components/RoleGuard";
import { Users, UserPlus, Shield, Building } from "lucide-react";

export default function SettingsPage() {
  const { user } = useUser();

  // Phase 1.1: system role vs company role separation
  const isGlobalAdmin =
    user?.system_role === "global_admin" || user?.role === "global_admin";

  return (
    <RoleGuard>
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your application settings and configurations
          </p>
        </div>

        {/* TEAM & PERSONNEL */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              TEAM & PERSONNEL
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Manage users, roles, and team members
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Admin Panel - Users Management (System level) */}
            {isGlobalAdmin && (
              <a
                href="/settings/users"
                className="block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Admin Panel
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Manage system users (Global Admin)
                    </p>
                  </div>
                </div>
              </a>
            )}

            {/* Employee Import */}
            <a
              href="/settings/employees/import"
              className="block p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Employee Import
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Bulk import employee records from CSV files
                  </p>
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* SYSTEM CONFIGURATION */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              SYSTEM CONFIGURATION
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Configure system-wide settings and policies
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Security Settings */}
            <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Security Settings
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Configure authentication, session management, and access
                    controls
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Coming soon</p>
                </div>
              </div>
            </div>

            {/* Organization Settings */}
            <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Organization Settings
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Configure company information, branding, and organizational
                    structure
                  </p>
                  <p className="text-xs text-gray-500 mt-2">Coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
