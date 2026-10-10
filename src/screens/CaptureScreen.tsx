import React, { useRef, useState, useEffect } from 'react';
import { Camera, Image as ImageIcon, ArrowLeft, RefreshCw, Sparkles, Layers, Plus, X } from 'lucide-react';
import { SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';

export interface LeafItem {
  blob: Blob | File;
  url: string;
}

interface Props {
  currentLanguage: SupportedLanguage;
  crop: string;
  imageBlob?: Blob | File;
  previewUrl?: string;
  onImageSelected: (blob: Blob | File, previewUrl: string) => void;
  onBack: () => void;
  onProceed: () => void;
  onProceedPlantAssessment?: (leaves: LeafItem[]) => void;
}

export const CaptureScreen: React.FC<Props> = ({
  currentLanguage,
  crop,
  imageBlob,
  previewUrl,
  onImageSelected,
  onBack,
  onProceed,
  onProceedPlantAssessment
}) => {
  const dict = translations[currentLanguage];
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [loadingDemo, setLoadingDemo] = useState<string | null>(null);
  const [isMultiLeafMode, setIsMultiLeafMode] = useState<boolean>(false);
  const [plantLeaves, setPlantLeaves] = useState<LeafItem[]>(() => {
    return imageBlob && previewUrl ? [{ blob: imageBlob, url: previewUrl }] : [];
  });

  useEffect(() => {
    if (imageBlob && previewUrl && plantLeaves.length === 0) {
      setPlantLeaves([{ blob: imageBlob, url: previewUrl }]);
    }
  }, [imageBlob, previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (isMultiLeafMode) {
        const nextLeaves = [...plantLeaves, { blob: file, url }];
        setPlantLeaves(nextLeaves);
        onImageSelected(file, url);
      } else {
        setPlantLeaves([{ blob: file, url }]);
        onImageSelected(file, url);
      }
    }
  };

  const handleSelectDemoImage = async (demoKey: string) => {
    setLoadingDemo(demoKey);
    try {
      const imgPath = `/assets/demo_images/${demoKey}.jpg`;
      const resp = await fetch(imgPath);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      if (isMultiLeafMode) {
        const nextLeaves = [...plantLeaves, { blob, url }];
        setPlantLeaves(nextLeaves);
        onImageSelected(blob, url);
      } else {
        setPlantLeaves([{ blob, url }]);
        onImageSelected(blob, url);
      }
    } catch (err) {
      console.warn('Failed to load demo image:', err);
    } finally {
      setLoadingDemo(null);
    }
  };

  const handleRemoveLeaf = (index: number) => {
    const next = plantLeaves.filter((_, i) => i !== index);
    setPlantLeaves(next);
    if (next.length > 0) {
      onImageSelected(next[next.length - 1].blob, next[next.length - 1].url);
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

      {/* Mode Selector Tabs: Single Leaf vs Whole Plant */}
      <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-xl text-xs font-bold text-center">
        <button
          type="button"
          onClick={() => setIsMultiLeafMode(false)}
          className={`py-2 rounded-lg transition-all ${
            !isMultiLeafMode
              ? 'bg-white shadow-xs text-[#1E5631] font-extrabold'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {dict.plant_mode_single}
        </button>
        <button
          type="button"
          onClick={() => setIsMultiLeafMode(true)}
          className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            isMultiLeafMode
              ? 'bg-white shadow-xs text-[#1E5631] font-extrabold'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Layers size={14} />
          <span>{dict.plant_mode_multi}</span>
        </button>
      </div>

      {isMultiLeafMode && (
        <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <Layers size={14} className="text-emerald-700" />
            <span>{dict.plant_assessment_title}</span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            {currentLanguage === 'te'
              ? 'ఈ మొక్క నుండి 2 నుండి 5 ఆకులను తీయండి (పై ఆకులు, మధ్య ఆకులు, అడుగు ఆకులు). మోడల్ ప్రతి ఆకును విశ్లేషించి మొత్తం మొక్క ఆరోగ్య ఏకాభిప్రాయాన్ని నిర్ధారిస్తుంది.'
              : currentLanguage === 'hi'
              ? 'इस पौधे से 2 से 5 पत्तियां लें (ऊपरी, मध्य व निचली)। मॉडल प्रत्येक पत्ती की जांच कर पूरे पौधे का समग्र निदान करेगा।'
              : 'Capture 2 to 5 leaves from different levels of the same plant (upper canopy, middle, lower). The model checks each leaf and computes plant consensus.'}
          </p>
        </div>
      )}

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
            {isMultiLeafMode && (
              <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                {dict.plant_leaf_num} {plantLeaves.length}
              </div>
            )}
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

        {/* Multi-leaf Thumbnails Strip */}
        {isMultiLeafMode && plantLeaves.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-bold text-gray-600 flex justify-between">
              <span>{dict.plant_total_leaves} {plantLeaves.length} / 5</span>
              <span className="text-gray-400 font-normal">Tap × to remove</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {plantLeaves.map((item, idx) => (
                <div
                  key={idx}
                  className="relative shrink-0 w-18 h-18 rounded-xl overflow-hidden border border-gray-300 bg-black shadow-2xs group cursor-pointer"
                  onClick={() => onImageSelected(item.blob, item.url)}
                >
                  <img src={item.url} alt={`Leaf ${idx + 1}`} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 bg-black/75 text-white text-[9px] px-1 rounded font-bold">
                    #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveLeaf(idx);
                    }}
                    className="absolute top-1 right-1 w-4 h-4 bg-red-600/90 text-white rounded-full flex items-center justify-center text-[10px] font-bold"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {plantLeaves.length < 5 && (
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="shrink-0 w-18 h-18 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50 text-[#1E5631] flex flex-col items-center justify-center text-[10px] font-bold gap-0.5 active:scale-95 transition-all"
                >
                  <Plus size={16} />
                  <span>+ {dict.plant_leaf_num}</span>
                </button>
              )}
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
      {isMultiLeafMode && plantLeaves.length >= 2 ? (
        <div className="pt-2 animate-in fade-in">
          <button
            onClick={() => onProceedPlantAssessment?.(plantLeaves)}
            className="btn-primary w-full shadow-md text-sm py-3"
          >
            <Layers size={18} />
            <span>{dict.plant_assess_btn} ({plantLeaves.length} {dict.plant_leaf_num}s)</span>
          </button>
        </div>
      ) : previewUrl ? (
        <div className="pt-2 animate-in fade-in">
          <button
            onClick={onProceed}
            className="btn-primary w-full shadow-md text-sm py-3"
          >
            <span>{dict.proceed_to_diagnosis}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
};
