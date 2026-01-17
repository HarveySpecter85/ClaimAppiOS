import { View, Text, TextInput } from "react-native";

export function WrittenStatement({ value, onChangeText }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: "#111827",
          marginBottom: 8,
        }}
      >
        Written Statement
      </Text>
      <TextInput
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          padding: 12,
          fontSize: 15,
          color: "#111827",
          borderWidth: 1,
          borderColor: "#E5E7EB",
          minHeight: 120,
          textAlignVertical: "top",
        }}
        placeholder="Record the employee's statement..."
        placeholderTextColor="#9CA3AF"
        multiline
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}
