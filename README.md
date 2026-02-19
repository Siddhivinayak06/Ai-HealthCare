# AI-HealthCare: The Future of Intelligent Clinical Diagnostics

![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)
![Status: Production-Ready](https://img.shields.io/badge/Status-Production--Ready-success)
![UI: True Glass](https://img.shields.io/badge/UI-True_Glass_System-violet)
![ML: PyTorch](https://img.shields.io/badge/ML-PyTorch_%7C_FastAPI-orange)

**Ai-HealthCare** is a high-performance, medical-grade diagnostic platform that bridges the gap between sophisticated Machine Learning and clinical practice. Built with a focus on **medical minimalism** and **computational excellence**, it provides healthcare professionals with a seamless, Apple-health-inspired interface for imaging analysis and predictive patient monitoring.

## 🌟 The "True Glass" Experience

Our latest iteration introduces a **"True Glass" Design System** centered on **Clinical Calm & Precision**:

-   **Medical Instrument Aesthetics**: UI elements mimic high-end medical equipment with viewfinder brackets, technical grid overlays, and monospace data typography.
-   **Vibrant Depth**: Gone are the flat, washed-out interfaces. We use deep glassmorphism ("True Glass"), cool tints, and rich gradients to create a sense of depth and modernity.
-   **Micro-Animations**: Subtle "scan sweeps", "ripples", and "pulses" provide immediate feedback on system status (inference latency, GPU load) without overwhelming the user.
-   **Focus on Logic**: Content is king. The layout uses an "Open Header" philosophy to reduce visual noise and keep the focus on the diagnostic verdict.

## 🚀 Key Features

### 🧠 Clinical Intelligence
-   **Multi-Modal Diagnostics**: Real-time analysis of **X-Rays, CT Scans, and MRIs**.
-   **Explainable AI (XAI)**:
    -   **Grad-CAM Heatmaps**: Visualize exactly where the model is "looking".
    -   **Confidence Scoring**: Precise probability metrics for every prediction.
-   **Risk Stratification**: Automated categorization into **Low, Moderate, and Critical** risk bands.
-   **Patient Context**: Historical trend analysis and longitudinal data tracking.

### 🛡️ Technical Excellence
-   **Real-Time Telemetry**: Live monitoring of inference latency and system health (GPU/CPU load).
-   **Privacy-First Architecture**:
    -   **Data Sanitization**: Strict `.gitignore` policies ensure NO patient data images are ever pushed to the repository.
    -   **Local Processing**: Models can run entirely on-premise (local GPU/CPU) for HIPAA compliance.
-   **Robust Tech Stack**: 100% TypeScript type-safety from database to UI.

## 🛠 Tech Stack

### Frontend & Core
-   **Next.js 16**: App Router, Server Components, and Server Actions.
-   **Tailwind CSS**: Custom "Medical Minimalism" utility classes.
-   **Lucide React**: High-fidelity clinical iconography.
-   **Sonner**: Premium toast notifications.

### ML Ecosystem (MedAI)
-   **FastAPI**: High-performance asynchronous Python backend.
-   **PyTorch**: Deep learning framework for training and inference.
-   **TorchVision**: Image transformations and model architectures (DenseNet-121).
-   **SciKit-Learn & XGBoost**: Auxiliary risk modeling.

## 🏗 System Architecture

The system operates as a **Tri-Service Ecosystem**:
1.  **Clinical Dashboard (Next.js)**: The practitioner's interface. Hydrates real-time health cards and manages the user session.
2.  **Logic Engine (Server Actions/DB)**: Handles business logic, authentication, and secure database transactions (PostgreSQL/Supabase).
3.  **Inference Node (FastAPI)**: A dedicated Python microservice that performs the heavy lifting of image analysis and risk prediction.

## 🚦 Getting Started

### Prerequisites
-   **Node.js**: v18+
-   **Python**: v3.9+
-   **Git LFS**: Required if you plan to version control large models (optional).

### Rapid Deployment

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/Siddhivinayak06/Ai-HealthCare
    cd Ai-HealthCare
    ```

2.  **Frontend Setup**:
    ```bash
    cd frontend
    cp .env.local.example .env.local  # Configure your env vars
    npm install
    npm run dev
    ```

3.  **ML Backend Setup**:
    ```bash
    cd ml-modal
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    python main.py
    ```

### ⚠️ Important: ML Models
Due to GitHub file size limits, the trained model weights (`*.pth` files, ~100MB+ each) are **NOT included** in this repository.
-   **Option A**: Train your own models using the provided `train.py`.
-   **Option B**: Download pre-trained weights from our external storage (link to be added).

## 📈 Human-in-the-Loop Learning
Our diagnostic pipeline follows a strict validation cycle:
1.  **Predict**: AI provides the initial clinical impression.
2.  **Validate**: Licensed healthcare professionals approve or override findings.
3.  **Improve**: Overridden cases are logged for future model fine-tuning.

## 📄 License
Licensed under the ISC License. © 2026 MedAI Labs.
