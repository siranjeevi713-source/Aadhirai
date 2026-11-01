const { User, District, Department, Category, RoutingRule } = require('../models');
const bcrypt = require('bcryptjs');

const TN_DISTRICTS = [
  { name: 'Chennai', nameTa: 'சென்னை', coordinates: [80.2707, 13.0827] },
  { name: 'Coimbatore', nameTa: 'கோயம்புத்தூர்', coordinates: [76.9558, 11.0168] },
  { name: 'Madurai', nameTa: 'மதுரை', coordinates: [78.1198, 9.9252] },
  { name: 'Salem', nameTa: 'சேலம்', coordinates: [78.1460, 11.6643] },
  { name: 'Tiruchirappalli', nameTa: 'திருச்சிராப்பள்ளி', coordinates: [78.6942, 10.7905] },
  { name: 'Tirunelveli', nameTa: 'திருநெல்வேலி', coordinates: [77.7067, 8.7139] },
  { name: 'Vellore', nameTa: 'வேலூர்', coordinates: [79.1324, 12.9165] },
  { name: 'Erode', nameTa: 'ஈரோடு', coordinates: [77.7172, 11.3410] },
  { name: 'Tiruppur', nameTa: 'திருப்பூர்', coordinates: [77.3411, 11.1085] },
  { name: 'Thanjavur', nameTa: 'தஞ்சாவூர்', coordinates: [79.1378, 10.7870] },
  { name: 'Dindigul', nameTa: 'திண்டுக்கல்', coordinates: [77.9803, 10.3673] },
  { name: 'Kanchipuram', nameTa: 'காஞ்சிபுரம்', coordinates: [79.7036, 12.8185] },
  { name: 'Villupuram', nameTa: 'விழுப்புரம்', coordinates: [79.4953, 11.9396] },
  { name: 'Krishnagiri', nameTa: 'கிருஷ்ணகிரி', coordinates: [78.2138, 12.5186] },
  { name: 'Dharmapuri', nameTa: 'தர்மபுரி', coordinates: [78.1580, 12.1278] },
  { name: 'Cuddalore', nameTa: 'கடலூர்', coordinates: [79.7694, 11.7447] },
  { name: 'Nagapattinam', nameTa: 'நாகப்பட்டினம்', coordinates: [79.8452, 10.7672] },
  { name: 'Thoothukudi', nameTa: 'தூத்துக்குடி', coordinates: [78.1348, 8.7642] },
  { name: 'Virudhunagar', nameTa: 'விருதுநகர்', coordinates: [77.9624, 9.5810] },
  { name: 'Ramanathapuram', nameTa: 'ராமநாதபுரம்', coordinates: [78.8307, 9.3639] },
];

const CATEGORIES = [
  { code: 'POTHOLE', name: 'Pothole', nameTa: 'பள்ளம்', slaHours: 48, defaultSeverity: 'HIGH' },
  { code: 'ROAD_DAMAGE', name: 'Road Damage', nameTa: 'சாலை சேதம்', slaHours: 72, defaultSeverity: 'MEDIUM' },
  { code: 'GARBAGE_ACCUMULATION', name: 'Garbage Accumulation', nameTa: 'குப்பை குவிப்பு', slaHours: 24, defaultSeverity: 'HIGH' },
  { code: 'DRAINAGE_BLOCKAGE', name: 'Drainage Blockage', nameTa: 'வடிகால் அடைப்பு', slaHours: 24, defaultSeverity: 'HIGH' },
  { code: 'SEWAGE_OVERFLOW', name: 'Sewage Overflow', nameTa: 'கழிவுநீர் வழிதல்', slaHours: 12, defaultSeverity: 'CRITICAL' },
  { code: 'WATER_LEAKAGE', name: 'Water Leakage', nameTa: 'குழாய் கசிவு', slaHours: 12, defaultSeverity: 'HIGH' },
  { code: 'WATERLOGGING', name: 'Waterlogging', nameTa: 'நீர்த்தேக்கம்', slaHours: 24, defaultSeverity: 'HIGH' },
  { code: 'BROKEN_STREETLIGHT', name: 'Broken Streetlight', nameTa: 'தெருவிளக்கு பழுது', slaHours: 48, defaultSeverity: 'MEDIUM' },
  { code: 'DAMAGED_PUBLIC_INFRASTRUCTURE', name: 'Damaged Public Infrastructure', nameTa: 'பொது உள்கட்டமைப்பு சேதம்', slaHours: 72, defaultSeverity: 'MEDIUM' },
  { code: 'FALLEN_TREE', name: 'Fallen Tree', nameTa: 'விழுந்த மரம்', slaHours: 12, defaultSeverity: 'HIGH' },
];

