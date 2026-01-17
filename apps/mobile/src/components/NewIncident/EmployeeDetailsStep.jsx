import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import { Search, ChevronDown, Plus } from "lucide-react-native";
import { useState, useEffect } from "react";

export function EmployeeDetailsStep({
  employeeSearch,
  setEmployeeSearch,
  employeeData,
  setEmployeeData,
}) {
  const [clients, setClients] = useState([]);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  const [positions, setPositions] = useState([]);
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  const [newPositionName, setNewPositionName] = useState("");
  const [showNewPositionModal, setShowNewPositionModal] = useState(false);

  useEffect(() => {
    fetchClients();
    fetchPositions();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const fetchPositions = async () => {
    try {
      const response = await fetch("/api/job-positions");
      if (response.ok) {
        const data = await response.json();
        setPositions(data);
      }
    } catch (error) {
      console.error("Error fetching positions:", error);
    }
  };

  const handleAddClient = async () => {
    if (!newClientName.trim()) return;

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newClientName.trim() }),
      });

      if (response.ok) {
        const newClient = await response.json();
        setClients([...clients, newClient]);
        setEmployeeData({ ...employeeData, client_id: newClient.id });
        setNewClientName("");
        setShowNewClientModal(false);
        setShowClientPicker(false); // Also close the picker to avoid overlay issues
      }
    } catch (error) {
      console.error("Error adding client:", error);
    }
  };

  const handleAddPosition = async () => {
    if (!newPositionName.trim()) return;

    try {
      const response = await fetch("/api/job-positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newPositionName.trim() }),
      });

      if (response.ok) {
        const newPos = await response.json();
        setPositions([...positions, newPos]);
        setEmployeeData({ ...employeeData, position_name: newPos.title });
        setNewPositionName("");
        setShowNewPositionModal(false);
        setShowPositionPicker(false); // Close parent modal to prevent disabled fields issue
      }
    } catch (error) {
      console.error("Error adding position:", error);
    }
  };

  const selectedClient = clients.find((c) => c.id === employeeData.client_id);
  const selectedPosition = employeeData.position_name;

  return (
    <>
      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: "#374151",
            marginBottom: 8,
          }}
        >
          Search to Auto-fill
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#fff",
            borderRadius: 10,
            paddingHorizontal: 12,
            height: 48,
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
        >
          <Search color="#9CA3AF" size={20} />
          <TextInput
            style={{
              flex: 1,
              marginLeft: 8,
              fontSize: 15,
              color: "#111827",
            }}
            placeholder="Search by name or employee ID..."
            placeholderTextColor="#9CA3AF"
            value={employeeSearch}
            onChangeText={setEmployeeSearch}
          />
        </View>
      </View>

      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: "#111827",
          marginBottom: 16,
        }}
      >
        Or Enter Manually
      </Text>

      <View style={{ gap: 16 }}>
        {/* Client Picker */}
        <View>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Client *
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: "#fff",
              borderRadius: 10,
              paddingHorizontal: 12,
              height: 48,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
            onPress={() => setShowClientPicker(true)}
          >
            <Text
              style={{
                color: selectedClient ? "#111827" : "#9CA3AF",
                fontSize: 15,
              }}
            >
              {selectedClient ? selectedClient.name : "Select client"}
            </Text>
            <ChevronDown color="#9CA3AF" size={20} />
          </TouchableOpacity>
        </View>

        {/* Full Name */}
        <View>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Full Name *
          </Text>
          <TextInput
            style={{
              backgroundColor: "#fff",
              borderRadius: 10,
              paddingHorizontal: 12,
              height: 48,
              fontSize: 15,
              color: "#111827",
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
            placeholder="Enter full name"
            placeholderTextColor="#9CA3AF"
            value={employeeData.full_name}
            onChangeText={(text) =>
              setEmployeeData({ ...employeeData, full_name: text })
            }
          />
        </View>

        {/* Employee ID */}
        <View>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Employee ID *
          </Text>
          <TextInput
            style={{
              backgroundColor: "#fff",
              borderRadius: 10,
              paddingHorizontal: 12,
              height: 48,
              fontSize: 15,
              color: "#111827",
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
            placeholder="e.g., EMP-123"
            placeholderTextColor="#9CA3AF"
            value={employeeData.employee_id}
            onChangeText={(text) =>
              setEmployeeData({ ...employeeData, employee_id: text })
            }
          />
        </View>

        {/* Position Name Picker */}
        <View>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Position Name *
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: "#fff",
              borderRadius: 10,
              paddingHorizontal: 12,
              height: 48,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
            onPress={() => setShowPositionPicker(true)}
          >
            <Text
              style={{
                color: selectedPosition ? "#111827" : "#9CA3AF",
                fontSize: 15,
              }}
            >
              {selectedPosition || "Select position"}
            </Text>
            <ChevronDown color="#9CA3AF" size={20} />
          </TouchableOpacity>
        </View>

        {/* Pay Rate */}
        <View>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Pay Rate ($/hr)
          </Text>
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 10,
              paddingHorizontal: 12,
              height: 48,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#6B7280", fontSize: 15, marginRight: 4 }}>
              $
            </Text>
            <TextInput
              style={{
                flex: 1,
                fontSize: 15,
                color: "#111827",
              }}
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              value={employeeData.pay_rate}
              onChangeText={(text) =>
                setEmployeeData({ ...employeeData, pay_rate: text })
              }
            />
          </View>
        </View>

        {/* Role Description */}
        <View>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Role Description
          </Text>
          <TextInput
            style={{
              backgroundColor: "#fff",
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 12,
              fontSize: 15,
              color: "#111827",
              borderWidth: 1,
              borderColor: "#E5E7EB",
              minHeight: 80,
              textAlignVertical: "top",
            }}
            placeholder="Describe the employee's role and responsibilities..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            value={employeeData.role_description}
            onChangeText={(text) =>
              setEmployeeData({ ...employeeData, role_description: text })
            }
          />
        </View>

        {/* Hire Date */}
        <View>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Hire Date
          </Text>
          <TextInput
            style={{
              backgroundColor: "#fff",
              borderRadius: 10,
              paddingHorizontal: 12,
              height: 48,
              fontSize: 15,
              color: "#111827",
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
            placeholder="MM/DD/YYYY"
            placeholderTextColor="#9CA3AF"
            value={employeeData.hire_date}
            onChangeText={(text) =>
              setEmployeeData({ ...employeeData, hire_date: text })
            }
          />
        </View>

        {/* Phone Number */}
        <View>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Phone Number
          </Text>
          <TextInput
            style={{
              backgroundColor: "#fff",
              borderRadius: 10,
              paddingHorizontal: 12,
              height: 48,
              fontSize: 15,
              color: "#111827",
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
            placeholder="Enter phone number"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            value={employeeData.phone}
            onChangeText={(text) =>
              setEmployeeData({ ...employeeData, phone: text })
            }
          />
        </View>

        {/* Email */}
        <View>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Email
          </Text>
          <TextInput
            style={{
              backgroundColor: "#fff",
              borderRadius: 10,
              paddingHorizontal: 12,
              height: 48,
              fontSize: 15,
              color: "#111827",
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
            placeholder="Enter email address"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            value={employeeData.email}
            onChangeText={(text) =>
              setEmployeeData({ ...employeeData, email: text })
            }
          />
        </View>
      </View>

      {/* Client Picker Modal */}
      <Modal
        visible={showClientPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowClientPicker(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: "70%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: "#E5E7EB",
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "600", color: "#111827" }}
              >
                Select Client
              </Text>
              <TouchableOpacity onPress={() => setShowNewClientModal(true)}>
                <Plus color="#3B82F6" size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {clients.map((client) => (
                <TouchableOpacity
                  key={client.id}
                  style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: "#F3F4F6",
                    backgroundColor:
                      employeeData.client_id === client.id ? "#EFF6FF" : "#fff",
                  }}
                  onPress={() => {
                    setEmployeeData({ ...employeeData, client_id: client.id });
                    setShowClientPicker(false);
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: "#111827",
                      fontWeight:
                        employeeData.client_id === client.id ? "600" : "400",
                    }}
                  >
                    {client.name}
                  </Text>
                  {client.location && (
                    <Text
                      style={{ fontSize: 14, color: "#6B7280", marginTop: 2 }}
                    >
                      {client.location}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={{
                padding: 16,
                alignItems: "center",
                borderTopWidth: 1,
                borderTopColor: "#E5E7EB",
              }}
              onPress={() => setShowClientPicker(false)}
            >
              <Text
                style={{ fontSize: 16, color: "#6B7280", fontWeight: "600" }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* New Client Modal */}
      <Modal
        visible={showNewClientModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewClientModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 20,
              width: "100%",
              maxWidth: 400,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#111827",
                marginBottom: 16,
              }}
            >
              Add New Client
            </Text>
            <TextInput
              style={{
                backgroundColor: "#F9FAFB",
                borderRadius: 10,
                paddingHorizontal: 12,
                height: 48,
                fontSize: 15,
                color: "#111827",
                borderWidth: 1,
                borderColor: "#E5E7EB",
                marginBottom: 16,
              }}
              placeholder="Client name"
              placeholderTextColor="#9CA3AF"
              value={newClientName}
              onChangeText={setNewClientName}
              autoFocus
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#F3F4F6",
                  borderRadius: 10,
                  padding: 12,
                  alignItems: "center",
                }}
                onPress={() => {
                  setNewClientName("");
                  setShowNewClientModal(false);
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "#6B7280" }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#3B82F6",
                  borderRadius: 10,
                  padding: 12,
                  alignItems: "center",
                }}
                onPress={handleAddClient}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}
                >
                  Add
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Position Picker Modal */}
      <Modal
        visible={showPositionPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPositionPicker(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: "70%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: "#E5E7EB",
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "600", color: "#111827" }}
              >
                Select Position
              </Text>
              <TouchableOpacity onPress={() => setShowNewPositionModal(true)}>
                <Plus color="#3B82F6" size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {positions.map((position) => (
                <TouchableOpacity
                  key={position.id}
                  style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: "#F3F4F6",
                    backgroundColor:
                      employeeData.position_name === position.title
                        ? "#EFF6FF"
                        : "#fff",
                  }}
                  onPress={() => {
                    setEmployeeData({
                      ...employeeData,
                      position_name: position.title,
                    });
                    setShowPositionPicker(false);
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      color: "#111827",
                      fontWeight:
                        employeeData.position_name === position.title
                          ? "600"
                          : "400",
                    }}
                  >
                    {position.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={{
                padding: 16,
                alignItems: "center",
                borderTopWidth: 1,
                borderTopColor: "#E5E7EB",
              }}
              onPress={() => setShowPositionPicker(false)}
            >
              <Text
                style={{ fontSize: 16, color: "#6B7280", fontWeight: "600" }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* New Position Modal */}
      <Modal
        visible={showNewPositionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewPositionModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 20,
              width: "100%",
              maxWidth: 400,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#111827",
                marginBottom: 16,
              }}
            >
              Add New Position
            </Text>
            <TextInput
              style={{
                backgroundColor: "#F9FAFB",
                borderRadius: 10,
                paddingHorizontal: 12,
                height: 48,
                fontSize: 15,
                color: "#111827",
                borderWidth: 1,
                borderColor: "#E5E7EB",
                marginBottom: 16,
              }}
              placeholder="Position name"
              placeholderTextColor="#9CA3AF"
              value={newPositionName}
              onChangeText={setNewPositionName}
              autoFocus
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#F3F4F6",
                  borderRadius: 10,
                  padding: 12,
                  alignItems: "center",
                }}
                onPress={() => {
                  setNewPositionName("");
                  setShowNewPositionModal(false);
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "#6B7280" }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#3B82F6",
                  borderRadius: 10,
                  padding: 12,
                  alignItems: "center",
                }}
                onPress={handleAddPosition}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}
                >
                  Add
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
