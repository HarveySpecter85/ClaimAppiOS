import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  ChevronLeft,
  Image as ImageIcon,
  Video,
  FileText,
  Upload,
  Check,
  Clock,
} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useUpload } from "@/utils/useUpload";

export default function EvidenceCollection() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [evidence, setEvidence] = useState([]);
  const [pendingUploads, setPendingUploads] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [upload, { loading: uploading }] = useUpload();

  useEffect(() => {
    fetchEvidence();
  }, [id]);

  const fetchEvidence = async () => {
    try {
      const response = await fetch(
        `/api/evidence?incident_id=${id}&file_type=${activeTab}`,
      );
      if (!response.ok) throw new Error("Failed to fetch evidence");
      const data = await response.json();
      setEvidence(data);
    } catch (error) {
      console.error(error);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      for (const asset of result.assets) {
        await uploadFile(asset, "photo");
      }
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      multiple: true,
    });

    if (!result.canceled) {
      for (const file of result.assets) {
        await uploadFile(file, "document");
      }
    }
  };

  const uploadFile = async (file, fileType) => {
    const uploadId = Date.now();
    setPendingUploads((prev) => [
      ...prev,
      {
        id: uploadId,
        name: file.name || file.uri.split("/").pop(),
        type: fileType,
      },
    ]);

    const result = await upload({ reactNativeAsset: file });

    if (result.url) {
      await fetch("/api/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incident_id: id,
          file_url: result.url,
          file_type: fileType,
          file_name: file.name || file.uri.split("/").pop(),
          file_size: file.size,
        }),
      });

      setPendingUploads((prev) => prev.filter((u) => u.id !== uploadId));
      fetchEvidence();
    }
  };

  const tabs = [
    { key: "all", label: "All", icon: FileText },
    { key: "photo", label: "Photos", icon: ImageIcon },
    { key: "video", label: "Videos", icon: Video },
    { key: "document", label: "Docs", icon: FileText },
  ];

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "#fff",
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginBottom: 12 }}
        >
          <ChevronLeft color="#111827" size={24} />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            color: "#111827",
            marginBottom: 4,
          }}
        >
          Evidence Collection
        </Text>
        <Text style={{ fontSize: 14, color: "#6B7280" }}>
          All evidence for INC-{id}
        </Text>
      </View>

      {/* Tabs */}
      <View
        style={{
          backgroundColor: "#fff",
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
        }}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => {
                  setActiveTab(tab.key);
                  fetchEvidence();
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor:
                    activeTab === tab.key ? "#3B82F6" : "#F3F4F6",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: activeTab === tab.key ? "#fff" : "#374151",
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Pending Uploads */}
        {pendingUploads.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#111827",
                marginBottom: 12,
              }}
            >
              Pending Uploads
            </Text>

            <View style={{ gap: 8 }}>
              {pendingUploads.map((upload) => (
                <View
                  key={upload.id}
                  style={{
                    backgroundColor: "#FEF3C7",
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: "#FDE047",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Clock color="#F59E0B" size={20} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "500",
                        color: "#92400E",
                      }}
                    >
                      {upload.name}
                    </Text>
                    <Text
                      style={{ fontSize: 12, color: "#92400E", marginTop: 2 }}
                    >
                      Uploading...
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Synced Evidence */}
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#111827",
              marginBottom: 12,
            }}
          >
            Synced Evidence ({evidence.length})
          </Text>

          {evidence.length === 0 ? (
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 32,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                alignItems: "center",
              }}
            >
              <FileText color="#9CA3AF" size={48} />
              <Text style={{ fontSize: 15, color: "#6B7280", marginTop: 12 }}>
                No evidence uploaded yet
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {evidence.map((item) => (
                <View
                  key={item.id}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    flexDirection: "row",
                    gap: 12,
                  }}
                >
                  {item.file_type === "photo" ? (
                    <Image
                      source={{ uri: item.file_url }}
                      style={{ width: 60, height: 60, borderRadius: 8 }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 8,
                        backgroundColor: "#F3F4F6",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {item.file_type === "video" ? (
                        <Video color="#374151" size={24} />
                      ) : (
                        <FileText color="#374151" size={24} />
                      )}
                    </View>
                  )}

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "500",
                        color: "#111827",
                        marginBottom: 4,
                      }}
                    >
                      {item.file_name}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Text style={{ fontSize: 12, color: "#6B7280" }}>
                        {formatFileSize(item.file_size)}
                      </Text>
                      <View
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: "#D1D5DB",
                        }}
                      />
                      <Text style={{ fontSize: 12, color: "#6B7280" }}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        marginTop: 4,
                      }}
                    >
                      <Check color="#10B981" size={14} />
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#10B981",
                          fontWeight: "500",
                        }}
                      >
                        Synced
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer Upload Buttons */}
      <View
        style={{
          padding: 20,
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={pickImage}
          disabled={uploading}
          style={{
            backgroundColor: "#3B82F6",
            borderRadius: 10,
            height: 50,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <ImageIcon color="#fff" size={20} />
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>
            Upload Photos
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity
            disabled={uploading}
            style={{
              flex: 1,
              backgroundColor: "#fff",
              borderRadius: 10,
              height: 50,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            <Video color="#374151" size={20} />
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#374151" }}>
              Video
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={pickDocument}
            disabled={uploading}
            style={{
              flex: 1,
              backgroundColor: "#fff",
              borderRadius: 10,
              height: 50,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            <FileText color="#374151" size={20} />
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#374151" }}>
              Document
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
