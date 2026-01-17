import { useState, useEffect } from "react";
import { Alert } from "react-native";

export function usePrescriptionCard(incidentId, t) {
  const safeT = (key, fallback) => {
    if (typeof t !== "function") return fallback;
    const v = t(key);
    if (typeof v === "string" && v.trim().length > 0) return v;
    return fallback;
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [incident, setIncident] = useState(null);
  const [card, setCard] = useState(null);

  const [patientFullName, setPatientFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [dateOfInjury, setDateOfInjury] = useState("");

  const [binNumber, setBinNumber] = useState("004682");
  const [pcn, setPcn] = useState("WC");
  const [memberId, setMemberId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupId, setGroupId] = useState("");

  const [authorizedBy, setAuthorizedBy] = useState("");
  const [signatureUrl, setSignatureUrl] = useState(null);
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId]);

  const load = async () => {
    try {
      setLoading(true);

      const incidentRes = await fetch(`/api/incidents/${incidentId}`);
      if (!incidentRes.ok) {
        throw new Error(
          `When fetching /api/incidents/${incidentId}, the response was [${incidentRes.status}] ${incidentRes.statusText}`,
        );
      }
      const incidentData = await incidentRes.json();
      setIncident(incidentData);

      // Helpful defaults
      setPatientFullName(incidentData.employee_name || "");
      setDateOfInjury(incidentData.incident_date || "");

      const cardRes = await fetch(
        `/api/prescription-cards?incident_id=${incidentId}`,
      );
      if (!cardRes.ok) {
        throw new Error(
          `When fetching /api/prescription-cards, the response was [${cardRes.status}] ${cardRes.statusText}`,
        );
      }

      const rows = await cardRes.json();
      if (rows.length > 0) {
        const existing = rows[0];
        setCard(existing);

        setPatientFullName(
          existing.patient_full_name || incidentData.employee_name || "",
        );
        setDateOfBirth(existing.date_of_birth || "");
        setDateOfInjury(
          existing.date_of_injury || incidentData.incident_date || "",
        );

        setBinNumber(existing.bin_number || "004682");
        setPcn(existing.pcn || "WC");
        setMemberId(existing.member_id || "");
        setGroupName(existing.group_name || "");
        setGroupId(existing.group_id || "");

        setAuthorizedBy(existing.authorized_by || "");
        setSignatureUrl(existing.investigator_signature_url || null);
        setConsent(!!existing.consent);
      }
    } catch (e) {
      console.error(e);
      Alert.alert(
        safeT("common.errorTitle", "Error"),
        safeT(
          "prescription.alerts.couldNotLoad",
          "Could not load prescription card",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const buildPayload = () => {
    return {
      incident_id: incidentId,
      patient_full_name: patientFullName || null,
      date_of_birth: dateOfBirth || null,
      date_of_injury: dateOfInjury || null,
      bin_number: binNumber || null,
      pcn: pcn || null,
      member_id: memberId || null,
      group_name: groupName || null,
      group_id: groupId || null,
      authorized_by: authorizedBy || null,
      investigator_signature_url: signatureUrl || null,
      consent: !!consent,
      status: "draft",
    };
  };

  const saveCard = async () => {
    try {
      setSaving(true);
      const payload = buildPayload();

      if (card?.id) {
        const res = await fetch(`/api/prescription-cards/${card.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          throw new Error(
            `When fetching /api/prescription-cards/${card.id}, the response was [${res.status}] ${res.statusText}`,
          );
        }
        const updated = await res.json();
        setCard(updated);
      } else {
        const res = await fetch(`/api/prescription-cards`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          throw new Error(
            `When fetching /api/prescription-cards, the response was [${res.status}] ${res.statusText}`,
          );
        }
        const created = await res.json();
        setCard(created);
      }

      Alert.alert(
        safeT("prescription.savedTitle", "Saved"),
        safeT("prescription.savedBody", "Prescription card saved"),
      );
    } catch (e) {
      console.error(e);
      Alert.alert(
        safeT("common.errorTitle", "Error"),
        safeT(
          "prescription.alerts.couldNotSave",
          "Could not save prescription card",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    incident,
    card,
    patientFullName,
    setPatientFullName,
    dateOfBirth,
    setDateOfBirth,
    dateOfInjury,
    setDateOfInjury,
    binNumber,
    setBinNumber,
    pcn,
    setPcn,
    memberId,
    setMemberId,
    groupName,
    setGroupName,
    groupId,
    setGroupId,
    authorizedBy,
    setAuthorizedBy,
    signatureUrl,
    setSignatureUrl,
    consent,
    setConsent,
    saveCard,
  };
}
