import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { FileText } from "lucide-react-native";

export default function Reports() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <StatusBar style="dark" />

      <View
        style={{
          backgroundColor: "#fff",
          paddingTop: insets.top + 20,
          paddingBottom: 20,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
        }}
      >
        <Text style={{ fontSize: 28, fontWeight: "700", color: "#111827" }}>
          Reports
        </Text>
      </View>

      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
        }}
      >
        <FileText color="#D1D5DB" size={64} />
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: "#6B7280",
            marginTop: 16,
            textAlign: "center",
          }}
        >
          Reports Coming Soon
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: "#9CA3AF",
            marginTop: 8,
            textAlign: "center",
          }}
        >
          Generate and view incident reports
        </Text>
      </View>
    </View>
  );
}
