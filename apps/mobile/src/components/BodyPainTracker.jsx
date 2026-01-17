import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import Svg, { Path, G } from "react-native-svg";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react-native";

// Definición de las siluetas detalladas
const BODY_PARTS_SVG = {
  head: "M85 30 A15 15 0 1 1 115 30 A15 15 0 1 1 100 30",
  neck: "M90 50 L110 50 L110 60 L90 60 Z",

  // Brazos Izquierdos (Vista Frontal: Lado Derecho de la Imagen)
  shoulder_left: "M70 60 L90 60 L90 80 L60 80 L65 65 Z",
  upper_arm_left: "M60 80 L90 80 L85 115 L65 115 Z",
  elbow_left: "M65 115 L85 115 L85 125 L65 125 Z",
  forearm_left: "M65 125 L85 125 L82 160 L68 160 Z",
  hand_left: "M68 160 L82 160 L80 180 L70 180 Z",

  // Brazos Derechos (Vista Frontal: Lado Izquierdo de la Imagen)
  shoulder_right: "M110 60 L130 60 L135 65 L140 80 L110 80 Z",
  upper_arm_right: "M110 80 L140 80 L135 115 L115 115 Z",
  elbow_right: "M115 115 L135 115 L135 125 L115 125 Z",
  forearm_right: "M115 125 L135 125 L132 160 L118 160 Z",
  hand_right: "M118 160 L132 160 L130 180 L120 180 Z",

  // Torso Frontal
  chest: "M70 60 L130 60 L125 100 L75 100 Z",
  abdomen: "M75 100 L125 100 L120 140 L80 140 Z",
  hips: "M70 140 L130 140 L125 160 L75 160 Z",
  genital: "M90 160 L110 160 L100 175 Z",

  // Torso Trasero
  upper_back: "M70 60 L130 60 L125 100 L75 100 Z",
  lower_back: "M75 100 L125 100 L120 140 L80 140 Z",
  buttocks: "M75 140 L125 140 L125 160 L75 160 Z",

  // Piernas Izquierdas
  thigh_left: "M75 160 L95 160 L90 220 L70 220 Z",
  knee_left: "M70 220 L90 220 L90 235 L70 235 Z",
  lower_leg_left: "M70 235 L90 235 L88 285 L72 285 Z", // Espinilla/Pantorrilla
  ankle_left: "M72 285 L88 285 L88 295 L72 295 Z",
  foot_left: "M72 295 L88 295 L95 310 L65 310 Z",

  // Piernas Derechas
  thigh_right: "M105 160 L125 160 L130 220 L110 220 Z",
  knee_right: "M110 220 L130 220 L130 235 L110 235 Z",
  lower_leg_right: "M110 235 L130 235 L128 285 L112 285 Z",
  ankle_right: "M112 285 L128 285 L128 295 L112 295 Z",
  foot_right: "M112 295 L128 295 L135 310 L105 310 Z",
};

