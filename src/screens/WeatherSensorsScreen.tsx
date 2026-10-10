import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CloudSun,
  Radio,
  Thermometer,
  Droplets,
  Wind,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  CheckCircle,
  Wifi,
  Cpu
} from 'lucide-react';
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

  const hasPhysicalTelemetry = sensors.some((s) => !s.is_simulated);

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
          {hasPhysicalTelemetry && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
          )}
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
          {/* Hardware Status Banner */}
          {hasPhysicalTelemetry ? (
            <div className="card bg-emerald-50 border-2 border-emerald-400 p-4 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>ESP32 Hardware Node Online</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-900">
                  LIVE WI-FI
                </span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                {currentLanguage === 'te'
                  ? 'ESP32 ఫీల్డ్ సెన్సార్ నోడ్ నుండి ప్రత్యక్ష వాతావరణ సమాచారం (ఉష్ణోగ్రత, తేమ, ఆకు తడి వ్యవధి, నేల తేమ) విజయవంతంగా చేరుతోంది.'
                  : currentLanguage === 'hi'
                  ? 'ESP32 फ़ील्ड सेंसर नोड से वास्तविक सूक्ष्म-जलवायु डेटा (तापमान, आर्द्रता, पत्ती गीलापन, मिट्टी नमी) प्राप्त हो रहा है।'
                  : 'Live microclimate telemetry (canopy temperature, humidity, leaf wetness duration, soil moisture) actively streaming from physical ESP32 field node.'}
              </p>
            </div>
          ) : (
            <div className="card bg-amber-50 border-2 border-amber-300 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs uppercase tracking-wider">
                <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                <span>Telemetry Notice</span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed font-bold">
                {dict.sensor_simulated_alert}
              </p>
            </div>
          )}

          {/* Sensor Telemetry List */}
          <div className="space-y-2.5">
            {sensors.map((s) => (
              <div
                key={s.sensor_id}
                className={`card p-4 flex items-center justify-between border ${
                  !s.is_simulated ? 'border-emerald-200 bg-white' : 'border-gray-200'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-gray-900">{s.parameter}</div>
                  <div className="text-[10px] text-gray-400 font-mono">{s.sensor_id}</div>
                  <div
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      !s.is_simulated ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {!s.is_simulated ? '● PHYSICAL ESP32 TELEMETRY' : s.provenance_tag}
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

          {/* IoT Architecture & Hardware Integration note */}
          <div className="card p-4 bg-gray-50 border border-gray-200 text-xs text-gray-600 leading-relaxed space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-gray-800">
              <Cpu size={15} className="text-[#1E5631]" />
              <span>Hardware Node Architecture</span>
            </div>
            <p>
              Autonomous ESP32 DevKit node reading DHT22 (GPIO 4), Soil Moisture (ADC1 GPIO 32), and Leaf Wetness (ADC1 GPIO 33). Telemetry is transmitted via HTTP POST JSON to{' '}
              <code className="bg-gray-200 px-1 rounded text-[11px]">/api/sensor</code>.
            </p>
            <div className="text-[11px] text-gray-500 pt-1 border-t border-gray-200 flex items-center justify-between">
              <span>Node Status: {hasPhysicalTelemetry ? '🟢 Active Streaming' : '🟠 Offline / Demo Mode'}</span>
              <span>Port: 8008</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

