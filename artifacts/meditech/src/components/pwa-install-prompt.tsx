import { useEffect, useState } from "react";
import { Download, X, Share, Plus, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "ios" | "android" | "desktop" | "unknown";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream)
    return "ios";
  if (/Android/.test(ua)) return "android";
  if (/Windows|Macintosh|Linux/.test(ua)) return "desktop";
  return "unknown";
}

const DISMISSED_KEY = "meditech-pwa-dismissed";
const DISMISSED_EXPIRY_DAYS = 7;

function wasDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return false;
    const daysAgo = (Date.now() - parseInt(raw, 10)) / (1000 * 60 * 60 * 24);
    return daysAgo < DISMISSED_EXPIRY_DAYS;
  } catch {
    return false;
  }
}

export function PwaInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (isStandalone || wasDismissedRecently()) return;

    const p = detectPlatform();
    setPlatform(p);

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setVisible(false));

    const timer = setTimeout(() => setVisible(true), 3000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(DISMISSED_KEY, Date.now().toString()); } catch {}
    setVisible(false);
  };

  const handleInstall = async () => {
    if (platform === "ios") { dismiss(); return; }
    if (!installPrompt) { dismiss(); return; }
    setInstalling(true);
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    setInstalling(false);
    if (outcome === "accepted") setVisible(false);
    else dismiss();
  };

  if (!visible) return null;

  const isIos = platform === "ios";
  const hasNativePrompt = !!installPrompt;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={dismiss}
      />

      <div className="fixed z-50 bottom-0 left-0 right-0 p-3 sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4 pointer-events-none">
        <div className="pointer-events-auto w-full sm:max-w-sm animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-border">

            <div className="bg-primary px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-xl p-2">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-base leading-tight">MediTech</p>
                  <p className="text-white/75 text-xs">Smart Healthcare Management</p>
                </div>
              </div>
              <button
                onClick={dismiss}
                className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 py-4">
              {isIos ? (
                <>
                  <p className="text-sm font-semibold text-foreground mb-0.5">Install on iPhone / iPad</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add to your Home Screen for a full app experience — works offline too.
                  </p>
                  <div className="space-y-2.5 mb-4">
                    <div className="flex items-center gap-3 bg-muted/60 rounded-xl p-3">
                      <div className="bg-primary/10 rounded-lg p-1.5 shrink-0">
                        <Share className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold">Step 1</p>
                        <p className="text-xs text-muted-foreground">Tap the Share button at the bottom of Safari</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-muted/60 rounded-xl p-3">
                      <div className="bg-primary/10 rounded-lg p-1.5 shrink-0">
                        <Plus className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold">Step 2</p>
                        <p className="text-xs text-muted-foreground">Select "Add to Home Screen", then tap Add</p>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full" onClick={dismiss}>Got it</Button>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-foreground mb-0.5">
                    Install MediTech on this device
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Launch directly from your home screen — no browser needed, works offline too.
                  </p>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { icon: "⚡", label: "Fast Open" },
                      { icon: "📶", label: "Offline Mode" },
                      { icon: "🏠", label: "Home Screen" },
                    ].map((f) => (
                      <div key={f.label} className="bg-muted/60 rounded-xl py-2.5 px-2 text-center">
                        <div className="text-lg mb-1">{f.icon}</div>
                        <p className="text-xs font-medium text-muted-foreground leading-tight">{f.label}</p>
                      </div>
                    ))}
                  </div>

                  {!hasNativePrompt && (
                    <p className="text-xs text-muted-foreground bg-muted/60 rounded-lg px-3 py-2 mb-3 text-center">
                      Look for the install icon in your browser's address bar
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={dismiss}>
                      Not now
                    </Button>
                    <Button
                      className="flex-1 gap-2"
                      onClick={handleInstall}
                      disabled={installing}
                    >
                      <Download className="h-4 w-4" />
                      {installing ? "Installing..." : "Install App"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
