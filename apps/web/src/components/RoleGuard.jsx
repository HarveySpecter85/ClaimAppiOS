"use client";

import { useUser } from "@/utils/useUser";
import { ShieldAlert } from "lucide-react";

export default function RoleGuard({ children, roles = [], fallback = null }) {
  const { user, loading } = useUser();

  const effectiveSystemRole = user?.system_role || null;
  const effectiveLegacyRole = user?.role || null;

  if (loading) {
    return (
      <div className="p-4 flex justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-black rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return (
      fallback || (
        <div className="flex flex-col items-center justify-center p-8 text-gray-500">
          <ShieldAlert className="w-12 h-12 mb-4 text-gray-300" />
          <p>Access Denied</p>
          <p className="text-xs mt-2 text-gray-400">Please log in.</p>
          <a
            href="/login"
            className="mt-4 text-sm font-medium text-black underline"
          >
            Go to Login
          </a>
        </div>
      )
    );
  }

  if (roles.length > 0) {
    const matches =
      (effectiveSystemRole && roles.includes(effectiveSystemRole)) ||
      (effectiveLegacyRole && roles.includes(effectiveLegacyRole));

    if (!matches) {
      const current = effectiveSystemRole || effectiveLegacyRole || "unknown";
      return (
        fallback || (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <ShieldAlert className="w-12 h-12 mb-4 text-red-200" />
            <p>You do not have permission to view this content.</p>
            <p className="text-xs mt-2 text-gray-400">
              Current role: {current}
            </p>
          </div>
        )
      );
    }
  }

  return children;
}
