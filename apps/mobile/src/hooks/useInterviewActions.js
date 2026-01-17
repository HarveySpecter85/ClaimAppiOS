import { Alert } from "react-native";

export function useInterviewActions({
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
  witnessName, // Optional: for witness interviews
  witnessRole, // Optional: for witness interviews
  type = "primary", // Default to primary
}) {
  const handleTranscribeAndAnalyze = async () => {
    if (!videoUri && !audioUri) {
      Alert.alert("No Media", "Please record video or audio first.");
      return;
    }

    try {
      setAnalyzing(true);
      let mediaUrl = null;
      let mediaType = "audio";

      // Prefer video if available, otherwise audio
      if (videoUri) {
        mediaType = "video";
        if (videoUri.startsWith("file://")) {
          const result = await uploadFile({
            reactNativeAsset: {
              uri: videoUri,
              type: "video/mp4",
              name: `interview_video_${incidentId}_${Date.now()}.mp4`,
            },
          });
          if (result.error) throw new Error(result.error);
          mediaUrl = result.url;
          setVideoUri(mediaUrl);
          setOriginalVideoUri(mediaUrl);
        } else {
          mediaUrl = videoUri;
        }
      } else if (audioUri) {
        if (
          audioUri.startsWith("file://") ||
          audioUri.startsWith("content://")
        ) {
          const result = await uploadFile({
            reactNativeAsset: {
              uri: audioUri,
              type: "audio/m4a",
              name: `interview_audio_${incidentId}_${Date.now()}.m4a`,
            },
          });
          if (result.error) throw new Error(result.error);
          mediaUrl = result.url;
          setAudioUri(mediaUrl);
          setOriginalAudioUri(mediaUrl);
        } else {
          mediaUrl = audioUri;
        }
      }

      let currentInterviewId = interviewId;
      if (!currentInterviewId) {
        const body = {
          incident_id: incidentId,
          written_statement: statement,
          video_recording_url: mediaType === "video" ? mediaUrl : null,
          audio_recording_url: mediaType === "audio" ? mediaUrl : null,
          type, // Include type
          interviewee_name: witnessName, // Include witness name
          interviewee_role: witnessRole, // Include witness role
          ...questions,
        };
        const saveRes = await fetch("/api/interviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!saveRes.ok)
          throw new Error("Failed to save draft before analysis");
        const saveData = await saveRes.json();
        currentInterviewId = saveData.id;
        setInterviewId(currentInterviewId);
      }

      const response = await fetch(
        `/api/interviews/${currentInterviewId}/analyze`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaUrl, mediaType }),
        },
      );

      if (!response.ok) throw new Error("Analysis failed");

      const data = await response.json();
      setStatement(data.text);
      setSuggestions(data.suggestions || []);

      Alert.alert(
        "Success",
        "Transcription complete and evidence suggestions generated!",
      );
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to transcribe and analyze media.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async (options = { goBack: true }) => {
    try {
      let finalVideoUrl = originalVideoUri;
      let finalAudioUrl = originalAudioUri;

      // Upload video
      if (
        videoUri &&
        videoUri !== originalVideoUri &&
        videoUri.startsWith("file://")
      ) {
        const result = await uploadFile({
          reactNativeAsset: {
            uri: videoUri,
            type: "video/mp4",
            name: `interview_video_${incidentId}_${Date.now()}.mp4`,
          },
        });
        if (result.error) {
          Alert.alert("Upload Failed", "Could not upload video.");
          return false;
        }
        finalVideoUrl = result.url;
        setOriginalVideoUri(finalVideoUrl);
      } else if (!videoUri) {
        finalVideoUrl = null;
      }

      // Upload audio
      if (
        audioUri &&
        audioUri !== originalAudioUri &&
        (audioUri.startsWith("file://") || audioUri.startsWith("content://"))
      ) {
        const result = await uploadFile({
          reactNativeAsset: {
            uri: audioUri,
            type: "audio/m4a",
            name: `interview_audio_${incidentId}_${Date.now()}.m4a`,
          },
        });
        if (result.error) {
          Alert.alert("Upload Failed", "Could not upload audio.");
          return false;
        }
        finalAudioUrl = result.url;
        setOriginalAudioUri(finalAudioUrl);
      } else if (!audioUri) {
        finalAudioUrl = null;
      }

      const method = interviewId ? "PUT" : "POST";
      const body = {
        id: interviewId,
        incident_id: incidentId,
        written_statement: statement,
        video_recording_url: finalVideoUrl,
        audio_recording_url: finalAudioUrl,
        type, // Include type
        interviewee_name: witnessName, // Include witness name
        interviewee_role: witnessRole, // Include witness role
        ...questions,
      };

      const response = await fetch("/api/interviews", {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.id) setInterviewId(data.id);

        if (options.goBack) router.back();
        return true;
      } else {
        Alert.alert("Error", "Failed to save interview details.");
        return false;
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "An unexpected error occurred.");
      return false;
    }
  };

  return {
    handleTranscribeAndAnalyze,
    handleSave,
  };
}
