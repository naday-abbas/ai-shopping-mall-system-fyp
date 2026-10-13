
import asyncio
import os
from contextlib import asynccontextmanager

import cv2
import numpy as np
import tensorflow as tf
from fastapi import FastAPI, File, UploadFile, HTTPException

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "model",
    "mall_smart_screen_FYP_FINAL.keras",
)

AGE_LABELS = ["Kid", "Young", "Adult", "Senior"]

model = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model

    # Load model weights and architecture without restoring
    # the training optimizer/loss compilation configuration.
    model = tf.keras.models.load_model(
        MODEL_PATH,
        compile=False,
    )

    yield

    model = None


app = FastAPI(
    title="Smart Mall AI Service",
    lifespan=lifespan,
)


def run_model_inference(batch):
    """Run direct eager inference instead of model.predict()."""
    outputs = model(batch, training=False)

    if not isinstance(outputs, (list, tuple)):
        outputs = [outputs]

    return [np.asarray(output) for output in outputs]


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "smart-mall-ai",
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is not an image.",
        )

    raw = await file.read()

    if not raw:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty.",
        )

    buf = np.frombuffer(raw, dtype=np.uint8)
    img = cv2.imdecode(buf, cv2.IMREAD_COLOR)

    if img is None:
        raise HTTPException(
            status_code=400,
            detail="Could not decode image. Ensure it is a valid image file.",
        )

    img = cv2.resize(img, (224, 224))
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = img.astype("float32") / 255.0
    img = np.expand_dims(img, axis=0)

    # Run inference in a thread so the async event loop remains responsive.
    loop = asyncio.get_running_loop()
    preds = await loop.run_in_executor(
        None,
        run_model_inference,
        img,
    )

    if len(preds) != 2:
        raise HTTPException(
            status_code=500,
            detail="The AI model did not return the expected age and gender outputs.",
        )

    age_preds, gender_preds = preds

    age_index = int(np.argmax(age_preds[0]))
    age_category = AGE_LABELS[age_index]
    age_confidence = float(np.max(age_preds[0]))

    gender_score = float(gender_preds[0][0])
    gender = "Female" if gender_score > 0.5 else "Male"
    gender_confidence = (
        gender_score if gender == "Female" else 1.0 - gender_score
    )

    return {
        "success": True,
        "age_category": age_category,
        "gender": gender,
        "age_confidence": round(age_confidence, 4),
        "gender_confidence": round(gender_confidence, 4),
    }
