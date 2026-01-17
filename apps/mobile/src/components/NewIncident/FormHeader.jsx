import { View, Text } from "react-native";

export function FormHeader({ step, stepTitle, insets }) {
  return (
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
          fontSize: 24,
          fontWeight: "700",
          color: "#111827",
          marginBottom: 4,
        }}
      >
        {stepTitle}
      </Text>
      <Text style={{ fontSize: 14, color: "#6B7280" }}>Step {step} of 4</Text>

      {/* Progress Bar */}
      <View
        style={{
          marginTop: 16,
          height: 4,
          backgroundColor: "#E5E7EB",
          borderRadius: 2,
        }}
      >
        <View
          style={{
            width: `${(step / 4) * 100}%`,
            height: 4,
            backgroundColor: "#3B82F6",
            borderRadius: 2,
          }}
        />
      </View>
    </View>
  );
}
