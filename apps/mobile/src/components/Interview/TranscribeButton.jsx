import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Wand2 } from "lucide-react-native";

export function TranscribeButton({ onPress, analyzing, disabled }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || analyzing}
        style={{
          backgroundColor: "#eff6ff",
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#bfdbfe",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {analyzing ? (
          <ActivityIndicator color="#3b82f6" />
        ) : (
          <Wand2 size={20} color="#3b82f6" />
        )}
        <Text
          style={{
            color: "#1d4ed8",
            fontWeight: "600",
            fontSize: 15,
          }}
        >
          {analyzing ? "Processing with AI..." : "Transcribe & Analyze Media"}
        </Text>
      </TouchableOpacity>
      <Text
        style={{
          fontSize: 12,
          color: "#6b7280",
          marginTop: 6,
          textAlign: "center",
        }}
      >
        Automatically converts audio to text and suggests evidence to collect.
      </Text>
    </View>
  );
}
