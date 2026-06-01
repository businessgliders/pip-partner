import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, CheckCircle2, AlertCircle, Plug, Unplug, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import AdminFavicon from "../components/AdminFavicon";

const CONNECTOR_ID = "6a17b6076b79e4d2d3fa4a55";

export default function FranchiseMailbox() {
  const { user, isLoadingAuth } = useAuth();
  const [checking, setChecking] = useState(true);
  const [connected, setConnected] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(false);

  const checkStatus = async () => {
    setChecking(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("pollFranchiseGmailReplies", {});
      setConnected(true);
      setLastResult(res.data);
    } catch (e) {
      setConnected(false);
      setLastResult(null);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (!isLoadingAuth && user?.role === "admin") {
      checkStatus();
    } else if (!isLoadingAuth) {
      setChecking(false);
    }
  }, [isLoadingAuth, user]);

  const handleConnect = async () => {
    setError(null);
    try {
      const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
      const popup = window.open(url, "_blank", "width=600,height=700");
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          checkStatus();
        }
      }, 500);
    } catch (e) {
      setError(e.message || "Failed to start connect flow");
    }
  };

  const handleDisconnect = async () => {
    setError(null);
    try {
      await base44.connectors.disconnectAppUser(CONNECTOR_ID);
      setConnected(false);
      setLastResult(null);
    } catch (e) {
      setError(e.message || "Failed to disconnect");
    }
  };

  const handlePollNow = async () => {
    setPolling(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("pollFranchiseGmailReplies", {});
      setLastResult(res.data);
      setConnected(true);
    } catch (e) {
      setError(e.message || "Poll failed");
    } finally {
      setPolling(false);
    }
  };

  if (isLoadingAuth || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-sm text-slate-500">Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <AdminFavicon title="PIP Partner — Franchise Mailbox" />
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
            <Mail className="w-5 h-5 text-pink-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Franchise Mailbox
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Connect <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">franchise@pilatesinpinkstudio.com</code>{" "}
              so the app can poll it for replies on Franchise tickets.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {connected ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium text-slate-900">Connected</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <span className="text-sm font-medium text-slate-900">Not connected</span>
                </>
              )}
            </div>
            <div className="flex gap-2">
              {connected ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePollNow}
                    disabled={polling}
                  >
                    {polling ? (
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-1.5" />
                    )}
                    Poll now
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnect}
                  >
                    <Unplug className="w-4 h-4 mr-1.5" />
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={handleConnect}>
                  <Plug className="w-4 h-4 mr-1.5" />
                  Connect franchise@
                </Button>
              )}
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md p-2">
              {error}
            </div>
          )}

          {lastResult && (
            <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md p-3 font-mono">
              <div>Last scan: {lastResult.found ?? 0} messages</div>
              <div>Ingested into Franchise tickets: {lastResult.ingested ?? 0}</div>
            </div>
          )}
        </div>

        <div className="text-xs text-slate-500 leading-relaxed">
          <p className="font-medium text-slate-700 mb-1">How it works</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>You sign into <code className="bg-slate-100 px-1 rounded">franchise@pilatesinpinkstudio.com</code> in the popup — once.</li>
            <li>Every 5 minutes, the app scans that inbox for new replies.</li>
            <li>Only messages that match a <strong>FranchiseInquiry</strong> ticket (via subject tag or thread reference) are ingested.</li>
            <li>Replies appear in the corresponding ticket's email thread, just like the main mailbox.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}