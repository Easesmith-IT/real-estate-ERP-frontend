"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const [secondsLeft, setSecondsLeft] = useState(8);
  const [copied, setCopied] = useState(false);
  const [diagnosticId, setDiagnosticId] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDiagnosticId(`ERR-404-${Math.random().toString(36).substring(2, 9).toUpperCase()}`);
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) {
      window.location.href = "http://localhost:3000/home/dashboard";
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleRedirect = () => {
    window.location.href = "http://localhost:3000/home/dashboard";
  };

  const copyDiagnosticInfo = () => {
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "unknown";
    const info = `Diagnostic Trace ID: ${diagnosticId}\nTimestamp: ${new Date().toISOString()}\nPath: ${currentPath}\nStatus Code: 404 (Registry Resolution Failure)`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(info).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const progressPercent = (secondsLeft / 8) * 100;

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-[#eef2f7] p-4 text-text-primary lg:p-8">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-accent-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-accent-secondary/5 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border-soft bg-white p-6 shadow-enterprise lg:p-8">
        
        {/* Top Header / Branding */}
        <div className="flex items-center justify-between border-b border-border-soft pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-primary text-white shadow-soft transition-transform duration-300 hover:rotate-6">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div>
              <p className="font-secondary text-body font-semibold tracking-tight text-text-primary">NimbusOS</p>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Enterprise ERP</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Registry Operational
          </div>
        </div>

        {/* 404 Icon & Title */}
        <div className="relative flex flex-col items-center py-4 text-center">
          <div className="relative">
            <h1 className="text-7xl font-extrabold tracking-tight bg-linear-to-b from-accent-primary to-accent-secondary bg-clip-text text-transparent select-none font-sans">
              404
            </h1>
          </div>
          
          <h2 className="mt-4 font-secondary text-lg font-bold text-text-primary tracking-tight">
            Registry Resolution Failure
          </h2>
          <p className="mt-2 text-sm text-text-secondary max-w-sm leading-relaxed">
            The requested enterprise resource node or URL path is not registered in the system registry.
          </p>
        </div>

        {/* Redirect timer progress */}
        <div className="rounded-xl border border-border-soft bg-slate-50 p-4 mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-text-secondary mb-2">
            <div className="flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-accent-primary" style={{ animationDuration: '3s' }} />
              <span>Redirecting to Dashboard...</span>
            </div>
            <span className="font-mono text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded">
              0{secondsLeft}s
            </span>
          </div>
          
          {/* Progress bar track */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div 
              className="h-full bg-linear-to-r from-accent-primary to-accent-secondary transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleRedirect} 
            className="group flex-1 justify-center gap-2 py-2.5"
            variant="primary"
          >
            <span>Dashboard</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
          
          <Button 
            onClick={copyDiagnosticInfo} 
            variant="secondary"
            className="justify-center gap-2 py-2.5 sm:w-[150px]"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-500" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Trace Log</span>
              </>
            )}
          </Button>
        </div>

        {/* Diagnostic System Info */}
        <div className="mt-6 border-t border-border-soft pt-4 flex flex-col gap-1 text-[10px] font-mono text-text-muted">
          <div className="flex justify-between">
            <span>Trace Reference:</span>
            <span className="text-text-secondary font-semibold">{diagnosticId || "PENDING"}</span>
          </div>
          <div className="flex justify-between">
            <span>Gateway Protocol:</span>
            <span className="text-text-secondary">HTTP/2 Secure SSL</span>
          </div>
          <div className="flex justify-between">
            <span>Resolution Target:</span>
            <span className="text-text-secondary">Client Side Router</span>
          </div>
        </div>

      </div>
    </div>
  );
}
