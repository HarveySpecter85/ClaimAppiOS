import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Eye } from "lucide-react-native";
import useI18n from "@/utils/i18n/useI18n";

export function CardPreview({
  patientNameUpper,
  binNumber,
  pcn,
  memberId,
  groupId,
  onViewFull,
}) {
  const { t } = useI18n();

  const cardPreviewLabel = t("prescription.cardPreview");
  const viewFullLabel = t("prescription.viewFull");

  const labels = t("prescription.pdfLabels");
  const rxCardLabel = labels?.rxCard || "RX CARD";
  const patientNameLabel = labels?.patientName || "Patient Name";
  const memberIdLabel = labels?.member || "Member ID";
  const groupLabel = labels?.group || "Group";

  return (
    <View style={{ gap: 10 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#111827" }}>
          {cardPreviewLabel}
        </Text>
        <TouchableOpacity
          onPress={onViewFull}
          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <Eye size={16} color="#3B82F6" />
          <Text style={{ color: "#3B82F6", fontWeight: "700" }}>
            {viewFullLabel}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={onViewFull}
        style={{ borderRadius: 16, overflow: "hidden" }}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={["#137fec", "#0f65bd"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            padding: 16,
            minHeight: 190,
            justifyContent: "space-between",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <View style={{ gap: 6 }}>
              <Text style={{ color: "#fff", fontSize: 22, fontWeight: "900" }}>
                Rx
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.75)",
                  fontSize: 11,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}
              >
                First Fill Temporary
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.20)",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 11, fontWeight: "900" }}>
                {rxCardLabel}
              </Text>
            </View>
          </View>

          <View style={{ gap: 2 }}>
            <Text
              style={{
                color: "rgba(255,255,255,0.70)",
                fontSize: 10,
                fontWeight: "800",
                textTransform: "uppercase",
                letterSpacing: 0.9,
              }}
            >
              {patientNameLabel}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                color: "#fff",
                fontSize: 18,
                fontWeight: "900",
                letterSpacing: 0.5,
              }}
            >
              {patientNameUpper || ""}
            </Text>
          </View>

          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: "rgba(255,255,255,0.20)",
              paddingTop: 12,
              flexDirection: "row",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <View style={{ width: "48%" }}>
              <Text
                style={{
                  color: "rgba(255,255,255,0.65)",
                  fontSize: 10,
                  fontWeight: "900",
                }}
              >
                BIN
              </Text>
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "900" }}>
                {binNumber || ""}
              </Text>
            </View>
            <View style={{ width: "48%" }}>
              <Text
                style={{
                  color: "rgba(255,255,255,0.65)",
                  fontSize: 10,
                  fontWeight: "900",
                }}
              >
                PCN
              </Text>
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "900" }}>
                {pcn || ""}
              </Text>
            </View>
            <View style={{ width: "48%" }}>
              <Text
                style={{
                  color: "rgba(255,255,255,0.65)",
                  fontSize: 10,
                  fontWeight: "900",
                }}
              >
                {memberIdLabel}
              </Text>
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "900" }}>
                {memberId || ""}
              </Text>
            </View>
            <View style={{ width: "48%" }}>
              <Text
                style={{
                  color: "rgba(255,255,255,0.65)",
                  fontSize: 10,
                  fontWeight: "900",
                }}
              >
                {groupLabel}
              </Text>
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "900" }}>
                {groupId || ""}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}