async function seedDatabase() {
  console.log('[Seed] Starting database seeding...');

  // 1. Districts
  const districtMap = {};
  for (const d of TN_DISTRICTS) {
    let district = await District.findOne({ name: d.name });
    if (!district) {
      district = await District.create({
        name: d.name,
        nameTa: d.nameTa,
        state: 'Tamil Nadu',
        center: { type: 'Point', coordinates: d.coordinates },
        isActive: true,
      });
      console.log(`[Seed] Created district: ${d.name}`);
    }
    districtMap[d.name] = district;
  }

  // 2. Categories
  for (const c of CATEGORIES) {
    await Category.findOneAndUpdate(
      { code: c.code },
      { $setOnInsert: c },
      { upsert: true, new: true }
    );
  }
  console.log('[Seed] Categories seeded.');

  // 3. Sample departments for Coimbatore & Salem
  const coimbatore = districtMap['Coimbatore'];
  const salem = districtMap['Salem'];

  const sampleDepts = [
    { name: 'Roads & Infrastructure', code: `ROADS_${coimbatore._id.toString().slice(-4).toUpperCase()}`, districtId: coimbatore._id },
    { name: 'Sanitation & Solid Waste', code: `SAN_${coimbatore._id.toString().slice(-4).toUpperCase()}`, districtId: coimbatore._id },
    { name: 'Water Supply', code: `WATER_${coimbatore._id.toString().slice(-4).toUpperCase()}`, districtId: coimbatore._id },
    { name: 'Electrical Maintenance', code: `ELEC_${coimbatore._id.toString().slice(-4).toUpperCase()}`, districtId: coimbatore._id },
    { name: 'Roads & Infrastructure', code: `ROADS_${salem._id.toString().slice(-4).toUpperCase()}`, districtId: salem._id },
    { name: 'Sanitation & Solid Waste', code: `SAN_${salem._id.toString().slice(-4).toUpperCase()}`, districtId: salem._id },
  ];

  const deptMap = {};
  for (const dept of sampleDepts) {
    let d = await Department.findOne({ code: dept.code });
    if (!d) {
      d = await Department.create({ ...dept, isActive: true });
      console.log(`[Seed] Created department: ${dept.name} (${dept.code})`);
    }
    deptMap[dept.code] = d;
  }

  // 4. Routing rules for Coimbatore
  const cbRoadsCode = `ROADS_${coimbatore._id.toString().slice(-4).toUpperCase()}`;
  const cbSanCode = `SAN_${coimbatore._id.toString().slice(-4).toUpperCase()}`;
  const cbWaterCode = `WATER_${coimbatore._id.toString().slice(-4).toUpperCase()}`;
  const cbElecCode = `ELEC_${coimbatore._id.toString().slice(-4).toUpperCase()}`;

  const cbRoutingRules = [
    { categoryCode: 'POTHOLE', departmentId: deptMap[cbRoadsCode]?._id },
    { categoryCode: 'ROAD_DAMAGE', departmentId: deptMap[cbRoadsCode]?._id },
    { categoryCode: 'GARBAGE_ACCUMULATION', departmentId: deptMap[cbSanCode]?._id },
    { categoryCode: 'DRAINAGE_BLOCKAGE', departmentId: deptMap[cbSanCode]?._id },
    { categoryCode: 'SEWAGE_OVERFLOW', departmentId: deptMap[cbSanCode]?._id },
    { categoryCode: 'WATER_LEAKAGE', departmentId: deptMap[cbWaterCode]?._id },
    { categoryCode: 'WATERLOGGING', departmentId: deptMap[cbWaterCode]?._id },
    { categoryCode: 'BROKEN_STREETLIGHT', departmentId: deptMap[cbElecCode]?._id },
    { categoryCode: 'DAMAGED_PUBLIC_INFRASTRUCTURE', departmentId: deptMap[cbRoadsCode]?._id },
    { categoryCode: 'FALLEN_TREE', departmentId: deptMap[cbSanCode]?._id },
  ];

  for (const rule of cbRoutingRules) {
    if (!rule.departmentId) continue;
    await RoutingRule.findOneAndUpdate(
      { districtId: coimbatore._id, categoryCode: rule.categoryCode },
      { $set: { departmentId: rule.departmentId, isActive: true } },
      { upsert: true }
    );
  }
  console.log('[Seed] Routing rules seeded for Coimbatore.');

  // 5. Super Admin
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@aadhirai.gov.in';
  let superAdmin = await User.findOne({ email: superAdminEmail });
  if (!superAdmin) {
    const hash = await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD || 'Aadhirai@2026', 12);
    superAdmin = await User.create({
      name: process.env.SUPER_ADMIN_NAME || 'AADHIRAI Super Administrator',
      email: superAdminEmail,
      mobile: '9000000001',
      passwordHash: hash,
      role: 'super_admin',
      isActive: true,
    });
    console.log('[Seed] Super Admin created:', superAdminEmail);
  }

  // 6. Default Citizen
  const citizenEmail = 'citizen@aadhirai.gov.in';
  let defaultCitizen = await User.findOne({ email: citizenEmail });
  if (!defaultCitizen) {
    const hash = await bcrypt.hash('Aadhirai@2026', 12);
    defaultCitizen = await User.create({
      name: 'Default Citizen',
      email: citizenEmail,
      mobile: '9000000002',
      passwordHash: hash,
      role: 'citizen',
      homeDistrictId: coimbatore._id,
      isActive: true,
    });
    console.log('[Seed] Default Citizen created:', citizenEmail);
  }

  // 7. Default Department Admin (Coimbatore Roads & Infrastructure)
  const deptAdminEmail = 'deptadmin@aadhirai.gov.in';
  let defaultDeptAdmin = await User.findOne({ email: deptAdminEmail });
  if (!defaultDeptAdmin) {
    const hash = await bcrypt.hash('Aadhirai@2026', 12);
    defaultDeptAdmin = await User.create({
      name: 'Coimbatore Roads Admin',
      email: deptAdminEmail,
      mobile: '9000000003',
      passwordHash: hash,
      role: 'department_admin',
      assignedDistrictId: coimbatore._id,
      departmentId: deptMap[cbRoadsCode]?._id,
      isActive: true,
    });
    console.log('[Seed] Default Department Admin created:', deptAdminEmail);
  }

  // 8. Default District Reviewer (Coimbatore)
  const reviewerEmail = 'reviewer@aadhirai.gov.in';
  let defaultReviewer = await User.findOne({ email: reviewerEmail });
  if (!defaultReviewer) {
    const hash = await bcrypt.hash('Aadhirai@2026', 12);
    defaultReviewer = await User.create({
      name: 'Coimbatore District Reviewer',
      email: reviewerEmail,
      mobile: '9000000004',
      passwordHash: hash,
      role: 'reviewer',
      assignedDistrictId: coimbatore._id,
      isActive: true,
    });
    console.log('[Seed] Default District Reviewer created:', reviewerEmail);
  }

  console.log('[Seed] Database seeding complete.');
  return { districtMap, deptMap };
}

module.exports = { seedDatabase };

