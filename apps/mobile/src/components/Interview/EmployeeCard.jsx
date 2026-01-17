import { View, Text } from "react-native";
import { User } from "lucide-react-native";

export function EmployeeCard() {
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: "#DBEAFE",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <User color="#3B82F6" size={24} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#111827",
            }}
          >
            Sarah Jenkins
          </Text>
          <Text style={{ fontSize: 14, color: "#6B7280" }}>
            EMP-992 • Forklift Operator
          </Text>
        </View>
      </View>
    </View>
  );
}
