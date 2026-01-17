export function generatePrescriptionCardPdf({
  title,
  labels,
  patientNameUpper,
  incidentNumberText,
  binNumber,
  pcn,
  memberId,
  groupId,
  dateOfBirth,
  dateOfInjury,
  authorizedBy,
  consent,
}) {
  const safe = (v) => {
    if (!v) return "";
    return String(v)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  };

  const safeLabels = labels && typeof labels === "object" ? labels : {};

  const rxCardLabel = safeLabels.rxCard || "RX CARD";
  const patientNameLabel = safeLabels.patientName || "Patient Name";
  const binLabel = safeLabels.bin || "BIN";
  const memberLabel = safeLabels.member || "Member ID";
  const groupLabel = safeLabels.group || "Group";
  const dobLabel = safeLabels.dob || "DOB";
  const authorizedByLabel = safeLabels.authorizedBy || "Authorized By";
  const consentLabel = safeLabels.consent || "Consent";
  const yesLabel = safeLabels.yes || "Yes";
  const noLabel = safeLabels.no || "No";
  const dateOfInjuryLabel = safeLabels.dateOfInjury || "Date of Injury";
  const patientDetailsLabel = safeLabels.patientDetails || "Patient Details";

  const html = `
<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; padding: 20px; color: #111827; }
  .header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 14px; }
  .title { font-size: 18px; font-weight: 800; }
  .sub { font-size: 12px; color: #6B7280; font-weight: 600; }
  .card { border-radius: 14px; overflow: hidden; background: linear-gradient(135deg, #137fec, #0f65bd); color: white; padding: 18px; }
  .badge { font-size: 11px; font-weight: 800; padding: 4px 8px; border-radius: 8px; background: rgba(255,255,255,0.18); display: inline-block; }
  .label { font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.65); font-weight: 800; }
  .value { font-size: 14px; font-weight: 800; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 16px; border-top: 1px solid rgba(255,255,255,0.20); padding-top: 12px; margin-top: 14px; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; }
  .section { margin-top: 18px; }
  .section h3 { font-size: 14px; margin: 0 0 8px 0; }
  .row { margin: 4px 0; color: #374151; font-size: 13px; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">${safe(title || "Prescription Card")}</div>
      <div class="sub">${safe(incidentNumberText)}</div>
    </div>
    <div class="badge">${safe(rxCardLabel)}</div>
  </div>

  <div class="card">
    <div class="label">${safe(patientNameLabel)}</div>
    <div style="font-size:18px;font-weight:900;margin-top:4px;">${safe(patientNameUpper)}</div>

    <div class="grid">
      <div>
        <div class="label">${safe(binLabel)}</div>
        <div class="value mono">${safe(binNumber)}</div>
      </div>
      <div>
        <div class="label">PCN</div>
        <div class="value mono">${safe(pcn)}</div>
      </div>
      <div>
        <div class="label">${safe(memberLabel)}</div>
        <div class="value mono">${safe(memberId)}</div>
      </div>
      <div>
        <div class="label">${safe(groupLabel)}</div>
        <div class="value mono">${safe(groupId)}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h3>${safe(patientDetailsLabel)}</h3>
    <div class="row"><b>${safe(dobLabel)}:</b> ${safe(dateOfBirth)}</div>
    <div class="row"><b>${safe(dateOfInjuryLabel)}:</b> ${safe(dateOfInjury)}</div>
  </div>

  <div class="section">
    <h3>${safe(authorizedByLabel)}</h3>
    <div class="row">${safe(authorizedBy)}</div>
    <div class="row"><b>${safe(consentLabel)}:</b> ${consent ? safe(yesLabel) : safe(noLabel)}</div>
  </div>
</body>
</html>
`.trim();

  return html;
}
