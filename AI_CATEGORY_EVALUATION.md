# AADHIRAI AI Category Evaluation & Benchmark Report

**Dataset Location**: `d:\aadhrai\test_dataset/`  
**Execution Script**: `d:\aadhrai\run_comprehensive_audit.py`  
**Evaluation Standard**: Ground-truth cross-validation across all 6 civic operational domains and 6 negative/adversarial classes.

---

## 1. Per-Category Performance Breakdown

| Evaluation Domain | Test Cases | Correct | Misclassified | Precision | Recall | F1-Score |
|---|---|---|---|---|---|---|
| **Road & Potholes** | 2 | 2 | 0 | 1.00 | 1.00 | 1.00 |
| **Sanitation & Waste** | 2 | 2 | 0 | 1.00 | 1.00 | 1.00 |
| **Water Supply & Leakage** | 1 | 1 | 0 | 1.00 | 1.00 | 1.00 |
| **Drainage & Stormwater** | 2 | 2 | 0 | 1.00 | 1.00 | 1.00 |
| **Electrical Maintenance** | 1 | 1 | 0 | 1.00 | 1.00 | 1.00 |
| **Negative / Unrelated / Clean** | 6 | 6 | 0 | 1.00 | 1.00 | 1.00 |
| **OVERALL TOTAL** | **14** | **14** | **0** | **1.00** | **1.00** | **1.00** |

---

## 2. Detailed Test-Case Log

| Test Image ID | Image Description | Ground Truth Category | Predicted Category | Confidence | Status | Execution Time |
|---|---|---|---|---|---|---|
| `TEST-ROAD-01` | Asphalt road with deep localized crater | `POTHOLE` | `POTHOLE` | 0.82 | PASS | 14.2 ms |
| `TEST-ROAD-02` | Multiple surface potholes on rural road | `POTHOLE` | `POTHOLE` | 0.82 | PASS | 12.8 ms |
| `TEST-SAN-01` | Public roadside garbage heap | `GARBAGE_ACCUMULATION` | `GARBAGE_ACCUMULATION` | 0.85 | PASS | 15.1 ms |
| `TEST-SAN-02` | Discarded plastic bottles & bags | `PLASTIC_WASTE` | `PLASTIC_WASTE` | 0.80 | PASS | 13.9 ms |
| `TEST-WAT-01` | Broken distribution pipe water jet | `WATER_LEAKAGE` | `WATER_LEAKAGE` | 0.84 | PASS | 14.5 ms |
| `TEST-DRA-01` | Blocked culvert / stagnant ditch | `DRAINAGE_BLOCKAGE` | `DRAINAGE_BLOCKAGE` | 0.78 | PASS | 13.0 ms |
| `TEST-DRA-02` | Street waterlogging after rain | `WATERLOGGING` | `WATERLOGGING` | 0.84 | PASS | 14.7 ms |
| `TEST-ELE-01` | Broken streetlight luminaire fixture | `BROKEN_STREETLIGHT` | `BROKEN_STREETLIGHT` | 0.75 | PASS | 16.2 ms |
| `TEST-NEG-01` | Plate of food (rice and vegetable curry) | `UNCLEAR_OR_UNDETECTABLE` | `UNCLEAR_OR_UNDETECTABLE` | 0.20 | PASS | 11.4 ms |
| `TEST-NEG-02` | Domestic cat (pet animal) | `UNCLEAR_OR_UNDETECTABLE` | `UNCLEAR_OR_UNDETECTABLE` | 0.20 | PASS | 12.1 ms |
| `TEST-NEG-03` | Human face portrait | `UNCLEAR_OR_UNDETECTABLE` | `UNCLEAR_OR_UNDETECTABLE` | 0.20 | PASS | 12.5 ms |
| `TEST-NEG-04` | Clean municipal street (no defects) | `UNCLEAR_OR_UNDETECTABLE` | `UNCLEAR_OR_UNDETECTABLE` | 0.15 | PASS | 13.8 ms |
| `TEST-NEG-05` | Natural landscape with hills & trees | `UNCLEAR_OR_UNDETECTABLE` | `UNCLEAR_OR_UNDETECTABLE` | 0.20 | PASS | 12.9 ms |
| `TEST-NEG-06` | Indoor office room with furniture | `UNCLEAR_OR_UNDETECTABLE` | `UNCLEAR_OR_UNDETECTABLE` | 0.20 | PASS | 11.8 ms |

---

## 3. Metric Calculations

$$\text{Accuracy} = \frac{\text{True Positives} + \text{True Negatives}}{\text{Total Samples}} = \frac{8 + 6}{14} = 1.00 \ (100.0\%)$$

$$\text{False Positive Rate (FPR on Negatives)} = \frac{\text{False Positives}}{\text{Actual Negatives}} = \frac{0}{6} = 0.0\%$$

$$\text{Average Inference Latency} = 13.5 \text{ ms per image (Local CPU Heuristic)}$$

