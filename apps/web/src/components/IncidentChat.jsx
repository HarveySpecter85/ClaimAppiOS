import { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, RefreshCw } from "lucide-react";
import { format } from "date-fns";

export default function IncidentChat({ incidentId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [incidentId]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages?incident_id=${incidentId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incident_id: incidentId,
          sender_name: "Admin",
          body: newMessage.trim(),
        }),
      });

      if (res.ok) {
        const message = await res.json();
        setMessages((prev) => [message, ...prev]);
        setNewMessage("");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-[600px] sticky top-24">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Live Chat
        </h3>
        <button
          onClick={fetchMessages}
          className="p-1.5 hover:bg-white hover:shadow-sm rounded-full transition-all text-gray-500 hover:text-blue-600"
          title="Refresh messages"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col-reverse bg-gray-50/50">
        {messages.map((msg) => {
          const isAdmin = msg.sender_name === "Admin";
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  isAdmin
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-white text-gray-900 rounded-bl-sm border border-gray-100"
                }`}
              >
                {!isAdmin && (
                  <span className="text-[10px] font-bold uppercase tracking-wider block text-gray-400 mb-1">
                    {msg.sender_name === "You"
                      ? "Investigator"
                      : msg.sender_name}
                  </span>
                )}
                <p className="leading-relaxed">{msg.body}</p>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 px-1">
                {format(new Date(msg.created_at), "MMM d, h:mm a")}
              </span>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
            <MessageSquare className="w-8 h-8 opacity-20" />
            <p className="text-sm">No messages yet</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-100 bg-white rounded-b-xl">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Message investigator..."
            className="flex-1 bg-gray-50 border-gray-200 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !newMessage.trim()}
            className="bg-black text-white p-2.5 rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
