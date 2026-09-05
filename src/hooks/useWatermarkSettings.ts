import { defaultSettings, WatermarkSettings } from "@/lib/watermark";
import { useEffect, useState } from "react";

export function useWatermarkSettings () {
const [settings, setSettings] = useState<WatermarkSettings>(defaultSettings);
    const [hasLoaded, setHasLoaded] = useState(false);

    useEffect(() => {
      try {
        const saved = localStorage.getItem('watermark-settings');
        if (saved) setSettings(JSON.parse(saved));
      } catch {}
      setHasLoaded(true);
    }, []);

    useEffect(() => {
      if (!hasLoaded) return;
      localStorage.setItem('watermark-settings', JSON.stringify(settings));
    }, [settings, hasLoaded]);

    return { settings, setSettings };
}