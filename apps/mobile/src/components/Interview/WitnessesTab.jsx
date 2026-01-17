import { View } from "react-native";
import { WitnessList } from "./WitnessList";
import { AddWitnessForm } from "./AddWitnessForm";

export function WitnessesTab({
  witnesses,
  newWitness,
  onWitnessChange,
  onAddWitness,
}) {
  return (
    <View>
      <WitnessList witnesses={witnesses} />
      <AddWitnessForm
        witness={newWitness}
        onWitnessChange={onWitnessChange}
        onSubmit={onAddWitness}
      />
    </View>
  );
}
