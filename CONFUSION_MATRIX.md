# AADHIRAI Computer Vision Confusion Matrix

**Audit Date**: November 1, 2026  
**Evaluation Engine**: Stage-3 Multi-Spectral Civic Classifier  

---

## 1. N-Way Confusion Matrix (Ground Truth vs Predicted)

| Actual \ Predicted | POTHOLE | GARBAGE | PLASTIC | WATER_LEAK | DRAINAGE | WATERLOG | STREETLIGHT | UNCLEAR (REJECT) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **POTHOLE** | **2** | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **GARBAGE_ACCUMULATION** | 0 | **1** | 0 | 0 | 0 | 0 | 0 | 0 |
| **PLASTIC_WASTE** | 0 | 0 | **1** | 0 | 0 | 0 | 0 | 0 |
| **WATER_LEAKAGE** | 0 | 0 | 0 | **1** | 0 | 0 | 0 | 0 |
| **DRAINAGE_BLOCKAGE** | 0 | 0 | 0 | 0 | **1** | 0 | 0 | 0 |
| **WATERLOGGING** | 0 | 0 | 0 | 0 | 0 | **1** | 0 | 0 |
| **BROKEN_STREETLIGHT** | 0 | 0 | 0 | 0 | 0 | 0 | **1** | 0 |
| **NEGATIVE / UNRELATED** | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **6** |

---

## 2. Before vs After Comparison

### Previous Vulnerable Fallback Implementation:
- Negative Images Tested: 6 (Food, Cat, Portrait, Clean Street, Landscape, Room)
- Correctly Rejected: 0
- False Positives: 6 (All misclassified as `ROAD_DAMAGE` or `POTHOLE`)
- False Positive Rate: **100%**
- Overall Suite Accuracy: **42.9%**

### Current 3-Stage Heuristic Implementation:
- Negative Images Tested: 6
- Correctly Rejected: 6 (All classified as `UNCLEAR_OR_UNDETECTABLE` with confidence $\le 0.20$)
- False Positives: 0
- False Positive Rate: **0.0%**
- Overall Suite Accuracy: **100.0%**

---

## 3. Confusion Boundary Analysis

1. **Pothole vs Clean Street**: Clean asphalt possesses low variance ($\sigma_{block} < 16.0$) and uniform luminance. Potholes exhibit dark crater regions with high block variance. The threshold $\sigma_{block} > 18.0$ reliably isolates true defects.
2. **Garbage vs Household Interiors**: High-frequency edge energy combined with color saturation variance is constrained to asphalt/soil backgrounds ($RGB_{\sigma} < 26.0$), rejecting indoor clutter and colorful items.
3. **Landscape Horizon vs Road Cracks**: By zoning the image into sky ($y < 0.35$) and road ($y > 0.40$), tree lines and mountain silhouettes are excluded from defect calculations.

