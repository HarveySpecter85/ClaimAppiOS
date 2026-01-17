import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useState, useEffect, useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  ArrowLeft,
  MoreHorizontal,
  Info,
  PlusCircle,
  Trash2,
  MapPin,
  Send,
} from "lucide-react-native";
import SignaturePad from "@/components/SignaturePad";

export default function MileageReimbursementScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [incident, setIncident] = useState(null);
  const [reimbursement, setReimbursement] = useState(null);
  const [tripEntries, setTripEntries] = useState([
    {
      id: Date.now(),
      trip_date: new Date().toISOString().split("T")[0],
      start_address: "",
      medical_facility: "",
      final_destination: "",
      round_trip_miles: "",
    },
  ]);
  const [signatureUrl, setSignatureUrl] = useState("");
  const [dateSigned, setDateSigned] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  const signaturePadRef = useRef(null);

  useEffect(() => {
    fetchIncident();
    fetchReimbursement();
  }, [id]);

  const fetchIncident = async () => {
    try {
      const response = await fetch(`/api/incidents/${id}`);
      if (response.ok) {
        const data = await response.json();
        setIncident(data);
      }
    } catch (error) {
      console.error("Error fetching incident:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReimbursement = async () => {
    try {
      const response = await fetch(
        `/api/mileage-reimbursements?incident_id=${id}`,
      );
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setReimbursement(data[0]);
          // Fetch trip entries
          const entriesResponse = await fetch(
            `/api/trip-entries?reimbursement_id=${data[0].id}`,
          );
          if (entriesResponse.ok) {
            const entries = await entriesResponse.json();
            if (entries.length > 0) {
              setTripEntries(
                entries.map((e) => ({
                  ...e,
                  round_trip_miles: e.round_trip_miles?.toString() || "",
                })),
              );
            }
          }
          setSignatureUrl(data[0].employee_signature_url || "");
          setDateSigned(data[0].date_signed || "");
        }
      }
    } catch (error) {
      console.error("Error fetching reimbursement:", error);
    }
  };

  const addTripEntry = () => {
    setTripEntries([
      ...tripEntries,
      {
        id: Date.now(),
        trip_date: new Date().toISOString().split("T")[0],
        start_address: "",
        medical_facility: "",
        final_destination: "",
        round_trip_miles: "",
      },
    ]);
  };

  const removeTripEntry = (index) => {
    if (tripEntries.length === 1) {
      Alert.alert("Error", "You must have at least one trip entry");
      return;
    }
    const newEntries = tripEntries.filter((_, i) => i !== index);
    setTripEntries(newEntries);
  };

  const updateTripEntry = (index, field, value) => {
    const newEntries = [...tripEntries];
    newEntries[index][field] = value;
    setTripEntries(newEntries);
  };

  const handleSaveDraft = async () => {
    try {
      const payload = {
        incident_id: parseInt(id),
        employee_id: incident?.employee_id,
        employee_signature_url: signatureUrl,
        date_signed: dateSigned,
        status: "draft",
        trip_entries: tripEntries.map((e) => ({
          trip_date: e.trip_date,
          start_address: e.start_address,
          medical_facility: e.medical_facility,
          final_destination: e.final_destination,
          round_trip_miles: parseFloat(e.round_trip_miles) || 0,
        })),
      };

      const response = reimbursement
        ? await fetch(`/api/mileage-reimbursements/${reimbursement.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/mileage-reimbursements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (response.ok) {
        Alert.alert("Success", "Draft saved successfully");
        router.back();
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      Alert.alert("Error", "Failed to save draft");
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (tripEntries.some((e) => !e.trip_date || !e.medical_facility)) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (!signatureUrl) {
      Alert.alert("Error", "Please provide a signature");
      return;
    }

    try {
      const payload = {
        incident_id: parseInt(id),
        employee_id: incident?.employee_id,
        employee_signature_url: signatureUrl,
        date_signed: dateSigned,
        status: "submitted",
        trip_entries: tripEntries.map((e) => ({
          trip_date: e.trip_date,
          start_address: e.start_address,
          medical_facility: e.medical_facility,
          final_destination: e.final_destination,
          round_trip_miles: parseFloat(e.round_trip_miles) || 0,
        })),
      };

      const response = reimbursement
        ? await fetch(`/api/mileage-reimbursements/${reimbursement.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/mileage-reimbursements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (response.ok) {
        Alert.alert("Success", "Reimbursement submitted successfully");
        router.back();
      }
    } catch (error) {
      console.error("Error submitting reimbursement:", error);
      Alert.alert("Error", "Failed to submit reimbursement");
    }
  };

  const totalMiles = tripEntries.reduce(
    (sum, entry) => sum + (parseFloat(entry.round_trip_miles) || 0),
    0,
  );

  if (loading) {
    return (
      <View
        style={{ flex: 1, paddingTop: insets.top, backgroundColor: "#fff" }}
      >
        <StatusBar style="dark" />
        <Text style={{ textAlign: "center", marginTop: 20 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "#fff",
          paddingTop: insets.top,
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 2,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            height: 56,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowLeft size={24} color="#6B7280" />
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
            Mileage Reimbursement
          </Text>
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MoreHorizontal size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          <View
            style={{
              backgroundColor: "#EFF6FF",
              borderWidth: 1,
              borderColor: "#BFDBFE",
              borderRadius: 12,
              padding: 16,
              flexDirection: "row",
              gap: 12,
            }}
          >
            <Info size={20} color="#2563EB" style={{ marginTop: 2 }} />
            <Text
              style={{
                flex: 1,
                fontSize: 13,
                color: "#1E3A8A",
                lineHeight: 20,
              }}
            >
              Please complete each section of this form for{" "}
              <Text
                style={{ fontWeight: "700", textDecorationLine: "underline" }}
              >
                each day
              </Text>{" "}
              of mileage for reimbursement. All miles are subject to
              verification before processing.
            </Text>
          </View>
        </View>

        {/* Trip Entries Section */}
        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: "#6B7280",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Trip Entries
            </Text>
            <TouchableOpacity
              onPress={addTripEntry}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <PlusCircle size={16} color="#2563EB" />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#2563EB",
                }}
              >
                Add Entry
              </Text>
            </TouchableOpacity>
          </View>

          {/* Trip Entry Cards */}
          {tripEntries.map((entry, index) => (
            <View
              key={entry.id || index}
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                marginBottom: 16,
                overflow: "hidden",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              {/* Card Header */}
              <View
                style={{
                  backgroundColor: "#F9FAFB",
                  borderBottomWidth: 1,
                  borderBottomColor: "#E5E7EB",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <View
                    style={{
                      backgroundColor: "#2563EB",
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: "700",
                      }}
                    >
                      #{index + 1}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "500",
                      color: "#6B7280",
                    }}
                  >
                    Trip Detail
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeTripEntry(index)}>
                  <Trash2 size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* Card Body */}
              <View style={{ padding: 16, gap: 16 }}>
                {/* Date */}
                <View>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    Date
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: "#F9FAFB",
                      borderWidth: 1,
                      borderColor: "#D1D5DB",
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 14,
                      color: "#111827",
                    }}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9CA3AF"
                    value={entry.trip_date}
                    onChangeText={(text) =>
                      updateTripEntry(index, "trip_date", text)
                    }
                  />
                </View>

                {/* Start Address */}
                <View>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    Start Address
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: "#F9FAFB",
                      borderWidth: 1,
                      borderColor: "#D1D5DB",
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 14,
                      color: "#111827",
                    }}
                    placeholder="Address Employee Started From"
                    placeholderTextColor="#9CA3AF"
                    value={entry.start_address}
                    onChangeText={(text) =>
                      updateTripEntry(index, "start_address", text)
                    }
                  />
                </View>

                {/* Medical Facility */}
                <View>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    Physician / Medical Facility
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: "#F9FAFB",
                      borderWidth: 1,
                      borderColor: "#D1D5DB",
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 14,
                      color: "#111827",
                    }}
                    placeholder="Name and Address"
                    placeholderTextColor="#9CA3AF"
                    value={entry.medical_facility}
                    onChangeText={(text) =>
                      updateTripEntry(index, "medical_facility", text)
                    }
                  />
                </View>

                {/* Final Destination */}
                <View>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    Final Destination
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: "#F9FAFB",
                      borderWidth: 1,
                      borderColor: "#D1D5DB",
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 14,
                      color: "#111827",
                    }}
                    placeholder="Address after Dr's Appt"
                    placeholderTextColor="#9CA3AF"
                    value={entry.final_destination}
                    onChangeText={(text) =>
                      updateTripEntry(index, "final_destination", text)
                    }
                  />
                </View>

                {/* Round Trip Miles */}
                <View>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: "#6B7280",
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    Round Trip Miles
                  </Text>
                  <View style={{ position: "relative" }}>
                    <TextInput
                      style={{
                        backgroundColor: "#F9FAFB",
                        borderWidth: 1,
                        borderColor: "#D1D5DB",
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingRight: 40,
                        paddingVertical: 10,
                        fontSize: 14,
                        color: "#111827",
                        fontFamily: "monospace",
                      }}
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="decimal-pad"
                      value={entry.round_trip_miles}
                      onChangeText={(text) =>
                        updateTripEntry(index, "round_trip_miles", text)
                      }
                    />
                    <Text
                      style={{
                        position: "absolute",
                        right: 12,
                        top: 10,
                        fontSize: 14,
                        color: "#9CA3AF",
                      }}
                    >
                      mi
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}

          {/* Add Another Trip Button */}
          <TouchableOpacity
            onPress={addTripEntry}
            style={{
              borderWidth: 2,
              borderStyle: "dashed",
              borderColor: "#D1D5DB",
              borderRadius: 12,
              paddingVertical: 32,
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginBottom: 24,
            }}
          >
            <MapPin size={24} color="#9CA3AF" />
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: "#9CA3AF",
              }}
            >
              Add Another Trip
            </Text>
          </TouchableOpacity>
        </View>

        {/* Important Notice */}
        <View style={{ paddingHorizontal: 16 }}>
          <View
            style={{
              backgroundColor: "#FFF7ED",
              borderWidth: 1,
              borderColor: "#FED7AA",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
              }}
            >
              <Info size={14} color="#EA580C" />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: "#9A3412",
                  textTransform: "uppercase",
                }}
              >
                Important Notice
              </Text>
            </View>
            <Text
              style={{
                fontSize: 11,
                color: "#9A3412",
                lineHeight: 18,
                textAlign: "justify",
              }}
            >
              Any person who, knowingly and with intent to injure, defraud, or
              deceive any employer or employee, insurance company or
              self-insured program files a statement of claim containing any
              false or misleading information is guilty of fraud.
            </Text>
          </View>
        </View>

        {/* Verification Section */}
        <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              padding: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: "#111827",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              Verification
            </Text>

            {/* Employee Signature */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: "#6B7280",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Employee Signature
              </Text>
              <TouchableOpacity
                onPress={() => setShowSignaturePad(true)}
                style={{
                  height: 120,
                  backgroundColor: "#F9FAFB",
                  borderWidth: 2,
                  borderStyle: "dashed",
                  borderColor: "#D1D5DB",
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {signatureUrl ? (
                  <Image
                    source={{ uri: signatureUrl }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="contain"
                  />
                ) : (
                  <View style={{ alignItems: "center", gap: 8 }}>
                    <Text style={{ fontSize: 32, color: "#9CA3AF" }}>✍️</Text>
                    <Text style={{ fontSize: 12, color: "#9CA3AF" }}>
                      Tap to sign
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Date Signed */}
            <View>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: "#6B7280",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Date Signed
              </Text>
              <TextInput
                style={{
                  backgroundColor: "#F9FAFB",
                  borderWidth: 1,
                  borderColor: "#D1D5DB",
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  color: "#111827",
                }}
                value={dateSigned}
                onChangeText={setDateSigned}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Total Miles Summary */}
            <View
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTopWidth: 1,
                borderTopColor: "#E5E7EB",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: "#6B7280" }}
              >
                Total Miles
              </Text>
              <Text
                style={{ fontSize: 18, fontWeight: "700", color: "#2563EB" }}
              >
                {totalMiles.toFixed(1)} mi
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: insets.bottom + 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 8,
        }}
      >
        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            onPress={handleSaveDraft}
            style={{
              flex: 1,
              paddingVertical: 14,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#D1D5DB",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151" }}>
              Save Draft
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmit}
            style={{
              flex: 2,
              paddingVertical: 14,
              borderRadius: 8,
              backgroundColor: "#2563EB",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
              shadowColor: "#2563EB",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>
              Submit for Reimbursement
            </Text>
            <Send size={14} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <SignaturePad
          onSave={(url) => {
            setSignatureUrl(url);
            setShowSignaturePad(false);
          }}
          onClose={() => setShowSignaturePad(false)}
        />
      )}
    </View>
  );
}
