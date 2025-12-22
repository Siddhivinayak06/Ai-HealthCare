from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import time
from src.config import DATA_DIR, DEVICE
from src.core.state import MODELS
from src.api import diagnostics, risk, training, nlp

app = FastAPI(
    title="MedAI Diagnostics API",
    description="AI-powered medical imaging analysis with Continuous Learning",
    version="3.0.0"
)

# Serve generated heatmaps and uploads
app.mount("/outputs", StaticFiles(directory=DATA_DIR), name="outputs")

# Include Modular Routers
app.include_router(diagnostics.router)
app.include_router(risk.router)
app.include_router(training.router)
app.include_router(nlp.router)

@app.api_route("/", methods=["GET", "HEAD"])
def read_root():
    return {
        "status": "Active",
        "version": "3.0.0",
        "loaded_models_in_memory": list(MODELS.keys()),
        "device": str(DEVICE)
    }

@app.api_route("/health", methods=["GET", "HEAD"])
def health_check():
    return {"status": "healthy", "timestamp": time.time(), "device": str(DEVICE)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
