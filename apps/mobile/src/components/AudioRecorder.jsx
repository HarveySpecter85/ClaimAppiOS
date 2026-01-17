import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  RefreshCw,
} from "lucide-react-native";
import {
  useAudioRecorder,
  createAudioPlayer,
  RecordingPresets,
  requestRecordingPermissionsAsync,
} from "expo-audio";

export default function AudioRecorder({ audioUri, onAudioUriChange }) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Cleanup player on unmount
  useEffect(() => {
    return () => {
      if (player) {
        player.pause();
        player.remove();
      }
    };
  }, [player]);

  const handleRecord = async () => {
    try {
      if (isRecording) {
        await recorder.stop();
        setIsRecording(false);
        onAudioUriChange(recorder.uri);
      } else {
        const { granted } = await requestRecordingPermissionsAsync();
        if (!granted) {
          Alert.alert(
            "Permission Required",
            "Microphone access is needed for recording",
          );
          return;
        }

        await recorder.prepareToRecordAsync();
        recorder.record();
        setIsRecording(true);
      }
    } catch (error) {
      console.error("Recording error:", error);
      Alert.alert("Error", "Failed to toggle recording");
    }
  };

  const togglePlayback = async () => {
    if (!audioUri) return;

    try {
      if (player) {
        if (isPlaying) {
          player.pause();
          setIsPlaying(false);
        } else {
          player.play();
          setIsPlaying(true);
        }
      } else {
        const newPlayer = createAudioPlayer(audioUri);
        setPlayer(newPlayer);
        newPlayer.play();
        setIsPlaying(true);

        // Simple polling for playback status since we don't have the hook handy for external URIs easily in this context
        // or we can use event listeners if available.
        // For simplicity, we'll assume it plays to end.
        // Actually expo-audio players usually have listeners.
        newPlayer.addListener("playbackStatusUpdate", (status) => {
          if (status.didJustFinish) {
            setIsPlaying(false);
            newPlayer.seekTo(0);
            newPlayer.pause();
          }
        });
      }
    } catch (error) {
      console.error("Playback error:", error);
      Alert.alert("Error", "Failed to play audio");
    }
  };

  const handleDelete = () => {
    if (player) {
      player.pause();
      player.remove();
      setPlayer(null);
      setIsPlaying(false);
    }
    onAudioUriChange(null);
  };

  // Timer for recording
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (audioUri) {
    return (
      <View
        style={{
          backgroundColor: "#F3F4F6",
          borderRadius: 12,
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={togglePlayback}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isPlaying ? "#EF4444" : "#3B82F6",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isPlaying ? (
            <Pause color="#fff" size={20} />
          ) : (
            <Play color="#fff" size={20} />
          )}
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "500", color: "#111827" }}>
            Audio Recording
          </Text>
          {/* We could show duration here if we knew it from the file */}
        </View>

        <TouchableOpacity onPress={handleDelete}>
          <Trash2 color="#6B7280" size={20} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderStyle: "dashed",
        borderRadius: 12,
        padding: 24,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F9FAFB",
      }}
    >
      <TouchableOpacity
        onPress={handleRecord}
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: isRecording ? "#EF4444" : "#3B82F6",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        {isRecording ? (
          <Square color="#fff" size={24} />
        ) : (
          <Mic color="#fff" size={32} />
        )}
      </TouchableOpacity>

      <Text style={{ fontSize: 14, color: "#6B7280", fontWeight: "500" }}>
        {isRecording
          ? `Recording... ${formatDuration(duration)}`
          : "Tap to Record Audio"}
      </Text>
    </View>
  );
}
