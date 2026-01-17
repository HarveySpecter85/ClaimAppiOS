import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react-native";
import { useRouter } from "expo-router";
import useI18n from "../../utils/i18n/useI18n";

export default function Investigations() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();
  const [incidents, setIncidents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncidents();
  }, [search]);

  const fetchIncidents = async () => {
    try {
      const url = search
        ? `/api/incidents?search=${encodeURIComponent(search)}`
        : "/api/incidents";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch incidents");
      const data = await response.json();
      setIncidents(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "#EF4444";
      case "high":
        return "#F59E0B";
      case "medium":
        return "#3B82F6";
      case "low":
        return "#10B981";
      default:
        return "#6B7280";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "#3B82F6";
      case "review":
        return "#F59E0B";
      case "closed":
        return "#10B981";
      default:
        return "#6B7280";
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "#fff",
          paddingTop: insets.top + 20,
          paddingBottom: 16,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "700",
            color: "#111827",
            marginBottom: 16,
          }}
        >
          {t("investigations.title")}
        </Text>

        {/* Search Bar */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#F3F4F6",
              borderRadius: 10,
              paddingHorizontal: 12,
              height: 44,
            }}
          >
            <Search color="#9CA3AF" size={20} />
            <TextInput
              style={{ flex: 1, marginLeft: 8, fontSize: 15, color: "#111827" }}
              placeholder={t("investigations.searchPlaceholder")}
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity
            style={{
              width: 44,
              height: 44,
              backgroundColor: "#F3F4F6",
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SlidersHorizontal color="#374151" size={20} />
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 6,
              backgroundColor: "#F3F4F6",
              borderRadius: 16,
            }}
          >
            <ArrowUpDown color="#374151" size={16} />
            <Text style={{ fontSize: 13, color: "#374151", fontWeight: "500" }}>
              {t("investigations.sort")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              backgroundColor: "#F3F4F6",
              borderRadius: 16,
            }}
          >
            <Text style={{ fontSize: 13, color: "#374151", fontWeight: "500" }}>
              {t("investigations.status")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              backgroundColor: "#F3F4F6",
              borderRadius: 16,
            }}
          >
            <Text style={{ fontSize: 13, color: "#374151", fontWeight: "500" }}>
              {t("investigations.priority")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Incident List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {incidents.map((incident) => (
          <TouchableOpacity
            key={incident.id}
            onPress={() => router.push(`/(tabs)/incident/${incident.id}`)}
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#111827",
                    marginBottom: 4,
                  }}
                >
                  {incident.client_name || "Unknown Client"}
                </Text>
                <Text style={{ fontSize: 13, color: "#6B7280" }}>
                  {incident.incident_number}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: getSeverityColor(incident.severity) + "20",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                  height: 24,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: getSeverityColor(incident.severity),
                    textTransform: "capitalize",
                  }}
                >
                  {incident.severity}
                </Text>
              </View>
            </View>

            {/* Details */}
            <View style={{ gap: 6, marginBottom: 12 }}>
              <View style={{ flexDirection: "row" }}>
                <Text style={{ fontSize: 14, color: "#6B7280", width: 100 }}>
                  {t("investigations.employee")}
                </Text>
                <Text style={{ fontSize: 14, color: "#111827", flex: 1 }}>
                  {incident.employee_name || "N/A"}
                </Text>
              </View>
              <View style={{ flexDirection: "row" }}>
                <Text style={{ fontSize: 14, color: "#6B7280", width: 100 }}>
                  {t("investigations.type")}
                </Text>
                <Text style={{ fontSize: 14, color: "#111827", flex: 1 }}>
                  {incident.incident_type}
                </Text>
              </View>
              <View style={{ flexDirection: "row" }}>
                <Text style={{ fontSize: 14, color: "#6B7280", width: 100 }}>
                  {t("investigations.location")}
                </Text>
                <Text style={{ fontSize: 14, color: "#111827", flex: 1 }}>
                  {incident.location}
                </Text>
              </View>
              <View style={{ flexDirection: "row" }}>
                <Text style={{ fontSize: 14, color: "#6B7280", width: 100 }}>
                  {t("investigations.date")}
                </Text>
                <Text style={{ fontSize: 14, color: "#111827", flex: 1 }}>
                  {new Date(incident.incident_date).toLocaleDateString()}
                </Text>
              </View>
            </View>

            {/* Status Badge */}
            <View
              style={{
                backgroundColor: getStatusColor(incident.status) + "15",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                alignSelf: "flex-start",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: getStatusColor(incident.status),
                  textTransform: "uppercase",
                }}
              >
                {incident.status}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
