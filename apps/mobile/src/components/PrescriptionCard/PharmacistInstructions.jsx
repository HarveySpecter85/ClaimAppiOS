import { View, Text } from "react-native";
import useI18n from "@/utils/i18n/useI18n";

export function PharmacistInstructions() {
  const { t } = useI18n();
  const label = t("prescription.pharmacistInstructions");

  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        overflow: "hidden",
      }}
    >
      <View
        style={{
          padding: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: "rgba(59,130,246,0.12)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#3B82F6", fontWeight: "900" }}>i</Text>
          </View>
          <Text style={{ fontWeight: "700", color: "#111827" }}>{label}</Text>
        </View>
        <Text style={{ color: "#9CA3AF", fontWeight: "900" }}>⌄</Text>
      </View>
    </View>
  );
}
