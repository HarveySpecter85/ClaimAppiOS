import { View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import { useIncidentForm } from "@/hooks/useIncidentForm";
import { FormHeader } from "@/components/NewIncident/FormHeader";
import { FormFooter } from "@/components/NewIncident/FormFooter";
import { EmployeeDetailsStep } from "@/components/NewIncident/EmployeeDetailsStep";
import { IncidentDetailsStep } from "@/components/NewIncident/IncidentDetailsStep";
import { IncidentAnalysisStep } from "@/components/NewIncident/IncidentAnalysisStep";
import { LocationContextStep } from "@/components/NewIncident/LocationContextStep";
import { ReviewSubmitStep } from "@/components/NewIncident/ReviewSubmitStep";

export default function NewIncident() {
  const insets = useSafeAreaInsets();
  const {
    step,
    employeeSearch,
    setEmployeeSearch,
    employeeData,
    setEmployeeData,
    incidentData,
    setIncidentData,
    analysisData,
    setAnalysisData,
    locationData,
    setLocationData,
    handleNext,
    handleBack,
    toggleBodyPart,
    getStepTitle,
  } = useIncidentForm();

  return (
    <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
      <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
        <StatusBar style="dark" />

        <FormHeader step={step} stepTitle={getStepTitle()} insets={insets} />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && (
            <EmployeeDetailsStep
              employeeSearch={employeeSearch}
              setEmployeeSearch={setEmployeeSearch}
              employeeData={employeeData}
              setEmployeeData={setEmployeeData}
            />
          )}

          {step === 2 && (
            <IncidentDetailsStep
              incidentData={incidentData}
              setIncidentData={setIncidentData}
              toggleBodyPart={toggleBodyPart}
            />
          )}

          {step === 3 && (
            <IncidentAnalysisStep
              analysisData={analysisData}
              setAnalysisData={setAnalysisData}
            />
          )}

          {step === 4 && (
            <LocationContextStep
              locationData={locationData}
              setLocationData={setLocationData}
              incidentData={incidentData}
              setIncidentData={setIncidentData}
            />
          )}

          {step === 5 && (
            <ReviewSubmitStep
              employeeData={employeeData}
              incidentData={incidentData}
              analysisData={analysisData}
              locationData={locationData}
            />
          )}
        </ScrollView>

        <FormFooter step={step} onBack={handleBack} onNext={handleNext} />
      </View>
    </KeyboardAvoidingAnimatedView>
  );
}
