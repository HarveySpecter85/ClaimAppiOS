import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
  useRef,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  PanResponder,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import {
  Pen,
  Trash2,
  X,
  Check,
  Image as ImageIcon,
  Undo,
} from "lucide-react-native";
import { useUpload } from "@/utils/useUpload";
import { Canvas, Path, Skia, useCanvasRef } from "@shopify/react-native-skia";

const SignaturePad = forwardRef(function SignaturePad(
  {
    label = "Signature",
    signatureUrl,
    onSignatureChange,
    initialSignature,
    onSignatureComplete,
    onSave,
    onClose,
    height = 128,
  },
  ref,
) {
  const [upload, { loading }] = useUpload();
  const [internalUrl, setInternalUrl] = useState(initialSignature || null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Skia Drawing State
  const canvasRef = useCanvasRef();
  const [paths, setPaths] = useState([]);
  const [currentPath, setCurrentPath] = useState(null);

  // Track the active path reference to avoid closure staleness in touch handler
  const currentPathRef = useRef(null);

  const displayedUrl = useMemo(() => {
    if (signatureUrl !== undefined) {
      return signatureUrl;
    }
    return internalUrl;
  }, [signatureUrl, internalUrl]);

  const notifyChange = useCallback(
    (nextUrl) => {
      if (signatureUrl === undefined) {
        setInternalUrl(nextUrl);
      }
      if (onSignatureChange) onSignatureChange(nextUrl);
      if (onSignatureComplete) onSignatureComplete(nextUrl);
      if (onSave) onSave(nextUrl);
    },
    [signatureUrl, onSignatureChange, onSignatureComplete, onSave],
  );

  useImperativeHandle(
    ref,
    () => ({
      clear: () => notifyChange(null),
    }),
    [notifyChange],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const p = Skia.Path.Make();
        p.moveTo(locationX, locationY);
        currentPathRef.current = p;
        setCurrentPath(p);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        if (currentPathRef.current) {
          currentPathRef.current.lineTo(locationX, locationY);
          setCurrentPath(currentPathRef.current.copy());
        }
      },
      onPanResponderRelease: () => {
        if (currentPathRef.current) {
          setPaths((prev) => [...prev, currentPathRef.current]);
          currentPathRef.current = null;
          setCurrentPath(null);
        }
      },
    }),
  ).current;

  const handleClearDrawing = () => {
    setPaths([]);
    setCurrentPath(null);
    currentPathRef.current = null;
  };

  const handleUndo = () => {
    setPaths((prev) => prev.slice(0, -1));
  };

  const handleSaveDrawing = async () => {
    try {
      if (paths.length === 0) {
        Alert.alert("Empty Signature", "Please sign before saving.");
        return;
      }

      // Generate snapshot
      const image = canvasRef.current?.makeImageSnapshot();
      if (!image) {
        Alert.alert("Error", "Failed to capture signature.");
        return;
      }

      // Encode to base64
      const base64 = image.encodeToBase64();
      const dataUri = `data:image/png;base64,${base64}`;

      // Upload
      const { url, error } = await upload({ base64: dataUri });

      if (error) {
        Alert.alert("Upload Failed", error);
        return;
      }

      notifyChange(url);
      setIsDrawing(false);
      // Reset drawing state
      setPaths([]);
      setCurrentPath(null);
    } catch (e) {
      console.error("Error saving signature:", e);
      Alert.alert("Error", "Failed to save signature");
    }
  };

  const pickSignatureImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 1],
        quality: 0.9,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      const { url, error } = await upload({ reactNativeAsset: asset });
      if (error) {
        Alert.alert("Upload failed", error);
        return;
      }

      notifyChange(url);
      setIsDrawing(false);
    } catch (e) {
      console.error("Error picking signature:", e);
      Alert.alert("Error", "Failed to select signature image");
    }
  };

  const confirmClear = useCallback(() => {
    Alert.alert(
      "Clear Signature",
      "Are you sure you want to clear this signature?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => notifyChange(null),
        },
      ],
    );
  }, [notifyChange]);

  const startDrawing = () => {
    setPaths([]);
    setCurrentPath(null);
    setIsDrawing(true);
  };

  const isModalMode = !!onClose;

  const DrawingModal = (
    <Modal
      visible={isDrawing}
      animationType="slide"
      onRequestClose={() => setIsDrawing(false)}
    >
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingTop: 60,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderColor: "#E5E7EB",
          }}
        >
          <TouchableOpacity
            onPress={() => setIsDrawing(false)}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor: "#F3F4F6",
            }}
          >
            <X size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#111827" }}>
            Sign Here
          </Text>
          <TouchableOpacity
            onPress={handleSaveDrawing}
            disabled={loading}
            style={{
              padding: 8,
              borderRadius: 8,
              backgroundColor: "#3B82F6",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Check size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Toolbar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: 12,
            backgroundColor: "#F9FAFB",
          }}
        >
          <TouchableOpacity
            onPress={handleClearDrawing}
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <Trash2 size={20} color="#EF4444" />
            <Text style={{ color: "#EF4444", fontWeight: "500" }}>Clear</Text>
          </TouchableOpacity>
          <View style={{ width: 1, height: 24, backgroundColor: "#D1D5DB" }} />
          <TouchableOpacity
            onPress={handleUndo}
            disabled={paths.length === 0}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              opacity: paths.length === 0 ? 0.5 : 1,
            }}
          >
            <Undo size={20} color="#374151" />
            <Text style={{ color: "#374151", fontWeight: "500" }}>Undo</Text>
          </TouchableOpacity>
          <View style={{ width: 1, height: 24, backgroundColor: "#D1D5DB" }} />
          <TouchableOpacity
            onPress={pickSignatureImage}
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <ImageIcon size={20} color="#374151" />
            <Text style={{ color: "#374151", fontWeight: "500" }}>
              Upload Image
            </Text>
          </TouchableOpacity>
        </View>

        {/* Canvas Area */}
        <View
          style={{ flex: 1, backgroundColor: "#F9FAFB", position: "relative" }}
        >
          <View
            style={{
              flex: 1,
              margin: 16,
              backgroundColor: "#fff",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              overflow: "hidden",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <View style={{ flex: 1 }} {...panResponder.panHandlers}>
              <Canvas style={{ flex: 1 }} ref={canvasRef}>
                {paths.map((path, index) => (
                  <Path
                    key={index}
                    path={path}
                    color="black"
                    style="stroke"
                    strokeWidth={3}
                    strokeJoin="round"
                    strokeCap="round"
                  />
                ))}
                {currentPath && (
                  <Path
                    path={currentPath}
                    color="black"
                    style="stroke"
                    strokeWidth={3}
                    strokeJoin="round"
                    strokeCap="round"
                  />
                )}
              </Canvas>
            </View>
            {paths.length === 0 && !currentPath && (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  justifyContent: "center",
                  alignItems: "center",
                  pointerEvents: "none",
                }}
              >
                <Text
                  style={{
                    color: "#9CA3AF",
                    fontSize: 24,
                    fontWeight: "500",
                    opacity: 0.5,
                  }}
                >
                  Sign above
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );

  const InlineBody = (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 14, fontWeight: "600", color: "#111827" }}>
        {label}
      </Text>

      {displayedUrl ? (
        <View
          style={{
            height,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: "#3B82F6",
            overflow: "hidden",
            position: "relative",
            backgroundColor: "#fff",
          }}
        >
          <Image
            source={{ uri: displayedUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="contain"
          />
          <TouchableOpacity
            onPress={confirmClear}
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              backgroundColor: "rgba(255,255,255,0.95)",
              borderRadius: 18,
              padding: 8,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            <Trash2 size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={startDrawing}
          disabled={loading}
          style={{
            height,
            borderRadius: 12,
            borderWidth: 2,
            borderStyle: "dashed",
            borderColor: "#D1D5DB",
            backgroundColor: "#F9FAFB",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Pen size={28} color="#9CA3AF" />
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#6B7280" }}>
            {loading ? "Uploading..." : "Tap to sign"}
          </Text>
        </TouchableOpacity>
      )}

      {DrawingModal}
    </View>
  );

  if (!isModalMode) {
    return InlineBody;
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.35)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: "#fff",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: 16,
            borderTopWidth: 1,
            borderColor: "rgba(229,231,235,0.8)",
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
            <Text style={{ fontSize: 16, fontWeight: "800", color: "#111827" }}>
              {label}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "#F3F4F6",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} color="#111827" />
            </TouchableOpacity>
          </View>

          {InlineBody}
        </View>
      </View>
    </Modal>
  );
});

export default SignaturePad;
