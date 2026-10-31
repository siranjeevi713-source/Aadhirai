from sqlalchemy.orm import Session
from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.models import (
    Role, User, Department, Municipality, Ward, Officer,
    ComplaintCategory, RoutingRule, SLAPolicy
)

def seed_database(db: Session = None):
    close_at_end = False
    if db is None:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        close_at_end = True

    try:
        # 1. Seed Roles
        roles_data = [
            ("citizen", "Regular citizen of Musiri"),
            ("officer", "Government field officer or engineer"),
            ("admin", "Municipal Commissioner or Department Admin")
        ]
        role_map = {}
        for name, desc in roles_data:
            role = db.query(Role).filter(Role.name == name).first()
            if not role:
                role = Role(name=name, description=desc)
                db.add(role)
                db.flush()
            role_map[name] = role

        # 2. Seed Municipality (Musiri)
        muni = db.query(Municipality).filter(Municipality.name_en == "Musiri").first()
        if not muni:
            muni = Municipality(
                name_en="Musiri",
                name_ta="முசிறி",
                district="Tiruchirappalli",
                state="Tamil Nadu",
                center_lat=10.9413,
                center_lon=78.4485
            )
            db.add(muni)
            db.flush()

        # 3. Seed 24 Wards of Musiri
        musiri_wards_data = [
            (1, "Kavery Riverbank North", "காவிரி வடகரை", 10.9450, 78.4420),
            (2, "Bazaar Street Central", "பஜார் வீதி மத்தி", 10.9425, 78.4450),
            (3, "Perumal Kovil Street", "பெருமாள் கோவில் தெரு", 10.9410, 78.4430),
            (4, "Anna Nagar East", "அண்ணா நகர் கிழக்கு", 10.9440, 78.4490),
            (5, "Gandhi Road West", "காந்தி சாலை மேற்கு", 10.9390, 78.4410),
            (6, "Kamaraj Puram", "காமராஜ் புரம்", 10.9380, 78.4460),
            (7, "Kavery Nagar Residential", "காவிரி நகர் குடியிருப்பு", 10.9413, 78.4485),
            (8, "New Bus Stand Junction", "புதிய பேருந்து நிலையம் சந்திப்பு", 10.9470, 78.4510),
            (9, "Old Hospital Road", "பழைய அரசு மருத்துவமனை சாலை", 10.9405, 78.4470),
            (10, "Thuraiyur Road Sector", "துறையூர் சாலை பிரிவு", 10.9520, 78.4550),
            (11, "Subramaniapuram", "சுப்பிரமணியபுரம்", 10.9360, 78.4435),
            (12, "Moorthi Reddiyar Street", "மூர்த்தி ரெட்டியார் தெரு", 10.9430, 78.4505),
            (13, "Thathaiyangarpet Bypass", "தாத்தையங்கார்பேட்டை புறவழிச்சாலை", 10.9550, 78.4460),
            (14, "VOC Street Extn", "வ.உ.சி தெரு விரிவாக்கம்", 10.9395, 78.4520),
            (15, "Bharathiyar Street", "பாரதியார் தெரு", 10.9415, 78.4540),
            (16, "Railway Feeder Road", "ரயில்வே இணைப்பு சாலை", 10.9480, 78.4580),
            (17, "Semparai Road Link", "செம்பரை சாலை இணைப்பு", 10.9320, 78.4400),
            (18, "Vellur High School Zone", "வெள்ளூர் மேல்நிலைப் பள்ளி பகுதி", 10.9350, 78.4500),
            (19, "Ayyampalayam Border", "அய்யம்பாளையம் எல்லை", 10.9290, 78.4380),
            (20, "Tiruchi Main Highway North", "திருச்சி மெயின் ரோடு வடக்கு", 10.9460, 78.4600),
            (21, "Thiruthalayur Link", "திருத்தலையூர் இணைப்பு", 10.9580, 78.4620),
            (22, "Chinthamani Nagar", "சிந்தாமணி நகர்", 10.9370, 78.4560),
            (23, "Kattuputhur Road Junction", "காட்டுப்புத்தூர் ரோடு சந்திப்பு", 10.9510, 78.4400),
            (24, "South Sluice Gate Ward", "தெற்கு மதகு வார்டு", 10.9340, 78.4470)
        ]
        ward_map = {}
        for num, n_en, n_ta, lat, lon in musiri_wards_data:
            ward = db.query(Ward).filter(Ward.municipality_id == muni.id, Ward.ward_number == num).first()
            if not ward:
                ward = Ward(
                    municipality_id=muni.id,
                    ward_number=num,
                    name_en=n_en,
                    name_ta=n_ta,
                    center_lat=lat,
                    center_lon=lon,
                    radius_meters=1000.0
                )
                db.add(ward)
                db.flush()
            ward_map[num] = ward

        # 4. Seed Departments
        depts_data = [
            ("DEPT_ROADS", "Roads & Highways Department", "சாலை மற்றும் நெடுஞ்சாலைத் துறை", "roads@musiri.gov.in", "+914326260101"),
            ("DEPT_SANITATION", "Public Health & Sanitation Department", "பொது சுகாதாரம் மற்றும் துப்புரவுத் துறை", "sanitation@musiri.gov.in", "+914326260102"),
            ("DEPT_ELECTRICAL", "Electrical & Public Lighting Department", "மின்சாரம் மற்றும் தெருவிளக்குத் துறை", "electrical@musiri.gov.in", "+914326260103"),
            ("DEPT_WATER_DRAINAGE", "Water Supply & Storm Drainage Department", "குடிநீர் விநியோகம் மற்றும் வடிகால் துறை", "water@musiri.gov.in", "+914326260104"),
            ("DEPT_ADMIN", "Municipal General Administration", "நகராட்சி பொது நிர்வாகம்", "commissioner@musiri.gov.in", "+914326260100")
        ]
        dept_map = {}
        for code, n_en, n_ta, em, ph in depts_data:
            dept = db.query(Department).filter(Department.code == code).first()
            if not dept:
                dept = Department(
                    code=code,
                    name_en=n_en,
                    name_ta=n_ta,
                    contact_email=em,
                    contact_phone=ph
                )
                db.add(dept)
                db.flush()
            dept_map[code] = dept

        # 5. Seed Categories
        categories_data = [
            ("road_damage", "Road Damage / Potholes", "சாலை சேதம் / பள்ளங்கள்", "HIGH", "truck"),
            ("garbage_accumulation", "Garbage Accumulation", "குப்பை குவிப்பு", "HIGH", "trash-2"),
            ("broken_streetlight", "Broken Streetlight", "பழுதடைந்த தெருவிளக்கு", "MEDIUM", "lightbulb-off"),
            ("water_leakage", "Drinking Water Pipeline Leakage", "குடிநீர் குழாய் கசிவு", "HIGH", "droplets"),
            ("blocked_drainage", "Blocked Storm Drainage", "சாக்கடை / வடிகால் அடைப்பு", "HIGH", "waves"),
            ("waterlogging", "Monsoon Waterlogging", "மழைநீர் தேக்கம்", "HIGH", "cloud-rain"),
            ("damaged_electrical", "Damaged Electrical Infrastructure", "சேதமடைந்த மின்சார உள்கட்டமைப்பு", "CRITICAL", "zap"),
            ("other_civic", "Other Civic Issue", "இதர பொதுப் பிரச்சனை", "MEDIUM", "alert-circle")
        ]
        cat_map = {}
        for code, n_en, n_ta, prio, icon in categories_data:
            cat = db.query(ComplaintCategory).filter(ComplaintCategory.code == code).first()
            if not cat:
                cat = ComplaintCategory(
                    code=code,
                    name_en=n_en,
                    name_ta=n_ta,
                    default_priority=prio,
                    icon_key=icon
                )
                db.add(cat)
                db.flush()
            cat_map[code] = cat

        # 6. Seed Routing Rules & SLA Policies
        cat_dept_map = {
            "road_damage": "DEPT_ROADS",
            "garbage_accumulation": "DEPT_SANITATION",
            "broken_streetlight": "DEPT_ELECTRICAL",
            "water_leakage": "DEPT_WATER_DRAINAGE",
            "blocked_drainage": "DEPT_WATER_DRAINAGE",
            "waterlogging": "DEPT_WATER_DRAINAGE",
            "damaged_electrical": "DEPT_ELECTRICAL",
            "other_civic": "DEPT_ADMIN"
        }
        sla_hours_map = {
            "road_damage": 72,
            "garbage_accumulation": 24,
            "broken_streetlight": 48,
            "water_leakage": 24,
            "blocked_drainage": 36,
            "waterlogging": 24,
            "damaged_electrical": 12,
            "other_civic": 96
        }
        for c_code, d_code in cat_dept_map.items():
            cat = cat_map[c_code]
            dept = dept_map[d_code]
            rule = db.query(RoutingRule).filter(RoutingRule.category_id == cat.id).first()
            if not rule:
                db.add(RoutingRule(category_id=cat.id, target_department_id=dept.id, priority_level="MEDIUM"))
            
            sla = db.query(SLAPolicy).filter(SLAPolicy.category_id == cat.id).first()
            if not sla:
                max_h = sla_hours_map[c_code]
                db.add(SLAPolicy(
                    category_id=cat.id,
                    max_resolution_hours=max_h,
                    warning_hours=int(max_h * 0.75),
                    escalation_tier1_hours=max_h + 8,
                    escalation_tier2_hours=max_h + 24
                ))

        # 7. Seed Standard Users
        # A: Citizen
        citizen = db.query(User).filter(User.phone == "+919876543210").first()
        if not citizen:
            citizen = User(
                phone="+919876543210",
                email="citizen.musiri@aadhirai.tn.gov.in",
                full_name="செந்தில் குமார் (Senthil Kumar)",
                password_hash=get_password_hash("Password123!"),
                preferred_language="ta",
                roles=[role_map["citizen"]]
            )
            db.add(citizen)
            db.flush()

        # B: Officer (Ward 7 Engineer, Roads Dept)
        officer_user = db.query(User).filter(User.phone == "+919876543211").first()
        if not officer_user:
            officer_user = User(
                phone="+919876543211",
                email="officer.roads@musiri.gov.in",
                full_name="பொறியாளர் பாஸ்கரன் (Er. Baskaran)",
                password_hash=get_password_hash("Password123!"),
                preferred_language="ta",
                roles=[role_map["officer"]]
            )
            db.add(officer_user)
            db.flush()
            db.add(Officer(
                user_id=officer_user.id,
                department_id=dept_map["DEPT_ROADS"].id,
                assigned_ward_id=ward_map[7].id,
                badge_number="MSR-AE-RD-07",
                designation="Assistant Engineer (Roads - Ward 7)",
                is_on_duty=True
            ))

        # C: Admin (Municipal Commissioner)
        admin_user = db.query(User).filter(User.phone == "+919876543212").first()
        if not admin_user:
            admin_user = User(
                phone="+919876543212",
                email="commissioner@musiri.gov.in",
                full_name="ஆணையர் தர்மலிங்கம் (Commissioner Dharmalingam)",
                password_hash=get_password_hash("Password123!"),
                preferred_language="ta",
                roles=[role_map["admin"]]
            )
            db.add(admin_user)
            db.flush()

        db.commit()
    finally:
        if close_at_end:
            db.close()
