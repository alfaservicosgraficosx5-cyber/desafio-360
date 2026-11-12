import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-lg border border-amber-500">
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Modo Offline — Interface em cache; alterações sincronizarão ao reconectar.</span>
    </div>
  );
};
