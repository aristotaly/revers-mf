"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

type DeferredPrompt = {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "revers-mf:install-dismissed";

/**
 * Non-intrusive install affordance:
 *   - Android/desktop Chromium: catches `beforeinstallprompt` and shows a
 *     "Install app" button that fires the native prompt.
 *   - iOS Safari: shows a one-time helper card explaining the Share → Add to
 *     Home Screen flow (Safari does not support beforeinstallprompt).
 *   - Hidden entirely when the app is already running in standalone mode.
 *   - Persists dismissals in localStorage so users aren't nagged.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<DeferredPrompt | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true); // assume installed until proven otherwise
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ua = navigator.userAgent || "";
    const iOS =
      /iPad|iPhone|iPod/.test(ua) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(iOS);

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;
    setIsStandalone(standalone);

    setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferred(event as unknown as DeferredPrompt);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => setIsStandalone(true);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  if (isStandalone || dismissed) return null;
  if (!deferred && !isIOS) return null;

  function handleDismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore (private mode / storage blocked)
    }
  }

  async function handleInstall() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    if (choice.outcome === "accepted") {
      setIsStandalone(true);
    } else {
      handleDismiss();
    }
  }

  return (
    <div
      className="mx-4 mt-3 flex items-start gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-3 text-sm text-violet-900 shadow-sm"
      data-testid="install-prompt"
    >
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
        <Download className="h-5 w-5" strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-tight">Install Weight Trend</p>
        {deferred ? (
          <p className="mt-0.5 text-xs leading-snug text-violet-800/80">
            Add it to your home screen for a fullscreen, app-like experience.
          </p>
        ) : (
          <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs leading-snug text-violet-800/80">
            Tap
            <Share className="inline h-3.5 w-3.5" strokeWidth={1.8} />
            then <span className="font-medium">Add to Home Screen</span>.
          </p>
        )}
        {deferred && (
          <button
            type="button"
            onClick={handleInstall}
            className="mt-2 inline-flex h-8 items-center rounded-full bg-violet-700 px-3 text-xs font-semibold text-white hover:bg-violet-800"
            data-testid="install-button"
          >
            Install app
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="-mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-full text-violet-700 hover:bg-violet-100"
        aria-label="Dismiss install prompt"
      >
        <X className="h-4 w-4" strokeWidth={1.8} />
      </button>
    </div>
  );
}
