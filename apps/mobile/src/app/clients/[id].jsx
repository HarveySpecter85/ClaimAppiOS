import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  ChevronLeft,
  Save,
  Trash2,
  User,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  Shield,
  Palette,
  Image as ImageIcon,
  UploadCloud,
} from "lucide-react-native";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import { useUpload } from "@/utils/useUpload";

export default function ClientForm() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isNew = id === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [upload, { loading: uploading }] = useUpload();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    location: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    manager_name: "",
    manager_email: "",
    manager_phone: "",
    safety_coordinator_name: "",
    safety_coordinator_email: "",
    safety_coordinator_phone: "",
    logo_url: null,
    primary_color: "#000000",
    secondary_color: "#ffffff",
  });

  const paddingAnimation = useRef(
    new Animated.Value(insets.bottom + 12),
  ).current;

  useEffect(() => {
    if (!isNew && id) {
      fetchClient();
    }
  }, [id]);

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/clients/${id}`);
      if (response.ok) {
        const data = await response.json();
        setFormData(data);
      } else {
        Alert.alert("Error", "Client not found");
        router.back();
      }
    } catch (error) {
      console.error("Error fetching client:", error);
      Alert.alert("Error", "Failed to load client details");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Required", "Please enter a client name");
      return;
    }

    setSaving(true);
    try {
      const url = isNew ? "/api/clients" : `/api/clients/${id}`;
      const method = isNew ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        Alert.alert(
          "Success",
          `Client ${isNew ? "created" : "updated"} successfully`,
        );
        router.back();
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      console.error("Error saving client:", error);
      Alert.alert("Error", "Failed to save client details");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "Delete Client",
      "Are you sure you want to delete this client? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`/api/clients/${id}`, {
                method: "DELETE",
              });
              if (response.ok) {
                router.back();
              } else {
                throw new Error("Failed to delete");
              }
            } catch (error) {
              console.error("Error deleting client:", error);
              Alert.alert("Error", "Failed to delete client");
            }
          },
        },
      ],
    );
  };

  const animateTo = (value) => {
    Animated.timing(paddingAnimation, {
      toValue: value,
      duration: 200,
      useNativeDriver: false, // paddingBottom is not supported by native driver
    }).start();
  };

  const handleInputFocus = () => {
    if (Platform.OS === "web") return;
    animateTo(12);
  };

  const handleInputBlur = () => {
    if (Platform.OS === "web") return;
    animateTo(insets.bottom + 12);
  };

  const handleLogoPick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const uploadResult = await upload({ reactNativeAsset: asset });

        if (uploadResult.url) {
          setFormData((prev) => ({ ...prev, logo_url: uploadResult.url }));
        } else {
          Alert.alert("Upload Failed", "Could not upload the logo image.");
        }
      }
    } catch (error) {
      console.error("Logo upload error:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#137FEC" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingAnimatedView
      style={{ flex: 1, backgroundColor: "#F2F2F7" }}
      behavior="padding"
    >
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "#fff",
          paddingTop: insets.top + 12,
          paddingBottom: 12,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
        >
          <ChevronLeft color="#137FEC" size={20} />
          <Text style={{ fontSize: 16, color: "#137FEC" }}>Back</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827" }}>
          {isNew ? "New Client" : "Edit Client"}
        </Text>

        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#137FEC" />
          ) : (
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#137FEC" }}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: paddingAnimation }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 24 }}>
          {/* General Info */}
          <View style={{ gap: 12 }}>
            <SectionHeader title="GENERAL INFORMATION" />
            <Card>
              <InputField
                label="Client Name"
                placeholder="Enter client name"
                value={formData.name}
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
                }
                icon={Briefcase}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
              <Divider />
              <InputField
                label="Address"
                placeholder="Full address"
                value={formData.address}
                onChangeText={(text) =>
                  setFormData({ ...formData, address: text })
                }
                icon={MapPin}
                multiline
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
              <Divider />
              <InputField
                label="Location (Short)"
                placeholder="e.g. New York, NY"
                value={formData.location}
                onChangeText={(text) =>
                  setFormData({ ...formData, location: text })
                }
                icon={MapPin}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </Card>
          </View>

          {/* Branding Section - NEW */}
          <View style={{ gap: 12 }}>
            <SectionHeader title="BRANDING & CUSTOMIZATION" />
            <Card>
              <View style={{ padding: 16 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 12,
                  }}
                >
                  Client Logo
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 12,
                      backgroundColor: "#F3F4F6",
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {formData.logo_url ? (
                      <Image
                        source={{ uri: formData.logo_url }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="contain"
                      />
                    ) : (
                      <Briefcase color="#9CA3AF" size={32} />
                    )}
                    {uploading && (
                      <View
                        style={{
                          ...StyleSheet.absoluteFillObject,
                          backgroundColor: "rgba(255,255,255,0.7)",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ActivityIndicator size="small" color="#137FEC" />
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={handleLogoPick}
                    disabled={uploading}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      backgroundColor: "#EFF6FF",
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: "#DBEAFE",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: "#137FEC",
                      }}
                    >
                      {formData.logo_url ? "Change Logo" : "Upload Logo"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View
                  style={{
                    height: 1,
                    backgroundColor: "#F3F4F6",
                    marginVertical: 16,
                  }}
                />

                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 12,
                  }}
                >
                  Brand Colors
                </Text>

                <View style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ flex: 1, gap: 8 }}>
                    <Text style={{ fontSize: 12, color: "#6B7280" }}>
                      Primary Color
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          backgroundColor: formData.primary_color,
                          borderWidth: 1,
                          borderColor: "#E5E7EB",
                        }}
                      />
                      <TextInput
                        value={formData.primary_color}
                        onChangeText={(text) =>
                          setFormData((prev) => ({
                            ...prev,
                            primary_color: text,
                          }))
                        }
                        style={{
                          flex: 1,
                          height: 36,
                          borderWidth: 1,
                          borderColor: "#E5E7EB",
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          fontSize: 14,
                        }}
                        placeholder="#000000"
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1, gap: 8 }}>
                    <Text style={{ fontSize: 12, color: "#6B7280" }}>
                      Secondary Color
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          backgroundColor: formData.secondary_color,
                          borderWidth: 1,
                          borderColor: "#E5E7EB",
                        }}
                      />
                      <TextInput
                        value={formData.secondary_color}
                        onChangeText={(text) =>
                          setFormData((prev) => ({
                            ...prev,
                            secondary_color: text,
                          }))
                        }
                        style={{
                          flex: 1,
                          height: 36,
                          borderWidth: 1,
                          borderColor: "#E5E7EB",
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          fontSize: 14,
                        }}
                        placeholder="#ffffff"
                      />
                    </View>
                  </View>
                </View>

                {/* Preview */}
                <View
                  style={{
                    marginTop: 16,
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: "#F9FAFB",
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                  }}
                >
                  <Text
                    style={{ fontSize: 12, color: "#6B7280", marginBottom: 8 }}
                  >
                    App Header Preview
                  </Text>
                  <View
                    style={{
                      backgroundColor: formData.primary_color,
                      padding: 12,
                      borderRadius: 6,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: "rgba(255,255,255,0.2)",
                        }}
                      />
                      <Text
                        style={{
                          color: formData.secondary_color,
                          fontWeight: "600",
                          fontSize: 15,
                        }}
                      >
                        Client Portal
                      </Text>
                    </View>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        backgroundColor: "rgba(255,255,255,0.2)",
                      }}
                    />
                  </View>
                </View>
              </View>
            </Card>
          </View>

          {/* Contact Person */}
          <View style={{ gap: 12 }}>
            <SectionHeader title="CONTACT PERSON" />
            <Card>
              <InputField
                label="Name"
                placeholder="Contact person name"
                value={formData.contact_name}
                onChangeText={(text) =>
                  setFormData({ ...formData, contact_name: text })
                }
                icon={User}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
              <Divider />
              <InputField
                label="Email"
                placeholder="email@example.com"
                value={formData.contact_email}
                onChangeText={(text) =>
                  setFormData({ ...formData, contact_email: text })
                }
                icon={Mail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
              <Divider />
              <InputField
                label="Telephone"
                placeholder="(555) 000-0000"
                value={formData.contact_phone}
                onChangeText={(text) =>
                  setFormData({ ...formData, contact_phone: text })
                }
                icon={Phone}
                keyboardType="phone-pad"
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </Card>
          </View>

          {/* Manager */}
          <View style={{ gap: 12 }}>
            <SectionHeader title="MANAGER" />
            <Card>
              <InputField
                label="Name"
                placeholder="Manager name"
                value={formData.manager_name}
                onChangeText={(text) =>
                  setFormData({ ...formData, manager_name: text })
                }
                icon={User}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
              <Divider />
              <InputField
                label="Email"
                placeholder="manager@example.com"
                value={formData.manager_email}
                onChangeText={(text) =>
                  setFormData({ ...formData, manager_email: text })
                }
                icon={Mail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
              <Divider />
              <InputField
                label="Telephone"
                placeholder="(555) 000-0000"
                value={formData.manager_phone}
                onChangeText={(text) =>
                  setFormData({ ...formData, manager_phone: text })
                }
                icon={Phone}
                keyboardType="phone-pad"
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </Card>
          </View>

          {/* Safety Coordinator */}
          <View style={{ gap: 12 }}>
            <SectionHeader title="SAFETY COORDINATOR" />
            <Card>
              <InputField
                label="Name"
                placeholder="Safety coordinator name"
                value={formData.safety_coordinator_name}
                onChangeText={(text) =>
                  setFormData({ ...formData, safety_coordinator_name: text })
                }
                icon={Shield}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
              <Divider />
              <InputField
                label="Email"
                placeholder="safety@example.com"
                value={formData.safety_coordinator_email}
                onChangeText={(text) =>
                  setFormData({ ...formData, safety_coordinator_email: text })
                }
                icon={Mail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
              <Divider />
              <InputField
                label="Telephone"
                placeholder="(555) 000-0000"
                value={formData.safety_coordinator_phone}
                onChangeText={(text) =>
                  setFormData({ ...formData, safety_coordinator_phone: text })
                }
                icon={Phone}
                keyboardType="phone-pad"
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </Card>
          </View>

          {!isNew && (
            <TouchableOpacity
              onPress={handleDelete}
              style={{
                backgroundColor: "#FEE2E2",
                padding: 16,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 8,
              }}
            >
              <Trash2 color="#EF4444" size={20} />
              <Text
                style={{ color: "#EF4444", fontWeight: "600", fontSize: 16 }}
              >
                Delete Client
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.ScrollView>
    </KeyboardAvoidingAnimatedView>
  );
}

function SectionHeader({ title }) {
  return (
    <Text
      style={{
        fontSize: 12,
        fontWeight: "600",
        color: "#6B7280",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginLeft: 4,
      }}
    >
      {title}
    </Text>
  );
}

function Card({ children }) {
  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#E5E7EB",
      }}
    >
      {children}
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: "#F3F4F6" }} />;
}

function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  icon: Icon,
  multiline,
  keyboardType,
  autoCapitalize,
  onFocus,
  onBlur,
}) {
  return (
    <View style={{ padding: 12, flexDirection: "row", gap: 12 }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          backgroundColor: "#F9FAFB",
          alignItems: "center",
          justifyContent: "center",
          marginTop: multiline ? 2 : 0,
        }}
      >
        <Icon color="#6B7280" size={18} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "500",
            color: "#6B7280",
            marginBottom: 4,
          }}
        >
          {label}
        </Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          style={{
            fontSize: 15,
            color: "#111827",
            padding: 0,
            minHeight: multiline ? 60 : 24,
            textAlignVertical: multiline ? "top" : "center",
          }}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </View>
    </View>
  );
}
