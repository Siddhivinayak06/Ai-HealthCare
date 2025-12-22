# Ai-HealthCare: Intelligent Diagnostics & Health Monitoring

Ai-HealthCare is a comprehensive, AI-powered healthcare diagnostics system designed to assist medical professionals and patients with advanced imaging analysis and proactive health monitoring. By integrating state-of-the-art Machine Learning with a modern web dashboard, it streamlines the diagnostic workflow and provides actionable health insights.

## 🚀 Key Features

- **AI-Powered Medical Imaging**: Real-time analysis of **X-rays, CT Scans, and MRIs** to detect underlying conditions.
- **Automated Modality Detection**: Intelligent system that automatically corrects and identifies the type of scan uploaded.
- **Continuous Learning Loop**: Integrated feedback mechanism where medical experts can validate AI results, which are then used to retrain and improve the models.
- **Patient Risk Assessment**: Non-invasive risk modeling based on vital signs (BP, Glucose, BMI) to predict potential health issues.
- **Interactive Provider Dashboard**: A sleek, high-performance interface for doctors to manage patients, review scans, and track diagnostic accuracy.
- **AI-Driven Health Assistant**: Real-time chat interface for patients and providers to query health data and insights.

## 🛠 Tech Stack

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (React 19)
- **Styling**: Vanilla CSS with [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/), Lucide Icons
- **Visualizations**: [Recharts](https://recharts.org/) for health analytics

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (via [Neon](https://neon.tech/))
- **Authentication**: JWT (JSON Web Tokens) with Secure Cookie storage
- **Communication**: Nodemailer for automated health notifications

### ML Service (MedAI)
- **API Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Core ML**: [PyTorch](https://pytorch.org/), Scikit-Learn
- **Image Processing**: PIL (Pillow), Torchvision
- **Async Tasks**: Background retraining and data preparation scripts

## 🏗 System Architecture

The application comprises three specialized services working in harmony:

1.  **Frontend (Next.js)**: Handles the user interface, patient management, and visualization of AI results.
2.  **Backend (Express)**: Manages business logic, user authentication, and coordinates requests between the database and the ML service.
3.  **ML Service (FastAPI)**: A high-performance Python service that performs intensive image processing and risk assessment.

## 🚦 Getting Started

### Prerequisites

- Node.js (v18+)
- Python (v3.9+)
- PostgreSQL Database (Local or Neon)

### Installation & Startup

1.  **Clone the Repository**:
    ```bash
    git clone <repository-url>
    cd Ai-HealthCare
    ```

2.  **Configure Environment Variables**:
    Create `.env` files in `backend/` and `frontend/` (refer to `.env.example` in respective directories for required keys).

3.  **Run Services**:
    The easiest way to start the system is using the provided shell script:
    ```bash
    ./start_services.sh
    ```
    *This will initialize the ML Service (port 8000), Backend (port 5000), and you can then start the Frontend separately: `cd frontend && npm run dev`.*

## 📈 ML Continuous Learning

Our system features a "Human-in-the-loop" approach:
1. **Predict**: AI provides a preliminary diagnosis.
2. **Review**: Medical experts provide feedback via the `/feedback` endpoint.
3. **Enhance**: Data is automatically moved to training sets, and the `/retrain` endpoint can be triggered to update models with new information.

## 📄 License

This project is licensed under the ISC License.
