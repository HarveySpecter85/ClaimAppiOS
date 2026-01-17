import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";

export function SaveFooter({ onSave, saving, uploading }) {
  return (
    <View
      style={{
        padding: 20,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
      }}
    >
      <TouchableOpacity
        onPress={onSave}
        disabled={saving || uploading}
        style={{
          backgroundColor: "#10B981",
          borderRadius: 10,
          height: 50,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
        }}
      >
        {(saving || uploading) && <ActivityIndicator color="#fff" />}
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>
          {uploading ? "Uploading Media..." : "Complete Main Interview"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
