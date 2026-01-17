import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, Info, CheckCircle } from "lucide-react-native";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import SignaturePad from "@/components/SignaturePad";
import useI18n from "../../../utils/i18n/useI18n";

export default function RefusalOfTreatmentScreen() {
  const { id } = useLocalSearchParams(); // incident_id
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  const acknowledgmentText = t("refusal.acknowledgmentText");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [incident, setIncident] = useState(null);
  const [refusal, setRefusal] = useState(null);

  const [employeeName, setEmployeeName] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [employer, setEmployer] = useState("");
  const [treatmentStatus, setTreatmentStatus] = useState("first_aid_only");
  const [signatureUrl, setSignatureUrl] = useState(null);
  const [dateSigned, setDateSigned] = useState(
    new Date().toISOString().split("T")[0],
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const load = async () => {
    try {
      setLoading(true);

      const incidentRes = await fetch(`/api/incidents/${id}`);
      if (!incidentRes.ok) {
        throw new Error(
          `When fetching /api/incidents/${id}, the response was [${incidentRes.status}] ${incidentRes.statusText}`,
        );
      }
      const incidentData = await incidentRes.json();
      setIncident(incidentData);

      setEmployeeName(incidentData.employee_name || "");
      setIncidentDate(incidentData.incident_date || "");
      setEmployer(incidentData.client_name || "");

      const refusalRes = await fetch(
        `/api/refusal-of-treatments?incident_id=${id}`,
      );
      if (!refusalRes.ok) {
        throw new Error(
          `When fetching /api/refusal-of-treatments, the response was [${refusalRes.status}] ${refusalRes.statusText}`,
        );
      }
      const rows = await refusalRes.json();

      if (rows.length > 0) {
        const existing = rows[0];
        setRefusal(existing);
        setEmployeeName(
          existing.employee_name || incidentData.employee_name || "",
        );
        setIncidentDate(
          existing.incident_date || incidentData.incident_date || "",
        );
        setEmployer(existing.employer || incidentData.client_name || "");
        setTreatmentStatus(existing.treatment_status || "first_aid_only");
        setSignatureUrl(existing.employee_signature_url || null);
        setDateSigned(
          existing.date_signed || new Date().toISOString().split("T")[0],
        );
      }
    } catch (e) {
      console.error(e);
      Alert.alert(t("common.errorTitle"), t("refusal.alerts.couldNotLoad"));
    } finally {
      setLoading(false);
    }
  };

  const buildPayload = (nextStatus) => {
    return {
      incident_id: id,
      employee_name: employeeName || null,
      incident_date: incidentDate || null,
      employer: employer || null,
      treatment_status: treatmentStatus || null,
      acknowledgment_text: acknowledgmentText,
      employee_signature_url: signatureUrl || null,
      date_signed: dateSigned || null,
      status: nextStatus,
    };
  };

  const saveDraft = async () => {
    try {
      setSaving(true);
      const payload = buildPayload("draft");

      if (!refusal?.id) {
        const res = await fetch("/api/refusal-of-treatments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          throw new Error(
            `When fetching /api/refusal-of-treatments, the response was [${res.status}] ${res.statusText}`,
          );
        }
        const created = await res.json();
        setRefusal(created);
      } else {
        const res = await fetch(`/api/refusal-of-treatments/${refusal.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          throw new Error(
            `When fetching /api/refusal-of-treatments/${refusal.id}, the response was [${res.status}] ${res.statusText}`,
          );
        }
        const updated = await res.json();
        setRefusal(updated);
      }

      Alert.alert(
        t("refusal.alerts.draftSavedTitle"),
        t("refusal.alerts.draftSavedBody"),
      );
    } catch (e) {
      console.error(e);
      Alert.alert(
        t("common.errorTitle"),
        t("refusal.alerts.couldNotSaveDraft"),
      );
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    if (!employeeName) {
      Alert.alert(
        t("refusal.alerts.missingInfoTitle"),
        t("refusal.alerts.nameRequired"),
      );
      return;
    }
    if (!signatureUrl) {
      Alert.alert(
        t("refusal.alerts.missingInfoTitle"),
        t("refusal.alerts.signatureRequired"),
      );
      return;
    }

    Alert.alert(
      t("refusal.alerts.confirmTitle"),
      t("refusal.alerts.confirmBody"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("refusal.confirmRefusal"),
          style: "destructive",
          onPress: async () => {
            try {
              setSaving(true);
              const payload = buildPayload("submitted");

              if (!refusal?.id) {
                const res = await fetch("/api/refusal-of-treatments", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });
                if (!res.ok) {
                  throw new Error(
                    `When fetching /api/refusal-of-treatments, the response was [${res.status}] ${res.statusText}`,
                  );
                }
              } else {
                const res = await fetch(
                  `/api/refusal-of-treatments/${refusal.id}`,
                  {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  },
                );
                if (!res.ok) {
                  throw new Error(
                    `When fetching /api/refusal-of-treatments/${refusal.id}, the response was [${res.status}] ${res.statusText}`,
                  );
                }
              }

              Alert.alert(
                t("refusal.alerts.submittedTitle"),
                t("refusal.alerts.submittedBody"),
              );
              router.back();
            } catch (e) {
              console.error(e);
              Alert.alert(
                t("common.errorTitle"),
                t("refusal.alerts.couldNotSubmit"),
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  };

  const statusOptions = useMemo(() => {
    const v = t("refusal.options");
    if (Array.isArray(v) && v.length > 0) return v;
    return [
      { key: "first_aid_only", title: "I have received first aid only" },
      {
        key: "physician_panel_provided",
        title: "I was shown and/or given the panel of physicians",
      },
    ];
  }, [t]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#F9FAFB",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  const incidentTitle = incident?.incident_number
    ? `Incident #${incident.incident_number}`
    : "Incident";

  const incidentSubtitleParts = [];
  if (incident?.site_area) incidentSubtitleParts.push(incident.site_area);
  if (incident?.location) incidentSubtitleParts.push(incident.location);
  const incidentSubtitle = incidentSubtitleParts.join(" • ");

  const titleLabel = t("refusal.title");
  const employeeDetailsLabel = t("refusal.employeeDetails");
  const employeeNameLabel = t("refusal.employeeName");
  const employeeNamePlaceholder = t("refusal.employeeNamePlaceholder");
  const dateOfIncidentLabel = t("refusal.dateOfIncident");
  const employerLabel = t("refusal.employer");
  const employerPlaceholder = t("refusal.employerPlaceholder");
  const treatmentStatusLabel = t("refusal.treatmentStatus");
  const treatmentHintLabel = t("refusal.treatmentHint");
  const acknowledgmentLabel = t("refusal.acknowledgment");
  const signatureSectionLabel = t("refusal.signature");
  const employeeSignatureLabel = t("refusal.employeeSignature");
  const dateSignedLabel = t("refusal.dateSigned");
  const confirmLabel = t("refusal.confirmRefusal");

  return (
    <KeyboardAvoidingAnimatedView style={{ flex: 1, backgroundColor: "#fff" }}>
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
            fontWeight: "700",
            color: "#111827",
            flex: 1,
            textAlign: "center",
          }}
        >
          {titleLabel}
        </Text>

        <TouchableOpacity
          onPress={saveDraft}
          disabled={saving}
          style={{ width: 56, alignItems: "flex-end" }}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : (
            <Text style={{ color: "#3B82F6", fontWeight: "700" }}>
              {t("common.save")}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: "#F9FAFB" }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 120,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Context */}
        <View
          style={{
            backgroundColor: "rgba(59, 130, 246, 0.10)",
            borderWidth: 1,
            borderColor: "rgba(59, 130, 246, 0.22)",
            borderRadius: 12,
            padding: 12,
            flexDirection: "row",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <Info size={18} color="#3B82F6" style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#1D4ED8" }}>
              {incidentTitle}
            </Text>
            {incidentSubtitle ? (
              <Text style={{ fontSize: 12, color: "#1E40AF", marginTop: 4 }}>
                {incidentSubtitle}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Employee details */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            padding: 16,
            gap: 14,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "800", color: "#111827" }}>
            {employeeDetailsLabel}
          </Text>

          <View>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: "#374151",
                marginBottom: 6,
              }}
            >
              {employeeNameLabel}
            </Text>
            <TextInput
              value={employeeName}
              onChangeText={setEmployeeName}
              placeholder={employeeNamePlaceholder}
              placeholderTextColor="#9CA3AF"
              style={{
                height: 48,
                borderRadius: 10,
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
                fontWeight: "600",
                color: "#374151",
                marginBottom: 6,
              }}
            >
              {dateOfIncidentLabel}
            </Text>
            <TextInput
              value={incidentDate}
              onChangeText={setIncidentDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
              style={{
                height: 48,
                borderRadius: 10,
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
                fontWeight: "600",
                color: "#374151",
                marginBottom: 6,
              }}
            >
              {employerLabel}
            </Text>
            <TextInput
              value={employer}
              onChangeText={setEmployer}
              placeholder={employerPlaceholder}
              placeholderTextColor="#9CA3AF"
              style={{
                height: 48,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                backgroundColor: "#fff",
                paddingHorizontal: 14,
                color: "#111827",
              }}
            />
          </View>
        </View>

        {/* Treatment status */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            padding: 16,
            gap: 10,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "800", color: "#111827" }}>
            {treatmentStatusLabel}
          </Text>
          <Text style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>
            {treatmentHintLabel}
          </Text>

          {statusOptions.map((opt) => {
            const selected = treatmentStatus === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setTreatmentStatus(opt.key)}
                style={{
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: selected ? "#3B82F6" : "#E5E7EB",
                  backgroundColor: selected
                    ? "rgba(59, 130, 246, 0.08)"
                    : "#fff",
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: selected ? "#3B82F6" : "#D1D5DB",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {selected ? (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: "#3B82F6",
                      }}
                    />
                  ) : null}
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#111827",
                    flex: 1,
                  }}
                >
                  {opt.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Acknowledgment */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            padding: 16,
            gap: 10,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "800", color: "#111827" }}>
            {acknowledgmentLabel}
          </Text>
          <View
            style={{
              backgroundColor: "#F9FAFB",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              padding: 14,
            }}
          >
            <Text style={{ fontSize: 13, color: "#4B5563", lineHeight: 19 }}>
              {acknowledgmentText}
            </Text>
          </View>
        </View>

        {/* Signature */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            padding: 16,
            gap: 14,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "800", color: "#111827" }}>
            {signatureSectionLabel}
          </Text>

          <SignaturePad
            label={employeeSignatureLabel}
            signatureUrl={signatureUrl}
            onSignatureChange={setSignatureUrl}
            height={180}
          />

          <View
            style={{
              backgroundColor: "#F9FAFB",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              paddingHorizontal: 12,
              paddingVertical: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#6B7280" }}>
              {dateSignedLabel}
            </Text>
            <TextInput
              value={dateSigned}
              onChangeText={setDateSigned}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
              style={{
                minWidth: 130,
                textAlign: "right",
                fontSize: 14,
                fontWeight: "700",
                color: "#111827",
              }}
            />
          </View>
        </View>
      </ScrollView>

      {/* Sticky bottom action */}
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
        }}
      >
        <TouchableOpacity
          onPress={submit}
          disabled={saving}
          style={{
            height: 48,
            borderRadius: 14,
            backgroundColor: "#3B82F6",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 10,
            shadowColor: "#3B82F6",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <CheckCircle size={18} color="#fff" />
              <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff" }}>
                {confirmLabel}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingAnimatedView>
  );
}
