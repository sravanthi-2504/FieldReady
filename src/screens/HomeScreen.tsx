import React from 'react';
import {
  ScanLine,
  MapPin,
  Clock,
  CloudSun,
  Database,
  Settings,
  Wifi,
  WifiOff,
  ChevronRight,
  ShieldAlert,
  Sprout
} from 'lucide-react';
import { SupportedLanguage, InspectionRecord, FieldRecord } from '../types';
import { translations } from '../i18n/translations';

interface Props {
  currentLanguage: SupportedLanguage;
  isOnline: boolean;
  pendingSyncCount: number;
  recentInspection?: InspectionRecord;
  fields: FieldRecord[];
  onStartInspection: () => void;
  onNavigate: (screen: any) => void;
  onChangeLanguage: () => void;
}

export const HomeScreen: React.FC<Props> = ({
  currentLanguage,
  isOnline,
  pendingSyncCount,
  recentInspection,
  fields,
  onStartInspection,
  onNavigate,
  onChangeLanguage
}) => {
  const dict = translations[currentLanguage];

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-5">
      {/* Top Status & Language Bar */}
      <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              <Wifi size={14} />
              <span>{dict.online_badge}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
              <WifiOff size={14} />
              <span>{dict.offline_badge}</span>
            </div>
          )}

          {pendingSyncCount > 0 && (
            <button
              onClick={() => onNavigate('OFFLINE_SYNC')}
              className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full hover:bg-blue-100"
            >
              {pendingSyncCount} {dict.pending_sync_badge}
            </button>
          )}
        </div>

        <button
          onClick={onChangeLanguage}
          className="text-xs font-bold text-[#1E5631] bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-full transition-colors"
        >
          {currentLanguage === 'te' ? 'తెలుగు' : currentLanguage === 'hi' ? 'हिन्दी' : 'English'}
        </button>
      </div>

      {/* Hero Primary Action Card */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#1E5631] to-[#2D6A4F] text-white p-6 shadow-md">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-emerald-200 uppercase bg-black/20 px-2.5 py-1 rounded-full">
            <Sprout size={14} />
            <span>{dict.app_title}</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {dict.action_check_health}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            {dict.voice_home_prompt}
          </p>

          <div className="pt-2">
            <button
              onClick={onStartInspection}
              className="w-full py-3.5 px-4 bg-white hover:bg-emerald-50 text-[#1E5631] font-bold rounded-2xl shadow-sm flex items-center justify-center gap-2 text-base active:scale-[0.98] transition-all"
            >
              <ScanLine size={20} className="text-[#1E5631]" />
              <span>{dict.action_check_health}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of 4 Farmer Actions */}
      <div className="grid grid-cols-2 gap-3">
        {/* My Fields */}
        <button
          onClick={() => onNavigate('FIELD_SELECTION_OR_CREATION')}
          className="card text-left p-4 hover:border-gray-300 transition-all active:scale-[0.98] flex flex-col justify-between h-32"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1E5631] flex items-center justify-center">
            <MapPin size={22} />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">{dict.action_my_fields}</div>
            <div className="text-[11px] text-gray-500 font-medium">{fields.length} {dict.fields_title}</div>
          </div>
        </button>

        {/* Inspection History */}
        <button
          onClick={() => onNavigate('HISTORY')}
          className="card text-left p-4 hover:border-gray-300 transition-all active:scale-[0.98] flex flex-col justify-between h-32"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Clock size={22} />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">{dict.action_history}</div>
            <div className="text-[11px] text-gray-500 font-medium">{dict.compare_visits_title}</div>
          </div>
        </button>

        {/* Weather & Sensors */}
        <button
          onClick={() => onNavigate('WEATHER_SENSORS')}
          className="card text-left p-4 hover:border-gray-300 transition-all active:scale-[0.98] flex flex-col justify-between h-32"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <CloudSun size={22} />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">{dict.action_weather_sensors}</div>
            <div className="text-[11px] text-gray-500 font-medium">Open-Meteo & Sensors</div>
          </div>
        </button>

        {/* Offline & Sync */}
        <button
          onClick={() => onNavigate('OFFLINE_SYNC')}
          className="card text-left p-4 hover:border-gray-300 transition-all active:scale-[0.98] flex flex-col justify-between h-32"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <Database size={22} />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">{dict.action_offline_sync}</div>
            <div className="text-[11px] text-gray-500 font-medium">{pendingSyncCount} {dict.pending_sync_badge}</div>
          </div>
        </button>
      </div>

      {/* Recent Inspection Card */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-gray-600 uppercase tracking-wider px-1">
          {dict.recent_inspection_heading}
        </div>

        {recentInspection ? (
          <div
            onClick={() => onNavigate('HISTORY')}
            className="card p-4 hover:border-gray-300 cursor-pointer active:scale-[0.99] transition-all flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              {recentInspection.image_data_url ? (
                <img
                  src={recentInspection.image_data_url}
                  alt="Inspection thumbnail"
                  className="w-14 h-14 rounded-xl object-cover border border-gray-200"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                  <Sprout size={24} />
                </div>
              )}
              <div>
                <div className="text-sm font-bold text-gray-900">
                  {recentInspection.predicted_condition
                    ? recentInspection.predicted_condition.replace(/_/g, ' ').toUpperCase()
                    : 'Crop Inspection'}
                </div>
                <div className="text-xs text-gray-500">
                  {recentInspection.crop} • {new Date(recentInspection.visited_at).toLocaleDateString()}
                </div>
                <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                  {recentInspection.symptomatic_count} of {recentInspection.sample_count} sampled plants with symptoms
                </div>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>
        ) : (
          <div className="card p-4 text-center text-gray-500 text-xs">
            {dict.no_inspections_yet}
          </div>
        )}
      </div>

      {/* Settings / Examiner Guide Footer Link */}
      <div className="pt-2">
        <button
          onClick={() => onNavigate('HELP_SETTINGS')}
          className="w-full py-3 px-4 rounded-2xl bg-white border border-gray-200 text-gray-700 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
        >
          <Settings size={16} />
          <span>{dict.action_settings} (Examiner Demo & ML Metrics)</span>
        </button>
      </div>
    </div>
  );
};
