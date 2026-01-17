import { View, Text, Modal, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { X } from "lucide-react-native";
import useI18n from "@/utils/i18n/useI18n";

export function FullCardModal({
  visible,
  onClose,
  patientNameUpper,
  binNumber,
  pcn,
  memberId,
  groupId,
  incidentNumberText,
  dateOfBirth,
  dateOfInjury,
  groupName,
  authorizedBy,
  topInset,
}) {
  const { t } = useI18n();

  const titleLabel = t("prescription.fullCard");
  const labels = t("prescription.pdfLabels");
  const dobLabel = labels?.dob || "DOB";
  const doiLabel = labels?.dateOfInjury || "Date of Injury";
  const authorizedByLabel = labels?.authorizedBy || "Authorized By";
  const groupNameLabel = t("prescription.groupName");

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#0B1220" }}>
        <StatusBar style="light" />
        <View
          style={{
            paddingTop: topInset + 12,
            paddingHorizontal: 16,
            paddingBottom: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            style={{ width: 40, height: 40, justifyContent: "center" }}
          >
            <X size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
            {titleLabel}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={{ padding: 16, gap: 12 }}>
          <LinearGradient
            colors={["#137fec", "#0f65bd"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 18, padding: 18 }}
          >
            <Text
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: 12,
                fontWeight: "800",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              First Fill Temporary
            </Text>
            <Text
              style={{
                color: "#fff",
                fontSize: 22,
                fontWeight: "900",
                marginTop: 6,
              }}
            >
              {patientNameUpper || ""}
            </Text>

            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: "rgba(255,255,255,0.2)",
                marginTop: 16,
                paddingTop: 14,
                gap: 10,
              }}
            >
              <Text
                style={{ color: "rgba(255,255,255,0.75)", fontWeight: "800" }}
              >
                BIN: <Text style={{ color: "#fff" }}>{binNumber || ""}</Text>
              </Text>
              <Text
                style={{ color: "rgba(255,255,255,0.75)", fontWeight: "800" }}
              >
                PCN: <Text style={{ color: "#fff" }}>{pcn || ""}</Text>
              </Text>
              <Text
                style={{ color: "rgba(255,255,255,0.75)", fontWeight: "800" }}
              >
                {labels?.member || "Member ID"}:{" "}
                <Text style={{ color: "#fff" }}>{memberId || ""}</Text>
              </Text>
              <Text
                style={{ color: "rgba(255,255,255,0.75)", fontWeight: "800" }}
              >
                {labels?.group || "Group"}:{" "}
                <Text style={{ color: "#fff" }}>{groupId || ""}</Text>
              </Text>
            </View>
          </LinearGradient>

          <View
            style={{
              backgroundColor: "#111827",
              borderRadius: 14,
              padding: 14,
              gap: 8,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900" }}>
              {incidentNumberText}
            </Text>
            <Text style={{ color: "#9CA3AF" }}>
              {dobLabel}: {dateOfBirth || ""}
            </Text>
            <Text style={{ color: "#9CA3AF" }}>
              {doiLabel}: {dateOfInjury || ""}
            </Text>
            <Text style={{ color: "#9CA3AF" }}>
              {groupNameLabel}: {groupName || ""}
            </Text>
            <Text style={{ color: "#9CA3AF" }}>
              {authorizedByLabel}: {authorizedBy || ""}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
