"""
gemini_analyzer.py — ShadowStack AI-Powered Code Optimization Analyzer

Uses Google Gemini (via the google-genai SDK) to analyze Python code changes
and provide intelligent, actionable cost optimisation suggestions.
"""

import os
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

# ── Gemini Client ────────────────────────────────────────────────────────────
_gemini_client = None

def _get_gemini_client():
    global _gemini_client
    if _gemini_client is None:
        try:
            from google import genai
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                logger.warning("GEMINI_API_KEY not set — Gemini analysis will be unavailable.")
                return None
            _gemini_client = genai.Client(api_key=api_key)
            logger.info("✅ Gemini client initialized.")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {e}")
            return None
    return _gemini_client


GEMINI_MODEL = "gemini-2.5-flash"


def _build_prompt(code: str, report: dict, predicted_cost: float, service: str, resource: str) -> str:
    """Construct the Gemini prompt for cost optimisation analysis."""
    return f"""You are an expert cloud cost optimisation engineer specialising in infrastructure-aware code review.

Analyse the following Python code changes from a Pull Request and provide **specific, actionable cost optimisation suggestions**.

## Context
- **Service:** {service}
- **Resource Type:** {resource}
- **Predicted Monthly Cost Impact:** ${predicted_cost:,.2f}

## AST Complexity Metrics
| Metric | Value |
|--------|-------|
| Functions | {report['function_count']} |
| Total Loops | {report['loop_count']} |
| Nested Loops | {report['nested_loop_count']} |
| Branches (if/else) | {report['branch_count']} |
| Cyclomatic Complexity | {report['cyclomatic_complexity']} |
| Complexity Score | {report['complexity_score']}/10 |
| Resource Units | {report['resource_units']} |

## Changed Code
```python
{code}
```

## Instructions
Provide **3–5 specific optimisation recommendations**. For each:
1. **Problem:** Briefly describe the inefficiency and its cost impact.
2. **Solution:** Provide refactored code or a clear algorithmic alternative.
3. **Estimated Savings:** Give a rough monthly dollar saving (e.g., "~$45/month").

Focus on:
- Algorithmic complexity (O(n2) → O(n) improvements)
- Vectorisation with NumPy/Pandas
- Reducing database queries / I/O
- Caching / memoisation opportunities
- Avoiding unnecessary object creation in hot loops

Format your entire response as clean markdown with level-3 headings (###) for each recommendation.
"""


def analyze_with_gemini(
    code: str,
    report: dict,
    predicted_cost: float,
    service_name: str,
    resource_type: str,
) -> Optional[str]:
    """
    Send code + metrics to Gemini and return AI-powered optimisation suggestions.
    Returns markdown string or None if Gemini is unavailable.
    """
    client = _get_gemini_client()
    if client is None:
        return None

    prompt = _build_prompt(code, report, predicted_cost, service_name, resource_type)

    try:
        from google.genai import types
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=types.Part.from_text(text=prompt),
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=4096,
                top_p=0.95,
            ),
        )
        text = response.text or ""
        logger.info(f"🤖 Gemini analysis completed ({len(text)} chars)")
        return text.strip()
    except Exception as e:
        logger.error(f"Gemini analysis failed: {e}")
        return None


def get_gemini_status() -> dict:
    """Return whether Gemini is configured and ready."""
    client = _get_gemini_client()
    return {
        "available": client is not None,
        "model": GEMINI_MODEL if client else None,
    }
