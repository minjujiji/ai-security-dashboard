from fastapi.testclient import TestClient

import main
from main import AIAnalysis

client = TestClient(main.app)

PAYLOAD = {
    "summary": {"total_events": 10, "failed_logins": 6},
    "top_attacking_ips": [{"ip_address": "203.0.113.9", "failed_attempts": 6}],
    "recent_alerts": [],
    "risk_score": 60,
    "rule_based_severity": "High",
}


def test_health():
    assert client.get("/health").json()["status"] == "ok"


def test_analyze_returns_structured_result(monkeypatch):
    fake = AIAnalysis(
        severity="High",
        main_finding="Brute force from one IP.",
        summary="Repeated failures.",
        suspicious_ips=["203.0.113.9"],
        recommended_actions=["Block the IP"],
    )
    monkeypatch.setattr(main, "call_gemini", lambda prompt: fake)
    body = client.post("/analyze", json=PAYLOAD).json()
    assert body["severity"] == "High"
    assert body["provider"] == "gemini"
    assert body["suspicious_ips"] == ["203.0.113.9"]


def test_analyze_failure_is_502(monkeypatch):
    def boom(prompt):
        raise RuntimeError("no key")

    monkeypatch.setattr(main, "call_gemini", boom)
    assert client.post("/analyze", json=PAYLOAD).status_code == 502


def test_rejects_invalid_severity():
    bad = {**PAYLOAD, "rule_based_severity": "Banana"}
    assert client.post("/analyze", json=bad).status_code == 422
