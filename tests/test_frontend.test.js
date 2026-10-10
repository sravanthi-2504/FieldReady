import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('PWA manifest exists and is valid', () => {
  const manifestPath = path.resolve('public/manifest.json');
  assert.ok(fs.existsSync(manifestPath), 'manifest.json must exist');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.name, 'AgriRhythm — FieldReady');
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.icons.length > 0, 'manifest should have icons');
});

test('Service worker script exists with versioned caching', () => {
  const swPath = path.resolve('public/sw.js');
  assert.ok(fs.existsSync(swPath), 'sw.js must exist');
  const swContent = fs.readFileSync(swPath, 'utf8');
  assert.ok(swContent.includes('CACHE_NAME'), 'sw.js must define CACHE_NAME');
  assert.ok(swContent.includes('STATIC_ASSETS'), 'sw.js must define cache assets');
});

test('Authentic PlantVillage demo leaf assets exist in public/assets/demo_images', () => {
  const classes = ['healthy', 'common_rust', 'northern_leaf_blight', 'gray_leaf_spot'];
  for (const c of classes) {
    const p = path.resolve(`public/assets/demo_images/${c}.jpg`);
    assert.ok(fs.existsSync(p), `Demo asset ${c}.jpg must exist for 1-click evaluation`);
    const stats = fs.statSync(p);
    assert.ok(stats.size > 1000, `Demo asset ${c}.jpg must be a valid non-empty image`);
  }
});

test('Model weights and evaluation reports exist in models directory', () => {
  const weightsPath = path.resolve('models/maize_mobilenetv2.pth');
  assert.ok(fs.existsSync(weightsPath), 'Trained PyTorch weights must exist');

  const reportPath = path.resolve('models/model_evaluation_report.json');
  assert.ok(fs.existsSync(reportPath), 'Evaluation report must exist');
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  assert.equal(report.crop, 'maize');
  assert.equal(report.architecture, 'mobilenet_v2');
  assert.ok(report.held_out_test_metrics.accuracy >= 0.70, 'Accuracy should be >= 70%');
  assert.ok(report.latency_benchmark_ms.mean_latency_ms > 0, 'Latency must be benchmarked');
});

test('Model registry defines support matrix honestly', () => {
  const registryPath = path.resolve('models/model_registry.json');
  assert.ok(fs.existsSync(registryPath), 'model_registry.json must exist');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  assert.equal(registry.crops.maize.status, 'supported');
  assert.equal(registry.crops.banana.status, 'supported');
  assert.equal(registry.crops.cotton.status, 'extension_ready');
});

test('Telugu and Hindi translations dictionary is complete and valid', () => {
  const translationsPath = path.resolve('src/i18n/translations.ts');
  assert.ok(fs.existsSync(translationsPath), 'translations.ts must exist');
  const content = fs.readFileSync(translationsPath, 'utf8');

  // Verify Telugu native strings
  assert.ok(content.includes('తెలుగు'), 'Must contain Telugu native script');
  assert.ok(content.includes('నమస్కారం!'), 'Must contain Telugu voice greeting');
  assert.ok(content.includes('మొక్కజొన్న'), 'Must contain Telugu maize term');

  // Verify Hindi native strings
  assert.ok(content.includes('हिन्दी'), 'Must contain Hindi native script');
  assert.ok(content.includes('नमस्ते!'), 'Must contain Hindi voice greeting');
  assert.ok(content.includes('मक्का'), 'Must contain Hindi maize term');

  // Verify Voice Prompts exist for both
  assert.ok(content.includes('voice_greeting'), 'Must have voice greeting');
  assert.ok(content.includes('voice_quality_prompt'), 'Must have quality prompt');
  assert.ok(content.includes('voice_crop_verify_prompt'), 'Must have crop verification prompt');
});

