import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

const FORM_LABELS = {
  benefit_affidavit: "Benefit Affidavit",
  status_log: "Status Log",
  medical_authorization: "Medical Authorization",
  prescription_card: "Prescription Card",
  mileage_reimbursement: "Mileage Reimbursement",
  modified_duty_policy: "Modified Duty Policy",
  refusal_of_treatment: "Refusal of Treatment",
};

export default function ShareFormLandingPage({ params }) {
  const token = params?.token;

  const [accessCode, setAccessCode] = useState("");
  const [unlocked, setUnlocked] = useState(null);

  const {
    data: resolved,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["secure-form-link", token],
    enabled: !!token,
    queryFn: async () => {
      const res = await fetch(`/api/secure-form-links/resolve?token=${token}`);
      if (!res.ok) {
        if (res.status === 410) {
          throw new Error("This secure link has expired or was revoked.");
        }
        throw new Error(
          `When fetching /api/secure-form-links/resolve, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/secure-form-links/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, access_code: accessCode }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Invalid access code.");
        }
        if (res.status === 410) {
          throw new Error("This secure link has expired or was revoked.");
        }
        throw new Error(
          `When fetching /api/secure-form-links/verify, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
    onSuccess: (data) => {
      setUnlocked(data);
    },
  });

  const displayed = unlocked || resolved;

  const formLabel = useMemo(() => {
    const key = displayed?.form_type;
    return FORM_LABELS[key] || key || "Form";
  }, [displayed?.form_type]);

  const expiresText = useMemo(() => {
    if (!displayed?.expires_at) return "";
    try {
      return new Date(displayed.expires_at).toLocaleString();
    } catch {
      return String(displayed.expires_at);
    }
  }, [displayed?.expires_at]);

  const recipientText = useMemo(() => {
    if (!displayed?.recipient_name) return "";
    return displayed.recipient_name;
  }, [displayed?.recipient_name]);

  const locked = !!resolved?.locked && !unlocked;

  const onVerify = useCallback(async () => {
    await verifyMutation.mutateAsync();
  }, [verifyMutation]);

  return (
    <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white border border-[#E5E7EB] rounded-xl p-6">
        <div className="text-sm font-semibold text-[#137fec]">
          Secure Form Link
        </div>
        <h1 className="text-2xl font-bold text-[#111827] mt-2">{formLabel}</h1>

        {isLoading ? <div className="mt-6 text-[#6B7280]">Loading…</div> : null}

        {error ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            {String(error.message || error)}
          </div>
        ) : null}

        {displayed ? (
          <div className="mt-6 space-y-3">
            <div className="rounded-lg border border-[#DBEAFE] bg-[#EFF6FF] p-4">
              <div className="text-sm text-[#1E40AF]">
                This link is valid until{" "}
                <span className="font-bold">{expiresText}</span>.
              </div>
              {recipientText ? (
                <div className="text-sm text-[#1E40AF] mt-2">
                  Recipient:{" "}
                  <span className="font-semibold">{recipientText}</span>
                </div>
              ) : null}
            </div>

            {locked ? (
              <div className="rounded-lg border border-[#E5E7EB] p-4">
                <div className="text-sm font-semibold text-[#111827]">
                  Access code required
                </div>
                <div className="text-sm text-[#6B7280] mt-1">
                  Enter the access code provided by the sender to unlock.
                </div>

                <div className="mt-3 flex gap-2">
                  <input
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    placeholder="6-digit code"
                    className="flex-1 h-11 rounded-lg border border-[#E5E7EB] px-3"
                  />
                  <button
                    onClick={onVerify}
                    disabled={!accessCode || verifyMutation.isPending}
                    className="h-11 px-4 rounded-lg bg-[#137fec] text-white font-bold disabled:opacity-50"
                  >
                    {verifyMutation.isPending ? "Checking…" : "Unlock"}
                  </button>
                </div>

                {verifyMutation.error ? (
                  <div className="mt-3 text-sm text-red-700">
                    {String(
                      verifyMutation.error.message || verifyMutation.error,
                    )}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="text-sm text-[#374151]">
                For now, this link is used to securely share access to the form.
                If you have the mobile app, open this link on your phone.
              </div>
            )}

            <div className="text-xs text-[#6B7280]">
              If you think this was sent to you by mistake, contact the case
              administrator.
            </div>
          </div>
        ) : null}

        <div className="mt-8 text-xs text-[#6B7280]">
          Tip: If this page looks stale, refresh.
          <button className="ml-2 underline" onClick={() => refetch()}>
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
