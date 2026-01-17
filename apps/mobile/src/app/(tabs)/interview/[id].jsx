import { useState, useEffect } from "react";
import { View, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import useUpload from "@/utils/useUpload";
import { useInterview } from "../../../hooks/useInterview";
import { useInterviewActions } from "../../../hooks/useInterviewActions";
import { InterviewHeader } from "@/components/Interview/InterviewHeader";
import { MainInterviewTab } from "@/components/Interview/MainInterviewTab";
import { WitnessesTab } from "@/components/Interview/WitnessesTab";
import { SaveFooter } from "@/components/Interview/SaveFooter";

export default function InterviewDetails() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [activeTab, setActiveTab] = useState("employee");
  const [newWitness, setNewWitness] = useState({ name: "", role: "" });
  const [uploadFile, { loading: uploading }] = useUpload();
  const [saving, setSaving] = useState(false);

  const {
    interviewId,
    setInterviewId,
    witnessInterviews,
    statement,
    setStatement,
    suggestions,
    setSuggestions,
    analyzing,
    setAnalyzing,
    questions,
    setQuestions,
    videoUri,
    setVideoUri,
    audioUri,
    setAudioUri,
    originalVideoUri,
    setOriginalVideoUri,
    originalAudioUri,
    setOriginalAudioUri,
  } = useInterview(id);

  const { handleTranscribeAndAnalyze, handleSave: performSave } =
    useInterviewActions({
      incidentId: id,
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
    });

  const handleSave = async (options = { goBack: true }) => {
    setSaving(true);
    const result = await performSave(options);
    setSaving(false);
    return result;
  };

  const handleTabChange = (newTab) => {
    if (activeTab === "employee" && newTab !== "employee") {
      Alert.alert(
        "Save Changes?",
        "Do you want to save the Main Interview details before switching?",
        [
          {
            text: "No",
            style: "destructive",
            onPress: () => setActiveTab(newTab),
          },
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Yes, Save",
            onPress: async () => {
              const success = await handleSave({ goBack: false });
              if (success) {
                setActiveTab(newTab);
              }
            },
          },
        ],
      );
      return;
    }

    setActiveTab(newTab);
  };

  const addWitness = async () => {
    if (!newWitness.name) {
      Alert.alert("Missing Information", "Please enter a witness name.");
      return;
    }
    router.push({
      pathname: "/(tabs)/interview/witness",
      params: { incidentId: id, name: newWitness.name, role: newWitness.role },
    });
    setNewWitness({ name: "", role: "" });
  };

  return (
    <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
      <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
        <StatusBar style="dark" />

        <InterviewHeader
          insets={insets}
          router={router}
          incidentId={id}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          witnessCount={witnessInterviews.length}
        />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "employee" ? (
            <MainInterviewTab
              videoUri={videoUri}
              onVideoUriChange={setVideoUri}
              audioUri={audioUri}
              onAudioUriChange={setAudioUri}
              analyzing={analyzing}
              onTranscribe={handleTranscribeAndAnalyze}
              suggestions={suggestions}
              statement={statement}
              onStatementChange={setStatement}
              questions={questions}
              onQuestionsChange={setQuestions}
            />
          ) : (
            <WitnessesTab
              witnesses={witnessInterviews}
              newWitness={newWitness}
              onWitnessChange={setNewWitness}
              onAddWitness={addWitness}
            />
          )}
        </ScrollView>

        {activeTab === "employee" && (
          <SaveFooter
            onSave={() => handleSave({ goBack: true })}
            saving={saving}
            uploading={uploading}
          />
        )}
      </View>
    </KeyboardAvoidingAnimatedView>
  );
}
