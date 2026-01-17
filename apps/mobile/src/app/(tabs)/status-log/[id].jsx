import { useState, useEffect } from "react";
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
  Save,
  Info,
  Calendar,
  Plus,
  HelpCircle,
} from "lucide-react-native";

export default function StatusLogScreen() {
  const { id } = useLocalSearchParams(); // incident_id
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [incident, setIncident] = useState(null);
  const [statusLog, setStatusLog] = useState(null);
  const [entries, setEntries] = useState([]);

  // Form fields
  const [weekEnding, setWeekEnding] = useState("");
  const [employer, setEmployer] = useState("");

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

      // Load or create status log
      const logsRes = await fetch(`/api/status-logs?incident_id=${id}`);
      const logs = await logsRes.json();

      if (logs.length > 0) {
        const log = logs[0];
        setStatusLog(log);
        setWeekEnding(log.week_ending || "");
        setEmployer(log.employer || "");

        // Load entries for this log
        const entriesRes = await fetch(
          `/api/status-log-entries?status_log_id=${log.id}`,
        );
        const entriesData = await entriesRes.json();
        setEntries(entriesData);
      } else {
        // Create initial week with 7 days
        const today = new Date();
        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() + (6 - today.getDay()));
        setWeekEnding(weekEnd.toISOString().split("T")[0]);
      }
    } catch (error) {
      console.error("Error loading status log:", error);
      Alert.alert("Error", "Could not load status log");
    } finally {
      setLoading(false);
    }
  };

  const saveStatusLog = async () => {
    try {
      setSaving(true);

      let logId = statusLog?.id;

      if (!logId) {
        // Create new status log
        const createRes = await fetch("/api/status-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            incident_id: id,
            employee_id: incident.employee_id,
            week_ending: weekEnding,
            employer,
          }),
        });
        const newLog = await createRes.json();
        logId = newLog.id;
        setStatusLog(newLog);
      } else {
        // Update existing
        await fetch(`/api/status-logs/${logId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            week_ending: weekEnding,
            employer,
          }),
        });
      }

      Alert.alert("Success", "Status log saved");
    } catch (error) {
      console.error("Error saving status log:", error);
      Alert.alert("Error", "Could not save status log");
    } finally {
      setSaving(false);
    }
  };

  const getWeekDays = () => {
    if (!weekEnding) return [];

    const endDate = new Date(weekEnding);
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(endDate.getDate() - i);
      days.push(date);
    }

    return days;
  };

  const getDayStatus = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate < today) {
      const entry = entries.find(
        (e) => e.entry_date === date.toISOString().split("T")[0],
      );
      return entry ? "completed" : "missed";
    } else if (compareDate.getTime() === today.getTime()) {
      return "today";
    } else {
      return "upcoming";
    }
  };

  const getEntryForDate = (date) => {
    return entries.find(
      (e) => e.entry_date === date.toISOString().split("T")[0],
    );
  };

  const submitWeeklyLog = async () => {
    if (!statusLog) {
      Alert.alert("Error", "Please save the status log first");
      return;
    }

    Alert.alert(
      "Submit Weekly Log",
      "Are you sure you want to submit this weekly log? This will send it to wc.peo@invoclaims.com",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          onPress: async () => {
            try {
              await fetch(`/api/status-logs/${statusLog.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "submitted" }),
              });
              Alert.alert("Success", "Weekly log submitted successfully");
              router.back();
            } catch (error) {
              console.error("Error submitting log:", error);
              Alert.alert("Error", "Could not submit weekly log");
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

  const weekDays = getWeekDays();

  return (
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
          <ArrowLeft size={24} color="#111827" />
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
          Status Update Log
        </Text>
        <TouchableOpacity
          onPress={saveStatusLog}
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
        {/* Case Details */}
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
              Case Details
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

          <View style={{ flexDirection: "row", gap: 16, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: 4,
                }}
              >
                Date of Injury
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
                value={incident?.incident_date || "N/A"}
                editable={false}
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
                Week Ending
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
                value={weekEnding}
                onChangeText={setWeekEnding}
                placeholder="YYYY-MM-DD"
              />
            </View>
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
              Employer
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
              value={employer}
              onChangeText={setEmployer}
              placeholder="e.g. Acme Staffing Solutions"
            />
          </View>
        </View>

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
          <HelpCircle
            size={20}
            color="#2563EB"
            style={{ marginRight: 12, marginTop: 2 }}
          />
          <Text style={{ flex: 1, fontSize: 14, color: "#1E40AF" }}>
            Ask employee daily how they are feeling and to rate pain level
            (0-10). Note any concerns.
          </Text>
        </View>

        {/* Daily Logs Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>
            Daily Logs
          </Text>
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            <Plus size={16} color="#2563EB" />
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: "#2563EB",
                marginLeft: 4,
              }}
            >
              Add Entry
            </Text>
          </TouchableOpacity>
        </View>

        {/* Daily Log Entries */}
        {weekDays.map((date, index) => {
          const status = getDayStatus(date);
          const entry = getEntryForDate(date);
          const dateStr = date.toISOString().split("T")[0];
          const dayName = date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          });

          return (
            <DayEntry
              key={index}
              date={dateStr}
              dayName={dayName}
              status={status}
              entry={entry}
              statusLogId={statusLog?.id}
              onEntryUpdated={loadData}
            />
          );
        })}

        {/* Weekly Submission */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            padding: 20,
            marginTop: 24,
            borderWidth: 1,
            borderColor: "#F3F4F6",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#111827",
              marginBottom: 8,
            }}
          >
            Weekly Submission
          </Text>
          <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 16 }}>
            Please ensure all daily logs are completed before submitting the
            weekly report to{" "}
            <Text style={{ color: "#2563EB" }}>wc.peo@invoclaims.com</Text>.
          </Text>
          <TouchableOpacity
            onPress={submitWeeklyLog}
            style={{
              backgroundColor: "#111827",
              borderRadius: 12,
              paddingVertical: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>
              Submit Weekly Log
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function DayEntry({
  date,
  dayName,
  status,
  entry,
  statusLogId,
  onEntryUpdated,
}) {
  const [isEditing, setIsEditing] = useState(status === "today");
  const [contentWithModifiedDuty, setContentWithModifiedDuty] = useState(
    entry?.content_with_modified_duty ?? null,
  );
  const [painScale, setPainScale] = useState(entry?.pain_scale ?? 0);
  const [notes, setNotes] = useState(entry?.notes || "");
  const [hoursWorked, setHoursWorked] = useState(
    entry?.hours_worked?.toString() || "",
  );
  const [clientRepInitials, setClientRepInitials] = useState(
    entry?.client_rep_initials || "",
  );
  const [employeeInitials, setEmployeeInitials] = useState(
    entry?.employee_initials || "",
  );
  const [saving, setSaving] = useState(false);

  const saveEntry = async () => {
    if (!statusLogId) {
      Alert.alert("Error", "Please save the status log first");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        status_log_id: statusLogId,
        entry_date: date,
        content_with_modified_duty: contentWithModifiedDuty,
        pain_scale: painScale,
        notes,
        hours_worked: hoursWorked ? parseFloat(hoursWorked) : null,
        client_rep_initials: clientRepInitials,
        employee_initials: employeeInitials,
        status: "completed",
      };

      if (entry?.id) {
        await fetch(`/api/status-log-entries/${entry.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/status-log-entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      Alert.alert("Success", "Entry saved");
      onEntryUpdated();
    } catch (error) {
      console.error("Error saving entry:", error);
      Alert.alert("Error", "Could not save entry");
    } finally {
      setSaving(false);
    }
  };

  const getBorderColor = () => {
    if (status === "today") return "#2563EB";
    if (status === "completed") return "#E5E7EB";
    return "#D1D5DB";
  };

  const getStatusBadge = () => {
    if (status === "completed") {
      return (
        <View
          style={{
            backgroundColor: "#D1FAE5",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 9999,
          }}
        >
          <Text style={{ color: "#065F46", fontSize: 12, fontWeight: "700" }}>
            Completed
          </Text>
        </View>
      );
    } else if (status === "today") {
      return (
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.2)",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 9999,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "700" }}>
            Today
          </Text>
        </View>
      );
    }
    return null;
  };

  if (status === "upcoming") {
    return (
      <View
        style={{
          backgroundColor: "rgba(255,255,255,0.5)",
          borderRadius: 12,
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: "#D1D5DB",
          padding: 16,
          marginBottom: 16,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 14, color: "#9CA3AF" }}>
          {dayName} (Upcoming)
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: status === "today" ? 4 : 1,
        borderColor: getBorderColor(),
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      {/* Header */}
      <View
        style={{
          backgroundColor: status === "today" ? "#2563EB" : "#F9FAFB",
          paddingHorizontal: 20,
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Calendar
            size={18}
            color={status === "today" ? "#FFFFFF" : "#9CA3AF"}
          />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: status === "today" ? "#FFFFFF" : "#374151",
            }}
          >
            {dayName}
          </Text>
        </View>
        {getStatusBadge()}
      </View>

      {/* Content */}
      <View style={{ padding: 20, gap: 20 }}>
        {/* Content with Modified Duty */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "500", color: "#374151" }}>
            Content with Modified Duty?
          </Text>
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#F3F4F6",
              padding: 4,
              borderRadius: 8,
              gap: 4,
            }}
          >
            <TouchableOpacity
              onPress={() => setContentWithModifiedDuty(true)}
              disabled={!isEditing}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor:
                  contentWithModifiedDuty === true ? "#FFFFFF" : "transparent",
                borderWidth: contentWithModifiedDuty === true ? 1 : 0,
                borderColor: "#D1D5DB",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: contentWithModifiedDuty === true ? "600" : "500",
                  color:
                    contentWithModifiedDuty === true ? "#111827" : "#6B7280",
                }}
              >
                Yes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setContentWithModifiedDuty(false)}
              disabled={!isEditing}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor:
                  contentWithModifiedDuty === false ? "#FFFFFF" : "transparent",
                borderWidth: contentWithModifiedDuty === false ? 1 : 0,
                borderColor: "#D1D5DB",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: contentWithModifiedDuty === false ? "600" : "500",
                  color:
                    contentWithModifiedDuty === false ? "#111827" : "#6B7280",
                }}
              >
                No
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pain Scale */}
        <View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: 8,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "500", color: "#374151" }}>
              Pain Scale
            </Text>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                color: painScale > 0 ? "#F97316" : "#9CA3AF",
              }}
            >
              {painScale > 0 ? painScale : "-"}
              <Text
                style={{ fontSize: 14, fontWeight: "400", color: "#9CA3AF" }}
              >
                /10
              </Text>
            </Text>
          </View>
          <TextInput
            style={{
              width: "100%",
              height: 8,
              backgroundColor: "#E5E7EB",
              borderRadius: 9999,
            }}
            value={painScale.toString()}
            onChangeText={(val) => setPainScale(parseInt(val) || 0)}
            editable={isEditing}
            keyboardType="numeric"
          />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 4,
            }}
          >
            <Text style={{ fontSize: 12, color: "#9CA3AF" }}>No Pain</Text>
            <Text style={{ fontSize: 12, color: "#9CA3AF" }}>Extreme</Text>
          </View>
        </View>

        {/* Notes */}
        <View>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: "#374151",
              marginBottom: 4,
            }}
          >
            Notes
          </Text>
          <TextInput
            style={{
              width: "100%",
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#D1D5DB",
              backgroundColor: "#FFFFFF",
              color: "#111827",
              paddingVertical: 8,
              paddingHorizontal: 12,
              fontSize: 14,
              minHeight: 60,
              textAlignVertical: "top",
            }}
            value={notes}
            onChangeText={setNotes}
            placeholder="Enter reason for absence or other notes..."
            placeholderTextColor="#9CA3AF"
            multiline
            editable={isEditing}
          />
        </View>

        {/* Hours & Initials */}
        <View style={{ flexDirection: "row", gap: 16 }}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                color: "#6B7280",
                marginBottom: 4,
              }}
            >
              Hours Worked
            </Text>
            <TextInput
              style={{
                width: "100%",
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#D1D5DB",
                backgroundColor: "#FFFFFF",
                color: "#111827",
                paddingVertical: 8,
                paddingHorizontal: 12,
                fontSize: 14,
              }}
              value={hoursWorked}
              onChangeText={setHoursWorked}
              placeholder="0.0"
              keyboardType="decimal-pad"
              editable={isEditing}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                color: "#6B7280",
                marginBottom: 4,
              }}
            >
              Client Rep Initials
            </Text>
            <TextInput
              style={{
                width: "100%",
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#D1D5DB",
                backgroundColor: "#FFFFFF",
                color: "#111827",
                paddingVertical: 8,
                paddingHorizontal: 12,
                fontSize: 14,
                textTransform: "uppercase",
              }}
              value={clientRepInitials}
              onChangeText={setClientRepInitials}
              placeholder="--"
              autoCapitalize="characters"
              editable={isEditing}
            />
          </View>
        </View>

        {/* Employee Initials (only for today) */}
        {status === "today" && (
          <View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                color: "#6B7280",
                marginBottom: 4,
              }}
            >
              Employee Initials
            </Text>
            <TextInput
              style={{
                width: "100%",
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#D1D5DB",
                backgroundColor: "#FFFFFF",
                color: "#111827",
                paddingVertical: 8,
                paddingHorizontal: 12,
                fontSize: 14,
                textTransform: "uppercase",
              }}
              value={employeeInitials}
              onChangeText={setEmployeeInitials}
              placeholder="Enter initials"
              autoCapitalize="characters"
              editable={isEditing}
            />
          </View>
        )}
      </View>

      {/* Save Button (only for today) */}
      {status === "today" && (
        <View
          style={{
            backgroundColor: "#F9FAFB",
            padding: 12,
            flexDirection: "row",
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity
            onPress={saveEntry}
            disabled={saving}
            style={{
              backgroundColor: "#2563EB",
              paddingVertical: 8,
              paddingHorizontal: 24,
              borderRadius: 8,
            }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text
                style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "500" }}
              >
                Save Entry
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
