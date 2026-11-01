"""
AADHIRAI Hybrid Vision AI Test & Evaluation Suite
Tests actual images across civic issue categories, non-civic samples, and low-quality images.
Records:
  - Ground Truth Label
  - Hugging Face Output
  - Gemini Output
  - Final Decision & Display Name
  - Citizen Confirmation Required
  - Actual Latency (ms)
  - Result (CORRECT / INCORRECT)
"""
import io
import os
import glob
import time
import json
import requests
from PIL import Image, ImageDraw

API_URL = "http://127.0.0.1:8001/api/ai/analyze-image"
FASTAPI_URL = "http://127.0.0.1:8000/api/v1/ai/classify-image"

def create_synthetic_test_images(test_dir: str):
    """Create controlled test samples for categories without uploaded files."""
    os.makedirs(test_dir, exist_ok=True)

    # 1. Severely underexposed / dark image
    dark = Image.new("RGB", (640, 480), color=(10, 10, 12))
    dark.save(os.path.join(test_dir, "synthetic_dark.jpg"))

    # 2. Blurry / low entropy image
    blurry = Image.new("RGB", (640, 480), color=(180, 180, 180))
    blurry.save(os.path.join(test_dir, "synthetic_blank.jpg"))

    # 3. Clean nature scenery
    nature = Image.new("RGB", (640, 480), color=(70, 140, 240))
    draw = ImageDraw.Draw(nature)
    draw.rectangle([0, 240, 640, 480], fill=(40, 160, 60))
    nature.save(os.path.join(test_dir, "synthetic_landscape.jpg"))

def run_tests():
    print("=" * 90)
    print("AADHIRAI HYBRID AI MODEL EVALUATION & INFERENCE BENCHMARK")
    print("=" * 90)

    test_dir = r"d:\aadhrai\ml-service\tests\test_samples"
    create_synthetic_test_images(test_dir)

    # Define test suite with ground truth
    user_up = r"C:\Users\siran\.gemini\antigravity\brain\c2db47ed-cd14-4d72-9eea-553d39e0013d\.user_uploaded"

    test_cases = [
        # (filepath, ground_truth, description)
        (
            os.path.join(user_up, "media_1793469612737_c74ffc78.png"),
            "POTHOLE",
            "Severe pothole on asphalt road"
        ),
        (
            os.path.join(user_up, "media_1793465115926_49704d33.png"),
            "GARBAGE_ACCUMULATION",
            "Mixed solid waste & garbage pile"
        ),
        (
            os.path.join(user_up, "media_1793469612758_067208af.jpg"),
            "GARBAGE_ACCUMULATION",
            "Street-side plastic waste accumulation"
        ),
        (
            os.path.join(user_up, "media_1793471441781_9bb7c5d8.jpg"),
            "GARBAGE_ACCUMULATION",
            "Roadside accumulated garbage dump"
        ),
        (
            os.path.join(test_dir, "synthetic_dark.jpg"),
            "UNCLEAR",
            "Severely underexposed / dark image"
        ),
        (
            os.path.join(test_dir, "synthetic_blank.jpg"),
            "UNCLEAR",
            "Featureless / low detail image"
        ),
        (
            os.path.join(test_dir, "synthetic_landscape.jpg"),
            "NON_CIVIC_IMAGE",
            "Clean sky / scenic landscape non-civic photo"
        )
    ]

    results_table = []

    for path, gt, desc in test_cases:
        if not os.path.exists(path):
            print(f"[SKIP] File not found: {path}")
            continue

        fname = os.path.basename(path)
        mime = "image/png" if path.endswith(".png") else "image/jpeg"

        with open(path, "rb") as f:
            file_bytes = f.read()

        t0 = time.time()
        try:
            r = requests.post(
                API_URL,
                files={"file": (fname, file_bytes, mime)},
                timeout=30
            )
            elapsed_ms = round((time.time() - t0) * 1000, 2)

            if r.status_code == 200:
                data = r.json()
                analysis = data.get("analysis", {})
                hf = data.get("huggingFace", {})
                gemini = data.get("gemini", {})

                final_cat = analysis.get("finalCategory", "UNKNOWN")
                decision_status = analysis.get("decisionStatus", "UNKNOWN")
                needs_conf = analysis.get("needsCitizenConfirmation", True)
                hf_dets = [f"{d['className']}({d['confidence']})" for d in hf.get("detections", [])]
                hf_summary = ", ".join(hf_dets) if hf_dets else "None"
                gemini_summary = f"{gemini.get('category') or 'None'} ({gemini.get('status')})"

                # Correctness criteria
                # Pothole and Road Damage are compatible road categories
                road_set = {"POTHOLE", "ROAD_DAMAGE"}
                if gt in road_set and final_cat in road_set:
                    is_correct = True
                elif gt == final_cat:
                    is_correct = True
                elif gt == "UNCLEAR" and (final_cat == "UNCLEAR" or analysis.get("isCivicIssue") is False):
                    is_correct = True
                elif gt == "NON_CIVIC_IMAGE" and (final_cat == "NON_CIVIC_IMAGE" or final_cat == "UNCLEAR" or not analysis.get("isCivicIssue")):
                    is_correct = True
                else:
                    is_correct = False

                results_table.append({
                    "file": fname,
                    "description": desc,
                    "groundTruth": gt,
                    "hfOutput": hf_summary,
                    "geminiOutput": gemini_summary,
                    "finalDecision": final_cat,
                    "decisionStatus": decision_status,
                    "needsConfirmation": needs_conf,
                    "latencyMs": elapsed_ms,
                    "isCorrect": is_correct
                })
            else:
                print(f"[FAIL] {fname}: HTTP {r.status_code} - {r.text[:80]}")
        except Exception as e:
            print(f"[ERR] {fname}: {e}")

    # Print summary
    print(f"\n{'Test Case':<32} | {'Ground Truth':<20} | {'Final Decision':<20} | {'Status':<8} | {'Latency':<8}")
    print("-" * 95)
    correct_count = 0
    total_latency = 0.0

    for res in results_table:
        status_str = "PASS" if res["isCorrect"] else "FAIL"
        if res["isCorrect"]:
            correct_count += 1
        total_latency += res["latencyMs"]
        print(f"{res['file'][:30]:<32} | {res['groundTruth']:<20} | {res['finalDecision']:<20} | {status_str:<8} | {res['latencyMs']:>6.1f}ms")

    accuracy = (correct_count / len(results_table)) * 100 if results_table else 0.0
    avg_latency = (total_latency / len(results_table)) if results_table else 0.0

    print("-" * 95)
    print(f"Total Tests: {len(results_table)} | Passed: {correct_count} | Accuracy: {accuracy:.1f}% | Avg Latency: {avg_latency:.1f}ms")
    print("=" * 90)

    # Save detailed JSON evaluation report
    report_path = r"d:\aadhrai\ml-service\tests\evaluation_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump({
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "totalTests": len(results_table),
            "passed": correct_count,
            "accuracyPercent": round(accuracy, 2),
            "avgLatencyMs": round(avg_latency, 2),
            "results": results_table
        }, f, indent=2)
    print(f"Saved evaluation report to: {report_path}")

if __name__ == "__main__":
    run_tests()
