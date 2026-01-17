import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  Briefcase,
  UserSearch,
  Plus,
  MapPin,
  ChevronRight,
  Shield,
  FileText,
  Smartphone,
  Megaphone,
  Accessibility,
  LogOut,
} from "lucide-react-native";
import { Linking } from "react-native";
import LanguageSelectorButton from "../../components/LanguageSelectorButton";
import useI18n from "../../utils/i18n/useI18n";
import { useAuth } from "../../utils/auth/useAuth";

export default function Settings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, locale } = useI18n();
  const { signOut } = useAuth();

  const [settings, setSettings] = useState({
    brokerName: "SafeGuard Insurance",
    contactPerson: "Michael Scott",
    brokerEmails: "claims@safeguard.com",
    companyEmails: "admin@staffingagency.com",
    companyPhone: "(555) 000-0000",
    companyAddress: "1234 Corporate Blvd, Suite 100\nMetropolis, NY 10012",
  });

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log("Settings saved:", settings);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F2F2F7" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "rgba(242, 242, 247, 0.8)",
          paddingTop: insets.top + 12,
          paddingBottom: 12,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
        >
          <ChevronLeft color="#137FEC" size={20} />
          <Text style={{ fontSize: 16, color: "#137FEC" }}>Back</Text>
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: "#111827",
            position: "absolute",
            left: "50%",
            transform: [{ translateX: -70 }],
          }}
        >
          Company Settings
        </Text>

        <TouchableOpacity onPress={handleSave}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#137FEC" }}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ padding: 16, gap: 24 }}>
          {/* LANGUAGE */}
          <View style={{ gap: 8 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: "#6B7280",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                paddingHorizontal: 16,
              }}
            >
              {t("common.language").toUpperCase()}
            </Text>
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "#F3F4F6",
                padding: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: "#111827",
                    marginBottom: 2,
                  }}
                >
                  {t("common.language")}
                </Text>
                <Text style={{ fontSize: 12, color: "#6B7280" }}>
                  {locale === "es" ? t("common.spanish") : t("common.english")}
                </Text>
              </View>
              <LanguageSelectorButton variant="pill" />
            </View>
          </View>

          {/* CLIENT MANAGEMENT */}
          <View style={{ gap: 8 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: "#6B7280",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                paddingHorizontal: 16,
              }}
            >
              CLIENT MANAGEMENT
            </Text>
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "#F3F4F6",
              }}
            >
              <TouchableOpacity
                onPress={() => router.push("/clients")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 12,
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: "#EFF6FF",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Briefcase color="#137FEC" size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#111827",
                      marginBottom: 2,
                    }}
                  >
                    My Clients - Positions
                  </Text>
                  <Text style={{ fontSize: 12, color: "#6B7280" }}>
                    Manage client roles & assignments
                  </Text>
                </View>
                <ChevronRight color="#9CA3AF" size={20} />
              </TouchableOpacity>
            </View>
          </View>

          {/* WC BROKER INFORMATION */}
          <View style={{ gap: 8 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: "#6B7280",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                paddingHorizontal: 16,
              }}
            >
              WC BROKER INFORMATION
            </Text>
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "#F3F4F6",
              }}
            >
              {/* Broker Name */}
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#F3F4F6",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: "#137FEC",
                    marginBottom: 4,
                  }}
                >
                  Broker Name
                </Text>
                <TextInput
                  value={settings.brokerName}
                  onChangeText={(text) =>
                    setSettings({ ...settings, brokerName: text })
                  }
                  placeholder="Enter broker agency name"
                  placeholderTextColor="#9CA3AF"
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#111827",
                    padding: 0,
                  }}
                />
              </View>

              {/* Contact Person */}
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#F3F4F6",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: "#6B7280",
                    marginBottom: 4,
                  }}
                >
                  Contact Person
                </Text>
                <TextInput
                  value={settings.contactPerson}
                  onChangeText={(text) =>
                    setSettings({ ...settings, contactPerson: text })
                  }
                  placeholder="Name of representative"
                  placeholderTextColor="#9CA3AF"
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#111827",
                    padding: 0,
                  }}
                />
              </View>

              {/* Broker Emails */}
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: "#6B7280",
                    marginBottom: 4,
                  }}
                >
                  Broker Emails
                </Text>
                <TextInput
                  value={settings.brokerEmails}
                  onChangeText={(text) =>
                    setSettings({ ...settings, brokerEmails: text })
                  }
                  placeholder="claims@broker.com, support@broker.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#111827",
                    padding: 0,
                  }}
                />
              </View>
            </View>
          </View>

          {/* TEAM & PERSONNEL */}
          <View style={{ gap: 8 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: "#6B7280",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                paddingHorizontal: 16,
              }}
            >
              TEAM & PERSONNEL
            </Text>
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "#F3F4F6",
              }}
            >
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 12,
                  gap: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#F3F4F6",
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: "#F3E8FF",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <UserSearch color="#9333EA" size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#111827",
                      marginBottom: 2,
                    }}
                  >
                    My Investigators
                  </Text>
                  <Text style={{ fontSize: 12, color: "#6B7280" }}>
                    12 Active Agents
                  </Text>
                </View>
                <ChevronRight color="#9CA3AF" size={20} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  try {
                    // Generate temporary access token
                    const response = await fetch("/api/auth/temporary-access", {
                      method: "GET",
                      headers: { "Content-Type": "application/json" },
                    });

                    if (response.ok) {
                      const { accessUrl } = await response.json();
                      Linking.openURL(accessUrl);
                    } else {
                      Alert.alert(
                        "Error",
                        "Could not generate admin panel access. Please try again.",
                      );
                    }
                  } catch (error) {
                    console.error("Error opening admin panel:", error);
                    Alert.alert(
                      "Error",
                      "Failed to open admin panel. Check your internet connection.",
                    );
                  }
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 12,
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: "#DBEAFE",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Shield color="#2563EB" size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#111827",
                      marginBottom: 2,
                    }}
                  >
                    Admin Panel
                  </Text>
                  <Text style={{ fontSize: 12, color: "#6B7280" }}>
                    Manage users, roles & permissions
                  </Text>
                </View>
                <ChevronRight color="#9CA3AF" size={20} />
              </TouchableOpacity>
            </View>
          </View>

          {/* MEDICAL RESOURCES */}
          <View style={{ gap: 8 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: "#6B7280",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                paddingHorizontal: 16,
              }}
            >
              MEDICAL RESOURCES
            </Text>
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "#F3F4F6",
              }}
            >
              {/* List of Panel Physicians */}
              <TouchableOpacity
                onPress={() => router.push("/panel-physicians")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 12,
                  gap: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#F3F4F6",
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: "#D1FAE5",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Plus color="#10B981" size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#111827",
                    }}
                  >
                    List of Panel Physicians
                  </Text>
                </View>
                <ChevronRight color="#9CA3AF" size={20} />
              </TouchableOpacity>

              {/* Medical Facilities by Zip Code */}
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 12,
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: "#FED7AA",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MapPin color="#EA580C" size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#111827",
                      marginBottom: 2,
                    }}
                  >
                    Medical Facilities by Zip Code
                  </Text>
                  <Text style={{ fontSize: 12, color: "#6B7280" }}>
                    Search nearby urgent care & clinics
                  </Text>
                </View>
                <ChevronRight color="#9CA3AF" size={20} />
              </TouchableOpacity>
            </View>
          </View>

          {/* COMPANY INFORMATION */}
          <View style={{ gap: 8 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: "#6B7280",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                paddingHorizontal: 16,
              }}
            >
              COMPANY INFORMATION
            </Text>
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "#F3F4F6",
              }}
            >
              {/* Company Emails */}
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#F3F4F6",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: "#6B7280",
                    marginBottom: 4,
                  }}
                >
                  Company Emails
                </Text>
                <TextInput
                  value={settings.companyEmails}
                  onChangeText={(text) =>
                    setSettings({ ...settings, companyEmails: text })
                  }
                  placeholder="admin@staffingagency.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#111827",
                    padding: 0,
                  }}
                />
              </View>

              {/* Company Phone */}
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#F3F4F6",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: "#6B7280",
                    marginBottom: 4,
                  }}
                >
                  Company Phone
                </Text>
                <TextInput
                  value={settings.companyPhone}
                  onChangeText={(text) =>
                    setSettings({ ...settings, companyPhone: text })
                  }
                  placeholder="(555) 000-0000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#111827",
                    padding: 0,
                  }}
                />
              </View>

              {/* Company Address */}
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: "#6B7280",
                    marginBottom: 4,
                  }}
                >
                  Company Address
                </Text>
                <TextInput
                  value={settings.companyAddress}
                  onChangeText={(text) =>
                    setSettings({ ...settings, companyAddress: text })
                  }
                  placeholder="1234 Corporate Blvd, Suite 100&#10;Metropolis, NY 10012"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={2}
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#111827",
                    padding: 0,
                    minHeight: 40,
                  }}
                />
              </View>
            </View>
          </View>

          {/* LEGAL & POLICIES */}
          <View style={{ gap: 8 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: "#6B7280",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                paddingHorizontal: 16,
              }}
            >
              LEGAL & POLICIES
            </Text>
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "#F3F4F6",
              }}
            >
              {[
                {
                  label: "Privacy Policy",
                  url: "https://www.ai-profitlab.io/privacy",
                  icon: Shield,
                  color: "#6B7280",
                  bgColor: "#F3F4F6",
                },
                {
                  label: "Terms of Service",
                  url: "https://www.ai-profitlab.io/terms",
                  icon: FileText,
                  color: "#6B7280",
                  bgColor: "#F3F4F6",
                },
                {
                  label: "Accessibility Policy",
                  url: "https://www.ai-profitlab.io/accessibility",
                  icon: Accessibility,
                  color: "#6B7280",
                  bgColor: "#F3F4F6",
                },
                {
                  label: "SMS Terms",
                  url: "https://www.ai-profitlab.io/sms-terms",
                  icon: Smartphone,
                  color: "#6B7280",
                  bgColor: "#F3F4F6",
                },
                {
                  label: "Marketing Policy",
                  url: "https://www.ai-profitlab.io/marketing-policy",
                  icon: Megaphone,
                  color: "#6B7280",
                  bgColor: "#F3F4F6",
                },
              ].map((item, index, arr) => (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => Linking.openURL(item.url)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 12,
                    gap: 12,
                    borderBottomWidth: index < arr.length - 1 ? 1 : 0,
                    borderBottomColor: "#F3F4F6",
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: item.bgColor,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <item.icon color={item.color} size={20} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: "#111827",
                      }}
                    >
                      {item.label}
                    </Text>
                  </View>
                  <ChevronRight color="#9CA3AF" size={20} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Footer Text */}
          <View style={{ paddingHorizontal: 32, paddingTop: 8 }}>
            <Text
              style={{
                fontSize: 11,
                color: "#9CA3AF",
                textAlign: "center",
                lineHeight: 16,
              }}
            >
              These settings affect global configurations for all incident
              reports. Last updated: Oct 24, 2023.
            </Text>
          </View>

          {/* LOG OUT */}
          <View style={{ paddingHorizontal: 16 }}>
            <TouchableOpacity
              onPress={signOut}
              style={{
                backgroundColor: "#FEF2F2",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#FECACA",
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <LogOut color="#EF4444" size={20} />
              <Text
                style={{ fontSize: 16, fontWeight: "700", color: "#EF4444" }}
              >
                Log Out
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
