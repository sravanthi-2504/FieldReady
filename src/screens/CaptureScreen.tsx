import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, ArrowLeft, RefreshCw, Check, Sparkles, Upload } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';

interface Props {
  currentLanguage: SupportedLanguage;
  crop: string;
  imageBlob?: Blob | File;
  previewUrl?: string;
  onImageSelected: (blob: Blob | File, previewUrl: string) => void;
  onBack: () => void;
  onProceed: () => void;
}

export const CaptureScreen: React.FC<Props> = ({
  currentLanguage,
  crop,
  imageBlob,
  previewUrl,
  onImageSelected,
  onBack,
  onProceed
}) => {
  const dict = translations[currentLanguage];
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onImageSelected(file, url);
    }
  };

  const handleSelectDemoImage = async (demoKey: string) => {
    setLoadingDemo(demoKey);
    try {
      const imgPath = `/assets/demo_images/${demoKey}.jpg`;
      const resp = await fetch(imgPath);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      onImageSelected(blob, url);
    } catch (err) {
      console.warn('Failed to load demo image:', err);
    } finally {
      setLoadingDemo(null);
    }
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-4">
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 active:scale-95 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900">{dict.capture_title}</h2>
          <span className="text-[11px] font-semibold text-[#1E5631] uppercase tracking-wider capitalize">
            Crop: {crop}
          </span>
        </div>
        <div className="w-9" />
      </div>

      {/* Image Preview or Capture Placeholder */}
      <div className="card p-4 space-y-3">
        {previewUrl ? (
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-black aspect-4/3 flex items-center justify-center">
            <img
              src={previewUrl}
              alt="Leaf capture preview"
              className="w-full h-full object-contain"
            />
            <div className="absolute top-2 right-2 flex gap-1.5">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-xs transition-colors"
                title="Retake"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 aspect-4/3 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#1E5631] flex items-center justify-center">
              <Camera size={28} />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-gray-700">
                {dict.leaf_capture_hint}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                Hold phone steady in natural daylight
              </p>
            </div>
          </div>
        )}

        {/* Capture Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="btn-primary text-xs py-3"
          >
            <Camera size={18} />
            <span>{dict.camera_btn}</span>
          </button>
          <button
            onClick={() => galleryInputRef.current?.click()}
            className="btn-secondary text-xs py-3"
          >
            <ImageIcon size={18} />
            <span>{dict.gallery_btn}</span>
          </button>
        </div>
      </div>

      {/* One-Click Examiner & Farmer Test Assets */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
          <Sparkles size={14} className="text-[#1E5631]" />
          <span>{dict.or_try_demo}</span>
        </div>

        {crop === 'banana' ? (
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleSelectDemoImage('banana_healthy')}
              disabled={loadingDemo !== null}
              className="card p-2 text-left hover:border-emerald-300 transition-all active:scale-[0.98] flex flex-col gap-1"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                🍌
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-gray-900 truncate">Healthy</div>
                <div className="text-[9px] text-gray-500">Normal</div>
              </div>
            </button>

            <button
              onClick={() => handleSelectDemoImage('banana_black_sigatoka')}
              disabled={loadingDemo !== null}
              className="card p-2 text-left hover:border-amber-300 transition-all active:scale-[0.98] flex flex-col gap-1"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                🍂
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-gray-900 truncate">Sigatoka</div>
                <div className="text-[9px] text-gray-500">P. fijiensis</div>
              </div>
            </button>

            <button
              onClick={() => handleSelectDemoImage('banana_bacterial_wilt')}
              disabled={loadingDemo !== null}
              className="card p-2 text-left hover:border-red-300 transition-all active:scale-[0.98] flex flex-col gap-1"
            >
              <div className="w-7 h-7 rounded-lg bg-red-100 text-red-800 flex items-center justify-center font-bold text-xs">
                🥀
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-gray-900 truncate">Bact. Wilt</div>
                <div className="text-[9px] text-gray-500">Xanthomonas</div>
              </div>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSelectDemoImage('healthy')}
              disabled={loadingDemo !== null}
              className="card p-2.5 text-left hover:border-emerald-300 transition-all active:scale-[0.98] flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-xs">
                🌿
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-gray-900 truncate">{dict.demo_healthy}</div>
                <div className="text-[10px] text-gray-500">Normal Leaf</div>
              </div>
            </button>

            <button
              onClick={() => handleSelectDemoImage('common_rust')}
              disabled={loadingDemo !== null}
              className="card p-2.5 text-left hover:border-amber-300 transition-all active:scale-[0.98] flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold text-xs">
                🍂
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-gray-900 truncate">{dict.demo_rust}</div>
                <div className="text-[10px] text-gray-500">Puccinia sorghi</div>
              </div>
            </button>

            <button
              onClick={() => handleSelectDemoImage('northern_leaf_blight')}
              disabled={loadingDemo !== null}
              className="card p-2.5 text-left hover:border-gray-400 transition-all active:scale-[0.98] flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-800 flex items-center justify-center shrink-0 font-bold text-xs">
                🌾
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-gray-900 truncate">{dict.demo_blight}</div>
                <div className="text-[10px] text-gray-500">E. turcicum</div>
              </div>
            </button>

            <button
              onClick={() => handleSelectDemoImage('gray_leaf_spot')}
              disabled={loadingDemo !== null}
              className="card p-2.5 text-left hover:border-gray-400 transition-all active:scale-[0.98] flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-200 text-gray-800 flex items-center justify-center shrink-0 font-bold text-xs">
                🌫️
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-gray-900 truncate">{dict.demo_spot}</div>
                <div className="text-[10px] text-gray-500">C. zeae-maydis</div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Proceed CTA */}
      {previewUrl && (
        <div className="pt-2 animate-in fade-in">
          <button
            onClick={onProceed}
            className="btn-primary w-full shadow-md text-sm"
          >
            <span>{dict.proceed_to_diagnosis}</span>
          </button>
        </div>
      )}
    </div>
  );
};
