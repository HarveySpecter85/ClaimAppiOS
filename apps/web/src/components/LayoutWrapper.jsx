"use client";

import Sidebar from "@/components/Sidebar";
import { useUser } from "@/utils/useUser";
import { useState, useEffect } from "react";

export default function LayoutWrapper({ children }) {
  const { user, loading } = useUser();
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    // Check if we are on a public page
    const path = window.location.pathname;
    if (
      path.startsWith("/auth") ||
      path.startsWith("/share") ||
      path === "/login"
    ) {
      setIsPublic(true);
    }
  }, []);

  if (isPublic) {
    return children;
  }

  // Show Sidebar only if user is logged in
  const showSidebar = !!user;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {showSidebar && <Sidebar />}
      <main
        className={`flex-1 min-h-screen transition-all duration-200 ${showSidebar ? "md:ml-64" : ""}`}
      >
        {children}
      </main>
    </div>
  );
}
