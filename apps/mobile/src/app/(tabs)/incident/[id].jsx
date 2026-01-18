import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  ChevronLeft,
  User,
  Building,
  Calendar,
  MapPin,
  FileText,
  ChevronRight,
  CheckCircle,
  Clipboard,
  ClipboardList,
  FileCheck,
  Car,
  XCircle,
  CreditCard,
  Share2,
  MessageCircle,
  History,
  Send,
} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  Gesture,
  GestureDetector,
  Directions,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import IncidentMessages from "@/components/IncidentMessages";
import AuditLogTimeline from "@/components/AuditLogTimeline";
import { Image } from "expo-image";

export default function IncidentDetails() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [showMessages, setShowMessages] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchIncident();
  }, [id]);

  const fetchIncident = async () => {
    try {
      const response = await fetch(`/api/incidents/${id}`);
      if (!response.ok) throw new Error("Failed to fetch incident");
      const data = await response.json();
      setIncident(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "#EF4444";
      case "high":
        return "#F59E0B";
      case "medium":
        return "#3B82F6";
      case "low":
        return "#10B981";
      default:
        return "#6B7280";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "#3B82F6";
      case "submitted":
      case "review":
        return "#F59E0B";
      case "approved":
      case "closed":
        return "#10B981";
      case "rejected":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "open":
        return "Open";
      case "submitted":
      case "review":
        return "Under Review";
      case "approved":
        return "Approved";
      case "closed":
        return "Closed";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  const handleSubmitForReview = () => {
    Alert.alert(
      "Submit for Review",
      "Are you sure you want to submit this incident for review? You won't be able to make changes while it is under review.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Submit",
          onPress: async () => {
            try {
              setSubmitting(true);
              const response = await fetch(`/api/incidents/${id}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  status: "submitted",
                  submission_date: new Date().toISOString(),
                }),
              });

              if (!response.ok) throw new Error("Failed to submit");

              const updatedIncident = await response.json();
              setIncident(updatedIncident);
              Alert.alert("Success", "Incident submitted for review.");
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Failed to submit incident.");
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  if (!incident) return null;

  const phases = [
    { title: "Interviews", icon: User, route: `/(tabs)/interview/${id}` },
    { title: "Evidence", icon: FileText, route: `/(tabs)/evidence/${id}` },
    { title: "Root Cause", icon: FileText, route: `/(tabs)/root-cause/${id}` },
    {
      title: "Actions",
      icon: CheckCircle,
      route: `/(tabs)/corrective-actions/${id}`,
    },
  ];

  const navigateToPhase = (index) => {
    if (index >= 0 && index < phases.length) {
      router.push(phases[index].route);
    }
  };

  const handleSwipeLeft = () => {
    const nextIndex = currentPhaseIndex + 1;
    if (nextIndex < phases.length) {
      setCurrentPhaseIndex(nextIndex);
      navigateToPhase(nextIndex);
    }
  };

  const handleSwipeRight = () => {
    const prevIndex = currentPhaseIndex - 1;
    if (prevIndex >= 0) {
      setCurrentPhaseIndex(prevIndex);
      navigateToPhase(prevIndex);
    }
  };

  const flingLeft = Gesture.Fling()
    .direction(Directions.LEFT)
    .onStart(() => {
      runOnJS(handleSwipeLeft)();
    });

  const flingRight = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onStart(() => {
      runOnJS(handleSwipeRight)();
    });

  const swipeGesture = Gesture.Race(flingLeft, flingRight);

  const forms = [
    {
      title: "Benefit Affidavit",
      icon: Clipboard,
      route: `/(tabs)/benefit-affidavit/${id}`,
      formType: "benefit_affidavit",
    },
    {
      title: "Status Log",
      icon: ClipboardList,
      route: `/(tabs)/status-log/${id}`,
      formType: "status_log",
    },
    {
      title: "Medical Authorization",
      icon: FileCheck,
      route: `/(tabs)/medical-authorization/${id}`,
      formType: "medical_authorization",
    },
    {
      title: "Prescription Card",
      icon: CreditCard,
      route: `/(tabs)/prescription-card/${id}`,
      formType: "prescription_card",
    },
    {
      title: "Mileage Reimbursement",
      icon: Car,
      route: `/(tabs)/mileage-reimbursement/${id}`,
      formType: "mileage_reimbursement",
    },
    {
      title: "Modified Duty Policy",
      icon: FileText,
      route: `/(tabs)/modified-duty-policy/${id}`,
      formType: "modified_duty_policy",
    },
    {
      title: "Refusal of Treatment",
      icon: XCircle,
      route: `/(tabs)/refusal-of-treatment/${id}`,
      formType: "refusal_of_treatment",
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <StatusBar style="light" />

      {/* Status Banner */}
      <View
        style={{
          backgroundColor: getStatusColor(incident.status),
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          paddingHorizontal: 20,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginBottom: 12 }}
        >
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            color: "#fff",
            marginBottom: 4,
          }}
        >
          {incident.incident_number}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: "#fff",
            opacity: 0.9,
            textTransform: "uppercase",
            fontWeight: "600",
          }}
        >
          {getStatusLabel(incident.status)}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Info Card */}
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
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
            <View
              style={{
                backgroundColor: getSeverityColor(incident.severity) + "20",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: getSeverityColor(incident.severity),
                  textTransform: "uppercase",
                }}
              >
                {incident.severity} SEVERITY
              </Text>
            </View>
          </View>

          <View style={{ gap: 12 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <Calendar color="#6B7280" size={20} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 13, color: "#6B7280", marginBottom: 2 }}
                >
                  Date & Time
                </Text>
                <Text
                  style={{ fontSize: 15, color: "#111827", fontWeight: "500" }}
                >
                  {new Date(incident.incident_date).toLocaleDateString()} at{" "}
                  {incident.incident_time}
                </Text>
              </View>
            </View>

            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <FileText color="#6B7280" size={20} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 13, color: "#6B7280", marginBottom: 2 }}
                >
                  Type
                </Text>
                <Text
                  style={{ fontSize: 15, color: "#111827", fontWeight: "500" }}
                >
                  {incident.incident_type}
                </Text>
              </View>
            </View>

            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <MapPin color="#6B7280" size={20} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 13, color: "#6B7280", marginBottom: 2 }}
                >
                  Location
                </Text>
                <Text
                  style={{ fontSize: 15, color: "#111827", fontWeight: "500" }}
                >
                  {incident.location}
                </Text>
                {incident.site_area && (
                  <Text
                    style={{ fontSize: 14, color: "#6B7280", marginTop: 2 }}
                  >
                    {incident.site_area}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Employee Card */}
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
            Employee Information
          </Text>

          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: "row" }}>
              <Text style={{ fontSize: 14, color: "#6B7280", width: 120 }}>
                Name:
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#111827",
                  fontWeight: "500",
                  flex: 1,
                }}
              >
                {incident.employee_name || "N/A"}
              </Text>
            </View>
            <View style={{ flexDirection: "row" }}>
              <Text style={{ fontSize: 14, color: "#6B7280", width: 120 }}>
                Employee ID:
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#111827",
                  fontWeight: "500",
                  flex: 1,
                }}
              >
                {incident.employee_number || "N/A"}
              </Text>
            </View>
            <View style={{ flexDirection: "row" }}>
              <Text style={{ fontSize: 14, color: "#6B7280", width: 120 }}>
                Position:
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#111827",
                  fontWeight: "500",
                  flex: 1,
                }}
              >
                {incident.employee_position || "N/A"}
              </Text>
            </View>
            <View style={{ flexDirection: "row" }}>
              <Text style={{ fontSize: 14, color: "#6B7280", width: 120 }}>
                Phone:
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#111827",
                  fontWeight: "500",
                  flex: 1,
                }}
              >
                {incident.employee_phone || "N/A"}
              </Text>
            </View>
          </View>
        </View>

        {/* Client Card */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: incident.client_primary_color
              ? incident.client_primary_color
              : "#E5E7EB",
            borderLeftWidth: incident.client_primary_color ? 6 : 1,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#111827",
              }}
            >
              Client Information
            </Text>
            {incident.client_logo_url && (
              <Image
                source={{ uri: incident.client_logo_url }}
                style={{ width: 80, height: 40 }}
                contentFit="contain"
              />
            )}
          </View>

          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: "row" }}>
              <Text style={{ fontSize: 14, color: "#6B7280", width: 120 }}>
                Company:
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#111827",
                  fontWeight: "500",
                  flex: 1,
                }}
              >
                {incident.client_name || "N/A"}
              </Text>
            </View>
            <View style={{ flexDirection: "row" }}>
              <Text style={{ fontSize: 14, color: "#6B7280", width: 120 }}>
                Location:
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#111827",
                  fontWeight: "500",
                  flex: 1,
                }}
              >
                {incident.client_location || "N/A"}
              </Text>
            </View>
            <View style={{ flexDirection: "row" }}>
              <Text style={{ fontSize: 14, color: "#6B7280", width: 120 }}>
                Contact:
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#111827",
                  fontWeight: "500",
                  flex: 1,
                }}
              >
                {incident.client_contact || "N/A"}
              </Text>
            </View>
            <View style={{ flexDirection: "row" }}>
              <Text style={{ fontSize: 14, color: "#6B7280", width: 120 }}>
                Phone:
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#111827",
                  fontWeight: "500",
                  flex: 1,
                }}
              >
                {incident.client_phone || "N/A"}
              </Text>
            </View>
          </View>
        </View>

        {/* Messages Section */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            overflow: "hidden",
          }}
        >
          <TouchableOpacity
            onPress={() => setShowMessages(!showMessages)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 16,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#EFF6FF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MessageCircle color="#3B82F6" size={20} />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                Messages
              </Text>
            </View>
            <ChevronRight
              color="#9CA3AF"
              size={20}
              style={{
                transform: [{ rotate: showMessages ? "90deg" : "0deg" }],
              }}
            />
          </TouchableOpacity>

          {showMessages && (
            <View
              style={{ height: 400, borderTopWidth: 1, borderColor: "#E5E7EB" }}
            >
              <IncidentMessages incidentId={id} />
            </View>
          )}
        </View>

        {/* Investigation Phases */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: "#111827",
              marginBottom: 12,
            }}
          >
            Investigation Phases
          </Text>

          <GestureDetector gesture={swipeGesture}>
            <View style={{ gap: 12 }}>
              {phases.map((phase, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => router.push(phase.route)}
                  style={{
                    backgroundColor:
                      index === currentPhaseIndex ? "#EFF6FF" : "#fff",
                    borderRadius: 12,
                    padding: 16,
                    borderWidth: 1,
                    borderColor:
                      index === currentPhaseIndex ? "#3B82F6" : "#E5E7EB",
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
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor:
                          index === currentPhaseIndex ? "#DBEAFE" : "#F3F4F6",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <phase.icon
                        color={
                          index === currentPhaseIndex ? "#3B82F6" : "#374151"
                        }
                        size={20}
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "600",
                        color: "#111827",
                      }}
                    >
                      {phase.title}
                    </Text>
                  </View>
                  <ChevronRight color="#9CA3AF" size={20} />
                </TouchableOpacity>
              ))}
            </View>
          </GestureDetector>
        </View>

        {/* Attachments & Forms */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: "#111827",
              marginBottom: 12,
            }}
          >
            Attachments & Forms
          </Text>

          <View style={{ gap: 12 }}>
            {forms.map((form, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <TouchableOpacity
                  onPress={() => router.push(form.route)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    flex: 1,
                    paddingVertical: 4,
                  }}
                  activeOpacity={0.85}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "#F3F4F6",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <form.icon color="#374151" size={20} />
                  </View>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: "#111827",
                    }}
                  >
                    {form.title}
                  </Text>
                </TouchableOpacity>

                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <TouchableOpacity
                    onPress={() =>
                      router.push(
                        `/(tabs)/share-form?incidentId=${id}&formType=${form.formType}`,
                      )
                    }
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: "#EFF6FF",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: "#DBEAFE",
                    }}
                    activeOpacity={0.85}
                  >
                    <Share2 color="#3B82F6" size={18} />
                  </TouchableOpacity>

                  <ChevronRight color="#9CA3AF" size={20} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* History Section - NEW */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            overflow: "hidden",
          }}
        >
          <TouchableOpacity
            onPress={() => setShowHistory(!showHistory)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 16,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#F3F4F6",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <History color="#374151" size={20} />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                Activity History
              </Text>
            </View>
            <ChevronRight
              color="#9CA3AF"
              size={20}
              style={{
                transform: [{ rotate: showHistory ? "90deg" : "0deg" }],
              }}
            />
          </TouchableOpacity>

          {showHistory && (
            <View style={{ borderTopWidth: 1, borderColor: "#E5E7EB" }}>
              <AuditLogTimeline entityType="incident" entityId={id} />
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={{ gap: 12 }}>
          {incident.status === "open" && (
            <TouchableOpacity
              onPress={handleSubmitForReview}
              disabled={submitting}
              style={{
                backgroundColor: "#10B981",
                borderRadius: 10,
                padding: 16,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
                shadowColor: "#10B981",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Send color="#fff" size={20} />
                  <Text
                    style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}
                  >
                    Submit for Review
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {incident.status === "rejected" && (
            <View
              style={{
                backgroundColor: "#FEF2F2",
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#FECACA",
                marginBottom: 4,
              }}
            >
              <Text
                style={{ color: "#991B1B", fontWeight: "600", marginBottom: 4 }}
              >
                Returned for Corrections
              </Text>
              <Text style={{ color: "#B91C1C", fontSize: 14 }}>
                {incident.rejection_reason ||
                  "Please review the feedback and resubmit."}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  // Logic to reopen can be added here or just allow editing directly
                  // For now, let's assume they can edit and then re-submit
                }}
                style={{ marginTop: 8 }}
              >
                <Text
                  style={{
                    color: "#DC2626",
                    fontWeight: "600",
                    textDecorationLine: "underline",
                  }}
                >
                  Re-open for Edits
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor:
                  incident.status === "open" ? "#3B82F6" : "#E5E7EB",
                borderRadius: 10,
                padding: 14,
                alignItems: "center",
              }}
              disabled={
                incident.status !== "open" && incident.status !== "rejected"
              }
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: incident.status === "open" ? "#fff" : "#9CA3AF",
                }}
              >
                Edit Details
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: "#fff",
                borderRadius: 10,
                padding: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            >
              <Text
                style={{ fontSize: 15, fontWeight: "600", color: "#374151" }}
              >
                Export Report
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
