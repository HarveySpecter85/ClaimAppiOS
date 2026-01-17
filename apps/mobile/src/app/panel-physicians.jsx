import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Share,
  SectionList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  Plus,
  FileText,
  Trash2,
  Mail,
  MapPin,
  X,
  Upload,
} from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
import useUpload from "@/utils/useUpload";

export default function PanelPhysicians() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [upload, { loading: uploading }] = useUpload();

  const [physicians, setPhysicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newLocation, setNewLocation] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchPhysicians();
  }, []);

  const fetchPhysicians = async () => {
    try {
      const response = await fetch("/api/panel-physicians");
      if (response.ok) {
        const data = await response.json();
        setPhysicians(data);
      }
    } catch (error) {
      console.error("Error fetching physicians:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/png"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const handleUpload = async () => {
    if (!newLocation.trim()) {
      Alert.alert("Required", "Please enter a location");
      return;
    }
    if (!selectedFile) {
      Alert.alert("Required", "Please select a file");
      return;
    }

    try {
      const result = await upload({
        reactNativeAsset: {
          uri: selectedFile.uri,
          type: selectedFile.mimeType,
          name: selectedFile.name,
        },
      });

      if (result.url) {
        const saveResponse = await fetch("/api/panel-physicians", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: newLocation,
            file_url: result.url,
            file_name: selectedFile.name,
            file_type: selectedFile.mimeType,
          }),
        });

        if (saveResponse.ok) {
          setModalVisible(false);
          setNewLocation("");
          setSelectedFile(null);
          fetchPhysicians();
          Alert.alert("Success", "Panel physician list uploaded successfully");
        } else {
          throw new Error("Failed to save record");
        }
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", "Failed to upload document");
    }
  };

  const handleDelete = async (id) => {
    Alert.alert(
      "Delete Document",
      "Are you sure you want to delete this document?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`/api/panel-physicians/${id}`, {
                method: "DELETE",
              });
              if (response.ok) {
                fetchPhysicians();
              } else {
                Alert.alert("Error", "Failed to delete document");
              }
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Failed to delete document");
            }
          },
        },
      ],
    );
  };

  const handleEmail = async (fileUrl) => {
    try {
      await Share.share({
        message: `Please find the attached Panel Physician List: ${fileUrl}`,
        url: fileUrl, // iOS might use this for attachment context in some apps, but mainly standard share
        title: "Panel Physician List",
      });
    } catch (error) {
      console.error("Share error:", error);
      Alert.alert("Error", "Failed to share document");
    }
  };

  // Group by location for SectionList
  const groupedData = physicians.reduce((acc, curr) => {
    const existing = acc.find((item) => item.title === curr.location);
    if (existing) {
      existing.data.push(curr);
    } else {
      acc.push({ title: curr.location, data: [curr] });
    }
    return acc;
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#F2F2F7" }}>
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
          Panel Physicians
        </Text>

        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Plus color="#137FEC" size={24} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#137FEC" />
        </View>
      ) : (
        <SectionList
          sections={groupedData}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section: { title } }) => (
            <View style={{ marginTop: 16, marginBottom: 8 }}>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: "#6B7280",
                  textTransform: "uppercase",
                  marginLeft: 4,
                }}
              >
                {title}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: "#fff",
                padding: 16,
                borderRadius: 12,
                marginBottom: 8,
                flexDirection: "row",
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  backgroundColor: "#EFF6FF",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <FileText color="#137FEC" size={20} />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: "#111827",
                    marginBottom: 2,
                  }}
                  numberOfLines={1}
                >
                  {item.file_name}
                </Text>
                <Text style={{ fontSize: 12, color: "#6B7280" }}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={() => handleEmail(item.file_url)}
                  style={{
                    padding: 8,
                    backgroundColor: "#F3F4F6",
                    borderRadius: 8,
                  }}
                >
                  <Mail color="#4B5563" size={18} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(item.id)}
                  style={{
                    padding: 8,
                    backgroundColor: "#FEE2E2",
                    borderRadius: 8,
                  }}
                >
                  <Trash2 color="#EF4444" size={18} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <Text style={{ color: "#6B7280", fontSize: 16 }}>
                No panel physicians uploaded yet.
              </Text>
            </View>
          }
        />
      )}

      {/* Add Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 24,
              paddingBottom: insets.bottom + 24,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <Text
                style={{ fontSize: 20, fontWeight: "700", color: "#111827" }}
              >
                Upload Document
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color="#6B7280" size={24} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 16 }}>
              <View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 8,
                  }}
                >
                  Location
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "#D1D5DB",
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    backgroundColor: "#F9FAFB",
                  }}
                >
                  <MapPin color="#9CA3AF" size={20} />
                  <TextInput
                    value={newLocation}
                    onChangeText={setNewLocation}
                    placeholder="Enter location name (e.g. New York)"
                    placeholderTextColor="#9CA3AF"
                    style={{
                      flex: 1,
                      padding: 12,
                      fontSize: 16,
                      color: "#111827",
                    }}
                  />
                </View>
              </View>

              <View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#374151",
                    marginBottom: 8,
                  }}
                >
                  Document
                </Text>
                <TouchableOpacity
                  onPress={handlePickDocument}
                  style={{
                    borderWidth: 1,
                    borderColor: "#D1D5DB",
                    borderStyle: "dashed",
                    borderRadius: 12,
                    padding: 24,
                    alignItems: "center",
                    backgroundColor: "#F9FAFB",
                  }}
                >
                  <Upload
                    color={selectedFile ? "#10B981" : "#6B7280"}
                    size={32}
                  />
                  <Text
                    style={{
                      marginTop: 8,
                      fontSize: 14,
                      color: selectedFile ? "#10B981" : "#6B7280",
                      fontWeight: selectedFile ? "600" : "400",
                      textAlign: "center",
                    }}
                  >
                    {selectedFile
                      ? selectedFile.name
                      : "Tap to select PDF, JPG, or PNG"}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleUpload}
                disabled={uploading}
                style={{
                  backgroundColor: "#137FEC",
                  borderRadius: 12,
                  padding: 16,
                  alignItems: "center",
                  marginTop: 8,
                  opacity: uploading ? 0.7 : 1,
                }}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: "#fff",
                    }}
                  >
                    Upload & Save
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
