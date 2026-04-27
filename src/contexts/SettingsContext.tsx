import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PLATFORM_NAME } from '../lib/constants';

interface Settings {
  appName: string;
  appLogoUrl: string;
  appFaviconUrl: string;
  supportWhatsapp: string;
  subscriptionPrice: string;
  qrisImageUrl: string;
}

interface SettingsContextType {
  settings: Settings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: Settings = {
  appName: PLATFORM_NAME,
  appLogoUrl: '',
  appFaviconUrl: '',
  supportWhatsapp: '',
  subscriptionPrice: '150000',
  qrisImageUrl: '',
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
  refreshSettings: async () => {},
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('system_settings').select('*');
      
      if (error) {
        console.error("Error fetching settings:", error);
        return;
      }

      if (data) {
        const newSettings = { ...defaultSettings };
        data.forEach((s) => {
          if (s.key === 'app_name' && s.value) newSettings.appName = s.value;
          if (s.key === 'app_logo_url' && s.value) newSettings.appLogoUrl = s.value;
          if (s.key === 'app_favicon_url' && s.value) newSettings.appFaviconUrl = s.value;
          if (s.key === 'support_whatsapp' && s.value) newSettings.supportWhatsapp = s.value;
          if (s.key === 'subscription_price' && s.value) newSettings.subscriptionPrice = s.value;
          if (s.key === 'qris_image_url' && s.value) newSettings.qrisImageUrl = s.value;
        });
        setSettings(newSettings);
      }
    } catch (err) {
      console.error("Failed to load settings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Effect to handle dynamic Document Title and Favicon
  useEffect(() => {
    if (settings.appName) {
      document.title = `${settings.appName} | Freeze your moment`;
    }

    if (settings.appFaviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = settings.appFaviconUrl;
    }
  }, [settings.appName, settings.appFaviconUrl]);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
