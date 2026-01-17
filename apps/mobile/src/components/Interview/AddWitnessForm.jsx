import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Plus } from "lucide-react-native";

export function AddWitnessForm({ witness, onWitnessChange, onSubmit }) {
  return (
    <View style={{ marginTop: 24 }}>
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: "#111827",
          marginBottom: 12,
        }}
      >
        Add New Witness
      </Text>
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: "#E5E7EB",
          gap: 12,
        }}
      >
        <View>
          <Text
            style={{
              fontSize: 13,
              color: "#6B7280",
              marginBottom: 6,
            }}
          >
            Full Name
          </Text>
          <TextInput
            style={{
              fontSize: 15,
              color: "#111827",
              padding: 12,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 8,
              backgroundColor: "#F9FAFB",
            }}
            placeholder="e.g. John Doe"
            placeholderTextColor="#9CA3AF"
            value={witness.name}
            onChangeText={(text) => onWitnessChange({ ...witness, name: text })}
          />
        </View>

        <View>
          <Text
            style={{
              fontSize: 13,
              color: "#6B7280",
              marginBottom: 6,
            }}
          >
            Role / Position
          </Text>
          <TextInput
            style={{
              fontSize: 15,
              color: "#111827",
              padding: 12,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 8,
              backgroundColor: "#F9FAFB",
            }}
            placeholder="e.g. Safety Officer"
            placeholderTextColor="#9CA3AF"
            value={witness.role}
            onChangeText={(text) => onWitnessChange({ ...witness, role: text })}
          />
        </View>

        <TouchableOpacity
          onPress={onSubmit}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            backgroundColor: "#3B82F6",
            padding: 14,
            borderRadius: 10,
            marginTop: 8,
          }}
        >
          <Plus color="#fff" size={20} />
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>
            Start Witness Interview
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
