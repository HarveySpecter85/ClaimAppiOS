import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Shield, User, Building, X } from "lucide-react";
import { useForm } from "react-hook-form";
import RoleGuard from "@/components/RoleGuard";

function normalizeSystemRole(u) {
  const fromDb = u?.system_role;
  if (fromDb === "global_admin") return "global_admin";
  if (fromDb === "standard") return "standard";
  // fallback for legacy rows
  return u?.role === "global_admin" ? "global_admin" : "standard";
}

function UserManagementContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin-users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/admin-users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-users"]);
      toast.success("User deleted");
    },
  });

  const { register, handleSubmit, reset, setValue } = useForm();

  const onSubmit = async (data) => {
    try {
      const url = editingUser
        ? `/api/admin-users/${editingUser.id}`
        : "/api/admin-users";

      const method = editingUser ? "PUT" : "POST";

      const systemRole =
        data.system_role === "global_admin" ? "global_admin" : "standard";

      // Backward-compatible payload: keep role, but treat system_role as the source of truth.
      const payload = {
        name: data.name,
        email: data.email,
        system_role: systemRole,
        role: systemRole === "global_admin" ? "global_admin" : "user",
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save");

      queryClient.invalidateQueries(["admin-users"]);
      toast.success(editingUser ? "User updated" : "User created");
      setIsModalOpen(false);
      setEditingUser(null);
      reset();
    } catch (error) {
      toast.error("Error saving user");
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setValue("name", user.name);
    setValue("email", user.email);
    setValue("system_role", normalizeSystemRole(user));
    setIsModalOpen(true);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500">Manage system users and system roles</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            reset();
            setValue("system_role", "standard");
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus size={20} />
          Add User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">
                Name
              </th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">
                Email
              </th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">
                System Role
              </th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : users?.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users?.map((user) => {
                const sysRole = normalizeSystemRole(user);
                const isGlobal = sysRole === "global_admin";

                const badgeClass = isGlobal
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : "bg-gray-50 text-gray-700 border-gray-200";

                const label = isGlobal ? "Global Admin" : "Standard";

                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <User size={16} className="text-gray-500" />
                        </div>
                        <span className="font-medium text-gray-900">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {user.email || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClass}`}
                      >
                        {isGlobal && <Shield size={12} />}
                        {label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                "Are you sure you want to delete this user?",
                              )
                            ) {
                              deleteMutation.mutate(user.id);
                            }
                          }}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingUser ? "Edit User" : "Add New User"}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  {...register("name", { required: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  {...register("email", { required: true })}
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  System Role
                </label>
                <select
                  {...register("system_role", { required: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                >
                  <option value="standard">Standard</option>
                  <option value="global_admin">Global Admin</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Save Basic Info
                </button>
              </div>
            </form>

            {editingUser && (
              <ClientRolesManager
                userId={editingUser.id}
                userName={editingUser.name}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ClientRolesManager({ userId, userName }) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const { data: clientRoles } = useQuery({
    queryKey: ["user-client-roles", userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin-users/${userId}/client-roles`);
      if (!res.ok) throw new Error("Failed to fetch roles");
      return res.json();
    },
  });

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
  });

  const addRoleMutation = useMutation({
    mutationFn: async (data) => {
      const res = await fetch(`/api/admin-users/${userId}/client-roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add role");
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["user-client-roles", userId]);
      setIsAdding(false);
      reset();
      toast.success("Access granted");
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async (roleId) => {
      const res = await fetch(
        `/api/admin-users/${userId}/client-roles?role_id=${roleId}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) throw new Error("Failed to remove role");
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["user-client-roles", userId]);
      toast.success("Access revoked");
    },
  });

  const onSubmit = (data) => {
    addRoleMutation.mutate(data);
  };

  return (
    <div className="mt-6 border-t border-gray-100 pt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Client Access & Roles
        </h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700"
        >
          <Plus size={14} />
          {isAdding ? "Cancel" : "Grant Access"}
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-gray-50 p-3 rounded-lg mb-4 space-y-3"
        >
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Client
            </label>
            <select
              {...register("client_id", { required: true })}
              className="w-full text-sm border-gray-300 rounded-md"
            >
              <option value="">Select Client...</option>
              {clients?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Role in Client
            </label>
            <select
              {...register("company_role", { required: true })}
              className="w-full text-sm border-gray-300 rounded-md"
            >
              <option value="user">User (Standard)</option>
              <option value="admin">Admin (Client Manager)</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white text-xs py-2 rounded-md hover:bg-blue-700"
          >
            Grant Access
          </button>
        </form>
      )}

      <div className="space-y-2">
        {clientRoles?.length === 0 ? (
          <p className="text-xs text-gray-500 italic">
            No client access assigned.
          </p>
        ) : (
          clientRoles?.map((role) => (
            <div
              key={role.id}
              className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div className="flex items-center gap-2">
                <Building size={14} className="text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {role.client_name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {role.company_role}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm("Revoke access to this client?")) {
                    removeRoleMutation.mutate(role.id);
                  }
                }}
                className="text-gray-400 hover:text-red-500 p-1"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function UserManagementPage() {
  return (
    <RoleGuard roles={["global_admin"]}>
      <UserManagementContent />
    </RoleGuard>
  );
}
