import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Mail, Lock, Eye, EyeOff, LogIn, Fingerprint } from "lucide-react-native";
import { useAuth } from "@/utils/auth/useAuth";
import { useBiometricLogin } from "@/hooks/useBiometricLogin";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setAuth } = useAuth();
  const {
    isBiometricAvailable,
    hasStoredCredentials,
    isLoading: biometricLoading,
    saveCredentials,
    authenticateAndGetCredentials,
    getBiometricDisplayName,
  } = useBiometricLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Attempt biometric login on mount if credentials are stored
  useEffect(() => {
    if (!biometricLoading && isBiometricAvailable && hasStoredCredentials) {
      handleBiometricLogin();
    }
  }, [biometricLoading, isBiometricAvailable, hasStoredCredentials]);

  const handleBiometricLogin = async () => {
    const result = await authenticateAndGetCredentials();
    if (result.success) {
      // Auto-login with stored credentials
      await performLogin(result.credentials.email, result.credentials.password, false);
    }
    // If cancelled or failed, user can still enter password manually
  };

  const performLogin = async (loginEmail, loginPassword, offerBiometric = true) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: loginEmail, password: loginPassword }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al iniciar sesión");
      }

      // Save session
      setAuth({
        user: data.user,
        jwt: data.jwt,
      });

      // Offer to enable biometrics if available and not already stored
      if (offerBiometric && isBiometricAvailable && !hasStoredCredentials) {
        Alert.alert(
          `Habilitar ${getBiometricDisplayName()}`,
          `¿Deseas usar ${getBiometricDisplayName()} para iniciar sesión más rápido?`,
          [
            {
              text: "No, gracias",
              style: "cancel",
              onPress: () => router.replace("/(tabs)/dashboard"),
            },
            {
              text: "Habilitar",
              onPress: async () => {
                await saveCredentials(loginEmail, loginPassword);
                router.replace("/(tabs)/dashboard");
              },
            },
          ]
        );
      } else {
        router.replace("/(tabs)/dashboard");
      }
    } catch (error) {
      Alert.alert("Error de Acceso", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor ingresa tu email y contraseña.");
      return;
    }
    await performLogin(email, password);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            padding: 24,
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header & Logo */}
          <View style={{ alignItems: "center", marginBottom: 40 }}>
            <Image
              source="https://ucarecdn.com/3de6f4d0-768f-4e5c-bfed-ae36d578aa03/-/format/auto/"
              style={{ width: 200, height: 100 }}
              contentFit="contain"
            />
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                color: "#111827",
                marginTop: 24,
                textAlign: "center",
              }}
            >
              Bienvenido
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: "#6B7280",
                marginTop: 8,
                textAlign: "center",
              }}
            >
              Inicia sesión para gestionar casos
            </Text>
          </View>

          {/* Formulario */}
          <View style={{ gap: 16 }}>
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: 8,
                }}
              >
                Correo Electrónico
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  height: 50,
                }}
              >
                <Mail color="#9CA3AF" size={20} />
                <TextInput
                  style={{
                    flex: 1,
                    marginLeft: 10,
                    fontSize: 16,
                    color: "#111827",
                  }}
                  placeholder="nombre@empresa.com"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: 8,
                }}
              >
                Contraseña
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  height: 50,
                }}
              >
                <Lock color="#9CA3AF" size={20} />
                <TextInput
                  style={{
                    flex: 1,
                    marginLeft: 10,
                    fontSize: 16,
                    color: "#111827",
                  }}
                  placeholder="Ingresa tu contraseña"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff color="#9CA3AF" size={20} />
                  ) : (
                    <Eye color="#9CA3AF" size={20} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={{ alignSelf: "flex-end" }}
              onPress={() =>
                Alert.alert(
                  "Recuperar Contraseña",
                  "Por favor contacta a tu administrador para restablecer tu acceso.",
                )
              }
            >
              <Text
                style={{ fontSize: 14, color: "#3B82F6", fontWeight: "500" }}
              >
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={{
                backgroundColor: "#3B82F6",
                borderRadius: 12,
                height: 50,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 8,
                shadowColor: "#3B82F6",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#fff",
                      marginRight: 8,
                    }}
                  >
                    Iniciar Sesión
                  </Text>
                  <LogIn color="#fff" size={20} />
                </>
              )}
            </TouchableOpacity>

            {/* Biometric Login Button */}
            {isBiometricAvailable && hasStoredCredentials && (
              <TouchableOpacity
                onPress={handleBiometricLogin}
                disabled={loading}
                style={{
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 12,
                  height: 50,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 12,
                }}
              >
                <Fingerprint color="#3B82F6" size={20} />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#3B82F6",
                    marginLeft: 8,
                  }}
                >
                  Usar {getBiometricDisplayName()}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Footer */}
          <View style={{ marginTop: 40, alignItems: "center" }}>
            <Text style={{ fontSize: 12, color: "#9CA3AF" }}>
              v1.0.0 • Incident Management System
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
