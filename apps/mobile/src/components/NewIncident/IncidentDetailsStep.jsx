import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Calendar, Clock } from "lucide-react-native";
import BodyPainTracker from "../BodyPainTracker";
import useI18n from "@/utils/i18n/useI18n";

const incidentTypes = [
  "Slip and Fall",
  "Equipment Malfunction",
  "Chemical Spill",
  "Vehicle Collision",
  "Burn Injury",
  "Cut/Laceration",
];

const severityLevels = ["low", "medium", "high", "critical"];

export function IncidentDetailsStep({
  incidentData,
  setIncidentData,
  toggleBodyPart,
}) {
  const { t } = useI18n();

  return (
    <>
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: "#374151",
              marginBottom: 6,
            }}
          >
            {t("incidentDetails.date")}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#fff",
              borderRadius: 10,
              paddingHorizontal: 12,
              height: 48,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            <Calendar color="#9CA3AF" size={20} />
            <TextInput
              style={{
                flex: 1,
                marginLeft: 8,
                fontSize: 15,
                color: "#111827",
              }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#9CA3AF"
              value={incidentData.incident_date}
              onChangeText={(text) =>
                setIncidentData({
                  ...incidentData,
                  incident_date: text,
                })
              }
            />
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: "#374151",
              marginBottom: 6,
            }}
          >
            {t("incidentDetails.time")}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#fff",
              borderRadius: 10,
              paddingHorizontal: 12,
              height: 48,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            <Clock color="#9CA3AF" size={20} />
            <TextInput
              style={{
                flex: 1,
                marginLeft: 8,
                fontSize: 15,
                color: "#111827",
              }}
              placeholder="HH:MM"
              placeholderTextColor="#9CA3AF"
              value={incidentData.incident_time}
              onChangeText={(text) =>
                setIncidentData({
                  ...incidentData,
                  incident_time: text,
                })
              }
            />
          </View>
        </View>
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
          {t("incidentDetails.incidentType")}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {incidentTypes.map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() =>
                setIncidentData({
                  ...incidentData,
                  incident_type: type,
                })
              }
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 20,
                backgroundColor:
                  incidentData.incident_type === type ? "#3B82F6" : "#fff",
                borderWidth: 1,
                borderColor:
                  incidentData.incident_type === type ? "#3B82F6" : "#E5E7EB",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color:
                    incidentData.incident_type === type ? "#fff" : "#374151",
                }}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
          {t("incidentDetails.severity")}
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {severityLevels.map((level) => (
            <TouchableOpacity
              key={level}
              onPress={() =>
                setIncidentData({ ...incidentData, severity: level })
              }
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor:
                  incidentData.severity === level ? "#3B82F6" : "#fff",
                borderWidth: 1,
                borderColor:
                  incidentData.severity === level ? "#3B82F6" : "#E5E7EB",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: incidentData.severity === level ? "#fff" : "#374151",
                  textTransform: "capitalize",
                }}
              >
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "500",
            color: "#374151",
            marginBottom: 6,
          }}
        >
          {t("incidentDetails.description")}
        </Text>
        <TextInput
          style={{
            backgroundColor: "#fff",
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 12,
            fontSize: 15,
            color: "#111827",
            borderWidth: 1,
            borderColor: "#E5E7EB",
            minHeight: 100,
            textAlignVertical: "top",
          }}
          placeholder={t("incidentDetails.descriptionPlaceholder")}
          placeholderTextColor="#9CA3AF"
          multiline
          value={incidentData.description}
          onChangeText={(text) =>
            setIncidentData({ ...incidentData, description: text })
          }
        />
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
          {t("incidentDetails.bodyPartsInjured")}
        </Text>
        <BodyPainTracker
          selectedParts={incidentData.body_parts_injured}
          onPartsChange={(newParts) =>
            setIncidentData({ ...incidentData, body_parts_injured: newParts })
          }
        />
      </View>
    </>
  );
}
