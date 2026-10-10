# AgriRhythm — FieldReady
### Voice-Guided, Offline-First Crop Health Intelligence & Field Inspection Platform

AgriRhythm: FieldReady is a farmer-focused mobile crop health companion built for real field conditions. It connects the full **Voice-Guided Evidence-to-Action** workflow:
**Regional Onboarding → Image Capture → Quality Gate → Crop Verification → ML Health Assessment → Uncertainty & Differential Questions → Management Guidance → Multi-Plant Field Sampling → Chronological Monitoring.**

---

## 🚀 Quick Launch (Demonstration Tomorrow)

### 1. Prerequisites
* **Python 3.11+** with PyTorch, TorchVision, FastAPI, Uvicorn, Pillow, OpenCV
* **Node.js 20+** with npm

### 2. Start Backend Service (Terminal 1)
```bash
# In project root: /Users/sravs/Downloads/FieldReady
/Library/Frameworks/Python.framework/Versions/3.11/bin/python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8008
```
* Backend health check: `http://localhost:8008/api/health`
* Interactive API docs: `http://localhost:8008/docs`

### 3. Start Frontend Dev Server (Terminal 2)
```bash
# In project root: /Users/sravs/Downloads/FieldReady
npm run dev
```
* Local URL: `http://localhost:5174` (or `5173`)
* Phone LAN URL: `http://192.168.88.6:5174`

---

## 📱 Opening & Demonstrating on Your Mobile Phone

1. **Connect to Same Wi-Fi:** Ensure your phone and laptop are connected to the same Wi-Fi network.
2. **Find Laptop LAN IP:**  
   Your laptop's current local IP address is:
   ```bash
   ipconfig getifaddr en0
   # Result: 192.168.88.6
   ```
3. **Open on Phone Browser:**  
   Navigate to:
   ```
   http://192.168.88.6:5173
   ```
   *(All `/api` network requests from your phone are automatically proxied by Vite to the backend on port 8000).*

---

## 🧪 Running Automated Tests

Run both frontend and backend test suites in under 5 seconds:

```bash
# Run backend pytest suite (10 tests: Vision quality, PyTorch inference, crop safety, sync)
/Library/Frameworks/Python.framework/Versions/3.11/bin/python3 -m pytest tests/test_backend.py -v

# Run frontend test suite (5 tests: PWA manifest, service worker, demo assets, model registry)
node --test tests/test_frontend.test.js
```

---

## 🌾 Supported Crops & Model Status

| Crop | Status | Classes Supported | Model Engine |
| :--- | :---: | :--- | :--- |
| **Maize (Corn)** | **Supported** | Healthy, Common Rust, Northern Leaf Blight, Gray Leaf Spot | PyTorch MobileNetV2 (`models/maize_mobilenetv2.pth`) |
| **Banana** | **Limited Demo** | Sigatoka, Cordana, Healthy | Transparent Workflow Demonstration |
| **Cotton** | **Extension-Ready** | *Not certified for diagnosis* | Safely halts diagnosis with warning |

---

## 📶 Testing Offline Resilience

1. Open `http://192.168.88.6:5173` on your phone and browse the main screens to allow the Service Worker to cache the application shell.
2. Turn on **Airplane Mode** (or disconnect Wi-Fi) on your phone.
3. Reload the page on your phone browser.
4. **Result:** The application loads immediately offline.
5. Create and save an inspection observation. The record is persisted in browser **IndexedDB** (`FieldReadyDB`).
6. Tap **Offline & Sync Status** to see the pending record in the sync queue.
7. Reconnect Wi-Fi and tap **Sync to Server Now** to push queued records to SQLite.

---

## 🛠️ Troubleshooting & Live Demo Tips

* **Camera / Gallery:** Modern mobile browsers require user interaction for file access. On the Capture screen, both `<input type="file" capture="environment">` and standard photo gallery are available. In addition, **4 One-Click verified demo leaf buttons** are provided directly on screen for instant zero-friction demonstration.
* **Microphone Access:** If browser security blocks microphone input over HTTP, use the large visible buttons. The entire application is **100% operable via touch controls**.
* **Stopping Services:** Press `Ctrl + C` in Terminal 1 and Terminal 2 to gracefully terminate servers.

---

## 📂 Documentation Guide
* **Examiner Evaluation & ML Metrics:** [`docs/EXAMINER_EVALUATION.md`](file:///Users/sravs/Downloads/FieldReady/docs/EXAMINER_EVALUATION.md)
* **5-Minute Presentation Script:** [`docs/DEMO_CHECKLIST.md`](file:///Users/sravs/Downloads/FieldReady/docs/DEMO_CHECKLIST.md)
* **Limitations & Roadmap:** [`docs/LIMITATIONS_AND_NEXT_STEPS.md`](file:///Users/sravs/Downloads/FieldReady/docs/LIMITATIONS_AND_NEXT_STEPS.md)
