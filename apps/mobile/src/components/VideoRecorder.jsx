import { useState, useRef } from "react";
import { View, Text, TouchableOpacity, Modal, Alert } from "react-native";
import { Camera, Video, Trash2, X, RefreshCw } from "lucide-react-native";
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import { useVideoPlayer, VideoView } from "expo-video";

export default function VideoRecorder({ videoUri, onVideoUriChange }) {
  const [showCamera, setShowCamera] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [facing, setFacing] = useState("back");
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] =
    useMicrophonePermissions();
  const cameraRef = useRef(null);

  // Video Player for preview
  const videoPlayer = useVideoPlayer(videoUri, (player) => {
    player.loop = false;
  });

  const startRecording = async () => {
    if (cameraRef.current) {
      setIsRecording(true);
      try {
        const video = await cameraRef.current.recordAsync();
        onVideoUriChange(video.uri);
        setShowCamera(false);
      } catch (e) {
        console.error(e);
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

  const handleRecordButtonPress = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert(
          "Permission required",
          "Camera permission is needed to record video.",
        );
        return;
      }
    }
    if (!microphonePermission?.granted) {
      const result = await requestMicrophonePermission();
      if (!result.granted) {
        Alert.alert(
          "Permission required",
          "Microphone permission is needed to record audio.",
        );
        return;
      }
    }
    setShowCamera(true);
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  if (videoUri) {
    return (
      <View>
        <View
          style={{
            borderRadius: 8,
            overflow: "hidden",
            height: 200,
            backgroundColor: "#000",
            marginBottom: 12,
          }}
        >
          <VideoView
            player={videoPlayer}
            style={{ flex: 1 }}
            contentFit="contain"
            nativeControls
          />
        </View>
        <TouchableOpacity
          onPress={() => onVideoUriChange(null)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            padding: 10,
            backgroundColor: "#FEF2F2",
            borderRadius: 8,
            gap: 8,
            borderWidth: 1,
            borderColor: "#FEE2E2",
          }}
        >
          <Trash2 size={18} color="#EF4444" />
          <Text style={{ color: "#EF4444", fontWeight: "500" }}>
            Remove Video
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        onPress={handleRecordButtonPress}
        style={{
          height: 120,
          backgroundColor: "#F9FAFB",
          borderRadius: 8,
          borderWidth: 1,
          borderColor: "#D1D5DB",
          borderStyle: "dashed",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: "#EFF6FF",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Camera color="#3B82F6" size={24} />
        </View>
        <Text style={{ color: "#6B7280", fontWeight: "500" }}>
          Record Video
        </Text>
      </TouchableOpacity>

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
                  style={{
                    width: 32,
                    alignItems: "center",
                  }}
                >
                  <RefreshCw color="white" size={32} />
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </View>
      </Modal>
    </>
  );
}
