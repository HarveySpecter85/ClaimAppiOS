import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import useUpload from "@/utils/useUpload";

const SyncContext = createContext({});

export const useSync = () => useContext(SyncContext);

export function SyncProvider({ children }) {
  const [queue, setQueue] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [upload] = useUpload();

  useEffect(() => {
    loadQueue();
  }, []);

  // Try to sync when queue is loaded
  useEffect(() => {
    if (queue.length > 0) {
      // We delay slightly to ensure app is ready
      const timer = setTimeout(() => {
        syncNow();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [queue.length]);

  const loadQueue = async () => {
    try {
      const storedQueue = await AsyncStorage.getItem("offline_queue");
      if (storedQueue) {
        setQueue(JSON.parse(storedQueue));
      }
    } catch (e) {
      console.error("Failed to load queue", e);
    }
  };

  const saveQueue = async (newQueue) => {
    try {
      await AsyncStorage.setItem("offline_queue", JSON.stringify(newQueue));
      setQueue(newQueue);
    } catch (e) {
      console.error("Failed to save queue", e);
    }
  };

  const addToQueue = async (item) => {
    const newItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const newQueue = [...queue, newItem];
    await saveQueue(newQueue);
    Alert.alert(
      "Offline Mode",
      "No internet connection. Data saved locally and will be synced when you are online.",
    );
  };

  const removeFromQueue = async (id) => {
    const newQueue = queue.filter((item) => item.id !== id);
    await saveQueue(newQueue);
  };

  const processIncident = async (item) => {
    const { payload } = item;
    const { employeeData, incidentData, analysisData, locationData } = payload;

    // 1. Create/Get Employee if needed (with deduplication)
    let employeeId = payload.employeeId;
    if (!employeeId && employeeData?.full_name) {
      // First, check if employee already exists by (full_name + client_id)
      const searchParams = new URLSearchParams({
        search: employeeData.full_name,
        ...(employeeData.client_id && { client_id: employeeData.client_id }),
      });
      const searchResponse = await fetch(`/api/employees?${searchParams}`);
      if (searchResponse.ok) {
        const existingEmployees = await searchResponse.json();
        // Find exact match by full_name and client_id
        const existingEmployee = existingEmployees.find(
          (emp) =>
            emp.full_name?.toLowerCase() === employeeData.full_name?.toLowerCase() &&
            emp.client_id === employeeData.client_id
        );
        if (existingEmployee) {
          employeeId = existingEmployee.id;
        }
      }

      // If no existing employee found, create new one
      if (!employeeId) {
        const empResponse = await fetch("/api/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(employeeData),
        });
        if (!empResponse.ok) throw new Error("Failed to create employee");
        const emp = await empResponse.json();
        employeeId = emp.id;
      }
    }

    // 2. Upload Media Files
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
            // If upload fails during sync, we throw to retry later
            throw new Error("Failed to upload media");
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

    // 3. Submit Incident
    const response = await fetch("/api/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...incidentData,
        ...locationData,
        analysis_data: finalAnalysisData,
        employee_id: employeeId,
        client_id: employeeData.client_id,
      }),
    });

    if (!response.ok) throw new Error("Failed to submit incident");

    return await response.json();
  };

  const syncItem = async (item) => {
    switch (item.type) {
      case "SUBMIT_INCIDENT":
        return await processIncident(item);
      default:
        console.warn("Unknown sync item type", item.type);
        return null;
    }
  };

  const syncNow = async () => {
    if (queue.length === 0) return;
    if (isSyncing) return;

    setIsSyncing(true);
    let successCount = 0;
    const errors = [];

    // Process copy of queue to avoid mutation issues during iteration
    const currentQueue = [...queue];

    for (const item of currentQueue) {
      try {
        await syncItem(item);
        await removeFromQueue(item.id);
        successCount++;
      } catch (error) {
        console.error(`Failed to sync item ${item.id}`, error);
        errors.push(error.message);
        // We stop on first error usually to preserve order or prevent cascading failures,
        // or we can continue. For now, let's continue trying others but keep the failed one.
      }
    }

    setIsSyncing(false);

    if (successCount > 0) {
      Alert.alert(
        "Sync Complete",
        `${successCount} items synced successfully.`,
      );
    }
    if (errors.length > 0) {
      Alert.alert(
        "Sync Incomplete",
        `${errors.length} items failed to sync. Please try again when connection is better.`,
      );
    }
  };

  return (
    <SyncContext.Provider value={{ queue, addToQueue, syncNow, isSyncing }}>
      {children}
    </SyncContext.Provider>
  );
}
