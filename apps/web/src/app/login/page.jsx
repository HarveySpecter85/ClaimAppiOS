"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.length > 0;
  }, [email, password]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        let msg = "Credenciales inválidas";
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch (e) {
          // ignore
        }
        throw new Error(msg);
      }

      return res.json();
    },
    onSuccess: () => {
      // force a full reload so server/client pages and guards re-evaluate with cookies
      window.location.href = "/";
    },
    onError: (e) => {
      console.error(e);
      setError(e?.message || "No se pudo iniciar sesión");
    },
  });

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setError(null);
      if (!canSubmit || loginMutation.isPending) {
        return;
      }
      loginMutation.mutate({ email, password });
    },
    [canSubmit, email, password, loginMutation],
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Sign in</h1>
        <p className="text-sm text-gray-500 mt-1">
          Use your admin email + password.
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-black"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="hrodelo@fnstaffing.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-black"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || loginMutation.isPending}
            className="w-full bg-black text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
          >
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </button>

          <p className="text-xs text-gray-500">
            Tip: if you’re testing initial setup, the backdoor user
            hrodelo@fnstaffing.com + admin123 will be auto-created as Global
            Admin.
          </p>
        </form>
      </div>
    </div>
  );
}
