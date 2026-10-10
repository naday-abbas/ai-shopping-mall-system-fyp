"""Hits the ACTUAL running API server over real HTTP (not TestClient).
Start the server first: cd api && uvicorn main:app --reload --port 8000
Then run: python -m pytest testing/api/test_live.py -v
"""
import numpy as np
import cv2
import requests
import pytest

BASE_URL = "http://127.0.0.1:8000"
AGE_LABELS = ["Kid", "Young", "Adult", "Senior"]


def _face_like_image_bytes() -> bytes:
    img = np.full((224, 224, 3), 200, dtype=np.uint8)
    cv2.circle(img, (112, 112), 90, (180, 150, 130), -1)
    cv2.circle(img, (80, 90), 10, (60, 60, 60), -1)
    cv2.circle(img, (144, 90), 10, (60, 60, 60), -1)
    cv2.ellipse(img, (112, 150), (30, 15), 0, 0, 180, (90, 60, 60), -1)
    ok, buf = cv2.imencode(".jpg", img)
    assert ok
    return buf.tobytes()


@pytest.fixture(scope="module", autouse=True)
def ensure_server_running():
    try:
        requests.get(f"{BASE_URL}/health", timeout=3)
    except requests.exceptions.ConnectionError:
        pytest.fail(
            "API server is not running. Start it first with:\n"
            "  cd api && uvicorn main:app --reload --port 8000"
        )


def test_health_live():
    res = requests.get(f"{BASE_URL}/health", timeout=5)
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_predict_live():
    image_bytes = _face_like_image_bytes()
    res = requests.post(
        f"{BASE_URL}/predict",
        files={"file": ("test.jpg", image_bytes, "image/jpeg")},
        timeout=30,
    )
    assert res.status_code == 200
    data = res.json()

    assert data["success"] is True
    assert data["gender"] in ["Male", "Female"]
    assert data["age_category"] in AGE_LABELS
    print(f"\nLive server response: gender={data['gender']}, age={data['age_category']}")
