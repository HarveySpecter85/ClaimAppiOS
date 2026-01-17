import { View, Text, TextInput, TouchableOpacity } from "react-native";
import SignaturePad from "@/components/SignaturePad";
import useI18n from "@/utils/i18n/useI18n";

export function DigitalConfirmationSection({
  authorizedBy,
  setAuthorizedBy,
  signatureUrl,
  setSignatureUrl,
  consent,
  setConsent,
}) {
  const { t } = useI18n();

  const title = t("prescription.digitalConfirmation");
  const authorizedByLabel = t("prescription.authorizedBy");
  const signatureLabel = t("prescription.signature");
  const consentLabel = t("prescription.consent");

  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        padding: 16,
        gap: 12,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: "800", color: "#111827" }}>
        {title}
      </Text>

      <View>
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            color: "#374151",
            marginBottom: 6,
          }}
        >
          {authorizedByLabel}
        </Text>
        <TextInput
          value={authorizedBy}
          onChangeText={setAuthorizedBy}
          placeholder=""
          placeholderTextColor="#9CA3AF"
          style={{
            height: 48,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            paddingHorizontal: 14,
            color: "#111827",
            backgroundColor: "#F9FAFB",
          }}
        />
      </View>

      <SignaturePad
        label={signatureLabel}
        signatureUrl={signatureUrl}
        onSignatureChange={setSignatureUrl}
        height={140}
      />

      <TouchableOpacity
        onPress={() => setConsent((v) => !v)}
        style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}
        activeOpacity={0.85}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: consent ? "#3B82F6" : "#D1D5DB",
            backgroundColor: consent ? "#3B82F6" : "transparent",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 2,
          }}
        >
          {consent ? (
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 14 }}>
              ✓
            </Text>
          ) : null}
        </View>
        <Text
          style={{
            flex: 1,
            fontSize: 13,
            color: "#6B7280",
            lineHeight: 18,
          }}
        >
          {consentLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
