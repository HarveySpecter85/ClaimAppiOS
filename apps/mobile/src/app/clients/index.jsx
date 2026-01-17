import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  Plus,
  Briefcase,
  ChevronRight,
  MapPin,
  Phone,
} from "lucide-react-native";

export default function ClientsList() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchClients();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F2F2F7" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "#fff",
          paddingTop: insets.top + 12,
          paddingBottom: 12,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
        >
          <ChevronLeft color="#137FEC" size={20} />
          <Text style={{ fontSize: 16, color: "#137FEC" }}>Back</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827" }}>
          My Clients
        </Text>

        <TouchableOpacity onPress={() => router.push("/clients/new")}>
          <Plus color="#137FEC" size={24} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#137FEC" />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {clients.length === 0 ? (
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <Text style={{ color: "#6B7280", fontSize: 16 }}>
                No clients found. Tap + to add one.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {clients.map((client) => (
                <TouchableOpacity
                  key={client.id}
                  onPress={() => router.push(`/clients/${client.id}`)}
                  style={{
                    backgroundColor: "#fff",
                    padding: 16,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 2,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      backgroundColor: "#EFF6FF",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Briefcase color="#137FEC" size={20} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: "#111827",
                        marginBottom: 4,
                      }}
                    >
                      {client.name}
                    </Text>
                    {client.location && (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 2,
                        }}
                      >
                        <MapPin
                          color="#6B7280"
                          size={12}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={{ fontSize: 13, color: "#6B7280" }}>
                          {client.location}
                        </Text>
                      </View>
                    )}
                    {client.contact_name && (
                      <Text style={{ fontSize: 13, color: "#6B7280" }}>
                        Contact: {client.contact_name}
                      </Text>
                    )}
                  </View>

                  <ChevronRight color="#9CA3AF" size={20} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
