import React, { useState } from 'react';
import { ArrowLeft, Calendar, MapPin, ArrowUpDown, Sprout, ChevronRight, CheckCircle2, AlertTriangle, X, Info } from 'lucide-react';
import { InspectionRecord, FieldRecord, SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';

interface Props {
  currentLanguage: SupportedLanguage;
  inspections: InspectionRecord[];
  fields: FieldRecord[];
  onRevisitField: (fieldId: string) => void;
  onBack: () => void;
}

export const HistoryScreen: React.FC<Props> = ({
  currentLanguage,
  inspections,
  fields,
  onRevisitField,
  onBack
}) => {
  const dict = translations[currentLanguage];
  const [selectedFieldFilter, setSelectedFieldFilter] = useState<string>('all');
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState<boolean>(false);

  const filteredInspections = selectedFieldFilter === 'all'
    ? inspections
    : inspections.filter(i => i.field_id === selectedFieldFilter);

  const getFieldName = (fieldId: string) => {
    const f = fields.find(item => item.id === fieldId);
    return f ? f.name : 'Field Plot';
  };

  const handleToggleSelectCompare = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter(item => item !== id));
    } else {
      if (selectedForCompare.length < 2) {
        const next = [...selectedForCompare, id];
        setSelectedForCompare(next);
        if (next.length === 2) {
          setShowComparisonModal(true);
        }
      } else {
        // Replace second one
        setSelectedForCompare([selectedForCompare[0], id]);
        setShowComparisonModal(true);
      }
    }
  };

  const handleQuickCompareWithPrevious = (currentInsp: InspectionRecord) => {
    // Find prior inspection from same field, or any other inspection if single
    const sameFieldInspections = inspections
      .filter(i => i.field_id === currentInsp.field_id && i.id !== currentInsp.id)
      .sort((a, b) => new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime());

    const partner = sameFieldInspections.length > 0
      ? sameFieldInspections[0]
      : inspections.find(i => i.id !== currentInsp.id);

    if (partner) {
      setSelectedForCompare([partner.id, currentInsp.id]);
      setShowComparisonModal(true);
    }
  };

  // Resolve compared inspection objects in chronological order (earlier first)
  let earlierVisit: InspectionRecord | null = null;
  let laterVisit: InspectionRecord | null = null;

  if (selectedForCompare.length === 2) {
    const itemA = inspections.find(i => i.id === selectedForCompare[0]);
    const itemB = inspections.find(i => i.id === selectedForCompare[1]);
    if (itemA && itemB) {
      const timeA = new Date(itemA.visited_at).getTime();
      const timeB = new Date(itemB.visited_at).getTime();
      if (timeA <= timeB) {
        earlierVisit = itemA;
        laterVisit = itemB;
      } else {
        earlierVisit = itemB;
        laterVisit = itemA;
      }
    }
  }

  // Calculate comparative metrics
  let daysApart = 0;
  let earlierPct = 0;
  let laterPct = 0;
  let pctDiff = 0;

  if (earlierVisit && laterVisit) {
    const tEarly = new Date(earlierVisit.visited_at).getTime();
    const tLate = new Date(laterVisit.visited_at).getTime();
    daysApart = Math.max(0, Math.round((tLate - tEarly) / (1000 * 3600 * 24)));

    earlierPct = earlierVisit.sample_count > 0
      ? (earlierVisit.symptomatic_count / earlierVisit.sample_count) * 100
      : 0;
    laterPct = laterVisit.sample_count > 0
      ? (laterVisit.symptomatic_count / laterVisit.sample_count) * 100
      : 0;
    pctDiff = laterPct - earlierPct;
  }

  const comparisonDisclaimer = {
    en: "Differences in observation may reflect changed symptoms, image framing, or model uncertainty, and do not prove recovery or progression on two photographs alone.",
    te: "పరిశీలనలలోని తేడాలు మారుతున్న వ్యాధి లక్షణాలు, కెమెరా కోణం లేదా మోడల్ అనిశ్చితిని ప్రతిబింబిస్తాయి. కేవలం రెండు ఫోటోల ఆధారంగా మాత్రమే వ్యాధి నయమైనట్లు లేదా తీవ్రమైనట్లు నిర్ధారించలేము.",
    hi: "निरीक्षणों में अंतर बदलते लक्षणों, फोटो के कोण या मॉडल की अनिश्चितता को दर्शा सकते हैं। केवल दो तस्वीरों के आधार पर रोग में सुधार या वृद्धि साबित नहीं होती है।"
  }[currentLanguage];

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
        <h2 className="text-lg font-bold text-gray-900">{dict.history_title}</h2>
        <div className="w-9" />
      </div>

      {/* Field Filter Chips */}
      {fields.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setSelectedFieldFilter('all')}
            className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition-colors ${
              selectedFieldFilter === 'all'
                ? 'bg-[#1E5631] text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-700'
            }`}
          >
            {dict.filter_all} ({inspections.length})
          </button>
          {fields.map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFieldFilter(f.id)}
              className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition-colors ${
                selectedFieldFilter === f.id
                  ? 'bg-[#1E5631] text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-700'
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
      )}

      {/* Compare Bar if items selected */}
      {selectedForCompare.length > 0 && !showComparisonModal && (
        <div className="bg-emerald-50 border border-[#1E5631]/40 rounded-2xl p-3 flex items-center justify-between shadow-sm">
          <div className="text-xs">
            <span className="font-bold text-[#1E5631]">{selectedForCompare.length} of 2</span> visits selected for comparison
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedForCompare([])}
              className="text-xs text-gray-500 font-semibold px-2 py-1"
            >
              Clear
            </button>
            {selectedForCompare.length === 2 && (
              <button
                onClick={() => setShowComparisonModal(true)}
                className="bg-[#1E5631] text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm"
              >
                Compare Now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Two-Visit Comparison Modal */}
      {showComparisonModal && earlierVisit && laterVisit && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b pb-3 border-gray-100">
              <div>
                <h3 className="text-base font-black text-gray-900 flex items-center gap-1.5">
                  <ArrowUpDown size={18} className="text-[#1E5631]" />
                  <span>{dict.compare_visits_title}</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {getFieldName(earlierVisit.field_id)} • {daysApart} days elapsed between visits
                </p>
              </div>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:text-gray-900"
              >
                <X size={18} />
              </button>
            </div>

            {/* Side-by-side or stacked visit cards */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Visit 1 (Earlier) */}
              <div className="bg-gray-50 rounded-2xl p-3 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between border-b pb-1.5 border-gray-200">
                  <span className="font-extrabold text-gray-600 uppercase text-[10px] tracking-wide">Visit 1 (Baseline)</span>
                  <span className="text-[11px] font-semibold text-gray-500">
                    {new Date(earlierVisit.visited_at).toLocaleDateString()}
                  </span>
                </div>
                {earlierVisit.image_data_url && (
                  <img
                    src={earlierVisit.image_data_url}
                    alt="Visit 1 Leaf"
                    className="w-full h-24 object-cover rounded-xl border border-gray-200"
                  />
                )}
                <div>
                  <div className="text-[11px] text-gray-500">Condition:</div>
                  <div className="font-bold text-gray-900 text-xs truncate">
                    {earlierVisit.predicted_condition
                      ? earlierVisit.predicted_condition.replace(/_/g, ' ').toUpperCase()
                      : 'Healthy / Routine'}
                  </div>
                  {earlierVisit.confidence && (
                    <div className="text-[10px] text-gray-500">
                      Conf: {(earlierVisit.confidence * 100).toFixed(1)}%
                    </div>
                  )}
                </div>
                <div className="bg-white p-2 rounded-xl border border-gray-100">
                  <div className="text-[10px] text-gray-500 font-medium">Symptom Sample:</div>
                  <div className="font-extrabold text-[#1E5631] text-[11px] leading-tight">
                    {earlierVisit.symptomatic_count} of {earlierVisit.sample_count} plants showed symptoms ({earlierPct.toFixed(1)}%)
                  </div>
                </div>
              </div>

              {/* Visit 2 (Later) */}
              <div className="bg-emerald-50/70 rounded-2xl p-3 border border-[#1E5631]/30 space-y-2">
                <div className="flex items-center justify-between border-b pb-1.5 border-[#1E5631]/20">
                  <span className="font-extrabold text-[#1E5631] uppercase text-[10px] tracking-wide">Visit 2 (Follow-up)</span>
                  <span className="text-[11px] font-semibold text-gray-600">
                    {new Date(laterVisit.visited_at).toLocaleDateString()}
                  </span>
                </div>
                {laterVisit.image_data_url && (
                  <img
                    src={laterVisit.image_data_url}
                    alt="Visit 2 Leaf"
                    className="w-full h-24 object-cover rounded-xl border border-gray-200"
                  />
                )}
                <div>
                  <div className="text-[11px] text-gray-500">Condition:</div>
                  <div className="font-bold text-gray-900 text-xs truncate">
                    {laterVisit.predicted_condition
                      ? laterVisit.predicted_condition.replace(/_/g, ' ').toUpperCase()
                      : 'Healthy / Routine'}
                  </div>
                  {laterVisit.confidence && (
                    <div className="text-[10px] text-gray-500">
                      Conf: {(laterVisit.confidence * 100).toFixed(1)}%
                    </div>
                  )}
                </div>
                <div className="bg-white p-2 rounded-xl border border-gray-100">
                  <div className="text-[10px] text-gray-500 font-medium">Symptom Sample:</div>
                  <div className="font-extrabold text-[#1E5631] text-[11px] leading-tight">
                    {laterVisit.symptomatic_count} of {laterVisit.sample_count} plants showed symptoms ({laterPct.toFixed(1)}%)
                  </div>
                </div>
              </div>
            </div>

            {/* Trajectory Analysis Card */}
            <div className="bg-white rounded-2xl p-3 border border-gray-200 space-y-2">
              <div className="text-xs font-bold text-gray-800 flex items-center justify-between">
                <span>Field Symptom Progression Delta:</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                  pctDiff > 0
                    ? 'bg-amber-100 text-amber-800'
                    : pctDiff < 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {pctDiff > 0 ? `+${pctDiff.toFixed(1)}% increase` : pctDiff < 0 ? `${pctDiff.toFixed(1)}% decrease` : 'No percentage change'}
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                {pctDiff > 0
                  ? `Symptom prevalence increased across sampled plants between visits (${earlierPct.toFixed(1)}% → ${laterPct.toFixed(1)}%). Re-evaluate sanitation and protective practices.`
                  : pctDiff < 0
                  ? `Symptom prevalence decreased in the sampled quadrant (${earlierPct.toFixed(1)}% → ${laterPct.toFixed(1)}%). Continue monitoring field margins.`
                  : `Symptom incidence remained steady at ${laterPct.toFixed(1)}% across both visits.`}
              </p>
            </div>

            {/* Mandatory Agronomic Disclaimer */}
            <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
              <Info size={16} className="text-amber-700 shrink-0 mt-0.5" />
              <p className="leading-snug">
                {comparisonDisclaimer}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setShowComparisonModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 active:scale-95 transition-all"
              >
                Close Comparison
              </button>
              <button
                onClick={() => {
                  setShowComparisonModal(false);
                  if (laterVisit) onRevisitField(laterVisit.field_id);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#1E5631] text-white text-xs font-bold shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>{dict.revisit_field_btn}</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List of Inspections */}
      <div className="space-y-3">
        {filteredInspections.length === 0 ? (
          <div className="card p-8 text-center space-y-2">
            <p className="text-xs text-gray-500">{dict.no_history_records}</p>
          </div>
        ) : (
          filteredInspections.map((insp) => {
            const isSelected = selectedForCompare.includes(insp.id);
            const sympPct = insp.sample_count > 0
              ? ((insp.symptomatic_count / insp.sample_count) * 100).toFixed(1)
              : '0';

            return (
              <div
                key={insp.id}
                className={`card p-4 space-y-3 border transition-all ${
                  isSelected
                    ? 'border-[#1E5631] bg-emerald-50/20 shadow-md ring-1 ring-[#1E5631]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {insp.image_data_url ? (
                      <img
                        src={insp.image_data_url}
                        alt="Thumbnail"
                        className="w-14 h-14 rounded-xl object-cover border border-gray-200 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                        <Sprout size={22} />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-extrabold text-gray-900">
                        {insp.predicted_condition
                          ? insp.predicted_condition.replace(/_/g, ' ').toUpperCase()
                          : 'Routine Inspection'}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <MapPin size={12} className="text-[#1E5631]" />
                        <span>{getFieldName(insp.field_id)}</span>
                        <span>•</span>
                        <Calendar size={12} />
                        <span>{new Date(insp.visited_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      {insp.sync_status === 'synced' ? 'Synced' : 'Local'}
                    </span>
                    {/* Compare select toggle button */}
                    <button
                      onClick={() => handleToggleSelectCompare(insp.id)}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-[#1E5631] text-white border-[#1E5631]'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {isSelected ? '✓ Selected' : '+ Compare'}
                    </button>
                  </div>
                </div>

                {/* Sample Evidence Metric: Explicitly Formatted */}
                <div className="bg-gray-50 rounded-xl p-2.5 text-xs text-gray-700 flex items-center justify-between">
                  <span>Sample Prevalence:</span>
                  <span className="font-extrabold text-[#1E5631]">
                    {insp.symptomatic_count} of {insp.sample_count} plants ({sympPct}%)
                  </span>
                </div>

                {insp.notes && (
                  <p className="text-xs text-gray-600 bg-white p-2 rounded-lg border border-gray-100 italic">
                    &ldquo;{insp.notes}&rdquo;
                  </p>
                )}

                {/* Actions: Revisit / Quick Compare */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                  <button
                    onClick={() => onRevisitField(insp.field_id)}
                    className="text-xs font-bold text-[#1E5631] hover:underline flex items-center gap-1"
                  >
                    <span>{dict.revisit_field_btn}</span>
                    <ChevronRight size={14} />
                  </button>

                  {filteredInspections.length > 1 && (
                    <button
                      onClick={() => handleQuickCompareWithPrevious(insp)}
                      className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1 font-semibold active:scale-95"
                    >
                      <ArrowUpDown size={13} className="text-[#1E5631]" />
                      <span>Compare with prior visit</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
