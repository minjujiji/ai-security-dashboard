"""AI analysis microservice for the AI Security Dashboard.

Receives aggregated security data from the Express API, asks Gemini for a
structured threat assessment, and returns validated JSON. The Express API
combines the AI severity with its own rule-based severity.
"""

import json
import os
from typing import Literal

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

load_dotenv()

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

Severity = Literal["Low", "Medium", "High", "Critical"]

app = FastAPI(title="AI Security Analysis Service", version="1.0.0")


class AnalyzeRequest(BaseModel):
    summary: dict = Field(default_factory=dict, description="Aggregate counts")
    top_attacking_ips: list[dict] = Field(default_factory=list)
    recent_alerts: list[dict] = Field(default_factory=list)
    risk_score: int = Field(0, ge=0, le=100)
    rule_based_severity: Severity = "Low"


class AIAnalysis(BaseModel):
    severity: Severity
    main_finding: str
    summary: str
    suspicious_ips: list[str]
    recommended_actions: list[str]


class AnalyzeResponse(AIAnalysis):
    provider: str
    model: str


def build_prompt(req: AnalyzeRequest) -> str:
    data = req.model_dump()
    return f"""You are a SOC analyst reviewing aggregated authentication log data.

Rate the overall threat severity as one of Low, Medium, High or Critical.
A deterministic rule engine has already scored this data (risk_score and
rule_based_severity). Use it as context, but give your own independent rating
based on the evidence. Only reference IP addresses that appear in the data.

Return a main_finding (one sentence), a summary (2 to 4 sentences),
suspicious_ips (list of IPs from the data), and recommended_actions
(3 to 5 concrete steps).

Data:
{json.dumps(data, indent=2, default=str)}
"""


def call_gemini(prompt: str) -> AIAnalysis:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set")

    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=AIAnalysis,
            temperature=0.2,
        ),
    )
    if isinstance(response.parsed, AIAnalysis):
        return response.parsed
    return AIAnalysis.model_validate_json(response.text)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "model": GEMINI_MODEL}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    try:
        result = call_gemini(build_prompt(req))
    except Exception as exc:  # surface a clean 502 so Express can fall back
        raise HTTPException(status_code=502, detail=f"Gemini analysis failed: {exc}") from exc

    return AnalyzeResponse(**result.model_dump(), provider="gemini", model=GEMINI_MODEL)