const FRONT_VIEW_PARTS = [
  { id: "head", name: "Head", path: BODY_PARTS_SVG.head },
  { id: "neck", name: "Neck", path: BODY_PARTS_SVG.neck },

  // Left Arm (Screen Left)
  {
    id: "shoulder_left",
    name: "Shoulder (Left)",
    path: BODY_PARTS_SVG.shoulder_left,
  },
  {
    id: "upper_arm_left",
    name: "Upper Arm (Left)",
    path: BODY_PARTS_SVG.upper_arm_left,
  },
  { id: "elbow_left", name: "Elbow (Left)", path: BODY_PARTS_SVG.elbow_left },
  {
    id: "forearm_left",
    name: "Forearm (Left)",
    path: BODY_PARTS_SVG.forearm_left,
  },
  { id: "hand_left", name: "Hand (Left)", path: BODY_PARTS_SVG.hand_left },

  // Right Arm (Screen Right)
  {
    id: "shoulder_right",
    name: "Shoulder (Right)",
    path: BODY_PARTS_SVG.shoulder_right,
  },
  {
    id: "upper_arm_right",
    name: "Upper Arm (Right)",
    path: BODY_PARTS_SVG.upper_arm_right,
  },
  {
    id: "elbow_right",
    name: "Elbow (Right)",
    path: BODY_PARTS_SVG.elbow_right,
  },
  {
    id: "forearm_right",
    name: "Forearm (Right)",
    path: BODY_PARTS_SVG.forearm_right,
  },
  { id: "hand_right", name: "Hand (Right)", path: BODY_PARTS_SVG.hand_right },

  // Torso
  { id: "chest", name: "Chest (Pecho)", path: BODY_PARTS_SVG.chest },
  { id: "abdomen", name: "Abdomen", path: BODY_PARTS_SVG.abdomen },
  { id: "hips", name: "Hips (Cadera)", path: BODY_PARTS_SVG.hips },
  { id: "genital", name: "Genitals", path: BODY_PARTS_SVG.genital },

  // Left Leg
  { id: "thigh_left", name: "Thigh (Left)", path: BODY_PARTS_SVG.thigh_left },
  { id: "knee_left", name: "Knee (Left)", path: BODY_PARTS_SVG.knee_left },
  {
    id: "leg_left",
    name: "Shin/Leg (Left)",
    path: BODY_PARTS_SVG.lower_leg_left,
  },
  { id: "ankle_left", name: "Ankle (Left)", path: BODY_PARTS_SVG.ankle_left },
  { id: "foot_left", name: "Foot (Left)", path: BODY_PARTS_SVG.foot_left },

  // Right Leg
  {
    id: "thigh_right",
    name: "Thigh (Right)",
    path: BODY_PARTS_SVG.thigh_right,
  },
  { id: "knee_right", name: "Knee (Right)", path: BODY_PARTS_SVG.knee_right },
  {
    id: "leg_right",
    name: "Shin/Leg (Right)",
    path: BODY_PARTS_SVG.lower_leg_right,
  },
  {
    id: "ankle_right",
    name: "Ankle (Right)",
    path: BODY_PARTS_SVG.ankle_right,
  },
  { id: "foot_right", name: "Foot (Right)", path: BODY_PARTS_SVG.foot_right },
];

