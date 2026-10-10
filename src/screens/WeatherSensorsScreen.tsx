import React, { useState, useEffect } from 'react';
import { ArrowLeft, CloudSun, Radio, Thermometer, Droplets, Wind, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { WeatherData, SensorReading, SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';
import { apiService } from '../services/api';

interface Props {
  currentLanguage: SupportedLanguage;
  onBack: () => void;
}

export const WeatherSensorsScreen: React.FC<Props> = ({ currentLanguage, onBack }) => {
  const dict = translations[currentLanguage];
  const [activeTab, setActiveTab] = useState<'weather' | 'sensors'>('weather');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [sensors, setSensors] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const [wData, sData] = await Promise.all([
      apiService.getWeather(),
      apiService.getSensorReadings()
    ]);
    setWeather(wData);
    setSensors(sData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        <h2 className="text-lg font-bold text-gray-900">{dict.weather_sensors_title}</h2>
        <button
          onClick={fetchData}
          className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 active:scale-95 transition-all"
          title="Refresh"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 p-1 bg-gray-200/80 rounded-2xl gap-1 text-xs font-bold">
        <button
          onClick={() => setActiveTab('weather')}
          className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'weather' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600'
          }`}
        >
          <CloudSun size={15} />
          <span>{dict.weather_section}</span>
        </button>

        <button
          onClick={() => setActiveTab('sensors')}
          className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'sensors' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600'
          }`}
        >
          <Radio size={15} />
          <span>{dict.sensor_section}</span>
        </button>
      </div>

      {/* Tab 1: Weather */}
      {activeTab === 'weather' && weather && (
        <div className="space-y-4">
          {/* Main Weather Card */}
          <div className="card p-5 bg-linear-to-br from-blue-700 to-indigo-800 text-white space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                  {weather.location_name}
                </span>
                <div className="text-3xl font-extrabold mt-1">
                  {weather.temperature_c}°C
                </div>
                <div className="text-sm text-blue-100 font-medium">{weather.weather_condition}</div>
              </div>
              <CloudSun size={48} className="text-amber-300" />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-blue-600/60 text-xs">
              <div>
                <div className="text-blue-200 text-[10px]">{dict.humidity}</div>
                <div className="font-bold">{weather.relative_humidity_pct}%</div>
              </div>
              <div>
                <div className="text-blue-200 text-[10px]">{dict.rainfall}</div>
                <div className="font-bold">{weather.precipitation_mm} mm</div>
              </div>
              <div>
                <div className="text-blue-200 text-[10px]">{dict.wind}</div>
                <div className="font-bold">{weather.wind_speed_kmh} km/h</div>
              </div>
            </div>
          </div>

          {/* Provenance & Disclaimer Box */}
          <div className="card p-4 space-y-2 border border-blue-200 bg-blue-50/50">
            <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldCheck size={16} className="text-blue-700" />
              <span>Data Provenance: {weather.provenance}</span>
            </div>
            <p className="text-xs text-blue-800 leading-relaxed">
              {dict.weather_provenance_note}
            </p>
            <div className="text-[10px] text-gray-500 font-mono pt-1">
              Retrieved: {new Date(weather.retrieval_time).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Sensors */}
      {activeTab === 'sensors' && (
        <div className="space-y-4">
          {/* Prominent Mandatory Simulation Disclaimer */}
          <div className="card bg-amber-50 border-2 border-amber-300 p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs uppercase tracking-wider">
              <AlertTriangle size={18} className="text-amber-600 shrink-0" />
              <span>Telemetry Notice</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed font-bold">
              {dict.sensor_simulated_alert}
            </p>
          </div>

          {/* Sensor Telemetry List */}
          <div className="space-y-2.5">
            {sensors.map((s) => (
              <div key={s.sensor_id} className="card p-4 flex items-center justify-between border border-gray-200">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-gray-900">{s.parameter}</div>
                  <div className="text-[10px] text-gray-400 font-mono">{s.sensor_id}</div>
                  <div className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">
                    {s.provenance_tag}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-extrabold text-[#1E5631]">
                    {s.value} <span className="text-xs font-normal text-gray-600">{s.unit}</span>
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {new Date(s.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* IoT Architecture note */}
          <div className="card p-4 bg-gray-50 border border-gray-200 text-xs text-gray-600 leading-relaxed space-y-1">
            <span className="font-bold text-gray-800">Hardware Integration Architecture: </span>
            A modular IoT adapter in <code className="bg-gray-200 px-1 rounded text-[11px]">backend/app/services/sensor_service.py</code> supports physical LoRaWAN / MQTT field hardware telemetry without frontend changes.
          </div>
        </div>
      )}
    </div>
  );
};
