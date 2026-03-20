import os
import httpx
import json
from typing import Optional

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
LLM_MODEL = os.getenv("LLM_MODEL", "neural-chat")
LLM_TIMEOUT = int(os.getenv("LLM_TIMEOUT", "120"))


SYSTEM_PROMPT_EN = """You are an expert educational tutor for Indian school students. 
You help students understand textbook concepts clearly and simply.
Always respond in this exact JSON structure:
{
  "simple_explanation": "Clear explanation in simple language",
  "example": "A relatable real-world example",
  "summary": "1-2 sentence summary",
  "practice_question": "One practice question to test understanding"
}
Base your answer ONLY on the provided context. If context is insufficient, say so honestly."""

SYSTEM_PROMPT_HI = """आप भारतीय स्कूली छात्रों के लिए एक विशेषज्ञ शैक्षिक ट्यूटर हैं।
आप छात्रों को पाठ्यपुस्तक की अवधारणाओं को सरल हिंदी में समझने में मदद करते हैं।
हमेशा इस JSON संरचना में उत्तर दें:
{
  "simple_explanation": "सरल भाषा में स्पष्ट व्याख्या",
  "example": "एक संबंधित वास्तविक उदाहरण",
  "summary": "1-2 वाक्य सारांश",
  "practice_question": "समझ परखने के लिए एक प्रश्न"
}
केवल दिए गए संदर्भ के आधार पर उत्तर दें।"""

QUIZ_PROMPT_EN = """Generate exactly {n} multiple choice questions from the following educational content.
Return ONLY a JSON array of objects with this structure:
[
  {{
    "question": "Question text",
    "options": ["A. option1", "B. option2", "C. option3", "D. option4"],
    "correct": "A",
    "explanation": "Why this answer is correct"
  }}
]"""

QUIZ_PROMPT_HI = """निम्नलिखित शैक्षिक सामग्री से ठीक {n} बहुविकल्पीय प्रश्न तैयार करें।
केवल JSON array लौटाएं:
[
  {{
    "question": "प्रश्न",
    "options": ["A. विकल्प1", "B. विकल्प2", "C. विकल्प3", "D. विकल्प4"],
    "correct": "A",
    "explanation": "सही उत्तर का कारण"
  }}
]"""


async def call_ollama(prompt: str, system: str, temperature: float = 0.3) -> str:
    """Call Ollama LLM with given prompt"""
    payload = {
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt}
        ],
        "stream": False,
        "options": {
            "temperature": temperature,
            "num_predict": 1024,
        }
    }

    try:
        async with httpx.AsyncClient(timeout=LLM_TIMEOUT) as client:
            resp = await client.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["message"]["content"]
    except httpx.ConnectError:
        raise RuntimeError(f"Cannot connect to Ollama at {OLLAMA_BASE_URL}. Is it running?")
    except httpx.TimeoutException:
        raise RuntimeError("LLM request timed out. Try a shorter question.")
    except Exception as e:
        raise RuntimeError(f"LLM error: {str(e)}")


async def generate_answer(question: str, context: str, language: str = "en") -> dict:
    """Generate structured answer using RAG context"""
    system = SYSTEM_PROMPT_HI if language == "hi" else SYSTEM_PROMPT_EN

    if language == "hi":
        prompt = f"""संदर्भ:\n{context}\n\nछात्र का प्रश्न: {question}\n\nJSON में उत्तर दें:"""
    else:
        prompt = f"""Context:\n{context}\n\nStudent Question: {question}\n\nRespond in JSON:"""

    raw = await call_ollama(prompt, system, temperature=0.3)

    # Parse JSON from response
    try:
        # Find JSON block
        start = raw.find('{')
        end = raw.rfind('}') + 1
        if start != -1 and end > start:
            return json.loads(raw[start:end])
    except (json.JSONDecodeError, ValueError):
        pass

    # Fallback structured response
    return {
        "simple_explanation": raw.strip(),
        "example": "Please refer to your textbook for examples.",
        "summary": "Answer provided above.",
        "practice_question": "Can you explain this concept in your own words?"
    }


async def generate_quiz(context: str, num_questions: int = 5, language: str = "en") -> list:
    """Generate quiz questions from context"""
    prompt_template = QUIZ_PROMPT_HI if language == "hi" else QUIZ_PROMPT_EN
    system = "You are an expert quiz generator for Indian school students. Return ONLY valid JSON."

    prompt = f"{prompt_template.format(n=num_questions)}\n\nContent:\n{context}"

    raw = await call_ollama(prompt, system, temperature=0.4)

    try:
        start = raw.find('[')
        end = raw.rfind(']') + 1
        if start != -1 and end > start:
            return json.loads(raw[start:end])
    except (json.JSONDecodeError, ValueError):
        pass

    return []


async def check_ollama_health() -> bool:
    """Check if Ollama is running"""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            return resp.status_code == 200
    except Exception:
        return False
