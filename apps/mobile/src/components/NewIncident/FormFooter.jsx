import { View, Text, TouchableOpacity } from "react-native";

export function FormFooter({ step, onBack, onNext }) {
  return (
    <View
      style={{
        padding: 20,
        paddingBottom: 20,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
      }}
    >
      <View style={{ flexDirection: "row", gap: 12 }}>
        {step > 1 && (
          <TouchableOpacity
            onPress={onBack}
            style={{
              flex: 1,
              backgroundColor: "#F3F4F6",
              borderRadius: 10,
              height: 50,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#374151" }}>
              Back
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={onNext}
          style={{
            flex: step > 1 ? 1 : undefined,
            flexGrow: 1,
            backgroundColor: "#3B82F6",
            borderRadius: 10,
            height: 50,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>
            {step === 4 ? "Submit Incident" : "Continue"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
