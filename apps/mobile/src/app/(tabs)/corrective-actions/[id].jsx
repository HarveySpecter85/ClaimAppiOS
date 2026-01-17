import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, Plus, User, Calendar } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function CorrectiveActionsManagement() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [actions, setActions] = useState([]);
  const [activeTab, setActiveTab] = useState("open");

  useEffect(() => {
    fetchActions();
  }, [id, activeTab]);

  const fetchActions = async () => {
    try {
      const response = await fetch(
        `/api/corrective-actions?incident_id=${id}&status=${activeTab}`,
      );
      if (!response.ok) throw new Error("Failed to fetch actions");
      const data = await response.json();
      setActions(data);
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "#3B82F6";
      case "overdue":
        return "#EF4444";
      case "completed":
        return "#10B981";
      default:
        return "#6B7280";
    }
  };

  const openActions = actions.filter((a) => a.status === "open").length;
  const totalActions = actions.length;
  const progress =
    totalActions > 0 ? ((totalActions - openActions) / totalActions) * 100 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "#fff",
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginBottom: 12 }}
        >
          <ChevronLeft color="#111827" size={24} />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            color: "#111827",
            marginBottom: 16,
          }}
        >
          Corrective Actions
        </Text>

        {/* Progress Bar */}
        <View style={{ marginBottom: 12 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <Text style={{ fontSize: 13, color: "#6B7280" }}>
              Overall Progress
            </Text>
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#111827" }}>
              {Math.round(progress)}%
            </Text>
          </View>
          <View
            style={{ height: 8, backgroundColor: "#E5E7EB", borderRadius: 4 }}
          >
            <View
              style={{
                width: `${progress}%`,
                height: 8,
                backgroundColor: "#10B981",
                borderRadius: 4,
              }}
            />
          </View>
        </View>

        <Text style={{ fontSize: 13, color: "#6B7280" }}>
          {openActions} of {totalActions} actions remaining
        </Text>
      </View>

      {/* Status Tabs */}
      <View
        style={{
          backgroundColor: "#fff",
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
        }}
      >
        <View style={{ flexDirection: "row", gap: 8 }}>
          {["open", "overdue", "completed"].map((status) => (
            <TouchableOpacity
              key={status}
              onPress={() => setActiveTab(status)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: activeTab === status ? "#3B82F6" : "#F3F4F6",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: activeTab === status ? "#fff" : "#374151",
                  textTransform: "capitalize",
                }}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {actions.length === 0 ? (
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 32,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              alignItems: "center",
            }}
          >
            <Text
              style={{ fontSize: 15, color: "#6B7280", textAlign: "center" }}
            >
              No {activeTab} actions
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {actions.map((action) => (
              <View
                key={action.id}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "600",
                        color: "#111827",
                        marginBottom: 4,
                      }}
                    >
                      {action.title}
                    </Text>
                    {action.description && (
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#6B7280",
                          lineHeight: 20,
                        }}
                      >
                        {action.description}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={{ gap: 8 }}>
                  {action.assignee_name && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <User color="#6B7280" size={16} />
                      <Text style={{ fontSize: 13, color: "#6B7280" }}>
                        Assigned to {action.assignee_name}
                      </Text>
                    </View>
                  )}

                  {action.due_date && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Calendar color="#6B7280" size={16} />
                      <Text style={{ fontSize: 13, color: "#6B7280" }}>
                        Due {new Date(action.due_date).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>

                <View
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTopWidth: 1,
                    borderTopColor: "#F3F4F6",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      backgroundColor: getStatusColor(action.status) + "20",
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: getStatusColor(action.status),
                        textTransform: "uppercase",
                      }}
                    >
                      {action.status}
                    </Text>
                  </View>

                  {action.status !== "completed" && (
                    <TouchableOpacity
                      style={{ paddingHorizontal: 12, paddingVertical: 6 }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: "#3B82F6",
                        }}
                      >
                        Mark Complete
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#3B82F6",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 8,
        }}
      >
        <Plus color="#fff" size={24} />
      </TouchableOpacity>
    </View>
  );
}
