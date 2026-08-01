import { useState, useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-5">
      <div className="bg-red-500 text-white px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 font-medium text-sm">
        <WifiOff className="h-4 w-4" />
        <span>You are offline. Working in offline mode.</span>
      </div>
    </div>
  );
}
