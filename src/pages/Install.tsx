import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Monitor, Check } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-border bg-card">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            {installed ? <Check className="h-8 w-8 text-primary" /> : <Download className="h-8 w-8 text-primary" />}
          </div>
          <CardTitle className="font-display text-xl">
            {installed ? "GymFlow Installed!" : "Install GymFlow"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {installed ? (
            <p className="text-muted-foreground">GymFlow is now installed on your device. Open it from your home screen.</p>
          ) : deferredPrompt ? (
            <>
              <p className="text-muted-foreground">Install GymFlow as an app for quick access.</p>
              <Button onClick={handleInstall} className="w-full">
                <Download className="mr-2 h-4 w-4" /> Install App
              </Button>
            </>
          ) : (
            <div className="space-y-4 text-left">
              <p className="text-muted-foreground text-center">Install GymFlow on your device:</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                  <Smartphone className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">iPhone / iPad</p>
                    <p className="text-xs text-muted-foreground">Tap Share → Add to Home Screen</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                  <Smartphone className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Android</p>
                    <p className="text-xs text-muted-foreground">Tap browser menu → Install App</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                  <Monitor className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Desktop</p>
                    <p className="text-xs text-muted-foreground">Click the install icon in address bar</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
