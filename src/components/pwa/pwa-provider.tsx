"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Download, WifiOff, X, Sparkles, CheckCircle2 } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface PWAContextValue {
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  promptInstall: () => Promise<boolean>;
}

const PWAContext = createContext<PWAContextValue>({
  isInstalled: false,
  isInstallable: false,
  isOnline: true,
  promptInstall: async () => false,
});

export function usePWA() {
  return useContext(PWAContext);
}

export function PWAProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [installSuccessToast, setInstallSuccessToast] = useState(false);

  // 1. Register Service Worker & Check Installation State
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if already running in standalone mode (installed PWA)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes("android-app://");

    if (isStandalone) {
      setIsInstalled(true);
    }

    // Register Service Worker
    if ("serviceWorker" in navigator && process.env.NODE_ENV !== "test") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[PWA] Service Worker registered with scope:", registration.scope);

          // Check for worker updates
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                  console.log("[PWA] New version available! Reloading for update.");
                }
              };
            }
          };
        })
        .catch((error) => {
          console.warn("[PWA] Service Worker registration failed:", error);
        });
    }

    // 2. Listen for 'beforeinstallprompt'
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Only show banner if not dismissed previously in this session
      const dismissed = sessionStorage.getItem("crestix_pwa_dismissed");
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    // 3. Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowInstallBanner(false);
      setInstallSuccessToast(true);
      setTimeout(() => setInstallSuccessToast(false), 5000);
      console.log("[PWA] Crestix Probe installed successfully.");
    };

    // 4. Online/Offline network state detection
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Trigger Native PWA Install Prompt
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.log("[PWA] Install prompt unavailable or already installed.");
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
        setDeferredPrompt(null);
        setShowInstallBanner(false);
        return true;
      }
    } catch (err) {
      console.warn("[PWA] Installation prompt error:", err);
    }
    return false;
  }, [deferredPrompt]);

  const dismissBanner = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem("crestix_pwa_dismissed", "true");
  };

  return (
    <PWAContext.Provider
      value={{
        isInstalled,
        isInstallable: !!deferredPrompt && !isInstalled,
        isOnline,
        promptInstall,
      }}
    >
      {/* Offline Ribbon */}
      {!isOnline && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed top-0 inset-x-0 z-50 bg-rose-600/95 backdrop-blur-md text-white text-xs font-mono py-1.5 px-4 flex items-center justify-center gap-2 shadow-lg animate-in slide-in-from-top duration-300"
        >
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          <span>OFFLINE MODE ACTIVE • Telemetry buffered locally in service worker storage</span>
        </aside>
      )}

      {/* Install Success Toast */}
      {installSuccessToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 right-4 z-50 bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top duration-300"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-xs font-bold text-white">Crestix Probe Installed!</p>
            <p className="text-[11px] text-emerald-300">Fast offline launch now active on home screen.</p>
          </div>
        </div>
      )}

      {/* Mobile/Desktop PWA Install Banner */}
      {showInstallBanner && !isInstalled && (
        <aside
          role="region"
          aria-label="Progressive Web App installation prompt"
          className="fixed bottom-18 lg:bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-40 sm:max-w-md bg-gradient-to-r from-slate-900/95 via-[#0b0f17]/95 to-slate-900/95 border border-cyan-500/40 backdrop-blur-xl p-4 rounded-2xl shadow-2xl shadow-cyan-950/50 animate-in slide-in-from-bottom duration-300"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-950 to-teal-950 border border-cyan-500/40 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  Install Crestix Probe App
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    PWA
                  </span>
                </h4>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Add to home screen for instant full-screen mobile telemetry & offline operation.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={dismissBanner}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 focus:outline-none"
              aria-label="Dismiss installation prompt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={promptInstall}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install to Device</span>
            </button>
            <button
              type="button"
              onClick={dismissBanner}
              className="py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Maybe Later
            </button>
          </div>
        </aside>
      )}

      {children}
    </PWAContext.Provider>
  );
}
