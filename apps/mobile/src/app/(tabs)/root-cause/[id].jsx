import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, Check } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";

export default function RootCauseAnalysis() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState("5-whys");
  const [problemStatement, setProblemStatement] = useState("");
  const [whys, setWhys] = useState([
    {
      level: 1,
      question: "Why did the slip and fall occur?",
      answer: "",
      complete: false,
    },
    { level: 2, question: "Why?", answer: "", complete: false },
    { level: 3, question: "Why?", answer: "", complete: false },
    { level: 4, question: "Why?", answer: "", complete: false },
    { level: 5, question: "Why?", answer: "", complete: false },
  ]);

  useEffect(() => {
    fetchRootCause();
  }, [id]);

  const fetchRootCause = async () => {
    try {
      const response = await fetch(`/api/root-cause?incident_id=${id}`);
      if (!response.ok) throw new Error("Failed to fetch root cause");
      const data = await response.json();
      if (data.length > 0) {
        setProblemStatement(data[0].problem_statement || "");
        const existingWhys = data.map((item) => ({
          level: item.why_level,
          question: item.question,
          answer: item.answer || "",
          complete: !!item.answer,
        }));
        setWhys(existingWhys);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const updateWhy = (level, answer) => {
    setWhys(
      whys.map((why) =>
        why.level === level ? { ...why, answer, complete: !!answer } : why,
      ),
    );
  };

  const handleSave = async () => {
    for (const why of whys) {
      await fetch("/api/root-cause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incident_id: id,
          problem_statement: problemStatement,
          why_level: why.level,
          question: why.question,
          answer: why.answer,
        }),
      });
    }
    router.back();
  };

  return (
    <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
      <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
        <StatusBar style="dark" />

        {/* Header */}
        <View
          style={{
            backgroundColor: "#fff",
            paddingTop: insets.top + 16,
            paddingBottom: 16,
            paddingHorizontal: 20,
            borderBottomWidth: 1,
            borderBottomColor: "#E5E7EB",
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginBottom: 12 }}
          >
            <ChevronLeft color="#111827" size={24} />
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              color: "#111827",
              marginBottom: 4,
            }}
          >
            Root Cause Analysis
          </Text>
          <Text style={{ fontSize: 14, color: "#6B7280" }}>
            Identify underlying causes
          </Text>
        </View>

        {/* Tabs */}
        <View
          style={{
            backgroundColor: "#fff",
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#E5E7EB",
          }}
        >
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={() => setActiveTab("5-whys")}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: activeTab === "5-whys" ? "#3B82F6" : "#F3F4F6",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: activeTab === "5-whys" ? "#fff" : "#374151",
                }}
              >
                5 Whys
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("fishbone")}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor:
                  activeTab === "fishbone" ? "#3B82F6" : "#F3F4F6",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: activeTab === "fishbone" ? "#fff" : "#374151",
                }}
              >
                Fishbone
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "5-whys" && (
            <>
              {/* Problem Statement */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#111827",
                    marginBottom: 8,
                  }}
                >
                  Problem Statement
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
                    minHeight: 80,
                    textAlignVertical: "top",
                  }}
                  placeholder="Describe the problem that occurred..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  value={problemStatement}
                  onChangeText={setProblemStatement}
                />
              </View>

              {/* 5 Whys */}
              <View style={{ gap: 16 }}>
                {whys.map((why, index) => (
                  <View
                    key={why.level}
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 12,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: why.complete ? "#10B981" : "#3B82F6",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 12,
                        }}
                      >
                        {why.complete ? (
                          <Check color="#fff" size={18} />
                        ) : (
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "700",
                              color: "#fff",
                            }}
                          >
                            {why.level}
                          </Text>
                        )}
                      </View>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "600",
                          color: "#111827",
                          flex: 1,
                        }}
                      >
                        {why.question}
                      </Text>
                    </View>

                    <TextInput
                      style={{
                        backgroundColor: "#F9FAFB",
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 14,
                        color: "#111827",
                        minHeight: 60,
                        textAlignVertical: "top",
                      }}
                      placeholder="Enter your answer..."
                      placeholderTextColor="#9CA3AF"
                      multiline
                      value={why.answer}
                      onChangeText={(text) => updateWhy(why.level, text)}
                    />
                  </View>
                ))}
              </View>

              {/* Conclusion */}
              <View
                style={{
                  marginTop: 24,
                  backgroundColor: "#DBEAFE",
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "#93C5FD",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#1E40AF",
                    marginBottom: 8,
                  }}
                >
                  Root Cause Identified
                </Text>
                <Text
                  style={{ fontSize: 14, color: "#1E3A8A", lineHeight: 20 }}
                >
                  {whys[4]?.answer ||
                    'Complete all 5 "Why" questions to identify the root cause.'}
                </Text>
              </View>
            </>
          )}

          {activeTab === "fishbone" && (
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 32,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 15, color: "#6B7280", textAlign: "center" }}
              >
                Fishbone diagram coming soon
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View
          style={{
            padding: 20,
            backgroundColor: "#fff",
            borderTopWidth: 1,
            borderTopColor: "#E5E7EB",
          }}
        >
          <TouchableOpacity
            onPress={handleSave}
            style={{
              backgroundColor: "#10B981",
              borderRadius: 10,
              height: 50,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>
              Save Analysis
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingAnimatedView>
  );
}
