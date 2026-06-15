"use client";
import { toast } from "@/components/ui/toast";

import { useState } from "react";
import { Cpu, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Device = {
  name: string;
  type: string;
  status: "Connected" | "Disconnected";
  lastSync: string;
};

export function AttendanceIntegrations() {
  const [syncing, setSyncing] = useState<string | null>(null);
  const [devices, setDevices] = useState<Device[]>([
    { name: "ZKTeco ProFace X", type: "Biometric Reader", status: "Connected", lastSync: "10 mins ago" },
    { name: "eSSL K90 Pro", type: "Fingerprint scanner", status: "Connected", lastSync: "1 hour ago" },
    { name: "Matrix COSEC", type: "RFID & Palm Scanner", status: "Disconnected", lastSync: "24 hours ago" },
  ]);

  const handleSync = (deviceName: string) => {
    setSyncing(deviceName);
    setTimeout(() => {
      setSyncing(null);
      setDevices((prev) =>
        prev.map((d) =>
          d.name === deviceName
            ? { ...d, status: "Connected", lastSync: "Just now" }
            : d
        )
      );
      toast.success(`${deviceName} biometric data synchronized successfully!`);
    }, 1200);
  };

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between gap-3 border-b border-border-soft pb-3">
        <p className="text-body text-text-secondary">
          Manage site connections, configure hardware, and trigger manual synchronization logs.
        </p>
        <Badge tone="success">Systems Online</Badge>
      </div>
      <div className="space-y-4 mt-2">
        {devices.map((device) => (
          <div
            key={device.name}
            className="flex flex-col gap-3 rounded-[var(--radius-input)] border border-border-soft bg-surface-secondary p-4 sm:flex-row sm:items-center sm:justify-between hover:shadow-soft transition-all duration-200"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-hover p-2 text-text-secondary">
                <Cpu className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-text-primary text-body">{device.name}</p>
                <p className="text-label text-text-muted">{device.type}</p>
                <p className="text-label text-text-muted mt-1">Last synced: {device.lastSync}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
              <Badge tone={device.status === "Connected" ? "success" : "neutral"} className="flex items-center gap-1">
                {device.status === "Connected" ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" /> Connected
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3" /> Disconnected
                  </>
                )}
              </Badge>
              <Button
                size="sm"
                variant="secondary"
                className="h-8"
                onClick={() => handleSync(device.name)}
                loading={syncing === device.name}
              >
                {!syncing && <RefreshCw className="mr-1 h-3 w-3" />}
                Sync
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
