import { useCallback, useMemo, useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { Languages, X } from "lucide-react-native";
import useI18n from "../utils/i18n/useI18n";

export default function LanguageSelectorButton({ variant = "icon" }) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);

  const label = useMemo(() => {
    return locale === "es" ? "ES" : "EN";
  }, [locale]);

  const onPick = useCallback(
    async (next) => {
      await setLocale(next);
      setOpen(false);
    },
    [setLocale],
  );

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={{
          height: 44,
          minWidth: 44,
          borderRadius: 22,
          backgroundColor: variant === "pill" ? "#F3F4F6" : "transparent",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: variant === "pill" ? 12 : 0,
          flexDirection: "row",
          gap: 8,
        }}
        activeOpacity={0.85}
      >
        <Languages color="#374151" size={20} />
        {variant === "pill" ? (
          <Text style={{ fontSize: 13, fontWeight: "800", color: "#374151" }}>
            {label}
          </Text>
        ) : null}
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.35)",
            padding: 20,
            justifyContent: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <Text
                style={{ fontSize: 16, fontWeight: "900", color: "#111827" }}
              >
                {t("common.language")}
              </Text>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                activeOpacity={0.85}
              >
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 10 }}>
              <TouchableOpacity
                onPress={() => onPick("en")}
                style={{
                  height: 48,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: locale === "en" ? "#3B82F6" : "#E5E7EB",
                  backgroundColor:
                    locale === "en" ? "rgba(59,130,246,0.10)" : "#fff",
                  paddingHorizontal: 14,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
                activeOpacity={0.85}
              >
                <Text
                  style={{ fontSize: 14, fontWeight: "800", color: "#111827" }}
                >
                  {t("common.english")}
                </Text>
                <Text
                  style={{ fontSize: 13, fontWeight: "900", color: "#6B7280" }}
                >
                  EN
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onPick("es")}
                style={{
                  height: 48,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: locale === "es" ? "#3B82F6" : "#E5E7EB",
                  backgroundColor:
                    locale === "es" ? "rgba(59,130,246,0.10)" : "#fff",
                  paddingHorizontal: 14,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
                activeOpacity={0.85}
              >
                <Text
                  style={{ fontSize: 14, fontWeight: "800", color: "#111827" }}
                >
                  {t("common.spanish")}
                </Text>
                <Text
                  style={{ fontSize: 13, fontWeight: "900", color: "#6B7280" }}
                >
                  ES
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