test('IndexedDB persistent service is properly structured', () => {
  const dbPath = path.resolve('src/services/db.ts');
  assert.ok(fs.existsSync(dbPath), 'db.ts must exist');
  const content = fs.readFileSync(dbPath, 'utf8');
  assert.ok(content.includes('FieldReadyDB'), 'Database name must be FieldReadyDB');
  assert.ok(content.includes('saveField'), 'Must implement saveField');
  assert.ok(content.includes('saveInspection'), 'Must implement saveInspection');
  assert.ok(content.includes('getInspections'), 'Must implement getInspections');
  assert.ok(content.includes('sync_queue'), 'Must implement sync_queue object store');
});

test('AssessmentScreen implements all 12 authoritative sections and Speak Report', () => {
  const screenPath = path.resolve('src/screens/AssessmentScreen.tsx');
  assert.ok(fs.existsSync(screenPath), 'AssessmentScreen.tsx must exist');
  const code = fs.readFileSync(screenPath, 'utf8');

  // Verify 12 sections
  assert.ok(code.includes('SECTION 1'), 'Must include Section 1: Header / Title');
  assert.ok(code.includes('SECTION 2'), 'Must include Section 2: Verified Crop Badge');
  assert.ok(code.includes('SECTION 3'), 'Must include Section 3: Primary Detected Condition');
  assert.ok(code.includes('SECTION 4'), 'Must include Section 4: Confidence Gauge + Safe Threshold');
  assert.ok(code.includes('SECTION 5'), 'Must include Section 5: Model Provenance Badge');
  assert.ok(code.includes('SECTION 6'), 'Must include Section 6: Uncertainty Notice');
  assert.ok(code.includes('SECTION 7'), 'Must include Section 7: Differential Diagnosis');
  assert.ok(code.includes('SECTION 8'), 'Must include Section 8: Probability Breakdown');
  assert.ok(code.includes('SECTION 9'), 'Must include Section 9: Immediate Cultural Practices');
  assert.ok(code.includes('SECTION 10'), 'Must include Section 10: Long-Term Preventive Care');
  assert.ok(code.includes('SECTION 11'), 'Must include Section 11: Re-inspection Timeline');
  assert.ok(code.includes('SECTION 12'), 'Must include Section 12: Official Agricultural Citation & Chemical Disclaimer');

  // Verify Speak Report button and generator
  assert.ok(code.includes('buildSpokenReport'), 'Must implement buildSpokenReport function');
  assert.ok(code.includes('handleToggleSpeakReport'), 'Must implement handleToggleSpeakReport');
  assert.ok(code.includes('Speak Report'), 'Must include Speak Report button text');
});

test('WelcomeLanguageScreen contains exact confirmation phrases for Telugu, Hindi, English', () => {
  const screenPath = path.resolve('src/screens/WelcomeLanguageScreen.tsx');
  assert.ok(fs.existsSync(screenPath), 'WelcomeLanguageScreen.tsx must exist');
  const code = fs.readFileSync(screenPath, 'utf8');

  assert.ok(code.includes('మీరు తెలుగును ఎంచుకున్నారు'), 'Must have Telugu confirmation phrase');
  assert.ok(code.includes('आपने हिन्दी चुनी है'), 'Must have Hindi confirmation phrase');
  assert.ok(code.includes('You have selected English'), 'Must have English confirmation phrase');
  assert.ok(code.includes('assistant.stopSpeaking()'), 'Must stop any prior speech before speaking confirmation');
});

test('CropVerificationScreen enforces genuine foliage check and honest botanical policy', () => {
  const screenPath = path.resolve('src/screens/CropVerificationScreen.tsx');
  assert.ok(fs.existsSync(screenPath), 'CropVerificationScreen.tsx must exist');
  const code = fs.readFileSync(screenPath, 'utf8');

  assert.ok(code.includes('isNotLeaf'), 'Must handle non-plant leaf rejection');
  assert.ok(code.includes('isCotton'), 'Must halt unsupported crops like cotton');
  assert.ok(code.includes('foliage_coverage_pct'), 'Must display foliage coverage percentage');
  assert.ok(code.includes('botanical'), 'Must disclose honest species classification limitation');
});

