import { View, Text, TextInput } from "react-native";
import { MapPin, Calendar } from "lucide-react-native";

export function LocationContextStep({
  locationData,
  setLocationData,
  incidentData,
  setIncidentData,
}) {
  return (
    <>
      <View style={{ marginBottom: 16 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "500",
            color: "#374151",
            marginBottom: 6,
          }}
        >
          Location *
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
          <MapPin color="#9CA3AF" size={20} />
          <TextInput
            style={{
              flex: 1,
              marginLeft: 8,
              fontSize: 15,
              color: "#111827",
            }}
            placeholder="e.g., Warehouse B"
            placeholderTextColor="#9CA3AF"
            value={locationData.location}
            onChangeText={(text) =>
              setLocationData({ ...locationData, location: text })
            }
          />
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
          Specific Site/Area
        </Text>
        <TextInput
          style={{
            backgroundColor: "#fff",
            borderRadius: 10,
            paddingHorizontal: 12,
            height: 48,
            fontSize: 15,
            color: "#111827",
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
          placeholder="e.g., Loading Dock"
          placeholderTextColor="#9CA3AF"
          value={locationData.site_area}
          onChangeText={(text) =>
            setLocationData({ ...locationData, site_area: text })
          }
        />
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
          Full Address (Optional)
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
            minHeight: 80,
            textAlignVertical: "top",
          }}
          placeholder="Enter complete address..."
          placeholderTextColor="#9CA3AF"
          multiline
          value={locationData.address}
          onChangeText={(text) =>
            setLocationData({ ...locationData, address: text })
          }
        />
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
          Date Reported to Employer
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
            value={incidentData.date_reported_to_employer}
            onChangeText={(text) =>
              setIncidentData({
                ...incidentData,
                date_reported_to_employer: text,
              })
            }
          />
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
          Reported To (Name)
        </Text>
        <TextInput
          style={{
            backgroundColor: "#fff",
            borderRadius: 10,
            paddingHorizontal: 12,
            height: 48,
            fontSize: 15,
            color: "#111827",
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
          placeholder="Enter supervisor name"
          placeholderTextColor="#9CA3AF"
          value={incidentData.reported_to_name}
          onChangeText={(text) =>
            setIncidentData({ ...incidentData, reported_to_name: text })
          }
        />
      </View>
    </>
  );
}
