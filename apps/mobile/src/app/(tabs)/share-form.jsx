import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Share,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  Info,
  ChevronDown,
  Lock,
  Mail,
  MessageCircle,
  Share2,
  Link as LinkIcon,
} from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { useMutation, useQuery } from "@tanstack/react-query";
import useI18n from "../../utils/i18n/useI18n";

const FORM_TYPES = [
  { key: "benefit_affidavit", label: "Benefit Affidavit" },
  { key: "status_log", label: "Status Log" },
  { key: "medical_authorization", label: "Medical Authorization" },
  { key: "prescription_card", label: "Prescription Card" },
  { key: "mileage_reimbursement", label: "Mileage Reimbursement" },
  { key: "modified_duty_policy", label: "Modified Duty Policy" },
  { key: "refusal_of_treatment", label: "Refusal of Treatment" },
];

export default function ShareFormLinkScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { t } = useI18n();

  const incidentId = params?.incidentId;
  const defaultFormType = params?.formType;

  const [formType, setFormType] = useState(
    typeof defaultFormType === "string" ? defaultFormType : "",
  );
  const [recipientName, setRecipientName] = useState("");
  const [recipientContact, setRecipientContact] = useState("");
  const [expiration, setExpiration] = useState("24h");
  const [requireCode, setRequireCode] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState("share");

  const { data: incident } = useQuery({
    queryKey: ["incident", incidentId],
    enabled: !!incidentId,
    queryFn: async () => {
      const res = await fetch(`/api/incidents/${incidentId}`);
      if (!res.ok) {
        throw new Error(
          `When fetching /api/incidents/${incidentId}, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  const incidentTitle = useMemo(() => {
    const n = incident?.incident_number;
    if (n) return `Case #${n}`;
    if (incidentId) return `Case #${incidentId}`;
    return "Case";
  }, [incident?.incident_number, incidentId]);

  const incidentSubtitle = useMemo(() => {
    const parts = [];
    if (incident?.site_area) parts.push(incident.site_area);
    if (incident?.location) parts.push(incident.location);
    return parts.join(" • ");
  }, [incident?.location, incident?.site_area]);

  const selectedFormLabel = useMemo(() => {
    const found = FORM_TYPES.find((f) => f.key === formType);
    return found?.label || "Select a form...";
  }, [formType]);

  const expirationLabel = useMemo(() => {
    if (expiration === "24h") return "24 Hours";
    if (expiration === "48h") return "48 Hours";
    return "7 Days";
  }, [expiration]);

  const contactLabel = useMemo(() => {
    if (deliveryMethod === "email") return "Recipient Email";
    if (deliveryMethod === "sms") return "Recipient Phone";
    return "Recipient Contact (optional)";
  }, [deliveryMethod]);

  const contactPlaceholder = useMemo(() => {
    if (deliveryMethod === "email") return "name@example.com";
    if (deliveryMethod === "sms") return "+1 (555) 123-4567";
    return "";
  }, [deliveryMethod]);

  const createLinkMutation = useMutation({
    mutationFn: async () => {
      const body = {
        incident_id: incidentId,
        form_type: formType,
        recipient_name: recipientName || null,
        recipient_contact: recipientContact || null,
        delivery_method: deliveryMethod,
        expiration,
        require_access_code: requireCode,
      };

      const res = await fetch("/api/secure-form-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(
          `When fetching /api/secure-form-links, the response was [${res.status}] ${res.statusText}`,
        );
      }

      return res.json();
    },
    onError: (e) => {
      console.error(e);
      Alert.alert("Error", "Could not generate secure link");
    },
  });

  const buildMessage = useCallback(
    ({ url, expires_at, access_code }) => {
      const exp = expires_at ? new Date(expires_at).toLocaleString() : "";

      const lines = [];
      lines.push(`Secure form link for ${incidentTitle}`);
      if (formType) {
        lines.push(`Document: ${selectedFormLabel}`);
      }
      if (exp) {
        lines.push(`Expires: ${exp}`);
      } else {
        lines.push(`Expires: ${expirationLabel}`);
      }
      lines.push("");
      lines.push(url);

      if (access_code) {
        lines.push("");
        lines.push(`Access code: ${access_code}`);
      }

      return lines.join("\n");
    },
    [incidentTitle, selectedFormLabel, expirationLabel, formType],
  );

  const sendMessage = useCallback(
    async ({ url, expires_at, access_code }) => {
      const message = buildMessage({ url, expires_at, access_code });

      if (deliveryMethod === "email") {
        const to = recipientContact || "";
        const subject = encodeURIComponent(
          `Secure form link: ${selectedFormLabel}`,
        );
        const body = encodeURIComponent(message);
        const mailto = `mailto:${to}?subject=${subject}&body=${body}`;
        const can = await Linking.canOpenURL(mailto);
        if (can) {
          await Linking.openURL(mailto);
        } else {
          await Share.share({ message });
        }
        return;
      }

      if (deliveryMethod === "sms") {
        const to = recipientContact || "";
        const encoded = encodeURIComponent(message);
        const sep = Platform.OS === "ios" ? "&" : "?";
        const smsUrl = `sms:${to}${sep}body=${encoded}`;
        const can = await Linking.canOpenURL(smsUrl);
        if (can) {
          await Linking.openURL(smsUrl);
        } else {
          await Share.share({ message });
        }
        return;
      }

      await Share.share({ message });
    },
    [buildMessage, deliveryMethod, recipientContact, selectedFormLabel],
  );

  const onGenerate = useCallback(async () => {
    if (!incidentId) {
      Alert.alert("Missing", "incidentId is required to share a form");
      return;
    }

    if (!formType) {
      Alert.alert("Missing", "Please select a document type");
      return;
    }

    if (
      (deliveryMethod === "email" || deliveryMethod === "sms") &&
      !recipientContact
    ) {
      Alert.alert(
        "Missing",
        deliveryMethod === "email"
          ? "Please enter a recipient email"
          : "Please enter a recipient phone",
      );
      return;
    }

    const result = await createLinkMutation.mutateAsync();
    if (!result?.url) {
      Alert.alert("Error", "Could not generate link");
      return;
    }

    try {
      await Clipboard.setStringAsync(result.url);
    } catch (e) {
      console.error(e);
    }

    await sendMessage(result);

    const extra = result.access_code
      ? `\n\nAccess code: ${result.access_code}`
      : "";

    Alert.alert(
      "Link generated",
      `Copied to clipboard. Valid for: ${expirationLabel}.${extra}`,
      [{ text: "Done", onPress: () => router.back() }],
    );
  }, [
    createLinkMutation,
    deliveryMethod,
    expirationLabel,
    formType,
    incidentId,
    router,
    sendMessage,
    recipientContact,
  ]);

  const isLoading = createLinkMutation.isPending;

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
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
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: "#3B82F6", fontWeight: "700", fontSize: 16 }}>
            {t("common.cancel")}
          </Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 18, fontWeight: "900", color: "#111827" }}>
          {t("shareForm.title")}
        </Text>

        <View style={{ width: 56 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Context */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: "rgba(59,130,246,0.10)",
            borderLeftWidth: 4,
            borderLeftColor: "#3B82F6",
            flexDirection: "row",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <Info size={18} color="#3B82F6" style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: "#111827" }}>
              {t("shareForm.generatingFor", { case: incidentTitle })}
            </Text>
            {incidentSubtitle ? (
              <Text style={{ fontSize: 12, color: "#374151", marginTop: 4 }}>
                {incidentSubtitle}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={{ height: 14 }} />

        {/* Form selector */}
        <View style={{ paddingHorizontal: 16 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "800",
              color: "#111827",
              marginBottom: 10,
            }}
          >
            {t("shareForm.documentType")}
          </Text>

          <View style={{ gap: 10 }}>
            {FORM_TYPES.map((f) => {
              const selected = f.key === formType;
              return (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => setFormType(f.key)}
                  style={{
                    backgroundColor: selected
                      ? "rgba(59,130,246,0.10)"
                      : "#fff",
                    borderWidth: 1,
                    borderColor: selected ? "#3B82F6" : "#E5E7EB",
                    borderRadius: 12,
                    paddingVertical: 14,
                    paddingHorizontal: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "800",
                      color: "#111827",
                    }}
                  >
                    {f.label}
                  </Text>
                  <ChevronDown
                    size={18}
                    color={selected ? "#3B82F6" : "#9CA3AF"}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 8 }}>
            Selected: {selectedFormLabel}
          </Text>
        </View>

        {/* Recipient */}
        <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "800",
              color: "#111827",
              marginBottom: 10,
            }}
          >
            {t("shareForm.recipient")}
          </Text>

          <View style={{ gap: 12 }}>
            <View>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: "#374151",
                  marginBottom: 6,
                }}
              >
                {t("shareForm.recipientName")}
              </Text>
              <TextInput
                value={recipientName}
                onChangeText={setRecipientName}
                placeholder={t("shareForm.recipientNamePlaceholder")}
                placeholderTextColor="#9CA3AF"
                style={{
                  height: 52,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  backgroundColor: "#fff",
                  paddingHorizontal: 14,
                  color: "#111827",
                }}
              />
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
                {contactLabel}
              </Text>
              <TextInput
                value={recipientContact}
                onChangeText={setRecipientContact}
                placeholder={contactPlaceholder}
                placeholderTextColor="#9CA3AF"
                keyboardType={
                  deliveryMethod === "sms" ? "phone-pad" : "default"
                }
                autoCapitalize="none"
                style={{
                  height: 52,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  backgroundColor: "#fff",
                  paddingHorizontal: 14,
                  color: "#111827",
                }}
              />
            </View>
          </View>
        </View>

        {/* Security */}
        <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
          <Text style={{ fontSize: 18, fontWeight: "900", color: "#111827" }}>
            {t("shareForm.securitySettings")}
          </Text>

          <View style={{ marginTop: 12 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: "#374151",
                marginBottom: 8,
              }}
            >
              {t("shareForm.linkExpiration")}
            </Text>

            <View
              style={{
                backgroundColor: "#EEF2F7",
                borderRadius: 12,
                padding: 6,
                flexDirection: "row",
                gap: 6,
              }}
            >
              {[
                { key: "24h", label: "24 Hours" },
                { key: "48h", label: "48 Hours" },
                { key: "7d", label: "7 Days" },
              ].map((opt) => {
                const active = expiration === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setExpiration(opt.key)}
                    style={{
                      flex: 1,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: active ? "#fff" : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: active ? 1 : 0,
                      borderColor: active ? "#E5E7EB" : "transparent",
                    }}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "800",
                        color: active ? "#3B82F6" : "#6B7280",
                      }}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View
            style={{
              marginTop: 14,
              backgroundColor: "#fff",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                flex: 1,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(59,130,246,0.10)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Lock size={18} color="#3B82F6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 14, fontWeight: "800", color: "#111827" }}
                >
                  {t("shareForm.requireAccessCode")}
                </Text>
                <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                  {t("shareForm.requireAccessCodeHint")}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setRequireCode((v) => !v)}
              style={{
                width: 52,
                height: 30,
                borderRadius: 15,
                backgroundColor: requireCode ? "#3B82F6" : "#D1D5DB",
                padding: 3,
                justifyContent: "center",
              }}
              activeOpacity={0.85}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: "#fff",
                  alignSelf: requireCode ? "flex-end" : "flex-start",
                }}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Send via */}
        <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "900",
              color: "#111827",
              marginBottom: 10,
            }}
          >
            {t("shareForm.sendVia")}
          </Text>

          <View style={{ flexDirection: "row", gap: 10 }}>
            {[
              {
                key: "email",
                label: t("shareForm.email"),
                icon: Mail,
              },
              {
                key: "sms",
                label: t("shareForm.sms"),
                icon: MessageCircle,
              },
              {
                key: "share",
                label: t("shareForm.share"),
                icon: Share2,
              },
            ].map((m) => {
              const active = deliveryMethod === m.key;
              const Icon = m.icon;
              return (
                <TouchableOpacity
                  key={m.key}
                  onPress={() => setDeliveryMethod(m.key)}
                  style={{
                    flex: 1,
                    backgroundColor: "#fff",
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: active ? "#3B82F6" : "#E5E7EB",
                    paddingVertical: 14,
                    alignItems: "center",
                    gap: 8,
                  }}
                  activeOpacity={0.85}
                >
                  <Icon size={18} color={active ? "#3B82F6" : "#6B7280"} />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "900",
                      color: "#111827",
                    }}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {deliveryMethod === "sms" && (
            <TouchableOpacity
              onPress={() =>
                Linking.openURL("https://www.ai-profitlab.io/sms-terms")
              }
              style={{ marginTop: 12, alignSelf: "flex-start" }}
            >
              <Text style={{ fontSize: 12, color: "#3B82F6" }}>
                View SMS Terms & Conditions
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Sticky footer */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          padding: 16,
          paddingBottom: insets.bottom + 16,
          gap: 10,
        }}
      >
        <TouchableOpacity
          onPress={onGenerate}
          disabled={isLoading}
          style={{
            height: 48,
            borderRadius: 14,
            backgroundColor: "#3B82F6",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 10,
          }}
          activeOpacity={0.9}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <LinkIcon size={18} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 15 }}>
                {t("shareForm.generateSecureLink")}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Lock size={14} color="#6B7280" />
          <Text style={{ fontSize: 11, color: "#6B7280", fontWeight: "700" }}>
            {t("shareForm.encryptedNote")}
          </Text>
        </View>
      </View>
    </View>
  );
}
