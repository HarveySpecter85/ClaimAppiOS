import { View, Text, TouchableOpacity } from "react-native";
import { ChevronLeft } from "lucide-react-native";

export function InterviewHeader({
  insets,
  router,
  incidentId,
  activeTab,
  onTabChange,
  witnessCount,
}) {
  return (
    <View
      style={{
        backgroundColor: "#fff",
        paddingTop: insets.top + 16,
        paddingBottom: 0,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
      }}
    >
      <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
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
            marginBottom: 4,
          }}
        >
          Interview Details
        </Text>
        <Text style={{ fontSize: 14, color: "#6B7280" }}>
          Incident Reference: INC-{incidentId}
        </Text>
      </View>

      {/* Tab Control */}
      <View style={{ flexDirection: "row", paddingHorizontal: 20 }}>
        <TouchableOpacity
          onPress={() => onTabChange("employee")}
          style={{
            paddingVertical: 12,
            marginRight: 24,
            borderBottomWidth: 2,
            borderBottomColor:
              activeTab === "employee" ? "#3B82F6" : "transparent",
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: activeTab === "employee" ? "600" : "500",
              color: activeTab === "employee" ? "#3B82F6" : "#6B7280",
            }}
          >
            Main Interview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onTabChange("witnesses")}
          style={{
            paddingVertical: 12,
            borderBottomWidth: 2,
            borderBottomColor:
              activeTab === "witnesses" ? "#3B82F6" : "transparent",
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: activeTab === "witnesses" ? "600" : "500",
              color: activeTab === "witnesses" ? "#3B82F6" : "#6B7280",
            }}
          >
            Witnesses ({witnessCount})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
