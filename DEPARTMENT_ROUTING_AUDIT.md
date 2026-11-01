# AADHIRAI Municipal Department Routing Engine Audit

**Jurisdiction**: Musiri Municipality (24 Wards, Tiruchirappalli District, Tamil Nadu)  
**Component**: `backend/app/services/routing_service.py` & Database Routing Rules  

---

## 1. Routing Architecture & Hierarchy

The AADHIRAI routing engine operates deterministically through 4 cascading tiers:

```
[Citizen Verified / AI Predicted Category]
                     │
                     ▼
[Tier 1: Category-to-Department Database Binding]
  - Query table `departments` & category metadata
  - Extract responsible municipal wing
                     │
                     ▼
[Tier 2: Geographic Ward Boundary & Jurisdiction]
  - Resolve Ward Number (1 through 24)
  - Verify Ward falls within Musiri Municipal boundary
                     │
                     ▼
[Tier 3: Active Officer Roster Allocation]
  - Query table `users` joining `roles` where role = 'officer'
  - Match department_id + ward_id
  - If multiple officers match: Least-loaded active queue
                     │
                     ▼
[Tier 4: Fallback / Administrative Review Queue]
  - If no officer is currently assigned to (Ward X, Dept Y):
  - Complaint routes to Municipal Commissioner Admin Pool
```

---

## 2. Department Mapping Matrix

| Category Code | Human Category Name | Responsible Municipal Wing | Target SLA (Hours) | Escalation Tier |
|---|---|---|:---:|:---:|
| `POTHOLE` | Pothole / Road Crater | Municipal Engineering & Roads | 48 | Assistant Engineer (AE) |
| `ROAD_DAMAGE` | Road Surface Breakdown | Municipal Engineering & Roads | 72 | Assistant Executive Engineer |
| `GARBAGE_ACCUMULATION` | Garbage Heap / Uncollected Waste | Solid Waste Management & Sanitation | 24 | Sanitary Inspector (SI) |
| `PLASTIC_WASTE` | Banned Single-Use Plastic Waste | Solid Waste Management & Sanitation | 24 | Sanitary Inspector (SI) |
| `WATER_LEAKAGE` | Pipeline Burst / Potable Water Leak | Public Water Supply Wing | 12 | Water Works Superintendent |
| `DRAINAGE_BLOCKAGE` | Choked Storm Drain / Silt Overflow | Stormwater & Drainage Wing | 24 | Health Officer / SWM |
| `WATERLOGGING` | Inundation on Public Thoroughfare | Stormwater & Drainage Wing | 24 | Municipal Engineer |
| `BROKEN_STREETLIGHT` | Non-functional / Damaged Streetlight | Electrical Maintenance Wing | 24 | Municipal Electrician |
| `FALLEN_TREE` | Fallen Tree / Branch Road Obstruction | Town Planning & Disaster Response | 12 | Town Planning Officer |
| `UNCLEAR_OR_UNDETECTABLE` | Unclear Evidence / Non-Civic Image | Administrative Review Pool | 24 | Grievance Cell Redressal Officer |

---

## 3. Jurisdiction & Override Verification

- **Citizen Category Override**: Citizens can manually correct AI suggestions before final confirmation. When corrected, the routing engine recalculates the assigned department immediately prior to database commit.
- **Audit Logging**: Every routing decision records `routing_method` (`AI_AUTOMATIC` vs `CITIZEN_OVERRIDE`), `assigned_department_id`, and `assigned_officer_id` in `complaint_history` and `audit_logs`.
- **Status Integrity**: New complaints enter in `SUBMITTED` or `ASSIGNED` state. Complaints are strictly forbidden from entering `RESOLVED` or `VERIFIED_RESOLVED` without signed officer closure and independent supervisor audit.

