import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Send } from "lucide-react-native";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function IncidentMessages({ incidentId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);
  const { subscribeToIncident } = usePushNotifications();

  useEffect(() => {
    if (incidentId) {
      fetchMessages();
      subscribeToIncident(incidentId);
    }
  }, [incidentId]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages?incident_id=${incidentId}`);
      if (!response.ok) throw new Error("Failed to fetch messages");
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error(error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incident_id: incidentId,
          sender_name: "You",
          body: newMessage.trim(),
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const message = await response.json();
      setMessages([message, ...messages]);
      setNewMessage("");

      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender_name === "You";
    const date = new Date(item.created_at);

    return (
      <View
        style={{
          marginBottom: 12,
          alignItems: isMe ? "flex-end" : "flex-start",
        }}
      >
        <View
          style={{
            maxWidth: "80%",
            backgroundColor: isMe ? "#3B82F6" : "#F3F4F6",
            borderRadius: 16,
            padding: 12,
            borderBottomRightRadius: isMe ? 4 : 16,
            borderBottomLeftRadius: isMe ? 16 : 4,
          }}
        >
          {!isMe && (
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: "#6B7280",
                marginBottom: 4,
              }}
            >
              {item.sender_name}
            </Text>
          )}
          <Text
            style={{
              fontSize: 15,
              color: isMe ? "#fff" : "#111827",
              lineHeight: 20,
            }}
          >
            {item.body}
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: isMe ? "#E0E7FF" : "#9CA3AF",
              marginTop: 4,
            }}
          >
            {date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        inverted
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={100}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 12,
            borderTopWidth: 1,
            borderColor: "#E5E7EB",
            backgroundColor: "#fff",
            gap: 8,
          }}
        >
          <TextInput
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            multiline
            maxLength={500}
            style={{
              flex: 1,
              backgroundColor: "#F9FAFB",
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              fontSize: 15,
              maxHeight: 100,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={loading || !newMessage.trim()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor:
                loading || !newMessage.trim() ? "#D1D5DB" : "#3B82F6",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Send color="#fff" size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
