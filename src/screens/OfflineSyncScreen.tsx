import React, { useState, useEffect } from 'react';
import { ArrowLeft, Database, CloudUpload, Trash2, CheckCircle2, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { FieldRecord, InspectionRecord, SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';
import { dbService } from '../services/db';
import { apiService } from '../services/api';

interface Props {
  currentLanguage: SupportedLanguage;
  isOnline: boolean;
  fields: FieldRecord[];
  inspections: InspectionRecord[];
  onDataReset: () => void;
  onBack: () => void;
}

export const OfflineSyncScreen: React.FC<Props> = ({
  currentLanguage,
  isOnline,
  fields,
  inspections,
  onDataReset,
  onBack
}) => {
  const dict = translations[currentLanguage];
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const loadPendingCount = async () => {
    const count = await dbService.getPendingSyncCount();
    setPendingCount(count);
  };

  useEffect(() => {
    loadPendingCount();
  }, []);

  const handleSyncNow = async () => {
    if (!isOnline) {
      setSyncStatusMsg('Cannot sync while offline. Please connect to Wi-Fi/Mobile network.');
      return;
    }

    setIsSyncing(true);
    setSyncStatusMsg(null);

    const pendingInspections = inspections.filter(i => i.sync_status !== 'synced');
    const success = await apiService.syncRecords(fields, pendingInspections);

    if (success) {
      await dbService.markInspectionsAsSynced(pendingInspections.map(i => i.id));
      setPendingCount(0);
      setSyncStatusMsg('All pending records synced successfully to server!');
    } else {
      setSyncStatusMsg('Sync failed: backend endpoint unreachable. Records remain safely stored locally.');
    }
    setIsSyncing(false);
  };

  const handleResetData = async () => {
    if (window.confirm(dict.clear_confirm_text)) {
      await dbService.clearAllData();
      onDataReset();
      setPendingCount(0);
      setSyncStatusMsg('Local database reset complete.');
    }
  };

  return (
    <div className="pb-28 pt-4 px-4 max-w-md mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 active:scale-95 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-bold text-gray-900">{dict.offline_sync_title}</h2>
        <div className="w-9" />
      </div>

      {/* Storage Summary Card */}
      <div className="card p-5 space-y-3 border-2 border-emerald-600/30 bg-emerald-50/20">
        <div className="flex items-center gap-2 text-xs font-bold text-[#1E5631] uppercase tracking-wider">
          <Database size={16} />
          <span>{dict.device_storage_label}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className="bg-white p-2.5 rounded-xl border border-gray-200">
            <div className="text-lg font-extrabold text-gray-900">{fields.length}</div>
            <div className="text-[10px] text-gray-500 font-medium">Fields</div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-gray-200">
            <div className="text-lg font-extrabold text-gray-900">{inspections.length}</div>
            <div className="text-[10px] text-gray-500 font-medium">Inspections</div>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-gray-200">
            <div className="text-lg font-extrabold text-blue-700">{pendingCount}</div>
            <div className="text-[10px] text-gray-500 font-medium">Pending Sync</div>
          </div>
        </div>

        <p className="text-[11px] text-gray-600 leading-relaxed pt-1">
          Structured inspection records and captured images are persisted locally in browser IndexedDB.
          All inspection data survives offline restarts.
        </p>
      </div>

      {/* Sync Status Banner */}
      {syncStatusMsg && (
        <div className="card bg-blue-50 border-blue-300 p-3 text-xs text-blue-900 font-medium animate-in fade-in">
          {syncStatusMsg}
        </div>
      )}

      {/* Sync Action */}
      <div className="space-y-2 pt-2">
        <button
          onClick={handleSyncNow}
          disabled={isSyncing}
          className="btn-primary w-full shadow-md text-sm"
        >
          <CloudUpload size={18} className={isSyncing ? 'animate-bounce' : ''} />
          <span>{isSyncing ? 'Syncing...' : dict.sync_now_btn}</span>
        </button>

        <button
          onClick={handleResetData}
          className="w-full py-3 px-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <Trash2 size={16} />
          <span>{dict.clear_data_btn}</span>
        </button>
      </div>
    </div>
  );
};
