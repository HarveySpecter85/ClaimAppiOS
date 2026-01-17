import { View, Text } from "react-native";
import { CheckCircle } from "lucide-react-native";
import useI18n from "@/utils/i18n/useI18n";

export function ReviewSubmitStep({
  employeeData,
  incidentData,
  analysisData,
  locationData,
}) {
  const { t } = useI18n();

  return (
    <>
      <View
        style={{
          backgroundColor: "#EFF6FF",
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: "#BFDBFE",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <CheckCircle color="#3B82F6" size={24} />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#1E40AF",
            }}
          >
            {t("review.title")}
          </Text>
        </View>
        <Text style={{ fontSize: 14, color: "#1E40AF" }}>
          {t("review.subtitle")}
        </Text>
      </View>

      {/* Employee Summary */}
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: "#E5E7EB",
        }}
      >
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: "#111827",
            marginBottom: 12,
          }}
        >
          {t("review.employeeInformation")}
        </Text>
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 14, color: "#374151" }}>
            <Text style={{ fontWeight: "600" }}>{t("review.field.name")}:</Text>{" "}
            {employeeData.full_name || t("review.notAvailable")}
          </Text>
          <Text style={{ fontSize: 14, color: "#374151" }}>
            <Text style={{ fontWeight: "600" }}>{t("review.field.id")}:</Text>{" "}
            {employeeData.employee_id || t("review.notAvailable")}
          </Text>
          <Text style={{ fontSize: 14, color: "#374151" }}>
            <Text style={{ fontWeight: "600" }}>
              {t("review.field.position")}:
            </Text>{" "}
            {employeeData.job_position || t("review.notAvailable")}
          </Text>
        </View>
      </View>

      {/* Incident Summary */}
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: "#E5E7EB",
        }}
      >
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: "#111827",
            marginBottom: 12,
          }}
        >
          {t("review.incidentDetails")}
        </Text>
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 14, color: "#374151" }}>
            <Text style={{ fontWeight: "600" }}>{t("review.field.date")}:</Text>{" "}
            {incidentData.incident_date} at {incidentData.incident_time}
          </Text>
          <Text style={{ fontSize: 14, color: "#374151" }}>
            <Text style={{ fontWeight: "600" }}>{t("review.field.type")}:</Text>{" "}
            {incidentData.incident_type || t("review.notAvailable")}
          </Text>
          <Text style={{ fontSize: 14, color: "#374151" }}>
            <Text style={{ fontWeight: "600" }}>
              {t("review.field.severity")}:
            </Text>{" "}
            {incidentData.severity}
          </Text>
          {incidentData.description && (
            <Text style={{ fontSize: 14, color: "#374151", marginTop: 4 }}>
              <Text style={{ fontWeight: "600" }}>
                {t("review.field.description")}:
              </Text>{" "}
              {incidentData.description}
            </Text>
          )}
        </View>
      </View>

      {/* Analysis Summary */}
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: "#E5E7EB",
        }}
      >
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: "#111827",
            marginBottom: 12,
          }}
        >
          {t("review.incidentAnalysis")}
        </Text>
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 14, color: "#374151" }}>
            <Text style={{ fontWeight: "600" }}>
              {t("incidentAnalysis.employmentTenure")}:
            </Text>{" "}
            {analysisData.employment_tenure || t("review.notAvailable")}
          </Text>
          <Text style={{ fontSize: 14, color: "#374151" }}>
            <Text style={{ fontWeight: "600" }}>
              {t("incidentAnalysis.timeOnTask")}:
            </Text>{" "}
            {analysisData.time_on_task || t("review.notAvailable")}
          </Text>
          <Text style={{ fontSize: 14, color: "#374151" }}>
            <Text style={{ fontWeight: "600" }}>
              {t("incidentAnalysis.wearingPpe")}:
            </Text>{" "}
            {analysisData.wearing_ppe
              ? t("incidentAnalysis.yes")
              : t("incidentAnalysis.no")}
          </Text>
          {analysisData.media_files?.length > 0 && (
            <Text style={{ fontSize: 14, color: "#374151" }}>
              <Text style={{ fontWeight: "600" }}>
                {t("incidentAnalysis.mediaEvidence")}:
              </Text>{" "}
              {analysisData.media_files.length} items
            </Text>
          )}
        </View>
      </View>

      {/* Location Summary */}
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: "#E5E7EB",
        }}
      >
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: "#111827",
            marginBottom: 12,
          }}
        >
          {t("review.locationContext")}
        </Text>
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 14, color: "#374151" }}>
            <Text style={{ fontWeight: "600" }}>
              {t("review.field.location")}:
            </Text>{" "}
            {locationData.location || t("review.notAvailable")}
          </Text>
          {locationData.site_area && (
            <Text style={{ fontSize: 14, color: "#374151" }}>
              <Text style={{ fontWeight: "600" }}>
                {t("review.field.area")}:
              </Text>{" "}
              {locationData.site_area}
            </Text>
          )}
          {locationData.address && (
            <Text style={{ fontSize: 14, color: "#374151" }}>
              <Text style={{ fontWeight: "600" }}>
                {t("review.field.address")}:
              </Text>{" "}
              {locationData.address}
            </Text>
          )}
        </View>
      </View>
    </>
  );
}
