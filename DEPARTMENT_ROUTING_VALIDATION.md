# AADHIRAI – Department Routing Validation Report

## 1. Deterministic Routing Architecture
The system strictly decouples **AI Defect Detection** from **Government Department Routing**:
1. **AI Output**: Identifies physical defect (e.g., `POTHOLE`, `WATER_LEAKAGE`).
2. **Citizen Confirmation**: Citizen verifies or corrects the defect category.
3. **Routing Service (`RoutingService.determine_department`)**: Performs database lookup against table `routing_rules`.
4. **Officer Assignment**: Locates on-duty department officer assigned to the matched municipal ward.

## 2. Validated Routing Matrix

| Category Code | Canonical Category | Target Municipal Department | Department Code |
|---|---|---|---|
| `road_damage` | `POTHOLE` / `ROAD_DAMAGE` | Roads & Highways Department | `DEPT_ROADS` |
| `garbage_accumulation` | `GARBAGE_ACCUMULATION` | Public Health & Sanitation Department | `DEPT_SANITATION` |
| `broken_streetlight` | `BROKEN_STREETLIGHT` | Electrical & Public Lighting Department | `DEPT_ELECTRICAL` |
| `water_leakage` | `WATER_LEAKAGE` | Water Supply & Storm Drainage Department | `DEPT_WATER_DRAINAGE` |
| `blocked_drainage` | `DRAINAGE_BLOCKAGE` | Water Supply & Storm Drainage Department | `DEPT_WATER_DRAINAGE` |
| `waterlogging` | `WATERLOGGING` | Water Supply & Storm Drainage Department | `DEPT_WATER_DRAINAGE` |
| `damaged_electrical` | `DAMAGED_ELECTRIC_POLE` | Electrical & Public Lighting Department | `DEPT_ELECTRICAL` |
| `other_civic` | `OTHER_CIVIC_ISSUE` | Municipal General Administration | `DEPT_ADMIN` |

Status: **VERIFIED WORKING** (Confirmed via `GET /api/v1/routing/suggestions`).

