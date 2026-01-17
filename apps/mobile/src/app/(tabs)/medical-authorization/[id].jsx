import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, Calendar, Lock, Check, X } from "lucide-react-native";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import SignaturePad from "@/components/SignaturePad";

export default function MedicalAuthorizationScreen() {
  const { id } = useLocalSearchParams(); // incident_id
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [incident, setIncident] = useState(null);
  const [authorization, setAuthorization] = useState(null);

  // Form fields
  const [patientName, setPatientName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [provider, setProvider] = useState("");
  const [includeHivAids, setIncludeHivAids] = useState(false);
  const [includeMentalHealth, setIncludeMentalHealth] = useState(false);
  const [includeDrugAlcohol, setIncludeDrugAlcohol] = useState(false);
  const [patientInitials, setPatientInitials] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");
  const [signedBy, setSignedBy] = useState("patient");
  const [signatureDate, setSignatureDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const signaturePadRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load incident details
      const incidentRes = await fetch(`/api/incidents/${id}`);
      if (!incidentRes.ok) throw new Error("Failed to fetch incident");
      const incidentData = await incidentRes.json();
      setIncident(incidentData);

      // Auto-fill patient details
      setPatientName(incidentData.employee_name || "");
      setIncidentDate(incidentData.incident_date || "");
      setProvider(incidentData.client_name || "");

      // Try to load existing authorization
      const authRes = await fetch(
        `/api/medical-authorizations?incident_id=${id}`,
      );
      if (authRes.ok) {
        const auths = await authRes.json();
        if (auths.length > 0) {
          const auth = auths[0];
          setAuthorization(auth);
          setPatientName(auth.patient_name || incidentData.employee_name || "");
          setDateOfBirth(auth.date_of_birth || "");
          setIncidentDate(
            auth.incident_date || incidentData.incident_date || "",
          );
          setProvider(auth.provider || incidentData.client_name || "");
          setIncludeHivAids(auth.include_hiv_aids || false);
          setIncludeMentalHealth(auth.include_mental_health || false);
          setIncludeDrugAlcohol(auth.include_drug_alcohol || false);
          setPatientInitials(auth.patient_initials || "");
          setSignatureUrl(auth.signature_url || "");
          setSignedBy(auth.signed_by || "patient");
          setSignatureDate(
            auth.signature_date || new Date().toISOString().split("T")[0],
          );
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Could not load authorization form");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        incident_id: id,
        patient_name: patientName,
        date_of_birth: dateOfBirth,
        incident_date: incidentDate,
        provider,
        include_hiv_aids: includeHivAids,
        include_mental_health: includeMentalHealth,
        include_drug_alcohol: includeDrugAlcohol,
        patient_initials: patientInitials,
        signature_url: signatureUrl,
        signed_by: signedBy,
        signature_date: signatureDate,
        status: "draft",
      };

      if (authorization?.id) {
        // Update existing
        const response = await fetch(
          `/api/medical-authorizations/${authorization.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        if (!response.ok) throw new Error("Failed to update");
      } else {
        // Create new
        const response = await fetch("/api/medical-authorizations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Failed to create");
        const newAuth = await response.json();
        setAuthorization(newAuth);
      }

      Alert.alert("Success", "Authorization saved successfully");
    } catch (error) {
      console.error("Error saving authorization:", error);
      Alert.alert("Error", "Could not save authorization");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!patientInitials || !signatureUrl) {
      Alert.alert(
        "Missing Information",
        "Please provide initials and signature",
      );
      return;
    }

    Alert.alert(
      "Submit Authorization",
      "Are you sure you want to submit this medical authorization?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: async () => {
            try {
              setSaving(true);

              const payload = {
                incident_id: id,
                patient_name: patientName,
                date_of_birth: dateOfBirth,
                incident_date: incidentDate,
                provider,
                include_hiv_aids: includeHivAids,
                include_mental_health: includeMentalHealth,
                include_drug_alcohol: includeDrugAlcohol,
                patient_initials: patientInitials,
                signature_url: signatureUrl,
                signed_by: signedBy,
                signature_date: signatureDate,
                status: "submitted",
              };

              if (authorization?.id) {
                await fetch(`/api/medical-authorizations/${authorization.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });
              } else {
                await fetch("/api/medical-authorizations", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });
              }

              Alert.alert("Success", "Authorization submitted successfully");
              router.back();
            } catch (error) {
              console.error("Error submitting:", error);
              Alert.alert("Error", "Could not submit authorization");
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  };

  const handleClearSignature = () => {
    signaturePadRef.current?.clear();
    setSignatureUrl("");
  };

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
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft color="#111827" size={24} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: "#111827",
            flex: 1,
            textAlign: "center",
          }}
        >
          Authorization
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Bar */}
      <View
        style={{
          backgroundColor: "#fff",
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 12,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "500", color: "#111827" }}>
            Step 3 of 5
          </Text>
          <Text style={{ fontSize: 12, color: "#6B7280" }}>
            Incident #{incident?.incident_number}
          </Text>
        </View>
        <View
          style={{
            height: 8,
            backgroundColor: "#E5E7EB",
            borderRadius: 9999,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: "100%",
              width: "60%",
              backgroundColor: "#3B82F6",
              borderRadius: 9999,
            }}
          />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Patient Details */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#111827",
              marginBottom: 12,
            }}
          >
            Patient Details
          </Text>

          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: "row", gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "600",
                    color: "#6B7280",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 4,
                  }}
                >
                  Patient Name
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#111827",
                  }}
                >
                  {patientName || "N/A"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "600",
                    color: "#6B7280",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 4,
                  }}
                >
                  Date of Birth
                </Text>
                <TextInput
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#111827",
                    borderBottomWidth: 1,
                    borderBottomColor: "#E5E7EB",
                    paddingVertical: 4,
                  }}
                  value={dateOfBirth}
                  onChangeText={setDateOfBirth}
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 16, marginTop: 12 }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "600",
                    color: "#6B7280",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 4,
                  }}
                >
                  Incident Date
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#111827",
                  }}
                >
                  {incidentDate || "N/A"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "600",
                    color: "#6B7280",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 4,
                  }}
                >
                  Provider
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#111827",
                  }}
                >
                  {provider || "N/A"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Legal Text Section */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#111827",
              marginBottom: 8,
            }}
          >
            Authorization for Release
          </Text>
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            <ScrollView
              style={{ height: 192 }}
              showsVerticalScrollIndicator={true}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: "#6B7280",
                  lineHeight: 20,
                  marginBottom: 12,
                }}
              >
                I hereby authorize the release of medical information to the
                Staffing Agency Incident Response Team for the purpose of
                evaluating my claim and coordinating return-to-work efforts.
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: "#6B7280",
                  lineHeight: 20,
                  marginBottom: 12,
                }}
              >
                This authorization includes the release of all medical records,
                including but not limited to, notes, x-rays, MRI reports, and
                physical therapy progress reports related to the incident
                described above.
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: "#6B7280",
                  lineHeight: 20,
                  marginBottom: 12,
                }}
              >
                I understand that this information will be used solely for the
                purpose of claim administration and workplace safety
                improvements. This authorization is valid for the duration of
                the claim or until revoked in writing.
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: "#6B7280",
                  lineHeight: 20,
                  marginBottom: 12,
                }}
              >
                I understand that I have the right to revoke this authorization
                at any time by sending a written notice to the staffing agency.
                However, I understand that any disclosure that has already
                occurred in reliance on this authorization cannot be revoked.
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: "#6B7280",
                  lineHeight: 20,
                }}
              >
                I understand that the information used or disclosed pursuant to
                this authorization may be subject to redisclosure by the
                recipient and may no longer be protected by federal privacy
                regulations.
              </Text>
            </ScrollView>
          </View>
        </View>

        {/* Specific Authorizations */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#111827",
              marginBottom: 8,
            }}
          >
            Specific Authorizations
          </Text>

          <View style={{ gap: 12 }}>
            {/* HIV/AIDS */}
            <View
              style={{
                backgroundColor: "#fff",
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#111827",
                  flex: 1,
                  paddingRight: 12,
                }}
              >
                Include HIV/AIDS related information?
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: "#F3F4F6",
                  borderRadius: 8,
                  padding: 4,
                  gap: 4,
                }}
              >
                <TouchableOpacity
                  onPress={() => setIncludeHivAids(true)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 6,
                    borderRadius: 6,
                    backgroundColor: includeHivAids ? "#fff" : "transparent",
                    borderWidth: includeHivAids ? 1 : 0,
                    borderColor: "#D1D5DB",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: includeHivAids ? "600" : "500",
                      color: includeHivAids ? "#111827" : "#6B7280",
                    }}
                  >
                    Yes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIncludeHivAids(false)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 6,
                    borderRadius: 6,
                    backgroundColor: !includeHivAids ? "#fff" : "transparent",
                    borderWidth: !includeHivAids ? 1 : 0,
                    borderColor: "#D1D5DB",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: !includeHivAids ? "600" : "500",
                      color: !includeHivAids ? "#111827" : "#6B7280",
                    }}
                  >
                    No
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Mental Health */}
            <View
              style={{
                backgroundColor: "#fff",
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#111827",
                  flex: 1,
                  paddingRight: 12,
                }}
              >
                Include Mental Health information?
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: "#F3F4F6",
                  borderRadius: 8,
                  padding: 4,
                  gap: 4,
                }}
              >
                <TouchableOpacity
                  onPress={() => setIncludeMentalHealth(true)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 6,
                    borderRadius: 6,
                    backgroundColor: includeMentalHealth
                      ? "#fff"
                      : "transparent",
                    borderWidth: includeMentalHealth ? 1 : 0,
                    borderColor: "#D1D5DB",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: includeMentalHealth ? "600" : "500",
                      color: includeMentalHealth ? "#111827" : "#6B7280",
                    }}
                  >
                    Yes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIncludeMentalHealth(false)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 6,
                    borderRadius: 6,
                    backgroundColor: !includeMentalHealth
                      ? "#fff"
                      : "transparent",
                    borderWidth: !includeMentalHealth ? 1 : 0,
                    borderColor: "#D1D5DB",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: !includeMentalHealth ? "600" : "500",
                      color: !includeMentalHealth ? "#111827" : "#6B7280",
                    }}
                  >
                    No
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Drug/Alcohol */}
            <View
              style={{
                backgroundColor: "#fff",
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#111827",
                  flex: 1,
                  paddingRight: 12,
                }}
              >
                Include Drug/Alcohol treatment info?
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: "#F3F4F6",
                  borderRadius: 8,
                  padding: 4,
                  gap: 4,
                }}
              >
                <TouchableOpacity
                  onPress={() => setIncludeDrugAlcohol(true)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 6,
                    borderRadius: 6,
                    backgroundColor: includeDrugAlcohol
                      ? "#fff"
                      : "transparent",
                    borderWidth: includeDrugAlcohol ? 1 : 0,
                    borderColor: "#D1D5DB",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: includeDrugAlcohol ? "600" : "500",
                      color: includeDrugAlcohol ? "#111827" : "#6B7280",
                    }}
                  >
                    Yes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIncludeDrugAlcohol(false)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 6,
                    borderRadius: 6,
                    backgroundColor: !includeDrugAlcohol
                      ? "#fff"
                      : "transparent",
                    borderWidth: !includeDrugAlcohol ? 1 : 0,
                    borderColor: "#D1D5DB",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: !includeDrugAlcohol ? "600" : "500",
                      color: !includeDrugAlcohol ? "#111827" : "#6B7280",
                    }}
                  >
                    No
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Initials Section */}
        <View
          style={{
            backgroundColor: "#EFF6FF",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: "#BFDBFE",
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <Text
            style={{
              flex: 1,
              fontSize: 13,
              color: "#111827",
              lineHeight: 20,
            }}
          >
            I acknowledge that I have read and understood the terms of this
            authorization. I understand that my refusal to sign will not affect
            my ability to obtain treatment.
          </Text>
          <View style={{ alignItems: "center", gap: 4 }}>
            <View
              style={{
                width: 64,
                height: 48,
                backgroundColor: "#fff",
                borderRadius: 8,
                borderWidth: 2,
                borderColor: "#3B82F6",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <TextInput
                style={{
                  width: "100%",
                  height: "100%",
                  textAlign: "center",
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#3B82F6",
                  textTransform: "uppercase",
                }}
                value={patientInitials}
                onChangeText={setPatientInitials}
                placeholder="JD"
                placeholderTextColor="#93C5FD"
                maxLength={3}
                autoCapitalize="characters"
              />
            </View>
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                color: "#3B82F6",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Initials
            </Text>
          </View>
        </View>

        {/* Signature Section */}
        <View style={{ marginBottom: 16 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#111827",
              }}
            >
              Signature
            </Text>
            <TouchableOpacity onPress={handleClearSignature}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "500",
                  color: "#3B82F6",
                }}
              >
                Clear
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              borderWidth: 2,
              borderStyle: "dashed",
              borderColor: "#D1D5DB",
              overflow: "hidden",
            }}
          >
            <SignaturePad
              ref={signaturePadRef}
              onSave={setSignatureUrl}
              height={160}
            />
            <View
              style={{
                position: "absolute",
                bottom: 8,
                right: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: "#F3F4F6",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
              }}
            >
              <Lock color="#6B7280" size={12} />
              <Text style={{ fontSize: 10, color: "#6B7280" }}>Secure</Text>
            </View>
          </View>
        </View>

        {/* Signer Details */}
        <View style={{ gap: 16, marginBottom: 16 }}>
          {/* Signed By */}
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "600",
                color: "#6B7280",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 8,
              }}
            >
              Signed By
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setSignedBy("patient")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: signedBy === "patient" ? "#3B82F6" : "#D1D5DB",
                    backgroundColor:
                      signedBy === "patient" ? "#3B82F6" : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {signedBy === "patient" && (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "#fff",
                      }}
                    />
                  )}
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#111827",
                  }}
                >
                  Patient
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSignedBy("representative")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor:
                      signedBy === "representative" ? "#3B82F6" : "#D1D5DB",
                    backgroundColor:
                      signedBy === "representative" ? "#3B82F6" : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {signedBy === "representative" && (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "#fff",
                      }}
                    />
                  )}
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#111827",
                  }}
                >
                  Representative
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date */}
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "600",
                  color: "#6B7280",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Date
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#111827",
                  marginTop: 2,
                }}
              >
                {new Date(signatureDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            </View>
            <Calendar color="#6B7280" size={20} />
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          padding: 16,
          paddingBottom: insets.bottom + 16,
        }}
      >
        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#D1D5DB",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#111827" />
            ) : (
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                Save Draft
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={saving}
            style={{
              flex: 2,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: "#3B82F6",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#fff",
                  }}
                >
                  Submit Authorization
                </Text>
                <Check color="#fff" size={16} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingAnimatedView>
  );
}
