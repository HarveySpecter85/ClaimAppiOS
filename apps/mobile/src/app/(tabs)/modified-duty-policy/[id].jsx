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
import {
  ArrowLeft,
  Info,
  MapPin,
  ChevronDown,
  Send,
} from "lucide-react-native";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import SignaturePad from "../../../components/SignaturePad";

function FieldLabel({ children }) {
  return (
    <Text
      style={{
        fontSize: 14,
        fontWeight: "500",
        color: "#1F2937",
        marginBottom: 6,
      }}
    >
      {children}
    </Text>
  );
}

function Card({ title, children }) {
  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        padding: 18,
      }}
    >
      {title ? (
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: "#4B5563",
            textTransform: "uppercase",
            letterSpacing: 0.6,
            marginBottom: 14,
          }}
        >
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

export default function ModifiedDutyPolicyScreen() {
  const { id } = useLocalSearchParams(); // incident_id
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [incident, setIncident] = useState(null);
  const [policy, setPolicy] = useState(null);

  // Employment details
  const [employeeName, setEmployeeName] = useState("");
  const [employer, setEmployer] = useState("");
  const [location, setLocation] = useState("");

  // Position details
  const [modifiedPositionOffered, setModifiedPositionOffered] = useState("");
  const [dateOffered, setDateOffered] = useState("");
  const [dateBegins, setDateBegins] = useState("");
  const [hourlyPayRate, setHourlyPayRate] = useState("");
  const [weeklyHours, setWeeklyHours] = useState("");
  const [shiftStart, setShiftStart] = useState("");
  const [shiftEnd, setShiftEnd] = useState("");
  const [dutiesDescription, setDutiesDescription] = useState("");

  // Policy
  const [showPolicyTerms, setShowPolicyTerms] = useState(false);

  // Decision
  const [decision, setDecision] = useState("accept");

  // Signatures
  const [employeeSignatureUrl, setEmployeeSignatureUrl] = useState(null);
  const [employeeSignatureDate, setEmployeeSignatureDate] = useState("");
  const [insuredRepSignatureUrl, setInsuredRepSignatureUrl] = useState(null);
  const [insuredRepSignatureDate, setInsuredRepSignatureDate] = useState("");

  const todayISO = useMemo(() => new Date().toISOString().split("T")[0], []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      const incidentRes = await fetch(`/api/incidents/${id}`);
      if (!incidentRes.ok) {
        throw new Error(
          `When fetching /api/incidents/${id}, the response was [${incidentRes.status}] ${incidentRes.statusText}`,
        );
      }
      const incidentData = await incidentRes.json();
      setIncident(incidentData);

      const policyRes = await fetch(
        `/api/modified-duty-policies?incident_id=${id}`,
      );
      if (!policyRes.ok) {
        throw new Error(
          `When fetching /api/modified-duty-policies, the response was [${policyRes.status}] ${policyRes.statusText}`,
        );
      }
      const rows = await policyRes.json();

      if (rows.length > 0) {
        const existing = rows[0];
        setPolicy(existing);

        setEmployeeName(
          existing.employee_name || incidentData.employee_name || "",
        );
        setEmployer(existing.employer || "");
        setLocation(existing.location || incidentData.location || "");

        setModifiedPositionOffered(existing.modified_position_offered || "");
        setDateOffered(existing.date_offered || "");
        setDateBegins(existing.date_begins || "");
        setHourlyPayRate(
          existing.hourly_pay_rate !== null &&
            existing.hourly_pay_rate !== undefined
            ? String(existing.hourly_pay_rate)
            : "",
        );
        setWeeklyHours(
          existing.weekly_hours !== null && existing.weekly_hours !== undefined
            ? String(existing.weekly_hours)
            : "",
        );
        setShiftStart(existing.shift_start || "");
        setShiftEnd(existing.shift_end || "");
        setDutiesDescription(existing.duties_description || "");

        setDecision(existing.decision === "decline" ? "decline" : "accept");

        setEmployeeSignatureUrl(existing.employee_signature_url || null);
        setEmployeeSignatureDate(existing.employee_signature_date || "");
        setInsuredRepSignatureUrl(existing.insured_rep_signature_url || null);
        setInsuredRepSignatureDate(existing.insured_rep_signature_date || "");
      } else {
        // Prefill
        setEmployeeName(incidentData.employee_name || "");
        setLocation(incidentData.location || "");
        setEmployeeSignatureDate(todayISO);
      }
    } catch (e) {
      console.error(e);
      setError("Could not load Modified Duty Policy");
    } finally {
      setLoading(false);
    }
  };

  const buildPayload = (nextStatus) => {
    const pay = hourlyPayRate ? Number(hourlyPayRate) : null;
    const weekly = weeklyHours ? Number(weeklyHours) : null;

    return {
      incident_id: id,
      employee_name: employeeName || null,
      employer: employer || null,
      location: location || null,
      modified_position_offered: modifiedPositionOffered || null,
      date_offered: dateOffered || null,
      date_begins: dateBegins || null,
      hourly_pay_rate: Number.isFinite(pay) ? pay : null,
      weekly_hours: Number.isFinite(weekly) ? weekly : null,
      shift_start: shiftStart || null,
      shift_end: shiftEnd || null,
      duties_description: dutiesDescription || null,
      decision,
      employee_signature_url: employeeSignatureUrl || null,
      employee_signature_date: employeeSignatureDate || null,
      insured_rep_signature_url: insuredRepSignatureUrl || null,
      insured_rep_signature_date: insuredRepSignatureDate || null,
      status: nextStatus,
    };
  };

  const saveDraft = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload = buildPayload("draft");

      if (!policy?.id) {
        const res = await fetch("/api/modified-duty-policies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          throw new Error(
            `When fetching /api/modified-duty-policies, the response was [${res.status}] ${res.statusText}`,
          );
        }
        const created = await res.json();
        setPolicy(created);
      } else {
        const res = await fetch(`/api/modified-duty-policies/${policy.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          throw new Error(
            `When fetching /api/modified-duty-policies/${policy.id}, the response was [${res.status}] ${res.statusText}`,
          );
        }
        const updated = await res.json();
        setPolicy(updated);
      }

      Alert.alert("Saved", "Draft saved successfully");
    } catch (e) {
      console.error(e);
      setError("Could not save draft");
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    const missing = [];
    if (!employeeName) missing.push("Employee Name");
    if (!modifiedPositionOffered) missing.push("Modified Position Offered");
    if (!dateBegins) missing.push("Date Begins");
    if (!employeeSignatureUrl) missing.push("Employee Signature");
    if (!employeeSignatureDate) missing.push("Employee Signature Date");
    if (!insuredRepSignatureUrl) missing.push("Insured Rep. Signature");

    if (missing.length > 0) {
      Alert.alert("Missing info", `Please complete: ${missing.join(", ")}`);
      return;
    }

    Alert.alert(
      "Submit Form",
      "Are you sure you want to submit this Modified Duty Policy form?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: async () => {
            try {
              setSubmitting(true);
              setError(null);

              const payload = buildPayload("submitted");

              if (!policy?.id) {
                const res = await fetch("/api/modified-duty-policies", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });
                if (!res.ok) {
                  throw new Error(
                    `When fetching /api/modified-duty-policies, the response was [${res.status}] ${res.statusText}`,
                  );
                }
                const created = await res.json();
                setPolicy(created);
              } else {
                const res = await fetch(
                  `/api/modified-duty-policies/${policy.id}`,
                  {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  },
                );
                if (!res.ok) {
                  throw new Error(
                    `When fetching /api/modified-duty-policies/${policy.id}, the response was [${res.status}] ${res.statusText}`,
                  );
                }
                const updated = await res.json();
                setPolicy(updated);
              }

              Alert.alert("Submitted", "Form submitted successfully");
              router.back();
            } catch (e) {
              console.error(e);
              setError("Could not submit form");
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#F3F4F6",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingAnimatedView
      style={{ flex: 1, backgroundColor: "#F3F4F6" }}
      behavior="padding"
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: 12,
          paddingHorizontal: 16,
          backgroundColor: "rgba(255,255,255,0.92)",
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ padding: 8, marginLeft: -8 }}
        >
          <ArrowLeft size={22} color="#4B5563" />
        </TouchableOpacity>

        <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>
          Modified Duty Policy
        </Text>

        <TouchableOpacity
          onPress={saveDraft}
          disabled={saving}
          style={{ padding: 8, marginRight: -8 }}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <Text style={{ color: "#2563EB", fontWeight: "600" }}>Save</Text>
          )}
        </TouchableOpacity>
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
        {error ? (
          <View
            style={{
              backgroundColor: "#FEF2F2",
              borderWidth: 1,
              borderColor: "#FCA5A5",
              borderRadius: 12,
              padding: 12,
            }}
          >
            <Text style={{ color: "#991B1B", fontWeight: "600" }}>{error}</Text>
          </View>
        ) : null}

        {/* Info Banner */}
        <View
          style={{
            backgroundColor: "rgba(37, 99, 235, 0.08)",
            borderWidth: 1,
            borderColor: "rgba(37, 99, 235, 0.18)",
            borderRadius: 12,
            padding: 14,
            flexDirection: "row",
            gap: 10,
          }}
        >
          <Info size={20} color="#2563EB" />
          <Text
            style={{ flex: 1, fontSize: 14, color: "#1E40AF", lineHeight: 20 }}
          >
            This form is only required in instances where a treating physician
            releases an injured worker to work light or modified duty.
          </Text>
        </View>

        {/* Employment Details */}
        <Card title="Employment Details">
          <View style={{ gap: 14 }}>
            <View>
              <FieldLabel>Employee Name</FieldLabel>
              <TextInput
                value={employeeName}
                onChangeText={setEmployeeName}
                placeholder="John Doe"
                placeholderTextColor="#9CA3AF"
                style={{
                  backgroundColor: "#F3F4F6",
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  color: "#111827",
                }}
              />
            </View>

            <View>
              <FieldLabel>Employer</FieldLabel>
              <TextInput
                value={employer}
                onChangeText={setEmployer}
                placeholder="Company Name LLC"
                placeholderTextColor="#9CA3AF"
                style={{
                  backgroundColor: "#F3F4F6",
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  color: "#111827",
                }}
              />
            </View>

            <View>
              <FieldLabel>Location</FieldLabel>
              <View style={{ position: "relative" }}>
                <View style={{ position: "absolute", left: 12, top: 12 }}>
                  <MapPin size={18} color="#9CA3AF" />
                </View>
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Site Location"
                  placeholderTextColor="#9CA3AF"
                  style={{
                    backgroundColor: "#F3F4F6",
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    paddingLeft: 36,
                    paddingRight: 14,
                    paddingVertical: 12,
                    color: "#111827",
                  }}
                />
              </View>
            </View>
          </View>
        </Card>

        {/* Position Details */}
        <Card title="Position Details">
          <View style={{ gap: 14 }}>
            <View>
              <FieldLabel>Modified Position Offered</FieldLabel>
              <TextInput
                value={modifiedPositionOffered}
                onChangeText={setModifiedPositionOffered}
                placeholder="e.g. Light Administrative Duty"
                placeholderTextColor="#9CA3AF"
                style={{
                  backgroundColor: "#F3F4F6",
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  color: "#111827",
                }}
              />
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <FieldLabel>Date Offered</FieldLabel>
                <TextInput
                  value={dateOffered}
                  onChangeText={setDateOffered}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                  style={{
                    backgroundColor: "#F3F4F6",
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    color: "#111827",
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <FieldLabel>Date Begins</FieldLabel>
                <TextInput
                  value={dateBegins}
                  onChangeText={setDateBegins}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                  style={{
                    backgroundColor: "#F3F4F6",
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    color: "#111827",
                  }}
                />
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <FieldLabel>Hourly Pay Rate</FieldLabel>
                <View style={{ position: "relative" }}>
                  <Text
                    style={{
                      position: "absolute",
                      left: 12,
                      top: 12,
                      fontWeight: "700",
                      color: "#6B7280",
                    }}
                  >
                    $
                  </Text>
                  <TextInput
                    value={hourlyPayRate}
                    onChangeText={setHourlyPayRate}
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="decimal-pad"
                    style={{
                      backgroundColor: "#F3F4F6",
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      paddingLeft: 26,
                      paddingRight: 14,
                      paddingVertical: 12,
                      color: "#111827",
                    }}
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <FieldLabel>Weekly Hours</FieldLabel>
                <TextInput
                  value={weeklyHours}
                  onChangeText={setWeeklyHours}
                  placeholder="40"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  style={{
                    backgroundColor: "#F3F4F6",
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    color: "#111827",
                  }}
                />
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <FieldLabel>Shift Start</FieldLabel>
                <TextInput
                  value={shiftStart}
                  onChangeText={setShiftStart}
                  placeholder="HH:MM"
                  placeholderTextColor="#9CA3AF"
                  style={{
                    backgroundColor: "#F3F4F6",
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    color: "#111827",
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <FieldLabel>Shift End</FieldLabel>
                <TextInput
                  value={shiftEnd}
                  onChangeText={setShiftEnd}
                  placeholder="HH:MM"
                  placeholderTextColor="#9CA3AF"
                  style={{
                    backgroundColor: "#F3F4F6",
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    color: "#111827",
                  }}
                />
              </View>
            </View>

            <View>
              <FieldLabel>Description of Duties</FieldLabel>
              <TextInput
                value={dutiesDescription}
                onChangeText={setDutiesDescription}
                placeholder="Enter detailed description of modified duties..."
                placeholderTextColor="#9CA3AF"
                multiline
                style={{
                  backgroundColor: "#F3F4F6",
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  minHeight: 110,
                  color: "#111827",
                  textAlignVertical: "top",
                }}
              />
            </View>
          </View>
        </Card>

        {/* Policy Terms */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            overflow: "hidden",
          }}
        >
          <TouchableOpacity
            onPress={() => setShowPolicyTerms((v) => !v)}
            style={{
              paddingHorizontal: 18,
              paddingVertical: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827" }}>
              Read Policy Terms
            </Text>
            <ChevronDown
              size={18}
              color="#6B7280"
              style={{
                transform: [{ rotate: showPolicyTerms ? "180deg" : "0deg" }],
              }}
            />
          </TouchableOpacity>

          {showPolicyTerms ? (
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: "#E5E7EB",
                paddingHorizontal: 18,
                paddingVertical: 14,
                gap: 10,
              }}
            >
              <Text style={{ fontSize: 13, color: "#4B5563", lineHeight: 18 }}>
                All light duty employees are required to abide by the following
                guidelines while performing work at client offices and sites:
              </Text>
              <Text style={{ fontSize: 13, color: "#4B5563", lineHeight: 18 }}>
                • Remain in designated work area and perform all functions
                assigned by client and within doctor's restrictions.
              </Text>
              <Text style={{ fontSize: 13, color: "#4B5563", lineHeight: 18 }}>
                • Do not interfere, interrupt or disturb the operations of the
                client site and their staff.
              </Text>
              <Text style={{ fontSize: 13, color: "#4B5563", lineHeight: 18 }}>
                • Use of cell phones or computers while assigned to the client
                site is not permitted unless required by the assignment.
              </Text>
              <Text style={{ fontSize: 13, color: "#4B5563", lineHeight: 18 }}>
                • Light Duty employees are to have NO access to confidential
                information.
              </Text>

              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: "#111827",
                  marginTop: 6,
                }}
              >
                Approved excused absences include:
              </Text>
              <Text style={{ fontSize: 13, color: "#4B5563", lineHeight: 18 }}>
                • Doctors' appointments (A note must be provided).
              </Text>
              <Text style={{ fontSize: 13, color: "#4B5563", lineHeight: 18 }}>
                • Sickness (if over 2 days, doctor's note required).
              </Text>
              <Text style={{ fontSize: 13, color: "#4B5563", lineHeight: 18 }}>
                • Pre-approved absences or tardies.
              </Text>
            </View>
          ) : null}
        </View>

        {/* Accept / Decline + Signatures */}
        <Card>
          <Text
            style={{
              fontSize: 14,
              color: "#111827",
              lineHeight: 20,
              marginBottom: 14,
            }}
          >
            I acknowledge I have received and understand the conditions set
            above in the company Modified Duty Policy. I also understand that
            the position being offered is a temporary position and is being
            offered to continue employment while I am recovering from this
            injury.
          </Text>

          <View style={{ gap: 10 }}>
            <TouchableOpacity
              onPress={() => setDecision("accept")}
              style={{
                backgroundColor: "#F3F4F6",
                borderRadius: 10,
                borderWidth: 1,
                borderColor: decision === "accept" ? "#2563EB" : "#E5E7EB",
                padding: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  borderWidth: 2,
                  borderColor: decision === "accept" ? "#2563EB" : "#9CA3AF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {decision === "accept" ? (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "#2563EB",
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
                I <Text style={{ color: "#16A34A" }}>ACCEPT</Text> this position
                being offered
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setDecision("decline")}
              style={{
                backgroundColor: "#F3F4F6",
                borderRadius: 10,
                borderWidth: 1,
                borderColor: decision === "decline" ? "#2563EB" : "#E5E7EB",
                padding: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  borderWidth: 2,
                  borderColor: decision === "decline" ? "#2563EB" : "#9CA3AF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {decision === "decline" ? (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "#2563EB",
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
                I <Text style={{ color: "#DC2626" }}>DECLINE</Text> this
                position being offered
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: "#E5E7EB",
              marginVertical: 16,
            }}
          />

          <View style={{ gap: 14 }}>
            <SignaturePad
              label="Employee Signature"
              signatureUrl={employeeSignatureUrl}
              onSignatureChange={setEmployeeSignatureUrl}
            />
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>
                Date
              </Text>
              <TextInput
                value={employeeSignatureDate}
                onChangeText={setEmployeeSignatureDate}
                placeholder={todayISO}
                placeholderTextColor="#9CA3AF"
                style={{
                  width: 140,
                  textAlign: "right",
                  backgroundColor: "#F3F4F6",
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: "#111827",
                }}
              />
            </View>

            <SignaturePad
              label="Insured Rep. Signature"
              signatureUrl={insuredRepSignatureUrl}
              onSignatureChange={setInsuredRepSignatureUrl}
            />
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>
                Date
              </Text>
              <TextInput
                value={insuredRepSignatureDate}
                onChangeText={setInsuredRepSignatureDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
                style={{
                  width: 140,
                  textAlign: "right",
                  backgroundColor: "#F3F4F6",
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: "#111827",
                }}
              />
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Sticky bottom submit */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: insets.bottom + 12,
          backgroundColor: "rgba(255,255,255,0.96)",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
        }}
      >
        <TouchableOpacity
          onPress={submit}
          disabled={submitting}
          style={{
            backgroundColor: "#2563EB",
            borderRadius: 12,
            paddingVertical: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text
                style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}
              >
                Submit Form
              </Text>
              <Send size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingAnimatedView>
  );
}
