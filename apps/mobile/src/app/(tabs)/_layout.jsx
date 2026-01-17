import { Tabs } from "expo-router";
import { View } from "react-native";
import {
  Home,
  AlertTriangle,
  FileText,
  Settings,
  Plus,
} from "lucide-react-native";
import useI18n from "../../utils/i18n/useI18n";

export default function TabLayout() {
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderColor: "#E5E7EB",
          paddingTop: 4,
          // IMPORTANT: don't set a fixed height for tabs; let iOS/Android size it.
        },
        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t("tab.home"),
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="investigations"
        options={{
          title: t("tab.incidents"),
          tabBarIcon: ({ color }) => <AlertTriangle color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="new-incident"
        options={{
          title: "",
          tabBarIcon: () => (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "#3B82F6",
                alignItems: "center",
                justifyContent: "center",
                marginTop: -20,
                shadowColor: "#3B82F6",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Plus color="#fff" size={28} strokeWidth={2.5} />
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reviews",
          tabBarIcon: ({ color }) => <FileText color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("tab.settings"),
          tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
        }}
      />

      {/* Hidden routes */}
      <Tabs.Screen
        name="incident/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="interview/witness"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="interview/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="evidence/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="root-cause/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="corrective-actions/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="benefit-affidavit/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="status-log/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="medical-authorization/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="mileage-reimbursement/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="modified-duty-policy/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="refusal-of-treatment/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="prescription-card/[id]"
        options={{
          href: null,
        }}
      />

      {/* NEW: share secure form link flow */}
      <Tabs.Screen
        name="share-form"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
