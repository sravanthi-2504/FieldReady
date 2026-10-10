import React, { useState } from 'react';

/**
 * Shows the leaf photo with the suspected affected area marked, with a toggle back to the original.
 *
 * Use it on the report screen, replacing the small thumbnail:
 *   <AffectedAreaView originalSrc={previewUrl} highlight={result.highlight} lang={lang} />
 *
 * `result.highlight` comes from the backend (decision_pipeline.py):
 *   { image_data_url, lesion_percent, yellow_percent, legend: {title, red, amber, note}, basis }
 * It is null when the leaf looks clean, so the original is shown with a short message.
 *
 * The marks come from colour analysis, not from the disease classifier. The note says so.
 */
export type Lang = 'en' | 'te' | 'hi';
type L3 = Record<Lang, string>;

export interface Highlight {
  image_data_url: string;
  lesion_percent: number;
  yellow_percent: number;
  legend: { title: L3; red: L3; amber: L3; note: L3 };
}

const TXT = {
  original: { en: 'Original', te: 'అసలు ఫోటో', hi: 'मूल फोटो' } as L3,
  marked: { en: 'Affected area', te: 'ప్రభావిత భాగం', hi: 'प्रभावित हिस्सा' } as L3,
  none: {
    en: 'No clearly damaged area was found in this photo.',
    te: 'ఈ ఫోటోలో స్పష్టంగా దెబ్బతిన్న భాగం కనిపించలేదు.',
    hi: 'इस फोटो में कोई साफ़ प्रभावित हिस्सा नहीं मिला।',
  } as L3,
  share: { en: 'of the visible leaf marked', te: 'కనిపించే ఆకులో గుర్తించినది', hi: 'दिखने वाली पत्ती में चिह्नित' } as L3,
};

interface Props {
  originalSrc: string;
  highlight?: Highlight | null;
  lang: Lang;
}

export default function AffectedAreaView({ originalSrc, highlight, lang }: Props) {
  const [showMarked, setShowMarked] = useState(true);

  if (!highlight) {
    return (
      <div style={{ marginBottom: 12 }}>
        <img src={originalSrc} alt="" style={{ width: '100%', borderRadius: 12, display: 'block' }} />
        <p style={{ fontSize: 13, color: '#4a5a4a', marginTop: 6 }}>{TXT.none[lang]}</p>
      </div>
    );
  }

  const tab = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer', fontWeight: 600,
    background: active ? '#2d5a3d' : '#e9efe9', color: active ? '#fff' : '#2d5a3d',
  });
  const dot = (c: string): React.CSSProperties => ({
    display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: c, marginRight: 6, verticalAlign: 'middle',
  });

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
        <button style={tab(showMarked)} onClick={() => setShowMarked(true)}>{TXT.marked[lang]}</button>
        <button style={tab(!showMarked)} onClick={() => setShowMarked(false)}>{TXT.original[lang]}</button>
      </div>

      <img
        src={showMarked ? highlight.image_data_url : originalSrc}
        alt={showMarked ? highlight.legend.title[lang] : ''}
        style={{ width: '100%', borderRadius: 12, display: 'block' }}
      />

      {showMarked && (
        <div style={{ fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>
          <div style={{ fontWeight: 700 }}>
            {highlight.legend.title[lang]} · {highlight.lesion_percent}% {TXT.share[lang]}
          </div>
          <div><span style={dot('#eb1e1e')} />{highlight.legend.red[lang]}</div>
          <div><span style={dot('#ffbe00')} />{highlight.legend.amber[lang]}</div>
          <div style={{ color: '#6b4e00', marginTop: 4 }}>{highlight.legend.note[lang]}</div>
        </div>
      )}
    </div>
  );
}
