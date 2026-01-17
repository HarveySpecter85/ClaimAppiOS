import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  // Dimensions,
  // Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  Bell,
  TrendingUp,
  Clock,
  AlertCircle,
  Plus,
  // Users,
  CheckCircle,
  AlertTriangle,
  BarChart2,
  PieChart,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import LanguageSelectorButton from "../../components/LanguageSelectorButton";
import useI18n from "../../utils/i18n/useI18n";

// const { width } = Dimensions.get("window");

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useI18n();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const total = stats?.total || 57;
  const open = stats?.open || 37;
  const closed = total - open || 20;
  const pending = stats?.pending || 12;
  const critical = stats?.critical || 5;
  const openPercentage = total > 0 ? Math.round((open / total) * 100) : 65;

  const trendData = stats?.trend || [];
  const typeData = stats?.typeBreakdown || [];

  // Helper to find max for scaling bars
  const maxTrend = Math.max(...trendData.map((d) => parseInt(d.count)), 1);

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <StatusBar style="dark" />

      {/* Header with Avatar and Notifications */}
      <View
        style={{
          backgroundColor: "#fff",
          paddingTop: insets.top + 12,
          paddingBottom: 20,
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ position: "relative" }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: "#3B82F6",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "#60A5FA",
                  }}
                />
              </View>
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: "#10B981",
                  borderWidth: 2,
                  borderColor: "#fff",
                }}
              />
            </View>
            <View>
              <Text style={{ fontSize: 13, color: "#6B7280" }}>
                {t("dashboard.welcomeBack")}
              </Text>
              <Text
                style={{ fontSize: 16, fontWeight: "700", color: "#111827" }}
              >
                {t("dashboard.portalTitle")}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <LanguageSelectorButton variant="pill" />

            <TouchableOpacity style={{ position: "relative" }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "#F3F4F6",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bell color="#374151" size={22} />
              </View>
              <View
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#EF4444",
                }}
              />
            </TouchableOpacity>
          </View>
        </View>

        <Text
          style={{
            fontSize: 26,
            fontWeight: "700",
            color: "#111827",
            marginBottom: 4,
          }}
        >
          {t("dashboard.greeting", { name: "Alex" })}
        </Text>
        <Text style={{ fontSize: 15, color: "#6B7280" }}>
          {t("dashboard.overviewSubtitle")}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              {/* Total Card */}
              <View
                style={{
                  width: 180,
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 16,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: "#EFF6FF",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <View
                      style={{
                        width: 24,
                        height: 20,
                        backgroundColor: "#3B82F6",
                        borderRadius: 4,
                      }}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: "#6B7280",
                    }}
                  >
                    Total
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 36,
                    fontWeight: "700",
                    color: "#111827",
                    marginBottom: 6,
                  }}
                >
                  {total}
                </Text>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <TrendingUp color="#10B981" size={16} />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: "#10B981",
                    }}
                  >
                    +12% this week
                  </Text>
                </View>
              </View>

              {/* Pending Card */}
              <View
                style={{
                  width: 180,
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 16,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: "#FEF3C7",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Clock color="#F59E0B" size={24} />
                  </View>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: "#6B7280",
                    }}
                  >
                    Pending
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 36,
                    fontWeight: "700",
                    color: "#111827",
                    marginBottom: 6,
                  }}
                >
                  {pending}
                </Text>
                <Text
                  style={{ fontSize: 13, fontWeight: "600", color: "#F59E0B" }}
                >
                  Needs review
                </Text>
              </View>

              {/* Critical Card */}
              <View
                style={{
                  width: 180,
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 16,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: "#FEE2E2",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <AlertCircle color="#EF4444" size={24} />
                  </View>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: "#6B7280",
                    }}
                  >
                    Critical
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 36,
                    fontWeight: "700",
                    color: "#111827",
                    marginBottom: 6,
                  }}
                >
                  {critical}
                </Text>
                <Text
                  style={{ fontSize: 13, fontWeight: "600", color: "#EF4444" }}
                >
                  Action required
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* NEW: Weekly Trend Analysis */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: "#F3F4F6",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BarChart2 color="#4B5563" size={24} />
              </View>
              <View>
                <Text
                  style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}
                >
                  Weekly Activity
                </Text>
                <Text style={{ fontSize: 14, color: "#6B7280" }}>
                  Incidents reported last 7 days
                </Text>
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-end",
                justifyContent: "space-between",
                height: 120,
                paddingBottom: 10,
              }}
            >
              {trendData.length > 0 ? (
                trendData.map((item, index) => {
                  const height = (parseInt(item.count) / maxTrend) * 100;
                  return (
                    <View
                      key={index}
                      style={{ alignItems: "center", gap: 8, flex: 1 }}
                    >
                      <View
                        style={{
                          width: 8,
                          height: `${Math.max(height, 10)}%`,
                          backgroundColor: height > 0 ? "#3B82F6" : "#E5E7EB",
                          borderRadius: 4,
                        }}
                      />
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#6B7280",
                          fontWeight: "500",
                        }}
                      >
                        {item.day}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <Text
                  style={{
                    color: "#9CA3AF",
                    textAlign: "center",
                    width: "100%",
                  }}
                >
                  No data available for this week
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* NEW: Incident Types Breakdown */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: "#111827",
              marginBottom: 16,
            }}
          >
            Top Categories
          </Text>
          <View style={{ gap: 12 }}>
            {typeData.map((type, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: "#fff",
                  padding: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    {type.incident_type}
                  </Text>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: "#111827",
                    }}
                  >
                    {type.count}
                  </Text>
                </View>
                <View
                  style={{
                    height: 6,
                    backgroundColor: "#F3F4F6",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: "100%",
                      width: `${(parseInt(type.count) / total) * 100}%`,
                      backgroundColor:
                        index === 0
                          ? "#EF4444"
                          : index === 1
                            ? "#F59E0B"
                            : "#3B82F6",
                      borderRadius: 3,
                    }}
                  />
                </View>
              </View>
            ))}
            {typeData.length === 0 && (
              <Text style={{ color: "#9CA3AF" }}>
                No categories recorded yet.
              </Text>
            )}
          </View>
        </View>

        {/* Incidents by Status */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 20,
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: "#111827",
                    marginBottom: 4,
                  }}
                >
                  Incidents by Status
                </Text>
                <Text style={{ fontSize: 14, color: "#6B7280" }}>
                  Current active cases overview
                </Text>
              </View>
              <TouchableOpacity>
                <Text
                  style={{ fontSize: 14, fontWeight: "600", color: "#3B82F6" }}
                >
                  View Report
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 24 }}
            >
              {/* Donut Chart */}
              <View style={{ alignItems: "center", justifyContent: "center" }}>
                <View
                  style={{
                    width: 140,
                    height: 140,
                    borderRadius: 70,
                    borderWidth: 24,
                    borderColor: "#E5E7EB",
                    borderLeftColor: "#3B82F6",
                    borderTopColor: "#3B82F6",
                    transform: [{ rotate: "-45deg" }],
                    position: "absolute",
                  }}
                />
                <View style={{ alignItems: "center" }}>
                  <Text
                    style={{
                      fontSize: 32,
                      fontWeight: "700",
                      color: "#111827",
                    }}
                  >
                    {openPercentage}%
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#6B7280",
                      fontWeight: "600",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    OPEN
                  </Text>
                </View>
              </View>

              {/* Legend */}
              <View style={{ flex: 1, gap: 16 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
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
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: "#3B82F6",
                      }}
                    />
                    <Text style={{ fontSize: 15, color: "#374151" }}>
                      Open Cases
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: "#111827",
                    }}
                  >
                    {open}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
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
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: "#E5E7EB",
                      }}
                    />
                    <Text style={{ fontSize: 15, color: "#374151" }}>
                      Closed
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: "#111827",
                    }}
                  >
                    {closed}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 4,
                  }}
                >
                  <AlertTriangle color="#F59E0B" size={16} />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#F59E0B",
                    }}
                  >
                    {critical} High Priority
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: "#111827",
              marginBottom: 16,
            }}
          >
            Quick Actions
          </Text>

          {/* Keep only "Report Incident" (remove Manage Users) */}
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/new-incident")}
            style={{
              backgroundColor: "#3B82F6",
              borderRadius: 16,
              padding: 20,
              minHeight: 130,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Plus color="#fff" size={28} />
            </View>
            <Text
              style={{
                fontSize: 17,
                fontWeight: "700",
                color: "#fff",
                marginBottom: 4,
              }}
            >
              Report Incident
            </Text>
            <Text style={{ fontSize: 14, color: "#DBEAFE" }}>
              Start a new case
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: "#111827",
              }}
            >
              Recent Activity
            </Text>
            <TouchableOpacity>
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: "#3B82F6" }}
              >
                View All
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 12 }}>
            {stats?.recentActivity?.length > 0 ? (
              stats.recentActivity.map((activity, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 12,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <View style={{ position: "relative" }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor:
                          activity.status === "open" ? "#DBEAFE" : "#D1FAE5",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {activity.status === "open" ? (
                        <View
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: "#3B82F6",
                          }}
                        />
                      ) : (
                        <CheckCircle color="#10B981" size={26} />
                      )}
                    </View>
                    {activity.status === "open" && (
                      <View
                        style={{
                          position: "absolute",
                          bottom: -2,
                          right: -2,
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          backgroundColor: "#FEE2E2",
                          borderWidth: 2,
                          borderColor: "#fff",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "700",
                            color: "#EF4444",
                          }}
                        >
                          !
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "600",
                        color: "#111827",
                        marginBottom: 2,
                      }}
                    >
                      {activity.incident_type || "Incident Report"}
                    </Text>
                    <Text style={{ fontSize: 13, color: "#6B7280" }}>
                      {activity.incident_number} •{" "}
                      {activity.employee_name || "Unknown Employee"}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, color: "#9CA3AF" }}>
                    {new Date(activity.created_at).toLocaleDateString(
                      undefined,
                      { month: "short", day: "numeric" },
                    )}
                  </Text>
                </View>
              ))
            ) : (
              <Text
                style={{ color: "#9CA3AF", textAlign: "center", padding: 20 }}
              >
                No recent activity
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
