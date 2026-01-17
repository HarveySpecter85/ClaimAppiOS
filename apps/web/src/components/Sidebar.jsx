"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Users,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { useUser } from "@/utils/useUser";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [pathname, setPathname] = useState("");
  const { user, refetch } = useUser();

  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: FileText, label: "Incidents", href: "/incidents" },
    { icon: CheckSquare, label: "Reviews", href: "/reviews" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  // Remove the admin panel injection - it will be in settings instead

  const onLogout = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(
          `When calling /api/auth/logout, the response was [${res.status}] ${res.statusText}`,
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      await refetch();
      window.location.href = "/login";
    }
  }, [refetch]);

  // Don't render sidebar if user is not logged in
  if (!user) return null;

  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-sm border border-gray-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div
        className={`
        fixed top-0 left-0 h-full bg-white border-r border-gray-200 w-64 z-40 transition-transform duration-200 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold">Safety App</h1>
          <p className="text-xs text-gray-500 mt-1">Admin Dashboard</p>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <a
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${
                    isActive
                      ? "bg-black text-white"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <Icon size={18} />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">
              {user.name?.[0] || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="mt-3 w-full text-left text-sm font-medium text-gray-700 hover:text-black px-3 py-2 rounded-lg hover:bg-gray-50"
          >
            Log Out
          </button>
        </div>
      </div>
    </>
  );
}
