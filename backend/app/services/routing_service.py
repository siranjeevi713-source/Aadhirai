from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.models.models import Ward, Department, Officer, RoutingRule, ComplaintCategory
from app.services.ai_service import AIService

class RoutingService:
    @staticmethod
    def match_ward(db: Session, lat: float, lon: float) -> Optional[Ward]:
        """Find closest ward in Musiri municipality based on spatial distance."""
        wards = db.query(Ward).all()
        if not wards:
            return None
        
        closest_ward = None
        min_distance = float("inf")
        
        for ward in wards:
            dist = AIService.calculate_distance_meters(lat, lon, ward.center_lat, ward.center_lon)
            if dist < min_distance:
                min_distance = dist
                closest_ward = ward
                
        return closest_ward

    @staticmethod
    def determine_department(db: Session, category_id: str) -> Optional[Department]:
        """Deterministic routing from category to department using configured routing rules."""
        rule = db.query(RoutingRule).filter(RoutingRule.category_id == category_id).first()
        if rule and rule.target_department:
            return rule.target_department
        
        # Fallback by category code
        category = db.query(ComplaintCategory).filter(ComplaintCategory.id == category_id).first()
        if not category:
            return None
            
        code_dept_map = {
            "road_damage": "DEPT_ROADS",
            "garbage_accumulation": "DEPT_SANITATION",
            "broken_streetlight": "DEPT_ELECTRICAL",
            "water_leakage": "DEPT_WATER_DRAINAGE",
            "blocked_drainage": "DEPT_WATER_DRAINAGE",
            "waterlogging": "DEPT_WATER_DRAINAGE",
            "damaged_electrical": "DEPT_ELECTRICAL",
            "other_civic": "DEPT_ADMIN"
        }
        dept_code = code_dept_map.get(category.code, "DEPT_ADMIN")
        return db.query(Department).filter(Department.code == dept_code).first()

    @staticmethod
    def assign_officer(db: Session, department_id: str, ward_id: Optional[str] = None) -> Optional[Officer]:
        """Find on-duty officer for department, prioritizing assigned ward."""
        if ward_id:
            officer = db.query(Officer).filter(
                Officer.department_id == department_id,
                Officer.assigned_ward_id == ward_id,
                Officer.is_on_duty == True
            ).first()
            if officer:
                return officer
        
        # Department level officer
        return db.query(Officer).filter(
            Officer.department_id == department_id,
            Officer.is_on_duty == True
        ).first()