const BACK_VIEW_PARTS = [
  { id: "head_back", name: "Head (Back)", path: BODY_PARTS_SVG.head },
  { id: "neck_back", name: "Neck (Back)", path: BODY_PARTS_SVG.neck },

  // Arms Back
  {
    id: "shoulder_left_back",
    name: "Shoulder Back (Left)",
    path: BODY_PARTS_SVG.shoulder_left,
  },
  {
    id: "upper_arm_left_back",
    name: "Upper Arm Back (Left)",
    path: BODY_PARTS_SVG.upper_arm_left,
  },
  {
    id: "elbow_left_back",
    name: "Elbow Back (Left)",
    path: BODY_PARTS_SVG.elbow_left,
  },
  {
    id: "forearm_left_back",
    name: "Forearm Back (Left)",
    path: BODY_PARTS_SVG.forearm_left,
  },
  {
    id: "hand_left_back",
    name: "Hand Back (Left)",
    path: BODY_PARTS_SVG.hand_left,
  },

  {
    id: "shoulder_right_back",
    name: "Shoulder Back (Right)",
    path: BODY_PARTS_SVG.shoulder_right,
  },
  {
    id: "upper_arm_right_back",
    name: "Upper Arm Back (Right)",
    path: BODY_PARTS_SVG.upper_arm_right,
  },
  {
    id: "elbow_right_back",
    name: "Elbow Back (Right)",
    path: BODY_PARTS_SVG.elbow_right,
  },
  {
    id: "forearm_right_back",
    name: "Forearm Back (Right)",
    path: BODY_PARTS_SVG.forearm_right,
  },
  {
    id: "hand_right_back",
    name: "Hand Back (Right)",
    path: BODY_PARTS_SVG.hand_right,
  },

  // Torso Back
  { id: "upper_back", name: "Upper Back", path: BODY_PARTS_SVG.upper_back },
  { id: "lower_back", name: "Lower Back", path: BODY_PARTS_SVG.lower_back },
  { id: "buttocks", name: "Buttocks (Nalgas)", path: BODY_PARTS_SVG.buttocks },

  // Legs Back
  {
    id: "thigh_left_back",
    name: "Thigh Back (Left)",
    path: BODY_PARTS_SVG.thigh_left,
  },
  {
    id: "knee_left_back",
    name: "Knee Back (Left)",
    path: BODY_PARTS_SVG.knee_left,
  },
  {
    id: "calf_left",
    name: "Calf (Pantorrilla Left)",
    path: BODY_PARTS_SVG.lower_leg_left,
  },
  {
    id: "ankle_left_back",
    name: "Ankle Back (Left)",
    path: BODY_PARTS_SVG.ankle_left,
  },
  {
    id: "foot_left_back",
    name: "Foot Back (Left)",
    path: BODY_PARTS_SVG.foot_left,
  },

  {
    id: "thigh_right_back",
    name: "Thigh Back (Right)",
    path: BODY_PARTS_SVG.thigh_right,
  },
  {
    id: "knee_right_back",
    name: "Knee Back (Right)",
    path: BODY_PARTS_SVG.knee_right,
  },
  {
    id: "calf_right",
    name: "Calf (Pantorrilla Right)",
    path: BODY_PARTS_SVG.lower_leg_right,
  },
  {
    id: "ankle_right_back",
    name: "Ankle Back (Right)",
    path: BODY_PARTS_SVG.ankle_right,
  },
  {
    id: "foot_right_back",
    name: "Foot Back (Right)",
    path: BODY_PARTS_SVG.foot_right,
  },
];

