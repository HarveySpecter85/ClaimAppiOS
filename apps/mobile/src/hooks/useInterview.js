import { useState, useEffect } from "react";

export function useInterview(incidentId) {
  const [interviewId, setInterviewId] = useState(null);
  const [witnessInterviews, setWitnessInterviews] = useState([]);
  const [statement, setStatement] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [questions, setQuestions] = useState({
    wearing_ppe: false,
    area_adequately_lit: false,
    witnessed_directly: false,
  });
  const [videoUri, setVideoUri] = useState(null);
  const [audioUri, setAudioUri] = useState(null);
  const [originalVideoUri, setOriginalVideoUri] = useState(null);
  const [originalAudioUri, setOriginalAudioUri] = useState(null);

  useEffect(() => {
    fetchInterview();
  }, [incidentId]);

  const fetchInterview = async () => {
    try {
      const response = await fetch(`/api/interviews?incident_id=${incidentId}`);
      if (!response.ok) throw new Error("Failed to fetch interview");
      const data = await response.json();

      if (data.length > 0) {
        const primary =
          data.find((i) => i.type === "primary" || i.employee_id) || data[0];
        const witnesses = data.filter((i) => i.type === "witness");

        if (primary && primary.type !== "witness") {
          setInterviewId(primary.id);
          setStatement(primary.written_statement || "");
          setQuestions({
            wearing_ppe: primary.wearing_ppe || false,
            area_adequately_lit: primary.area_adequately_lit || false,
            witnessed_directly: primary.witnessed_directly || false,
          });
          if (primary.video_recording_url) {
            setVideoUri(primary.video_recording_url);
            setOriginalVideoUri(primary.video_recording_url);
          }
          if (primary.audio_recording_url) {
            setAudioUri(primary.audio_recording_url);
            setOriginalAudioUri(primary.audio_recording_url);
          }
        }
        setWitnessInterviews(witnesses);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return {
    interviewId,
    setInterviewId,
    witnessInterviews,
    setWitnessInterviews,
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
    fetchInterview,
  };
}
