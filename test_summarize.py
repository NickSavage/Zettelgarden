import argparse
import time
import requests
import sys

def submit_and_poll(base_url, token, text):
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    resp = requests.post(f"{base_url}/api/summarize", json={"text": text}, headers=headers)
    if resp.status_code != 200:
        print("Error submitting summarization:", resp.text, file=sys.stderr)
        sys.exit(1)
    job = resp.json()
    job_id = job.get("id") or job.get("pk")
    # Poll until complete
    time.sleep(2)
    while True:
        r = requests.get(f"{base_url}/api/summarize/{job_id}", headers=headers)
        if r.status_code != 200:
            print("Error polling summarization:", r.text, file=sys.stderr)
            sys.exit(1)
        data = r.json()
        if data.get("status") == "complete":
            return data
        time.sleep(2)

def compare_with_openrouter(summary1, summary2, openrouter_key):
    headers = {
        "Authorization": f"Bearer {openrouter_key}",
        "Content-Type": "application/json"
    }
    prompt = f"""
Evaluate and assign a clarity, accuracy, conciseness, and overall rating (1–10 each) for the two summaries.
Respond in strict JSON format like:

{{
  "summary1": {{"clarity": 0, "accuracy": 0, "conciseness": 0, "overall": 0}},
  "summary2": {{"clarity": 0, "accuracy": 0, "conciseness": 0, "overall": 0}},
  "comparison": "Short text about which is better and why"
}}

Summary 1:
{summary1}

Summary 2:
{summary2}
"""
    data = {
        "model": "google/gemini-2.5-flash",
        "messages": [{"role": "user", "content": prompt}],
    }
    resp = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data)
    if resp.status_code != 200:
        print("Error calling OpenRouter:", resp.text, file=sys.stderr)
        sys.exit(1)
    j = resp.json()
    content = j["choices"][0]["message"]["content"]
    usage = j.get("usage", {})
    try:
        import json
        cleaned = content.strip()
        # Remove Markdown fences if present
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`")
            if cleaned.lower().startswith("json"):
                cleaned = cleaned[4:].strip()
        parsed = json.loads(cleaned)
        parsed["_usage"] = usage
        return parsed
    except Exception as e:
        print("Failed to parse OpenRouter JSON:", content, file=sys.stderr)
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Test summarization endpoints and compare with OpenRouter.")
    parser.add_argument("--file", required=True, help="Path to input text file")
    parser.add_argument("--backend", required=True, help="Backend base URL (e.g. http://localhost:8080)")
    parser.add_argument("--second", required=True, help="Second host base URL")
    parser.add_argument("--first_token", required=True, help="JWT token for backend summarizer")
    parser.add_argument("--second_token", required=True, help="JWT token for second host summarizer")
    parser.add_argument("--openrouter-key", required=True, help="OpenRouter API key")
    args = parser.parse_args()

    with open(args.file, "r") as f:
        text = f.read()

    results = []
    total_prompt = total_completion = total_tokens = 0
    total_cost = 0.0

    print("Submitting to backend summarizer (baseline)...")
    baseline = submit_and_poll(args.backend, args.first_token, text)
    total_prompt += baseline.get("prompt_tokens", 0)
    total_completion += baseline.get("completion_tokens", 0)
    total_tokens += baseline.get("total_tokens", 0)
    total_cost += baseline.get("cost", 0.0)

    for i in range(5):
        print(f"\n--- Trial {i+1} (Second host vs Baseline) ---")
        second = submit_and_poll(args.second, args.second_token, text)

        rating = compare_with_openrouter(baseline["result"], second["result"], args.openrouter_key)
        results.append(rating)

        print("\nBaseline Ratings:", rating["summary1"])
        print("Demo Ratings:", rating["summary2"])
        print("Comparison:", rating["comparison"])

        total_prompt += second.get("prompt_tokens", 0)
        total_completion += second.get("completion_tokens", 0)
        total_tokens += second.get("total_tokens", 0)
        total_cost += second.get("cost", 0.0)

        print(f"Second host usage: prompt={second.get('prompt_tokens',0)}, completion={second.get('completion_tokens',0)}, total={second.get('total_tokens',0)}, cost=${second.get('cost',0.0):.6f}")

    # Aggregate averages
    avg = {
        "summary1": {"clarity":0,"accuracy":0,"conciseness":0,"overall":0},
        "summary2": {"clarity":0,"accuracy":0,"conciseness":0,"overall":0}
    }
    for r in results:
        for key in ["clarity","accuracy","conciseness","overall"]:
            avg["summary1"][key] += r["summary1"][key]
            avg["summary2"][key] += r["summary2"][key]
    for key in avg["summary1"]:
        avg["summary1"][key] /= len(results)
        avg["summary2"][key] /= len(results)

    print("\n=== Averages Across 5 Trials ===")
    print("Backend :", avg["summary1"])
    print("Second  :", avg["summary2"])

    print("\n=== Comparison Feedback ===")
    for i, r in enumerate(results, 1):
        print(f"Trial {i}: {r['comparison']}")

    print("\n=== Overall Synthesis ===")
    if avg["summary1"]["overall"] > avg["summary2"]["overall"]:
        print("Backend summarizer was generally stronger overall.")
    elif avg["summary2"]["overall"] > avg["summary1"]["overall"]:
        print("Second host summarizer was generally stronger overall.")
    else:
        print("Both summarizers performed about equally well.")

    print("\n=== Cost Summary (OpenRouter) ===")
    print(f"Total prompt tokens: {total_prompt}")
    print(f"Total completion tokens: {total_completion}")
    print(f"Total tokens: {total_tokens}")
    print(f"Total estimated cost: ${total_cost:.6f}")
    print(f"Average cost per trial: ${total_cost/5:.6f}")

if __name__ == "__main__":
    main()
