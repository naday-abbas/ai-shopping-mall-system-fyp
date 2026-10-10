import asyncio
import os
import numpy as np
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, HTTPException
import cv2
import tensorflow as tf

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "model", "mall_smart_screen_FYP_FINAL.keras")
AGE_LABELS = ["Kid", "Young", "Adult", "Senior"]

model = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    model = tf.keras.models.load_model(MODEL_PATH)
    yield
    model = None


app = FastAPI(title="Smart Mall AI Service", lifespan=lifespan)


@app.get("/health")
def health():
    return {"status": "ok", "service": "smart-mall-ai"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file is not an image.")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    buf = np.frombuffer(raw, dtype=np.uint8)
    img = cv2.imdecode(buf, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Could not decode image. Ensure it is a valid image file.")

    img = cv2.resize(img, (224, 224))
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = img.astype("float32") / 255.0
    img = np.expand_dims(img, axis=0)

    # Run blocking Keras inference in a thread-pool so the async event loop
    # is never frozen — without this, every subsequent request (including
    # /health) hangs until the prediction finishes.
    loop = asyncio.get_event_loop()
    preds = await loop.run_in_executor(None, model.predict, img)
    age_preds, gender_preds = preds

    age_index = int(np.argmax(age_preds[0]))
    age_category = AGE_LABELS[age_index]
    age_confidence = float(np.max(age_preds[0]))

    gender_score = float(gender_preds[0][0])
    gender = "Female" if gender_score > 0.5 else "Male"
    gender_confidence = gender_score if gender == "Female" else 1.0 - gender_score

    return {
        "success": True,
        "age_category": age_category,
        "gender": gender,
        "age_confidence": round(age_confidence, 4),
        "gender_confidence": round(gender_confidence, 4),
    }
