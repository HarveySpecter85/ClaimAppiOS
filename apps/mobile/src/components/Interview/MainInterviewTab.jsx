import { View } from "react-native";
import { EmployeeCard } from "./EmployeeCard";
import { MediaSection } from "./MediaSection";
import { TranscribeButton } from "./TranscribeButton";
import { SuggestionsCard } from "./SuggestionsCard";
import { WrittenStatement } from "./WrittenStatement";
import { StandardQuestions } from "./StandardQuestions";

export function MainInterviewTab({
  videoUri,
  onVideoUriChange,
  audioUri,
  onAudioUriChange,
  analyzing,
  onTranscribe,
  suggestions,
  statement,
  onStatementChange,
  questions,
  onQuestionsChange,
}) {
  return (
    <>
      <EmployeeCard />

      <MediaSection
        videoUri={videoUri}
        onVideoUriChange={onVideoUriChange}
        audioUri={audioUri}
        onAudioUriChange={onAudioUriChange}
      />

      <TranscribeButton
        onPress={onTranscribe}
        analyzing={analyzing}
        disabled={!videoUri && !audioUri}
      />

      <SuggestionsCard suggestions={suggestions} />

      <WrittenStatement value={statement} onChangeText={onStatementChange} />

      <StandardQuestions
        questions={questions}
        onQuestionsChange={onQuestionsChange}
      />
    </>
  );
}
