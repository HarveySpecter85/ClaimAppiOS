import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import {
  Clock,
  User,
  ArrowRight,
  Edit3,
  PlusCircle,
  AlertCircle,
} from "lucide-react-native";
import { format } from "date-fns";

export default function AuditLogTimeline({ entityType, entityId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [entityType, entityId]);

  const fetchLogs = async () => {
    try {
      const response = await fetch(
        `/api/audit-logs?entityType=${entityType}&entityId=${entityId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (type) => {
    switch (type) {
      case "CREATE":
        return <PlusCircle size={16} color="#10B981" />;
      case "UPDATE":
        return <Edit3 size={16} color="#3B82F6" />;
      case "STATUS_CHANGE":
        return <AlertCircle size={16} color="#F59E0B" />;
      default:
        return <Clock size={16} color="#6B7280" />;
    }
  };

  const formatChanges = (changes) => {
    if (!changes) return null;

    // Si es initial_state (CREATE)
    if (changes.initial_state) {
      return (
        <Text style={{ color: "#6B7280", fontSize: 13, marginTop: 4 }}>
          Entity created
        </Text>
      );
    }

    return Object.keys(changes).map((key) => {
      const { old: oldVal, new: newVal } = changes[key];
      // Skip internal fields if they slip through
      if (key === "updated_at") return null;

      return (
        <View key={key} style={{ marginTop: 4 }}>
          <Text
            style={{
              fontSize: 13,
              color: "#374151",
              fontWeight: "500",
              textTransform: "capitalize",
            }}
          >
            {key.replace(/_/g, " ")}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginTop: 2,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                color: "#EF4444",
                textDecorationLine: "line-through",
              }}
            >
              {String(oldVal || "Empty")}
            </Text>
            <ArrowRight size={12} color="#9CA3AF" />
            <Text style={{ fontSize: 13, color: "#10B981", fontWeight: "600" }}>
              {String(newVal || "Empty")}
            </Text>
          </View>
        </View>
      );
    });
  };

  if (loading) {
    return (
      <ActivityIndicator
        size="small"
        color="#3B82F6"
        style={{ marginTop: 20 }}
      />
    );
  }

  if (logs.length === 0) {
    return (
      <View style={{ padding: 20, alignItems: "center" }}>
        <Text style={{ color: "#9CA3AF" }}>No history found.</Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 16 }}>
      {logs.map((log, index) => (
        <View key={log.id} style={{ flexDirection: "row", marginBottom: 24 }}>
          {/* Timeline Line */}
          <View style={{ alignItems: "center", width: 30 }}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: "#F3F4F6",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1,
              }}
            >
              {getActionIcon(log.action_type)}
            </View>
            {index < logs.length - 1 && (
              <View
                style={{
                  width: 2,
                  flex: 1,
                  backgroundColor: "#E5E7EB",
                  position: "absolute",
                  top: 30,
                  bottom: -24,
                }}
              />
            )}
          </View>

          {/* Content */}
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: "#111827" }}
              >
                {log.action_type === "STATUS_CHANGE"
                  ? "Status Changed"
                  : log.action_type}
              </Text>
              <Text style={{ fontSize: 12, color: "#9CA3AF" }}>
                {format(new Date(log.created_at), "MMM d, h:mm a")}
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 2,
                marginBottom: 6,
              }}
            >
              <User size={12} color="#6B7280" style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 12, color: "#6B7280" }}>
                by {log.performed_by_name || "System"}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "#F9FAFB",
                padding: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#F3F4F6",
              }}
            >
              {formatChanges(log.changes)}
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
