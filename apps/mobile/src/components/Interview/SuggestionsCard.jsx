import { View, Text } from "react-native";
import { Lightbulb } from "lucide-react-native";

export function SuggestionsCard({ suggestions }) {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <View
      style={{
        backgroundColor: "#FFFBEB",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#FCD34D",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <Lightbulb color="#D97706" size={20} />
        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: "#92400E",
          }}
        >
          AI Evidence Suggestions
        </Text>
      </View>
      <View style={{ gap: 8 }}>
        {suggestions.map((suggestion, idx) => (
          <View key={idx} style={{ flexDirection: "row", gap: 8 }}>
            <Text style={{ color: "#D97706" }}>•</Text>
            <Text style={{ color: "#B45309", fontSize: 14, flex: 1 }}>
              {suggestion}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