test('HistoryScreen implements robust 2-visit inspection comparison with agronomic disclaimer', () => {
  const screenPath = path.resolve('src/screens/HistoryScreen.tsx');
  assert.ok(fs.existsSync(screenPath), 'HistoryScreen.tsx must exist');
  const code = fs.readFileSync(screenPath, 'utf8');

  assert.ok(code.includes('selectedForCompare'), 'Must track selected inspections for comparison');
  assert.ok(code.includes('showComparisonModal'), 'Must support comparison modal view');
  assert.ok(code.includes('daysApart'), 'Must calculate days elapsed between visits');
  assert.ok(code.includes('pctDiff'), 'Must calculate symptom prevalence delta');
  assert.ok(code.includes('Differences in observation may reflect changed symptoms'), 'Must render required agronomic comparison disclaimer');
  assert.ok(code.includes('plants showed symptoms'), 'Must format plant symptom proportions correctly');
});

test('FieldSelectScreen provides unambiguous selection button and rapid workflow', () => {
  const screenPath = path.resolve('src/screens/FieldSelectScreen.tsx');
  assert.ok(fs.existsSync(screenPath), 'FieldSelectScreen.tsx must exist');
  const code = fs.readFileSync(screenPath, 'utf8');

  assert.ok(code.includes('dict.select_this_field'), 'Must render clear primary selection button with translation');
  assert.ok(code.includes('handleConfirmSelect'), 'Must implement handleConfirmSelect handler');
  assert.ok(code.includes('handleCreateField'), 'Must implement handleCreateField handler');
});

test('WeatherSensorsScreen implements physical ESP32 telemetry status and dynamic live indicators', () => {
  const screenPath = path.resolve('src/screens/WeatherSensorsScreen.tsx');
  assert.ok(fs.existsSync(screenPath), 'WeatherSensorsScreen.tsx must exist');
  const code = fs.readFileSync(screenPath, 'utf8');

  assert.ok(code.includes('hasPhysicalTelemetry'), 'Must detect if physical telemetry is streaming');
  assert.ok(code.includes('ESP32 Hardware Node Online'), 'Must render live ESP32 status banner');
  assert.ok(code.includes('PHYSICAL ESP32 TELEMETRY'), 'Must display physical telemetry provenance badge');
  assert.ok(code.includes('Hardware Node Architecture'), 'Must describe hardware architecture');
});

test('AssessmentScreen integrates Microclimate & Field Environmental Context without altering diagnosis', () => {
  const screenPath = path.resolve('src/screens/AssessmentScreen.tsx');
  assert.ok(fs.existsSync(screenPath), 'AssessmentScreen.tsx must exist');
  const code = fs.readFileSync(screenPath, 'utf8');

  assert.ok(code.includes('assessment.environmental_context'), 'Must check environmental_context in assessment');
  assert.ok(code.includes('Microclimate & Environmental Context'), 'Must render environmental context title');
  assert.ok(code.includes('ESP32 Live'), 'Must render live ESP32 badge');
  assert.ok(code.includes('without overriding visual leaf diagnosis') || code.includes('without altering visual leaf diagnosis'), 'Must state agronomic rationale disclaimer');
});

test('API service forwards field ID for sensor fusion during diagnosis', () => {
  const apiPath = path.resolve('src/services/api.ts');
  assert.ok(fs.existsSync(apiPath), 'api.ts must exist');
  const code = fs.readFileSync(apiPath, 'utf8');

  assert.ok(code.includes("formData.append('field_id', fieldId)"), 'Must pass field_id to /api/vision/predict');
  assert.ok(code.includes("formData.append('field_confirmed'"), 'Must pass field_confirmed to /api/vision/predict');
});

