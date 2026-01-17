import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  ChevronLeft,
  Calendar,
  MapPin,
  FileSignature,
  Save,
  Info,
} from "lucide-react-native";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import SignaturePad from "../../../components/SignaturePad";

export default function BenefitAffidavitScreen() {
  const { id } = useLocalSearchParams(); // incident_id
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [incident, setIncident] = useState(null);
  const [affidavit, setAffidavit] = useState(null);

  // Form fields
  const [incidentDate, setIncidentDate] = useState("");
  const [dateSigned, setDateSigned] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [currentAddress, setCurrentAddress] = useState("");
  const [employeeSignatureUrl, setEmployeeSignatureUrl] = useState("");
  const [employeePrintedName, setEmployeePrintedName] = useState("");
  const [witnessSignatureUrl, setWitnessSignatureUrl] = useState("");
  const [witnessPrintedName, setWitnessPrintedName] = useState("");

  const employeeSigRef = useRef(null);
  const witnessSigRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load incident details
      const incidentRes = await fetch(`/api/incidents/${id}`);
      const incidentData = await incidentRes.json();
      setIncident(incidentData);
      setIncidentDate(incidentData.incident_date || "");

      // Load or check for existing affidavit
      const affidavitsRes = await fetch(
        `/api/benefit-affidavits?incident_id=${id}`,
      );
      const affidavits = await affidavitsRes.json();

      if (affidavits.length > 0) {
        const existingAffidavit = affidavits[0];
        setAffidavit(existingAffidavit);
        setIncidentDate(existingAffidavit.incident_date || "");
        setDateSigned(existingAffidavit.date_signed || "");
        setCurrentAddress(existingAffidavit.current_address || "");
        setEmployeeSignatureUrl(existingAffidavit.employee_signature_url || "");
        setEmployeePrintedName(existingAffidavit.employee_printed_name || "");
        setWitnessSignatureUrl(existingAffidavit.witness_signature_url || "");
        setWitnessPrintedName(existingAffidavit.witness_printed_name || "");
      }
    } catch (error) {
      console.error("Error loading benefit affidavit:", error);
      Alert.alert("Error", "Could not load benefit affidavit");
    } finally {
      setLoading(false);
    }
  };

  const saveAffidavit = async () => {
    if (!incidentDate || !dateSigned) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        incident_id: id,
        incident_date: incidentDate,
        date_signed: dateSigned,
        current_address: currentAddress,
        employee_signature_url: employeeSignatureUrl,
        employee_printed_name: employeePrintedName,
        witness_signature_url: witnessSignatureUrl,
        witness_printed_name: witnessPrintedName,
      };

      if (affidavit?.id) {
        // Update existing
        await fetch(`/api/benefit-affidavits/${affidavit.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new
        const createRes = await fetch("/api/benefit-affidavits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const newAffidavit = await createRes.json();
        setAffidavit(newAffidavit);
      }

      Alert.alert("Success", "Benefit affidavit saved successfully");
      router.back();
    } catch (error) {
      console.error("Error saving affidavit:", error);
      Alert.alert("Error", "Could not save benefit affidavit");
    } finally {
      setSaving(false);
    }
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
      <View
        style={{ flex: 1, backgroundColor: "#F3F4F6", paddingTop: insets.top }}
      >
        <StatusBar style="dark" />

        {/* Header */}
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.8)",
            borderBottomWidth: 1,
            borderBottomColor: "#E5E7EB",
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              padding: 8,
              marginLeft: -8,
              borderRadius: 9999,
              backgroundColor: "transparent",
            }}
          >
            <ChevronLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: "#111827",
              flex: 1,
              textAlign: "center",
              marginRight: 40,
            }}
          >
            Benefit Affidavit
          </Text>
          <TouchableOpacity
            onPress={saveAffidavit}
            disabled={saving}
            style={{ padding: 8, marginRight: -8 }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <Save size={24} color="#2563EB" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 100,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Info Banner */}
          <View
            style={{
              backgroundColor: "#EFF6FF",
              borderLeftWidth: 4,
              borderLeftColor: "#2563EB",
              padding: 16,
              borderRadius: 8,
              marginBottom: 16,
              flexDirection: "row",
            }}
          >
            <Info
              size={20}
              color="#2563EB"
              style={{ marginRight: 12, marginTop: 2 }}
            />
            <Text style={{ flex: 1, fontSize: 14, color: "#1E40AF" }}>
              This affidavit certifies that the employee understands their
              rights regarding worker's compensation benefits.
            </Text>
          </View>

          {/* Case Information */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "#F3F4F6",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Info size={16} color="#9CA3AF" />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  color: "#9CA3AF",
                  marginLeft: 4,
                }}
              >
                Case Information
              </Text>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: 4,
                }}
              >
                Employee Name
              </Text>
              <TextInput
                style={{
                  width: "100%",
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#D1D5DB",
                  backgroundColor: "#F9FAFB",
                  color: "#111827",
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  fontSize: 14,
                }}
                value={incident?.employee_name || "N/A"}
                editable={false}
              />
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: 4,
                }}
              >
                Case Number
              </Text>
              <TextInput
                style={{
                  width: "100%",
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#D1D5DB",
                  backgroundColor: "#F9FAFB",
                  color: "#111827",
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  fontSize: 14,
                }}
                value={incident?.incident_number || "N/A"}
                editable={false}
              />
            </View>

            <View style={{ flexDirection: "row", gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: 4,
                  }}
                >
                  Incident Date *
                </Text>
                <TextInput
                  style={{
                    width: "100%",
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: "#D1D5DB",
                    backgroundColor: "#FFFFFF",
                    color: "#111827",
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    fontSize: 14,
                  }}
                  value={incidentDate}
                  onChangeText={setIncidentDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: 4,
                  }}
                >
                  Date Signed *
                </Text>
                <TextInput
                  style={{
                    width: "100%",
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: "#D1D5DB",
                    backgroundColor: "#FFFFFF",
                    color: "#111827",
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    fontSize: 14,
                  }}
                  value={dateSigned}
                  onChangeText={setDateSigned}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>
          </View>

          {/* Address */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "#F3F4F6",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <MapPin size={16} color="#9CA3AF" />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  color: "#9CA3AF",
                  marginLeft: 4,
                }}
              >
                Current Address
              </Text>
            </View>

            <TextInput
              style={{
                width: "100%",
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#D1D5DB",
                backgroundColor: "#FFFFFF",
                color: "#111827",
                paddingVertical: 10,
                paddingHorizontal: 12,
                fontSize: 14,
                minHeight: 80,
                textAlignVertical: "top",
              }}
              value={currentAddress}
              onChangeText={setCurrentAddress}
              placeholder="Enter current mailing address..."
              placeholderTextColor="#9CA3AF"
              multiline
            />
          </View>

          {/* Employee Signature */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "#F3F4F6",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <FileSignature size={16} color="#9CA3AF" />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  color: "#9CA3AF",
                  marginLeft: 4,
                }}
              >
                Employee Signature
              </Text>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: 8,
                }}
              >
                Signature
              </Text>
              <SignaturePad
                ref={employeeSigRef}
                onSignatureComplete={(url) => setEmployeeSignatureUrl(url)}
                initialSignature={employeeSignatureUrl}
              />
            </View>

            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: 4,
                }}
              >
                Printed Name
              </Text>
              <TextInput
                style={{
                  width: "100%",
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#D1D5DB",
                  backgroundColor: "#FFFFFF",
                  color: "#111827",
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  fontSize: 14,
                }}
                value={employeePrintedName}
                onChangeText={setEmployeePrintedName}
                placeholder="Enter employee name"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Witness Signature */}
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "#F3F4F6",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <FileSignature size={16} color="#9CA3AF" />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  color: "#9CA3AF",
                  marginLeft: 4,
                }}
              >
                Witness Signature
              </Text>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: 8,
                }}
              >
                Signature
              </Text>
              <SignaturePad
                ref={witnessSigRef}
                onSignatureComplete={(url) => setWitnessSignatureUrl(url)}
                initialSignature={witnessSignatureUrl}
              />
            </View>

            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: 4,
                }}
              >
                Printed Name
              </Text>
              <TextInput
                style={{
                  width: "100%",
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#D1D5DB",
                  backgroundColor: "#FFFFFF",
                  color: "#111827",
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  fontSize: 14,
                }}
                value={witnessPrintedName}
                onChangeText={setWitnessPrintedName}
                placeholder="Enter witness name"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={saveAffidavit}
            disabled={saving}
            style={{
              backgroundColor: "#2563EB",
              borderRadius: 12,
              paddingVertical: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginTop: 8,
            }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Save size={20} color="#FFFFFF" />
                <Text
                  style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}
                >
                  {affidavit ? "Update Affidavit" : "Create Affidavit"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingAnimatedView>
  );
}
