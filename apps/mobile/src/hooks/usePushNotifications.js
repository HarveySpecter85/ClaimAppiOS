import { useState, useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Skip notifications setup on web
    if (Platform.OS === "web") {
      return;
    }

    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        savePushToken(token);
      }
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.incidentId) {
          setNotification({
            ...response.notification,
            action: "tap",
            incidentId: data.incidentId,
          });
        }
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current,
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const subscribeToIncident = async (incidentId) => {
    if (!expoPushToken || Platform.OS === "web") return;

    try {
      const response = await fetch("/api/push-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incident_id: incidentId,
          expo_push_token: expoPushToken,
        }),
      });

      if (!response.ok) {
        console.error("Failed to subscribe to incident notifications");
      }
    } catch (error) {
      console.error("Error subscribing to incident:", error);
    }
  };

  const unsubscribeFromIncident = async (incidentId) => {
    if (!expoPushToken || Platform.OS === "web") return;

    try {
      await fetch(
        `/api/push-subscriptions?incident_id=${incidentId}&token=${expoPushToken}`,
        {
          method: "DELETE",
        },
      );
    } catch (error) {
      console.error("Error unsubscribing from incident:", error);
    }
  };

  return {
    expoPushToken,
    notification,
    subscribeToIncident,
    unsubscribeFromIncident,
  };
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#3B82F6",
    });
  }

  if (Platform.OS !== "web") {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return;
    }

    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      if (!projectId) {
        console.log("Project ID not found");
      }

      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
    } catch (error) {
      console.error("Error getting push token:", error);
    }
  } else {
    console.log("Must use physical device for Push Notifications");
  }

  return token;
}

async function savePushToken(token) {
  try {
    await fetch("/api/push-tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        expo_push_token: token,
        device_id: Constants.deviceId,
        platform: Platform.OS,
      }),
    });
  } catch (error) {
    console.error("Error saving push token:", error);
  }
}