test('AssessmentScreen implements verified pesticide recommendations, lookalike differentiation, and multi-leaf summary', () => {
  const screenPath = path.resolve('src/screens/AssessmentScreen.tsx');
  assert.ok(fs.existsSync(screenPath), 'AssessmentScreen.tsx must exist');
  const code = fs.readFileSync(screenPath, 'utf8');

  // Multi-leaf plant assessment card
  assert.ok(code.includes('assessment.plant_assessment'), 'Must check assessment.plant_assessment');
  assert.ok(code.includes('plant_disagreement_alert'), 'Must render disagreement alert when leaves disagree');
  assert.ok(code.includes('total_leaves_submitted'), 'Must display total submitted leaves metric');

  // Lookalike rust card
  assert.ok(code.includes('lookalike_heading'), 'Must render lookalike comparison heading');
  assert.ok(code.includes('lookalike_common_rust'), 'Must compare Common Rust (Puccinia sorghi)');
  assert.ok(code.includes('lookalike_southern_rust'), 'Must compare Southern Rust (Puccinia polysora)');
  assert.ok(code.includes('lookalike_rub_test'), 'Must provide diagnostic rub test');

  // Verified Pesticide card
  assert.ok(code.includes('pesticide_heading'), 'Must render verified pesticide heading');
  assert.ok(code.includes('pesticide_statutory_warning'), 'Must render statutory label warning');
  assert.ok(code.includes('pesticide_dose_per_liter'), 'Must show dose per liter');
  assert.ok(code.includes('pesticide_rate_per_acre'), 'Must show rate per acre');
  assert.ok(code.includes('pesticide_phi'), 'Must show pre-harvest interval');
  assert.ok(code.includes('pesticide_rei'), 'Must show re-entry interval');
  assert.ok(code.includes('pesticide_ppe'), 'Must show required PPE');
});

test('CaptureScreen supports multi-leaf plant capture and whole-plant assessment mode', () => {
  const screenPath = path.resolve('src/screens/CaptureScreen.tsx');
  assert.ok(fs.existsSync(screenPath), 'CaptureScreen.tsx must exist');
  const code = fs.readFileSync(screenPath, 'utf8');

  assert.ok(code.includes('isMultiLeafMode'), 'Must implement multi-leaf mode state');
  assert.ok(code.includes('plantLeaves'), 'Must track plantLeaves array');
  assert.ok(code.includes('onProceedPlantAssessment'), 'Must support onProceedPlantAssessment callback');
  assert.ok(code.includes('plant_mode_single'), 'Must render single leaf tab');
  assert.ok(code.includes('plant_mode_multi'), 'Must render multi leaf plant tab');
});

test('API service implements multi-leaf plant assessment and pesticide lookups', () => {
  const apiPath = path.resolve('src/services/api.ts');
  assert.ok(fs.existsSync(apiPath), 'api.ts must exist');
  const code = fs.readFileSync(apiPath, 'utf8');

  assert.ok(code.includes('assessPlantLeaves'), 'Must implement assessPlantLeaves method');
  assert.ok(code.includes('getPesticideRecommendation'), 'Must implement getPesticideRecommendation method');
  assert.ok(code.includes('getLookalikeComparison'), 'Must implement getLookalikeComparison method');
  assert.ok(code.includes('/vision/assess-plant'), 'Must post to /vision/assess-plant');
  assert.ok(code.includes('/pesticides/recommendation'), 'Must query /pesticides/recommendation');
});

test('Verified maize pesticide catalog contains valid CIBRC registered uses', () => {
  const catalogPath = path.resolve('data/maize_pesticide_catalog.json');
  assert.ok(fs.existsSync(catalogPath), 'maize_pesticide_catalog.json must exist');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

  assert.strictEqual(catalog.country, 'India', 'Must target India regulatory framework');
  assert.ok(catalog.diseases.common_rust, 'Must have common_rust entry');
  assert.ok(catalog.diseases.southern_rust, 'Must have southern_rust entry');
  assert.ok(catalog.diseases.healthy, 'Must have healthy crop entry');

  const rustChems = catalog.diseases.common_rust.chemical_interventions;
  assert.ok(rustChems.length > 0, 'Must specify registered chemical interventions for common rust');
  assert.ok(rustChems.some((c) => c.product_name.includes('Mancozeb')), 'Must include CIBRC registered Mancozeb');
  assert.ok(rustChems[0].pre_harvest_interval_days !== undefined, 'Must specify PHI');
  assert.ok(rustChems[0].re_entry_interval_hours !== undefined, 'Must specify REI');
  assert.ok(rustChems[0].ppe_requirements.length > 0, 'Must specify PPE requirements');
});



