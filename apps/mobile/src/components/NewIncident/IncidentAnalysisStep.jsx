import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
} from "react-native";
import {
  Calendar,
  Clock,
  Video,
  Mic,
  Camera,
  Play,
  Trash2,
  X,
  RefreshCw,
  Pause,
} from "lucide-react-native";
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import { useVideoPlayer, VideoView } from "expo-video";
import { useState, useRef, useEffect } from "react";
import useI18n from "@/utils/i18n/useI18n";

export function IncidentAnalysisStep({ analysisData, setAnalysisData }) {
  const { t } = useI18n();

  // Camera & Video State
  const [showCamera, setShowCamera] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [facing, setFacing] = useState("back");
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] =
    useMicrophonePermissions();
  const cameraRef = useRef(null);

  // Video Player for previewing the *last* recorded video (optional, or we can play specific ones)
  const [previewUri, setPreviewUri] = useState(null);
  const videoPlayer = useVideoPlayer(previewUri, (player) => {
    player.loop = false;
  });

  const handleVideoRecord = async () => {
    if (!cameraPermission?.granted) await requestCameraPermission();
    if (!microphonePermission?.granted) await requestMicrophonePermission();
    setShowCamera(true);
  };

  const startRecording = async () => {
    if (cameraRef.current) {
      setIsRecording(true);
      try {
        const video = await cameraRef.current.recordAsync();
        // Add to media list
        setAnalysisData({
          ...analysisData,
          media_files: [
            ...analysisData.media_files,
            { type: "video", uri: video.uri },
          ],
        });
        setPreviewUri(video.uri); // Auto-preview the new video if needed
        setShowCamera(false);
      } catch (e) {
        console.error(e);
        Alert.alert("Error", "Could not record video.");
      } finally {
        setIsRecording(false);
      }
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const handleAudioRecord = () => {
    Alert.alert("Info", "Audio recording feature coming soon.");
  };

  const removeMedia = (index) => {
    const newMedia = [...analysisData.media_files];
    newMedia.splice(index, 1);
    setAnalysisData({ ...analysisData, media_files: newMedia });
  };

  const playVideo = (uri) => {
    setPreviewUri(uri);
    videoPlayer.replace(uri);
    videoPlayer.play();
  };

  return (
    <View style={{ gap: 16 }}>
      {/* Camera Modal */}
      <Modal
        visible={showCamera}
        animationType="slide"
        onRequestClose={() => setShowCamera(false)}
      >
        <View style={{ flex: 1, backgroundColor: "black" }}>
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            mode="video"
            facing={facing}
          >
            <View
              style={{
                flex: 1,
                justifyContent: "flex-end",
                paddingBottom: 50,
                paddingHorizontal: 20,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <TouchableOpacity
                  onPress={() => setShowCamera(false)}
                  disabled={isRecording}
                >
                  <X color="white" size={32} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={isRecording ? stopRecording : startRecording}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: isRecording ? "red" : "white",
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: 4,
                    borderColor: "rgba(255,255,255,0.5)",
                  }}
                >
                  {isRecording && (
                    <View
                      style={{
                        width: 30,
                        height: 30,
                        backgroundColor: "white",
                        borderRadius: 4,
                      }}
                    />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={toggleCameraFacing}
                  disabled={isRecording}
                >
                  <RefreshCw color="white" size={32} />
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </View>
      </Modal>

      {/* Title */}
      <Text style={{ fontSize: 18, fontWeight: "600", color: "#111827" }}>
        {t("incidentAnalysis.title")}
      </Text>

      {/* Row 1: Tenure & Time on Task */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>
            {t("incidentAnalysis.employmentTenure")}
          </Text>
          <TextInput
            style={styles.input}
            value={analysisData.employment_tenure}
            onChangeText={(text) =>
              setAnalysisData({ ...analysisData, employment_tenure: text })
            }
            placeholder="e.g. 5 years"
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{t("incidentAnalysis.timeOnTask")}</Text>
          <TextInput
            style={styles.input}
            value={analysisData.time_on_task}
            onChangeText={(text) =>
              setAnalysisData({ ...analysisData, time_on_task: text })
            }
            placeholder="e.g. 2 hours"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Row 2: Shift Start & Hours Worked */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{t("incidentAnalysis.shiftStart")}</Text>
          <View style={styles.inputContainer}>
            <Clock color="#9CA3AF" size={18} />
            <TextInput
              style={styles.inputField}
              value={analysisData.shift_start_time}
              onChangeText={(text) =>
                setAnalysisData({ ...analysisData, shift_start_time: text })
              }
              placeholder="09:00 AM"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{t("incidentAnalysis.hoursWorked")}</Text>
          <TextInput
            style={styles.input}
            value={analysisData.hours_worked}
            onChangeText={(text) =>
              setAnalysisData({ ...analysisData, hours_worked: text })
            }
            placeholder="e.g. 8"
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Row 3: Last Day Off */}
      <View>
        <Text style={styles.label}>{t("incidentAnalysis.lastDayOff")}</Text>
        <View style={styles.inputContainer}>
          <Calendar color="#9CA3AF" size={18} />
          <TextInput
            style={styles.inputField}
            value={analysisData.last_day_off}
            onChangeText={(text) =>
              setAnalysisData({ ...analysisData, last_day_off: text })
            }
            placeholder="MM/DD/YYYY"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Toggles and Selectors */}
      <View style={styles.card}>
        {/* Wearing PPE */}
        <View style={styles.rowBetween}>
          <Text
            style={[styles.label, { marginBottom: 0, flex: 1, marginRight: 8 }]}
          >
            {t("incidentAnalysis.wearingPpe")}
          </Text>
          <View style={styles.toggleGroup}>
            <TouchableOpacity
              onPress={() =>
                setAnalysisData({ ...analysisData, wearing_ppe: true })
              }
              style={[
                styles.toggleBtn,
                analysisData.wearing_ppe && styles.toggleBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  analysisData.wearing_ppe && styles.toggleTextActive,
                ]}
              >
                {t("incidentAnalysis.yes")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                setAnalysisData({ ...analysisData, wearing_ppe: false })
              }
              style={[
                styles.toggleBtn,
                !analysisData.wearing_ppe && styles.toggleBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  !analysisData.wearing_ppe && styles.toggleTextActive,
                ]}
              >
                {t("incidentAnalysis.no")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.separator} />

        {/* Received Training */}
        <View style={styles.rowBetween}>
          <Text
            style={[styles.label, { marginBottom: 0, flex: 1, marginRight: 8 }]}
          >
            {t("incidentAnalysis.receivedTraining")}
          </Text>
          <View style={styles.toggleGroup}>
            <TouchableOpacity
              onPress={() =>
                setAnalysisData({ ...analysisData, received_training: true })
              }
              style={[
                styles.toggleBtn,
                analysisData.received_training && styles.toggleBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  analysisData.received_training && styles.toggleTextActive,
                ]}
              >
                {t("incidentAnalysis.yes")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                setAnalysisData({ ...analysisData, received_training: false })
              }
              style={[
                styles.toggleBtn,
                !analysisData.received_training && styles.toggleBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  !analysisData.received_training && styles.toggleTextActive,
                ]}
              >
                {t("incidentAnalysis.no")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        {/* Equipment Condition */}
        <View style={styles.rowBetween}>
          <Text
            style={[styles.label, { marginBottom: 0, flex: 1, marginRight: 8 }]}
          >
            {t("incidentAnalysis.equipmentCondition")}
          </Text>
          <View style={styles.toggleGroup}>
            <TouchableOpacity
              onPress={() =>
                setAnalysisData({
                  ...analysisData,
                  equipment_condition: "good",
                })
              }
              style={[
                styles.toggleBtn,
                analysisData.equipment_condition === "good" &&
                  styles.toggleBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  analysisData.equipment_condition === "good" &&
                    styles.toggleTextActive,
                ]}
              >
                {t("incidentAnalysis.good")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                setAnalysisData({ ...analysisData, equipment_condition: "bad" })
              }
              style={[
                styles.toggleBtn,
                analysisData.equipment_condition === "bad" &&
                  styles.toggleBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  analysisData.equipment_condition === "bad" &&
                    styles.toggleTextActive,
                ]}
              >
                {t("incidentAnalysis.bad")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.separator} />

        {/* Task Supervision */}
        <View style={styles.rowBetween}>
          <Text
            style={[styles.label, { marginBottom: 0, flex: 1, marginRight: 8 }]}
          >
            {t("incidentAnalysis.supervision")}
          </Text>
          <View style={styles.toggleGroup}>
            <TouchableOpacity
              onPress={() =>
                setAnalysisData({ ...analysisData, task_supervision: true })
              }
              style={[
                styles.toggleBtn,
                analysisData.task_supervision && styles.toggleBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  analysisData.task_supervision && styles.toggleTextActive,
                ]}
              >
                {t("incidentAnalysis.yes")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                setAnalysisData({ ...analysisData, task_supervision: false })
              }
              style={[
                styles.toggleBtn,
                !analysisData.task_supervision && styles.toggleBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  !analysisData.task_supervision && styles.toggleTextActive,
                ]}
              >
                {t("incidentAnalysis.no")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Media Evidence */}
      <View>
        <Text style={[styles.label, { marginBottom: 8 }]}>
          {t("incidentAnalysis.mediaEvidence")}
        </Text>

        {previewUri && (
          <View
            style={{
              height: 200,
              backgroundColor: "black",
              borderRadius: 8,
              marginBottom: 12,
              overflow: "hidden",
            }}
          >
            <VideoView
              player={videoPlayer}
              style={{ flex: 1 }}
              contentFit="contain"
              nativeControls
            />
          </View>
        )}

        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            onPress={handleVideoRecord}
            style={styles.mediaButton}
          >
            <Video color="#fff" size={20} />
            <Text style={styles.mediaButtonText}>
              {t("incidentAnalysis.recordVideo")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleAudioRecord}
            style={[styles.mediaButton, { backgroundColor: "#10B981" }]}
          >
            <Mic color="#fff" size={20} />
            <Text style={styles.mediaButtonText}>
              {t("incidentAnalysis.recordAudio")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* List of recordings */}
        {analysisData.media_files.length > 0 && (
          <View style={{ marginTop: 12, gap: 8 }}>
            {analysisData.media_files.map((file, index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#fff",
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                }}
              >
                <TouchableOpacity
                  onPress={() =>
                    file.type === "video" ? playVideo(file.uri) : null
                  }
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  {file.type === "video" ? (
                    <Video color="#374151" size={20} />
                  ) : (
                    <Mic color="#374151" size={20} />
                  )}
                  <Text
                    style={{
                      marginLeft: 12,
                      fontSize: 14,
                      color: "#374151",
                    }}
                    numberOfLines={1}
                  >
                    Recording {index + 1}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeMedia(index)}>
                  <Trash2 color="#EF4444" size={18} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = {
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontSize: 15,
    color: "#111827",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  inputField: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#111827",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleGroup: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  toggleTextActive: {
    color: "#111827",
    fontWeight: "600",
  },
  separator: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  mediaButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  mediaButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
};
