import { View, Text, TextInput } from "react-native";
import useI18n from "@/utils/i18n/useI18n";

export function PlanInformationSection({
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
}) {
  const { t } = useI18n();

  const title = t("prescription.planInformation");
  const binLabel = t("prescription.binNumber");
  const pcnLabel = t("prescription.pcn");
  const memberIdLabel = t("prescription.memberId");
  const groupNameLabel = t("prescription.groupName");
  const groupIdLabel = t("prescription.groupId");

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
            {binLabel}
          </Text>
          <TextInput
            value={binNumber}
            onChangeText={setBinNumber}
            placeholder="000000"
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
            {pcnLabel}
          </Text>
          <TextInput
            value={pcn}
            onChangeText={setPcn}
            placeholder="WC"
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

      <View>
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            color: "#374151",
            marginBottom: 6,
          }}
        >
          {memberIdLabel}
        </Text>
        <TextInput
          value={memberId}
          onChangeText={setMemberId}
          placeholder={memberIdLabel}
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
            {groupNameLabel}
          </Text>
          <TextInput
            value={groupName}
            onChangeText={setGroupName}
            placeholder={groupNameLabel}
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
        <View style={{ width: 120 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: "#374151",
              marginBottom: 6,
            }}
          >
            {groupIdLabel}
          </Text>
          <TextInput
            value={groupId}
            onChangeText={setGroupId}
            placeholder={groupIdLabel}
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