export default function BodyPainTracker({ selectedParts = [], onPartsChange }) {
  const [viewMode, setViewMode] = useState("front"); // 'front' | 'back'
  const [selectedPart, setSelectedPart] = useState(null);
  const [painLevels, setPainLevels] = useState({});

  // Animation values for zoom/pan
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  useEffect(() => {
    // Reset zoom when view mode changes
    handleResetZoom();
  }, [viewMode]);

  // Initialize pain levels
  useEffect(() => {
    const initialLevels = {};
    selectedParts.forEach((partString) => {
      const match = partString.match(/(.*?) \(Level (\d+)\)/);
      if (match) {
        initialLevels[match[1]] = parseInt(match[2], 10);
      } else {
        initialLevels[partString] = initialLevels[partString] || 1;
      }
    });
    setPainLevels(initialLevels);
  }, [selectedParts]); // Update when selectedParts changes

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onChange((event) => {
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const pinch = Gesture.Pinch()
    .onChange((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        savedScale.value = scale.value;
      }
    });

  const composed = Gesture.Simultaneous(pan, pinch);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleZoomIn = () => {
    const newScale = Math.min(scale.value + 0.5, 4);
    scale.value = withTiming(newScale);
    savedScale.value = newScale;
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale.value - 0.5, 1);
    scale.value = withTiming(newScale);
    savedScale.value = newScale;
    if (newScale === 1) {
      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    }
  };

  const handleResetZoom = () => {
    scale.value = withTiming(1);
    savedScale.value = 1;
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const handlePartPress = (part) => {
    setSelectedPart(part);
  };

  const updatePainLevel = (level) => {
    if (!selectedPart) return;

    const newLevels = { ...painLevels };

    if (level === 0) {
      delete newLevels[selectedPart.name];
      setSelectedPart(null);
    } else {
      newLevels[selectedPart.name] = level;
    }

    setPainLevels(newLevels);
    emitChanges(newLevels);
  };

  const emitChanges = (levels) => {
    const newSelectedParts = Object.entries(levels).map(([name, level]) => {
      return `${name} (Level ${level})`;
    });
    onPartsChange(newSelectedParts);
  };

  const getPartColor = (partName) => {
    const level = painLevels[partName];
    if (!level) return "#E5E7EB";
    if (level <= 3) return "#FCD34D";
    if (level <= 6) return "#F97316";
    return "#EF4444";
  };

  const currentParts =
    viewMode === "front" ? FRONT_VIEW_PARTS : BACK_VIEW_PARTS;

  return (
    <View style={styles.container}>
      {/* View Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === "front" && styles.activeToggle,
          ]}
          onPress={() => setViewMode("front")}
        >
          <Text
            style={[
              styles.toggleText,
              viewMode === "front" && styles.activeToggleText,
            ]}
          >
            Front View
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            viewMode === "back" && styles.activeToggle,
          ]}
          onPress={() => setViewMode("back")}
        >
          <Text
            style={[
              styles.toggleText,
              viewMode === "back" && styles.activeToggleText,
            ]}
          >
            Back View
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
          <ZoomIn size={20} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
          <ZoomOut size={20} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomButton} onPress={handleResetZoom}>
          <RotateCcw size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      <View style={styles.bodyViewport}>
        <GestureDetector gesture={composed}>
          <Animated.View style={[styles.bodyContent, animatedStyle]}>
            <Svg height="320" width="200" viewBox="0 0 200 320">
              <G>
                {currentParts.map((part) => (
                  <Path
                    key={part.id}
                    d={part.path}
                    fill={getPartColor(part.name)}
                    stroke="#9CA3AF"
                    strokeWidth="1"
                    onPress={() => handlePartPress(part)}
                  />
                ))}
              </G>
            </Svg>
          </Animated.View>
        </GestureDetector>
        <Text style={styles.instructionText}>
          {viewMode === "front" ? "Front Side" : "Back Side"} - Tap body part to
          log pain. Pinch to zoom.
        </Text>
      </View>

      {selectedPart && (
        <View style={styles.controlsContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.selectedPartText}>{selectedPart.name}</Text>
            <TouchableOpacity onPress={() => setSelectedPart(null)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.painLabel}>
            Pain Level: {painLevels[selectedPart.name] || 0}
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.painButtonsRow}
          >
            <TouchableOpacity
              style={[styles.painButton, styles.clearButton]}
              onPress={() => updatePainLevel(0)}
            >
              <Text style={styles.painButtonText}>None</Text>
            </TouchableOpacity>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.painButton,
                  painLevels[selectedPart.name] === level &&
                    styles.activePainButton,
                  { backgroundColor: getPainColor(level) },
                ]}
                onPress={() => updatePainLevel(level)}
              >
                <Text
                  style={[
                    styles.painButtonText,
                    painLevels[selectedPart.name] === level &&
                      styles.activePainButtonText,
                  ]}
                >
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

function getPainColor(level) {
  if (level <= 3) return "#FEF3C7"; // Light yellow
  if (level <= 6) return "#FFEDD5"; // Light orange
  return "#FEE2E2"; // Light red
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    alignItems: "center",
  },
  bodyViewport: {
    width: "100%",
    height: 380,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  bodyContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  zoomControls: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    width: "100%",
    justifyContent: "flex-end",
  },
  zoomButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  bodyContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
  },
  controlsContainer: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  selectedPartText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  closeText: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "500",
  },
  painLabel: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
  },
  painButtonsRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 4,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  activeToggle: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  activeToggleText: {
    color: "#111827",
    fontWeight: "600",
  },
  painButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  clearButton: {
    width: 50,
    backgroundColor: "#F3F4F6",
  },
  activePainButton: {
    borderColor: "#3B82F6",
    borderWidth: 2,
  },
  painButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  activePainButtonText: {
    fontWeight: "700",
    color: "#000",
  },
});
