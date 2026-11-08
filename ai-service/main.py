import os
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import torch
from transformers import pipeline

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

# Use a pre-trained HuggingFace model (downloaded automatically on first run).
# Override via MODEL_NAME env var if desired.
MODEL_NAME = os.getenv(
    "MODEL_NAME",
    "bhadresh-savani/distilbert-base-uncased-emotion",
)

app = FastAPI(
    title="Diary AI Emotion Analyzer",
    version="2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global classifier — loaded once at startup
CLASSIFIER = None


def load_model():
    global CLASSIFIER
    print(f"Loading emotion model '{MODEL_NAME}' from HuggingFace Hub...")
    device = 0 if torch.cuda.is_available() else -1  # -1 = CPU
    CLASSIFIER = pipeline(
        "text-classification",
        model=MODEL_NAME,
        device=device,
        truncation=True,
        max_length=128,
    )
    print("Emotion model loaded successfully.")


try:
    load_model()
except Exception as e:
    print(f"Model loading failed: {e}")


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class DiaryRequest(BaseModel):
    diary_content: str
    completed_tasks: List[str]
    pending_tasks: List[str]


class DiaryResponse(BaseModel):
    emotion: str
    sentiment: str
    stress_level: str
    productivity_score: int
    recommendation: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# Emotion → sentiment mapping for the 6-label dair-ai/emotion model:
#   sadness, joy, love, anger, fear, surprise
POSITIVE_EMOTIONS = {"joy", "love", "surprise"}
NEGATIVE_EMOTIONS = {"sadness", "anger", "fear"}

# Emotions that map to a HIGH stress level
HIGH_STRESS_EMOTIONS = {"anger", "fear"}
MED_STRESS_EMOTIONS = {"sadness"}


def derive_stress_level(emotion: str) -> str:
    if emotion in HIGH_STRESS_EMOTIONS:
        return "High"
    if emotion in MED_STRESS_EMOTIONS:
        return "Medium"
    return "Low"


def predict_emotion(text: str) -> str:
    if CLASSIFIER is None:
        raise RuntimeError(
            "AI model is not loaded. Check server logs for the loading error."
        )
    # Use a placeholder if the diary is empty so the model still returns a result
    result = CLASSIFIER(text or "I had a normal day.")
    return result[0]["label"].lower()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.post("/analyze", response_model=DiaryResponse)
def analyze_diary(data: DiaryRequest):
    emotion = predict_emotion(data.diary_content)

    completed = len(data.completed_tasks)
    pending = len(data.pending_tasks)
    total = completed + pending
    productivity = int((completed / total) * 100) if total > 0 else 50

    if emotion in POSITIVE_EMOTIONS:
        sentiment = "Positive"
        recommendation = (
            "Great progress today! Keep maintaining your consistency "
            "and continue your positive habits."
        )
    elif emotion in NEGATIVE_EMOTIONS:
        sentiment = "Negative"
        recommendation = (
            "Difficult days are part of growth. Take small steps tomorrow "
            "and believe in your improvement."
        )
    else:
        sentiment = "Neutral"
        recommendation = (
            "Keep reflecting on your day. Small consistent actions create "
            "big achievements."
        )

    stress_level = derive_stress_level(emotion)

    return {
        "emotion": emotion.capitalize(),
        "sentiment": sentiment,
        "stress_level": stress_level,
        "productivity_score": productivity,
        "recommendation": recommendation,
    }


@app.get("/")
def home():
    return {
        "message": "Diary AI API is running",
        "model_loaded": CLASSIFIER is not None,
        "model_name": MODEL_NAME,
    }
