import React, { useState, useEffect } from 'react';
import { Bell, BellRing, X, ShieldCheck } from 'lucide-react';
import { backgroundNotificationService } from '../utils/backgroundNotificationService';

export const NotificationPermissionBanner: React.FC = () => {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('granted');
  const [dismissed, setDismissed] = useState<boolean>(false);
  const [isActivating, setIsActivating] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      const isDismissed = sessionStorage.getItem('chrono_notif_banner_dismissed') === 'true';
      setDismissed(isDismissed);
    }
  }, []);

  if (permission === 'granted' || permission === 'unsupported' || dismissed) {
    return null;
  }

  const handleEnable = async () => {
    setIsActivating(true);
    try {
      const granted = await backgroundNotificationService.requestNotificationPermission();
      if (granted) {
        setPermission('granted');
      } else {
        setPermission(Notification.permission);
      }
    } finally {
      setIsActivating(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('chrono_notif_banner_dismissed', 'true');
  };

  return (
    <div className="relative z-30 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full pt-2">
      <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 shadow-sm backdrop-blur">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <BellRing className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
              Enable Lock Screen & Notification Shade Controls
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              View live countdowns, pause, and reset directly from your Android lock screen
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleEnable}
            disabled={isActivating}
            className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{isActivating ? 'Enabling...' : 'Enable Now'}</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
