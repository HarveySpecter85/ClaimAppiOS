import { View, Text, Switch } from "react-native";

export function StandardQuestions({ questions, onQuestionsChange }) {
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
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: "#111827",
          marginBottom: 12,
        }}
      >
        Standard Questions
      </Text>

      <View style={{ gap: 16 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 15, color: "#374151", flex: 1 }}>
            Was the employee wearing required PPE?
          </Text>
          <Switch
            value={questions.wearing_ppe}
            onValueChange={(value) =>
              onQuestionsChange({ ...questions, wearing_ppe: value })
            }
            trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
            thumbColor={questions.wearing_ppe ? "#3B82F6" : "#F3F4F6"}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 15, color: "#374151", flex: 1 }}>
            Was the area adequately lit?
          </Text>
          <Switch
            value={questions.area_adequately_lit}
            onValueChange={(value) =>
              onQuestionsChange({ ...questions, area_adequately_lit: value })
            }
            trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
            thumbColor={questions.area_adequately_lit ? "#3B82F6" : "#F3F4F6"}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 15, color: "#374151", flex: 1 }}>
            Did you witness the incident directly?
          </Text>
          <Switch
            value={questions.witnessed_directly}
            onValueChange={(value) =>
              onQuestionsChange({ ...questions, witnessed_directly: value })
            }
            trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
            thumbColor={questions.witnessed_directly ? "#3B82F6" : "#F3F4F6"}
          />
        </View>
      </View>
    </View>
  );
}
