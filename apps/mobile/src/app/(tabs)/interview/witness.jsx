import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, User } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import useUpload from "@/utils/useUpload";
import { useInterviewActions } from "../../../hooks/useInterviewActions";
import { MediaSection } from "@/components/Interview/MediaSection";
import { TranscribeButton } from "@/components/Interview/TranscribeButton";
import { SuggestionsCard } from "@/components/Interview/SuggestionsCard";

export default function WitnessInterview() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const incidentId = params.incidentId;
  const witnessName = params.name;
  const witnessRole = params.role;

  const [interviewId, setInterviewId] = useState(null);
  const [statement, setStatement] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [questions, setQuestions] = useState({
    wearing_ppe: false,
    area_adequately_lit: false,
    witnessed_directly: false,
  });

  // Media State
  const [videoUri, setVideoUri] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [originalVideoUri, setOriginalVideoUri] = useState(null);
  const [originalAudioUri, setOriginalAudioUri] = useState(null);

  const [uploadFile, { loading: uploading }] = useUpload();
  const [saving, setSaving] = useState(false);

  const { handleTranscribeAndAnalyze, handleSave: performSave } =
    useInterviewActions({
      incidentId,
      interviewId,
      setInterviewId,
      videoUri,
      setVideoUri,
      audioUri,
      setAudioUri,
      originalVideoUri,
      setOriginalVideoUri,
      originalAudioUri,
      setOriginalAudioUri,
      statement,
      questions,
      setAnalyzing,
      setStatement,
      setSuggestions,
      uploadFile,
      router,
      witnessName,
      witnessRole,
      type: "witness",
    });

  const handleSave = async () => {
    setSaving(true);
    await performSave({ goBack: true });
    setSaving(false);
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
            Witness Interview
          </Text>
          <Text style={{ fontSize: 14, color: "#6B7280" }}>
            Incident Reference: INC-{incidentId}
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Witness Card */}
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
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: "#DBEAFE",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <User color="#3B82F6" size={24} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "#111827" }}
                >
                  {witnessName || "Unknown Witness"}
                </Text>
                {witnessRole ? (
                  <Text style={{ fontSize: 14, color: "#6B7280" }}>
                    {witnessRole}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* Media Section */}
          <MediaSection
            videoUri={videoUri}
            onVideoUriChange={setVideoUri}
            audioUri={audioUri}
            onAudioUriChange={setAudioUri}
          />

          {/* Transcribe Button */}
          <TranscribeButton
            onPress={handleTranscribeAndAnalyze}
            analyzing={analyzing}
            disabled={!videoUri && !audioUri}
          />

          {/* AI Suggestions */}
          <SuggestionsCard suggestions={suggestions} />

          {/* Written Statement */}
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
              placeholder="Record the witness statement..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={statement}
              onChangeText={setStatement}
            />
          </View>

          {/* Standard Questions */}
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
                    setQuestions({ ...questions, wearing_ppe: value })
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
                    setQuestions({ ...questions, area_adequately_lit: value })
                  }
                  trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
                  thumbColor={
                    questions.area_adequately_lit ? "#3B82F6" : "#F3F4F6"
                  }
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
                    setQuestions({ ...questions, witnessed_directly: value })
                  }
                  trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
                  thumbColor={
                    questions.witnessed_directly ? "#3B82F6" : "#F3F4F6"
                  }
                />
              </View>
            </View>
          </View>
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
              {uploading ? "Uploading Media..." : "Save Witness Interview"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingAnimatedView>
  );
}
