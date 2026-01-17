import { View, Text, TouchableOpacity } from "react-native";
import { Users, Check } from "lucide-react-native";

export function WitnessList({ witnesses }) {
  return (
    <>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827" }}>
          Registered Witnesses
        </Text>
        <View
          style={{
            backgroundColor: "#EFF6FF",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              color: "#3B82F6",
              fontWeight: "600",
              fontSize: 13,
            }}
          >
            Total: {witnesses.length}
          </Text>
        </View>
      </View>

      {witnesses.length === 0 && (
        <View style={{ alignItems: "center", padding: 32, opacity: 0.5 }}>
          <Users size={48} color="#9CA3AF" />
          <Text
            style={{
              marginTop: 12,
              color: "#6B7280",
              textAlign: "center",
            }}
          >
            No witnesses recorded yet.
          </Text>
        </View>
      )}

      {witnesses.map((witness, index) => (
        <TouchableOpacity
          key={witness.id || index}
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            flexDirection: "row",
            justifyContent: "space-between",
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
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#ECFDF5",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Check size={20} color="#10B981" />
            </View>
            <View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                {witness.interviewee_name || "Witness"}
              </Text>
              <Text style={{ fontSize: 14, color: "#6B7280" }}>
                {witness.interviewee_role || "No role specified"}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </>
  );
}
