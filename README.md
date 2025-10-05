# AI-Based Healthcare Diagnostics System

A comprehensive platform for disease detection and health condition prediction using machine learning on medical imaging and patient data.

## Features

- **Disease Detection**: ML models to analyze X-rays, MRIs, and other medical images
- **Health Prediction**: Analyze patient data to predict potential health conditions
- **User Management**: 
  - **Admin Portal**: Manage users, view analytics, train models
  - **User Portal**: Upload images, view results, manage health records
- **Authentication**: Secure role-based access control
- **MongoDB Integration**: Scalable storage for user data and medical records

## Technology Stack

- **Frontend**: Next.js (React)
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **ML Framework**: TensorFlow.js
- **Authentication**: JWT-based auth

## Project Structure

```
ai-healthcare/
├── client/                # Next.js frontend
│   ├── public/            # Static assets
│   └── src/               # React components and pages
│       ├── components/    # Reusable UI components
│       ├── pages/         # Route-based pages
│       ├── contexts/      # Context providers
│       └── utils/         # Helper functions
├── server/                # Node.js backend
│   ├── controllers/       # Request handlers
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── utils/             # Helper functions
│   └── ml-models/         # Machine learning models
└── config/                # Configuration files
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install client dependencies
   cd client
   npm install

   # Install server dependencies
   cd ../server
   npm install
   ```
3. Configure environment variables (see .env.example)
4. Run the development servers:
   ```bash
   # Start client
   cd client
   npm run dev

   # Start server
   cd ../server
   npm run dev
   ```

## ML Models

The system includes pre-trained models for common diagnostics:
- Chest X-ray analysis (pneumonia, tuberculosis)
- Brain MRI analysis
- Skin lesion detection

Custom models can be trained through the admin interface using uploaded datasets.
