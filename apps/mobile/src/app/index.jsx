import { Redirect } from "expo-router";
import { useAuth } from "@/utils/auth/useAuth";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { isAuthenticated, isReady } = useAuth();

  // Esperar a que SecureStore cargue el estado de autenticación
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // Redirección inteligente
  return isAuthenticated ? (
    <Redirect href="/(tabs)/dashboard" />
  ) : (
    <Redirect href="/login" />
  );
}
