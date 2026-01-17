import { View, Text, TextInput } from "react-native";
import useI18n from "@/utils/i18n/useI18n";

export function PatientDetailsSection({
  patientFullName,
  setPatientFullName,
  dateOfBirth,
  setDateOfBirth,
  dateOfInjury,
  setDateOfInjury,
}) {
  const { t } = useI18n();

  const title = t("prescription.patientDetails");
  const fullNameLabel = t("prescription.patientFullName");
  const fullNamePlaceholder = t("prescription.patientFullNamePlaceholder");
  const dobLabel = t("prescription.dateOfBirth");
  const doiLabel = t("prescription.dateOfInjury");

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
          {fullNameLabel}
        </Text>
        <TextInput
          value={patientFullName}
          onChangeText={setPatientFullName}
          placeholder={fullNamePlaceholder}
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

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: "#374151",
              marginBottom: 6,
            }}
          >
            {dobLabel}
          </Text>
          <TextInput
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            placeholder="YYYY-MM-DD"
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
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: "#374151",
              marginBottom: 6,
            }}
          >
            {doiLabel}
          </Text>
          <TextInput
            value={dateOfInjury}
            onChangeText={setDateOfInjury}
            placeholder="YYYY-MM-DD"
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
      </View>
    </View>
  );
}
