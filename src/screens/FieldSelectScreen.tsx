import React, { useState } from 'react';
import { Plus, MapPin, Check, ArrowLeft, Navigation, ArrowRight, ShieldCheck, Sprout } from 'lucide-react';
import { FieldRecord, SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';
import { dbService } from '../services/db';

interface Props {
  currentLanguage: SupportedLanguage;
  fields: FieldRecord[];
  selectedFieldId?: string;
  onSelectField: (field: FieldRecord) => void;
  onBack: () => void;
}

export const FieldSelectScreen: React.FC<Props> = ({
  currentLanguage,
  fields,
  selectedFieldId,
  onSelectField,
  onBack
}) => {
  const dict = translations[currentLanguage];
  const [activeId, setActiveId] = useState<string>(selectedFieldId || (fields[0]?.id || ''));
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [fieldName, setFieldName] = useState('');
  const [crop, setCrop] = useState('maize');
  const [acreage, setAcreage] = useState('2.0');
  const [plantingDate, setPlantingDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; accuracy?: number } | undefined>();
  const [isCapturingGPS, setIsCapturingGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedField = fields.find(f => f.id === activeId) || fields[0];

  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setIsCapturingGPS(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: parseFloat(pos.coords.latitude.toFixed(5)),
          longitude: parseFloat(pos.coords.longitude.toFixed(5)),
          accuracy: Math.round(pos.coords.accuracy)
        });
        setIsCapturingGPS(false);
      },
      (err) => {
        setGpsError(`Location capture optional: ${err.message}`);
        setIsCapturingGPS(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const newField: FieldRecord = {
        id: 'field-' + Date.now(),
        name: fieldName.trim(),
        crop,
        acreage: acreage ? parseFloat(acreage) : undefined,
        planting_date: plantingDate,
        location,
        created_at: new Date().toISOString()
      };

      await dbService.saveField(newField);
      setShowCreateModal(false);
      // Immediately auto-select newly created field and proceed
      onSelectField(newField);
    } catch (err) {
      console.warn('Failed to save field:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSelect = () => {
    if (selectedField) {
      onSelectField(selectedField);
    }
  };

  return (
    <div className="pb-32 pt-4 px-4 max-w-md mx-auto space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 active:scale-95 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900">{dict.fields_title}</h2>
          <span className="text-[10px] text-gray-500 font-medium">Select or Add Plot</span>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="p-2 rounded-xl bg-[#1E5631] text-white active:scale-95 transition-all flex items-center gap-1 text-xs font-semibold px-3 shadow-xs"
        >
          <Plus size={16} />
          <span>{dict.create_new_field}</span>
        </button>
      </div>

      {/* Helper instruction */}
      <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3 flex items-start gap-2 text-xs text-gray-700">
        <Sprout size={16} className="text-[#1E5631] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {currentLanguage === 'te'
            ? 'మీ తనిఖీని కొనసాగించడానికి క్రింది పొలాలలో ఒకదాన్ని ఎంచుకుని, ఆకుపచ్చని బటన్‌పై నొక్కండి.'
            : currentLanguage === 'hi'
            ? 'निरीक्षण जारी रखने के लिए नीचे दिए गए खेत को चुनें और हरे बटन को दबाएँ।'
            : 'Select an existing field below or tap Create New Field to continue inspection.'}
        </p>
      </div>

      {/* Field List */}
      <div className="space-y-3 pt-1">
        {fields.length === 0 ? (
          <div className="card p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#1E5631] mx-auto flex items-center justify-center">
              <MapPin size={24} />
            </div>
            <p className="text-sm text-gray-600 font-medium">{dict.no_fields_created}</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary text-xs mx-auto"
            >
              <Plus size={16} />
              <span>{dict.create_new_field}</span>
            </button>
          </div>
        ) : (
          fields.map((f) => {
            const isSelected = activeId === f.id;
            return (
              <div
                key={f.id}
                onClick={() => setActiveId(f.id)}
                className={`card p-4 cursor-pointer transition-all active:scale-[0.99] flex items-center justify-between border-2 ${
                  isSelected
                    ? 'border-[#1E5631] bg-emerald-50/50 shadow-sm ring-1 ring-[#1E5631]/20'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-gray-900">{f.name}</span>
                    {isSelected && (
                      <span className="text-[10px] uppercase font-bold bg-[#1E5631] text-white px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span className="capitalize font-semibold text-[#1E5631]">{f.crop}</span>
                    {f.acreage && <span>• {f.acreage} Acres</span>}
                    {f.planting_date && <span>• Planted: {f.planting_date}</span>}
                  </div>
                  {f.location && (
                    <div className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Navigation size={12} />
                      <span>{f.location.latitude}, {f.location.longitude}</span>
                    </div>
                  )}
                </div>

                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-[#1E5631] text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Check size={18} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Prominent Primary Green Action Bar */}
      {fields.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-gray-200 z-30">
          <div className="max-w-md mx-auto space-y-2">
            <button
              onClick={handleConfirmSelect}
              className="btn-primary w-full shadow-lg text-sm font-bold flex items-center justify-center gap-2"
            >
              <span>{dict.select_this_field}: {selectedField?.name}</span>
              <ArrowRight size={18} />
            </button>
            <div className="text-center">
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-xs text-gray-500 hover:text-gray-800 font-semibold"
              >
                + {dict.create_new_field}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Field Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-gray-900">{dict.create_new_field}</h3>

            <form onSubmit={handleCreateField} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {dict.field_name_label}
                </label>
                <input
                  type="text"
                  required
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  placeholder={dict.field_name_placeholder}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-[#1E5631] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {dict.crop_type_label}
                  </label>
                  <select
                    value={crop}
                    onChange={(e) => setCrop(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-[#1E5631] text-sm capitalize"
                  >
                    <option value="maize">Maize (మొక్కజొన్న / मक्का)</option>
                    <option value="banana">Banana (అరటి / केला)</option>
                    <option value="cotton">Cotton (ప్రత్తి / कपास)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {dict.acreage_label}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={acreage}
                    onChange={(e) => setAcreage(e.target.value)}
                    placeholder="2.0"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-[#1E5631] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Planting Date
                </label>
                <input
                  type="date"
                  value={plantingDate}
                  onChange={(e) => setPlantingDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-[#1E5631] text-sm"
                />
              </div>

              {/* GPS Capture */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleCaptureGPS}
                  disabled={isCapturingGPS}
                  className="w-full py-2.5 px-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 flex items-center justify-center gap-2 text-xs font-semibold text-gray-700 transition-colors"
                >
                  <Navigation size={14} className={isCapturingGPS ? 'animate-spin text-[#1E5631]' : ''} />
                  <span>
                    {location
                      ? `${dict.gps_captured}: ${location.latitude}, ${location.longitude}`
                      : dict.capture_gps_label}
                  </span>
                </button>
                {gpsError && <p className="text-[10px] text-amber-600 mt-1">{gpsError}</p>}
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1 text-xs"
                >
                  {dict.cancel_btn}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-1 text-xs"
                >
                  {isSubmitting ? 'Saving...' : dict.save_field_btn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
