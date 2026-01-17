import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import { X } from "lucide-react-native";
import useI18n from "@/utils/i18n/useI18n";

export function PdfPreviewModal({ visible, onClose, pdfHtml, topInset }) {
  const { t } = useI18n();

  const title = t("prescription.pdfPreview");
  const preview = t("prescription.preview");
  const webNote = t("prescription.webHtmlNote");

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <View
          style={{
            backgroundColor: "#fff",
            paddingTop: topInset + 12,
            paddingBottom: 12,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottomWidth: 1,
            borderBottomColor: "#E5E7EB",
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            style={{ width: 40, height: 40, justifyContent: "center" }}
          >
            <X size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={{ fontWeight: "900", color: "#111827" }}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>

        {Platform.OS === "web" ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16 }}
          >
            <Text
              style={{ fontWeight: "800", color: "#111827", marginBottom: 8 }}
            >
              {preview}
            </Text>
            <Text style={{ color: "#6B7280", marginBottom: 16 }}>
              {webNote}
            </Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <Text style={{ padding: 12, color: "#111827" }}>{pdfHtml}</Text>
            </View>
          </ScrollView>
        ) : (
          <WebView source={{ html: pdfHtml }} style={{ flex: 1 }} />
        )}
      </View>
    </Modal>
  );
}
