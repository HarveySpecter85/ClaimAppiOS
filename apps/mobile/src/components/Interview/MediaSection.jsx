import { View, Text } from "react-native";
import VideoRecorder from "@/components/VideoRecorder";
import AudioRecorder from "@/components/AudioRecorder";

export function MediaSection({
  videoUri,
  onVideoUriChange,
  audioUri,
  onAudioUriChange,
}) {
  return (
    <>
      {/* Video Interview Section */}
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
          Video Interview
        </Text>
        <VideoRecorder
          videoUri={videoUri}
          onVideoUriChange={onVideoUriChange}
        />
      </View>

      {/* Audio Recording */}
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
          Audio Evidence
        </Text>
        <AudioRecorder
          audioUri={audioUri}
          onAudioUriChange={onAudioUriChange}
        />
      </View>
    </>
  );
}
