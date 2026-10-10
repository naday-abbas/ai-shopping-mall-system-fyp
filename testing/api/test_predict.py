import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "api"))

import io
import numpy as np
import cv2
from fastapi.testclient import TestClient

from main import app, AGE_LABELS


def _face_like_image_bytes() -> bytes:
    """Build a synthetic face-shaped image so /predict has something to run
    real inference on, without needing an external photo file."""
    img = np.full((224, 224, 3), 200, dtype=np.uint8)
    cv2.circle(img, (112, 112), 90, (180, 150, 130), -1)  # face
    cv2.circle(img, (80, 90), 10, (60, 60, 60), -1)       # left eye
    cv2.circle(img, (144, 90), 10, (60, 60, 60), -1)      # right eye
    cv2.ellipse(img, (112, 150), (30, 15), 0, 0, 180, (90, 60, 60), -1)  # mouth
    ok, buf = cv2.imencode(".jpg", img)
    assert ok
    return buf.tobytes()


def test_health():
    with TestClient(app) as client:
        res = client.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"


def test_predict_returns_gender_and_age():
    with TestClient(app) as client:
        image_bytes = _face_like_image_bytes()
        res = client.post(
            "/predict",
            files={"file": ("test.jpg", image_bytes, "image/jpeg")},
        )

        assert res.status_code == 200
        data = res.json()

        assert data["success"] is True
        assert data["gender"] in ["Male", "Female"]
        assert data["age_category"] in AGE_LABELS
        assert 0.0 <= data["gender_confidence"] <= 1.0
        assert 0.0 <= data["age_confidence"] <= 1.0


def test_predict_rejects_non_image():
    with TestClient(app) as client:
        res = client.post(
            "/predict",
            files={"file": ("test.txt", b"not an image", "text/plain")},
        )
        assert res.status_code == 400


def test_predict_rejects_empty_file():
    with TestClient(app) as client:
        res = client.post(
            "/predict",
            files={"file": ("empty.jpg", b"", "image/jpeg")},
        )
        assert res.status_code == 400
