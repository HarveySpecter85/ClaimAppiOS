import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { FileText, Save } from "lucide-react-native";
import useI18n from "@/utils/i18n/useI18n";

export function ActionFooter({ saving, onPreviewPdf, onSave, bottomInset }) {
  const { t } = useI18n();

  const previewPdfLabel = t("prescription.previewPdf");
  const saveCardLabel = t("prescription.saveCard");

  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
        padding: 16,
        paddingBottom: bottomInset + 16,
      }}
    >
      <View style={{ flexDirection: "row", gap: 12 }}>
        <TouchableOpacity
          onPress={onPreviewPdf}
          disabled={saving}
          style={{
            flex: 1,
            height: 48,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#D1D5DB",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
          }}
        >
          <FileText size={18} color="#111827" />
          <Text style={{ fontWeight: "800", color: "#111827" }}>
            {previewPdfLabel}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onSave}
          disabled={saving}
          style={{
            flex: 1,
            height: 48,
            borderRadius: 12,
            backgroundColor: "#3B82F6",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
          }}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Save size={18} color="#fff" />
              <Text style={{ fontWeight: "900", color: "#fff" }}>
                {saveCardLabel}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
