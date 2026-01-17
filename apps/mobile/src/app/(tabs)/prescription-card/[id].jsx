import { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft } from "lucide-react-native";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import { usePrescriptionCard } from "@/hooks/usePrescriptionCard";
import { CardPreview } from "@/components/PrescriptionCard/CardPreview";
import { PatientDetailsSection } from "@/components/PrescriptionCard/PatientDetailsSection";
import { PlanInformationSection } from "@/components/PrescriptionCard/PlanInformationSection";
import { DigitalConfirmationSection } from "@/components/PrescriptionCard/DigitalConfirmationSection";
import { PharmacistInstructions } from "@/components/PrescriptionCard/PharmacistInstructions";
import { ActionFooter } from "@/components/PrescriptionCard/ActionFooter";
import { FullCardModal } from "@/components/PrescriptionCard/FullCardModal";
import { PdfPreviewModal } from "@/components/PrescriptionCard/PdfPreviewModal";
import { generatePrescriptionCardPdf } from "@/utils/generatePrescriptionCardPdf";
import useI18n from "@/utils/i18n/useI18n";

export default function PrescriptionCardScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  const [showFull, setShowFull] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  const {
    loading,
    saving,
    incident,
    patientFullName,
    setPatientFullName,
    dateOfBirth,
    setDateOfBirth,
    dateOfInjury,
    setDateOfInjury,
    binNumber,
    setBinNumber,
    pcn,
    setPcn,
    memberId,
    setMemberId,
    groupName,
    setGroupName,
    groupId,
    setGroupId,
    authorizedBy,
    setAuthorizedBy,
    signatureUrl,
    setSignatureUrl,
    consent,
    setConsent,
    saveCard,
  } = usePrescriptionCard(id, t);

  const patientNameUpper = useMemo(() => {
    const v = patientFullName || "";
    return v.trim().toUpperCase();
  }, [patientFullName]);

  const incidentNumberText = incident?.incident_number
    ? `Incident #${incident.incident_number}`
    : "Incident";

  const pdfLabels = useMemo(() => {
    const v = t("prescription.pdfLabels");
    if (v && typeof v === "object") return v;
    return null;
  }, [t]);

  const pdfHtml = useMemo(() => {
    return generatePrescriptionCardPdf({
      title: t("prescription.title"),
      labels: pdfLabels,
      patientNameUpper,
      incidentNumberText,
      binNumber,
      pcn,
      memberId,
      groupId,
      dateOfBirth,
      dateOfInjury,
      authorizedBy,
      consent,
    });
  }, [
    authorizedBy,
    binNumber,
    consent,
    dateOfBirth,
    dateOfInjury,
    groupId,
    incidentNumberText,
    memberId,
    patientNameUpper,
    pcn,
    pdfLabels,
    t,
  ]);

  const titleLabel = t("prescription.title");

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#F9FAFB",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingAnimatedView
      style={{ flex: 1, backgroundColor: "#F9FAFB" }}
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "#fff",
          paddingTop: insets.top + 12,
          paddingBottom: 12,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 40, height: 40, justifyContent: "center" }}
        >
          <ArrowLeft size={22} color="#111827" />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 18,
            fontWeight: "800",
            color: "#111827",
            flex: 1,
            textAlign: "center",
          }}
        >
          {titleLabel}
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 120,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <CardPreview
          patientNameUpper={patientNameUpper}
          binNumber={binNumber}
          pcn={pcn}
          memberId={memberId}
          groupId={groupId}
          onViewFull={() => setShowFull(true)}
        />

        <PatientDetailsSection
          patientFullName={patientFullName}
          setPatientFullName={setPatientFullName}
          dateOfBirth={dateOfBirth}
          setDateOfBirth={setDateOfBirth}
          dateOfInjury={dateOfInjury}
          setDateOfInjury={setDateOfInjury}
        />

        <PlanInformationSection
          binNumber={binNumber}
          setBinNumber={setBinNumber}
          pcn={pcn}
          setPcn={setPcn}
          memberId={memberId}
          setMemberId={setMemberId}
          groupName={groupName}
          setGroupName={setGroupName}
          groupId={groupId}
          setGroupId={setGroupId}
        />

        <DigitalConfirmationSection
          authorizedBy={authorizedBy}
          setAuthorizedBy={setAuthorizedBy}
          signatureUrl={signatureUrl}
          setSignatureUrl={setSignatureUrl}
          consent={consent}
          setConsent={setConsent}
        />

        <PharmacistInstructions />
      </ScrollView>

      <ActionFooter
        saving={saving}
        onPreviewPdf={() => setShowPdfPreview(true)}
        onSave={saveCard}
        bottomInset={insets.bottom}
      />

      <FullCardModal
        visible={showFull}
        onClose={() => setShowFull(false)}
        patientNameUpper={patientNameUpper}
        binNumber={binNumber}
        pcn={pcn}
        memberId={memberId}
        groupId={groupId}
        incidentNumberText={incidentNumberText}
        dateOfBirth={dateOfBirth}
        dateOfInjury={dateOfInjury}
        groupName={groupName}
        authorizedBy={authorizedBy}
        topInset={insets.top}
      />

      <PdfPreviewModal
        visible={showPdfPreview}
        onClose={() => setShowPdfPreview(false)}
        pdfHtml={pdfHtml}
        topInset={insets.top}
      />
    </KeyboardAvoidingAnimatedView>
  );
}
