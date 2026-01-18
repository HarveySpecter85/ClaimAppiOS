import { useState } from "react";
import { useRouter } from "expo-router";
import useUpload from "@/utils/useUpload";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useSync } from "../context/SyncContext";

export function useIncidentForm() {
  const router = useRouter();
  const { subscribeToIncident } = usePushNotifications();
  const { addToQueue } = useSync();
  const [step, setStep] = useState(1);
  const [upload] = useUpload();
  const [uploading, setUploading] = useState(false);

  // Step 1: Employee Details
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeData, setEmployeeData] = useState({
    full_name: "",
    employee_id: "",
    job_position: "",
    employment_start_date: "",
    phone: "",
    client_id: null,
    position_name: "",
    pay_rate: "",
    role_description: "",
    hire_date: "",
    email: "",
  });

  // Step 2: Incident Details
  const [incidentData, setIncidentData] = useState({
    incident_date: new Date().toISOString().split("T")[0],
    incident_time: "09:00",
    incident_type: "",
    severity: "medium",
    description: "",
    body_parts_injured: [],
    date_reported_to_employer: "",
    reported_to_name: "",
  });

  // Step 3: Analysis (New)
  const [analysisData, setAnalysisData] = useState({
    employment_tenure: "",
    time_on_task: "",
    shift_start_time: "",
    hours_worked: "",
    last_day_off: "",
    wearing_ppe: false,
    received_training: false,
    equipment_condition: "good",
    task_supervision: false,
    media_files: [], // { type: 'video' | 'audio', uri: string }
  });

  // Step 4: Location & Context
  const [locationData, setLocationData] = useState({
    location: "",
    site_area: "",
    address: "",
  });

  const handleNext = async () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      // Step 5: Submit
      setUploading(true);
      try {
        let employeeId = selectedEmployee?.id;

        // Try to create employee first if online
        if (!employeeId && employeeData.full_name) {
          try {
            const empResponse = await fetch("/api/employees", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(employeeData),
            });
            if (empResponse.ok) {
              const emp = await empResponse.json();
              employeeId = emp.id;
            } else {
              throw new Error("Offline or Server Error");
            }
          } catch (e) {
            // If this fails, we assume offline/error and will handle in catch block
            throw e;
          }
        }

        // Upload media files if any
        const processedMedia = [];
        if (analysisData.media_files && analysisData.media_files.length > 0) {
          for (const file of analysisData.media_files) {
            if (file.uri && file.uri.startsWith("file://")) {
              const result = await upload({
                reactNativeAsset: {
                  uri: file.uri,
                  type: file.type === "video" ? "video/mp4" : "audio/m4a",
                  name: `incident_${Date.now()}.${file.type === "video" ? "mp4" : "m4a"}`,
                },
              });
              if (result.url) {
                processedMedia.push({ ...file, uri: result.url });
              } else {
                throw new Error("Upload Failed");
              }
            } else {
              processedMedia.push(file);
            }
          }
        }

        const finalAnalysisData = {
          ...analysisData,
          media_files: processedMedia,
        };

        const response = await fetch("/api/incidents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...incidentData,
            ...locationData,
            analysis_data: finalAnalysisData, // Send as analysis_data to match backend
            employee_id: employeeId,
            client_id: employeeData.client_id,
          }),
        });

        if (response.ok) {
          const incident = await response.json();
          // Auto-subscribe the creator to this incident
          await subscribeToIncident(incident.id);
          router.push(`/(tabs)/incident/${incident.id}`);
        } else {
          throw new Error("Submit Failed");
        }
      } catch (error) {
        console.log("Submission error, saving offline:", error);

        // Construct offline payload
        const offlinePayload = {
          employeeId: selectedEmployee?.id,
          employeeData,
          incidentData,
          analysisData,
          locationData,
        };

        await addToQueue({
          type: "SUBMIT_INCIDENT",
          payload: offlinePayload,
          title: `Incident: ${incidentData.incident_type || "Unspecified"}`,
          desc: incidentData.incident_date,
        });

        // Go to dashboard or show success message for offline save
        router.push("/(tabs)/dashboard");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const toggleBodyPart = (part) => {
    const current = incidentData.body_parts_injured;
    if (current.includes(part)) {
      setIncidentData({
        ...incidentData,
        body_parts_injured: current.filter((p) => p !== part),
      });
    } else {
      setIncidentData({
        ...incidentData,
        body_parts_injured: [...current, part],
      });
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Employee Details";
      case 2:
        return "Incident Details";
      case 3:
        return "Incident Analysis";
      case 4:
        return "Location & Context";
      case 5:
        return "Review & Submit";
      default:
        return "";
    }
  };

  return {
    step,
    employeeSearch,
    setEmployeeSearch,
    selectedEmployee,
    setSelectedEmployee,
    employeeData,
    setEmployeeData,
    incidentData,
    setIncidentData,
    analysisData,
    setAnalysisData,
    locationData,
    setLocationData,
    handleNext,
    handleBack,
    toggleBodyPart,
    getStepTitle,
  };
}
