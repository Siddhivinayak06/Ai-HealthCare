import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorMode } from '@chakra-ui/react';

// Create context
const SettingsContext = createContext();

// Default settings
const defaultSettings = {
  appearance: {
    theme: 'system', // 'light', 'dark', or 'system'
    fontSize: 'medium', // 'small', 'medium', 'large'
    compactView: false,
  },
  notifications: {
    emailNotifications: true,
    resultReady: true,
    systemUpdates: true,
    diagnosticReminders: true,
  },
  privacy: {
    shareAnonymousData: false,
    saveHistory: true,
    showRecordCount: true,
  },
  account: {
    twoFactorAuth: false,
    sessionTimeout: '30', // time in minutes
    autoSave: true,
  }
};

export const SettingsProvider = ({ children }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Load settings from localStorage on initial render
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('userSettings');
        
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings(parsedSettings);
        } else {
          // If no settings saved, initialize with the current color mode
          setSettings(prev => ({
            ...prev,
            appearance: {
              ...prev.appearance,
              theme: colorMode
            }
          }));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [colorMode]);

  // Update a specific setting
  const updateSetting = (section, setting, value) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [section]: {
          ...prev[section],
          [setting]: value
        }
      };
      
      // Save to localStorage
      localStorage.setItem('userSettings', JSON.stringify(newSettings));
      
      return newSettings;
    });
  };

  // Toggle a boolean setting
  const toggleSetting = (section, setting) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [section]: {
          ...prev[section],
          [setting]: !prev[section][setting]
        }
      };
      
      // Save to localStorage
      localStorage.setItem('userSettings', JSON.stringify(newSettings));
      
      return newSettings;
    });
  };

  // Save all settings
  const saveAllSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('userSettings', JSON.stringify(newSettings));
  };

  // Apply font size from settings
  useEffect(() => {
    if (!loading) {
      const fontSize = settings.appearance.fontSize;
      const htmlElement = document.documentElement;
      
      // Set data attribute for font size
      htmlElement.setAttribute('data-font-size', fontSize);
    }
  }, [settings.appearance.fontSize, loading]);

  // Apply theme from settings
  useEffect(() => {
    if (!loading && settings.appearance.theme !== colorMode) {
      toggleColorMode();
    }
  }, [settings.appearance.theme, colorMode, toggleColorMode, loading]);

  // Apply compact view
  useEffect(() => {
    if (!loading) {
      const bodyElement = document.body;
      if (settings.appearance.compactView) {
        bodyElement.classList.add('compact-view');
      } else {
        bodyElement.classList.remove('compact-view');
      }
    }
  }, [settings.appearance.compactView, loading]);

  return (
    <SettingsContext.Provider 
      value={{ 
        settings,
        updateSetting,
        toggleSetting,
        saveAllSettings,
        loading
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext); 