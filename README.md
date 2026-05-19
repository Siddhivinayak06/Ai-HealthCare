<div align="center">
  <h1>🏥 AI-HealthCare</h1>
  <p><strong>The Future of Intelligent Clinical Diagnostics</strong></p>
  
  [![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
  [![Status: Production-Ready](https://img.shields.io/badge/Status-Production--Ready-success)](#)
  [![UI: True Glass](https://img.shields.io/badge/UI-True_Glass_System-magenta)](#)
  [![ML: PyTorch](https://img.shields.io/badge/ML-PyTorch_%7C_FastAPI-orange)](#)
</div>

<br/>

**Ai-HealthCare** is a high-performance, medical-grade diagnostic platform that bridges the gap between sophisticated Machine Learning and clinical practice. Built with a focus on **medical minimalism** and **computational excellence**, it provides healthcare professionals with a seamless, Apple-health-inspired interface for imaging analysis, predictive patient monitoring, and risk assessment.

---

## ✨ The "True Glass" Experience

Our latest iteration introduces a **"True Glass" Design System** centered on **Clinical Calm & Precision**:

- **Medical Instrument Aesthetics**: UI elements mimic high-end medical equipment with viewfinder brackets, technical grid overlays, and concise data typography.
- **Vibrant Depth**: We use deep glassmorphism ("True Glass"), cool tints, and rich gradients to create a sense of depth and modernity, avoiding flat, washed-out interfaces.
- **Micro-Animations**: Subtle UI elements provide immediate feedback on system status (inference latency, GPU load) without overwhelming the user.
- **Focus on Logic**: Content is king. The layout uses an "Open Header" philosophy to reduce visual noise and keep focus on the diagnostic verdict.

## 🚀 Key Features

### 🧠 Clinical Intelligence
- **Multi-Modal Diagnostics**: Real-time analysis of **X-Rays, CT Scans, and MRIs**.
- **Explainable AI (XAI)**:
  - **Grad-CAM Heatmaps**: Visualize visually exactly where the model is "looking".
  - **Confidence Scoring**: Precise probability metrics for every diagnostic prediction.
- **Risk Stratification**: Automated categorization of cases into **Low, Moderate, and Critical** risk bands using ensemble models.
- **Patient Context**: Historical trend analysis and robust longitudinal data tracking.

### 🛡️ Technical Excellence
- **Real-Time Telemetry**: Live monitoring of inference latency and system health (GPU/CPU load).
- **Privacy-First Architecture**: Strictly respects `.gitignore` policies to ensure NO patient data or images are ever pushed to the repository.
- **Local Processing Capability**: ML models can run entirely on-premise (local GPU/CPU) to ease HIPAA compliance.
- **Robust Tech Stack**: 100% TypeScript type-safety from database to UI, coupled with an asynchronous Python ML microservice.

---

## 💻 Tech Stack

### Frontend & Core
- **Framework**: Next.js 16 (App Router, Server Components/Actions), React 19
- **Database UI / ORM**: Drizzle ORM coupled with @neondatabase/serverless (Neon Serverless Postgres)
- **Styling**: Tailwind CSS v4, custom "Medical Minimalism" utility classes
- **UI Components**: Radix UI primitives, Lucide React (clinical iconography), Sonner (premium toast notifications)
- **Authentication**: JWT, bcrypt, nodemailer

### ML Ecosystem (MedAI)
- **Framework**: FastAPI (High-performance asynchronous Python backend)
- **Deep Learning**: PyTorch & TorchVision (Image transformations and pre-trained architectures like DenseNet-121)
- **Risk Modeling**: SciKit-Learn & XGBoost (Auxiliary risk modeling and tabula data predictions)
- **Data Engineering**: Pandas, Numpy, Transformers, OpenCV

---

## 🏗 System Architecture

The system operates as a robust **Tri-Service Ecosystem**:

1. **Clinical Dashboard (Next.js Frontend)**: The practitioner's interface. Hydrates real-time health cards and manages the user session, UI rendering, and user flow.
2. **Logic Engine (Server Actions & Postgres)**: Handles business logic, secure authentication, and database transactions stored securely on Neon Database.
3. **Inference Node (FastAPI `ml-modal`)**: A dedicated Python microservice that performs the heavy lifting of image analysis, tensor transformations, and risk prediction.

---

## 📂 Project Structure

```text
Ai-HealthCare/
├── frontend/                 # Next.js 16 Web Application
│   ├── app/                  # App Router: Pages, Layouts, Server Actions
│   ├── components/           # Reusable precise UI components (True Glass)
│   ├── public/               # Static assets & iconography
│   └── package.json          # Frontend dependencies
├── ml-modal/                 # Python FastAPI Microservice
│   ├── src/                  # PyTorch models, endpoints, core ML logic
│   ├── train.py              # Model training automation
│   ├── main.py               # FastAPI entry point
│   └── requirements.txt      # Python MLS dependencies
├── start_services.sh         # Helper script to launch services concurrently
├── README.md                 # Project Documentation
└── .gitignore                # Privacy-first git ignore rules
```

---

## 🚦 Getting Started

### Prerequisites
- **Node.js**: v18+ 
- **Python**: v3.9+ 
- **Git LFS**: Required if you plan to version control large model weights (`.pth` files).

### 1. Clone the Repository
```bash
git clone https://github.com/Siddhivinayak06/Ai-HealthCare.git
cd Ai-HealthCare
```

### 2. Frontend Setup
```bash
cd frontend
# Create and configure your environment variables
cp .env.local.example .env.local  
npm install
npm run dev
```

### 3. ML Backend Setup (`ml-modal`)
Open a new terminal session:
```bash
cd ml-modal
python -m venv venv
source venv/bin/activate      # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

> **Optional**: Use the helper script `start_services.sh` from the root directory to spin up all services concurrently (make sure the directories align with the script).

---

## ⚠️ Important: ML Models

Due to GitHub file size limits, the trained model weights (`*.pth` files, typically ~100MB+ each) are **NOT included** in this repository. 

To solve this, we host our pre-trained model weights via **GitHub Releases**. 

### Quick Download
To easily download the latest model weights, run the included fetching script:
```bash
cd ml-modal
python download_weights.py
```
*Note: This script will query the GitHub API for the latest release and automatically download any attached `.pth` files into the `ml-modal/weights/` folder.*

### Manual Training
If you prefer to train your own diagnostic models from scratch using your dataset:
```bash
cd ml-modal
python train.py
```

---

## 📈 Human-in-the-Loop Learning

Our diagnostic pipeline follows a strict, medically guided validation cycle:
1. **Predict**: AI provides the initial clinical impression and scores.
2. **Validate**: Licensed healthcare professionals approve or override the AI's findings.
3. **Improve**: Overridden cases are securely logged for future model fine-tuning and recalibration.

---

## 📜 License

Licensed under the **ISC License**. 
© 2026 MedAI Labs. All rights reserved. Built for the future of healthcare.
