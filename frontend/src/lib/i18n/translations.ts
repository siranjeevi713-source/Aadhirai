export type Language = "ta" | "en";

export const translations = {
  ta: {
    // Brand & Header
    brandName: "ஆதிரை (AADHIRAI)",
    tagline: "புகார்கள் சமர்ப்பிப்பில் முடிவதில்லை. அவை ஆதாரத்தில் மட்டுமே முடிவடைகின்றன.",
    pilotBadge: "முசிறி நகராட்சி பைலட் திட்டம்",
    
    // Navigation
    home: "முகப்பு",
    citizenPortal: "குடிமக்கள் தளம்",
    officerPortal: "அலுவலர் தளம்",
    adminPortal: "நிர்வாகக் கட்டளைத் தளம்",
    publicProof: "பொதுச் சான்று தேடல்",
    login: "உள்நுழைவு",
    register: "பதிவு செய்க",
    logout: "வெளியேறு",
    myComplaints: "எனது புகார்கள்",
    submitComplaint: "புதிய புகார் பதிவு",
    profile: "சுயவிவரம்",
    
    // Statuses
    SUBMITTED: "சமர்ப்பிக்கப்பட்டது",
    ASSIGNED: "ஒதுக்கப்பட்டது",
    IN_PROGRESS: "பணியில் உள்ளது",
    RESOLVED_PENDING_VERIFICATION: "சரிபார்ப்பு நிலுவையில்",
    VERIFIED_RESOLVED: "சரிபார்க்கப்பட்டு தீர்க்கப்பட்டது",
    NEEDS_REVIEW: "ஆய்வு தேவை",
    DISPUTED: "மறுக்கப்பட்டது (சர்ச்சை)",
    REOPENED: "மீண்டும் திறக்கப்பட்டது",

    // Dashboard Metrics
    totalGrievances: "மொத்த புகார்கள்",
    pendingAction: "நடவடிக்கை நிலுவையில்",
    activeRepairs: "நடைபெறும் பணிகள்",
    verifiedResolutions: "சரிபார்க்கப்பட்ட தீர்வுகள்",
    slaCompliance: "SLA காலக்கெடு இணக்கம்",
    averageTurnaround: "சராசரி தீர்வு நேரம்",
    hours: "மணிநேரம்",
    
    // Forms
    complaintTitle: "புகார் தலைப்பு",
    complaintDesc: "புகார் விவரம் (தமிழ் அல்லது ஆங்கிலம்)",
    selectCategory: "துறை வகை தேர்வு",
    gpsLocation: "ஜி.பி.எஸ் இருப்பிடம்",
    landmark: "அடையாளம் / தெருப் பெயர்",
    uploadEvidence: "ஆதார புகைப்படம் / வீடியோ பதிவேற்றம்",
    aiAssistant: "ஹைபிரிட் AI பகுப்பாய்வு",
    aiDetected: "AI கண்டறிந்த வகை:",
    aiConfidence: "நம்பகத்தன்மை:",
    submitBtn: "புகாரை உறுதிசெய்து சமர்ப்பி",
    submitting: "பதிவேற்றப்படுகிறது...",
    
    // Officer Station
    assignedComplaints: "ஒதுக்கப்பட்ட புகார்கள்",
    acceptTask: "பொறுப்பேற்று பணியைத் தொடங்கு",
    createWorkOrder: "வேலை உத்தரவு (Work Order) உருவாக்கு",
    workOrderTitle: "பணி தலைப்பு",
    actionPlan: "செயல் திட்டம்",
    budgetEstimate: "மதிப்பீட்டுத் தொகை (ரூ.)",
    uploadResolutionProof: "தீர்வுக்கான ஆதாரப் புகைப்படத்தைப் பதிவேற்று",
    officerNotes: "அலுவலர் குறிப்புகள்",
    submitForVerification: "சுயாதீன சரிபார்ப்புக்கு சமர்ப்பி",

    // Independent Verification
    verificationStation: "சுயாதீன தீர்வு சரிபார்ப்பு",
    beforeEvidence: "முந்தைய புகைப்படம் (புகார்)",
    afterEvidence: "பிந்தைய புகைப்படம் (தீர்வு)",
    pHashCheck: "டிஜிட்டல் பட மறுபயன்பாட்டு சோதனை (pHash)",
    pHashPassed: "பாஸ்: புதிய தீர்வு புகைப்படம்",
    pHashFraud: "எச்சரிக்கை: அதே புகைப்படம் மீண்டும் பதிவேற்றப்பட்டுள்ளது!",
    approveResolution: "தீர்வை ஏற்று பொதுச் சான்றாக வெளியிடு",
    rejectResolution: "நிராகரித்து மீண்டும் பணிக்கு அனுப்பு",
    justification: "நிர்வாகக் காரண விளக்கம்",

    // Citizen Actions
    rateResolution: "தீர்வுக்கான திருப்தி மதிப்பீடு",
    disputeButton: "தீர்வை மறுத்து மேல்முறையீடு செய் (Dispute)",
    disputeReason: "மறுப்புக்கான காரணம்",

    // Public Proof
    publicProofTitle: "பொதுச் சான்று மற்றும் வெளிப்படைத்தன்மை அறிக்கை",
    publicReference: "பொதுக் குறிப்பு எண்",
    proofSummary: "சரிபார்ப்புச் சுருக்கம்",
    scanQR: "டிஜிட்டல் சரிபார்ப்பு QR குறியீடு",
    privacyNotice: "தனியுரிமைப் பாதுகாப்பு: குடிமக்களின் தொலைபேசி எண், மின்னஞ்சல் மற்றும் துல்லியமான முகவரி பொதுப் பார்வையில் மறைக்கப்பட்டுள்ளது.",

    // General UI
    search: "தேடுக...",
    filter: "வடிகட்டு",
    viewDetails: "விவரங்களைப் பார்",
    noData: "தரவுகள் ஏதுமில்லை",
    errorOccurred: "பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.",
    success: "வெற்றி!",
  },
  en: {
    // Brand & Header
    brandName: "AADHIRAI (ஆதிரை)",
    tagline: "Complaints don't end at submit. They end at proof.",
    pilotBadge: "Musiri Municipality Pilot Project",
    
    // Navigation
    home: "Home",
    citizenPortal: "Citizen Portal",
    officerPortal: "Officer Portal",
    adminPortal: "Admin Command",
    publicProof: "Public Proof Search",
    login: "Login",
    register: "Register",
    logout: "Logout",
    myComplaints: "My Grievances",
    submitComplaint: "Submit Grievance",
    profile: "Profile",

    // Statuses
    SUBMITTED: "Submitted",
    ASSIGNED: "Assigned",
    IN_PROGRESS: "In Progress",
    RESOLVED_PENDING_VERIFICATION: "Pending Verification",
    VERIFIED_RESOLVED: "Verified Resolved",
    NEEDS_REVIEW: "Needs Review",
    DISPUTED: "Disputed",
    REOPENED: "Reopened",

    // Dashboard Metrics
    totalGrievances: "Total Complaints",
    pendingAction: "Pending Triage",
    activeRepairs: "In Progress",
    verifiedResolutions: "Verified Proofs",
    slaCompliance: "SLA Compliance",
    averageTurnaround: "Avg Turnaround",
    hours: "hours",

    // Forms
    complaintTitle: "Complaint Title",
    complaintDesc: "Description (Tamil or English)",
    selectCategory: "Select Category",
    gpsLocation: "GPS Coordinates",
    landmark: "Landmark / Street Address",
    uploadEvidence: "Upload Photo / Video Evidence",
    aiAssistant: "Hybrid AI Intelligence",
    aiDetected: "AI Suggested Category:",
    aiConfidence: "Confidence:",
    submitBtn: "Confirm & Submit Grievance",
    submitting: "Submitting...",

    // Officer Station
    assignedComplaints: "Assigned Grievances",
    acceptTask: "Accept Assignment",
    createWorkOrder: "Create Work Order",
    workOrderTitle: "Work Order Title",
    actionPlan: "Action Plan",
    budgetEstimate: "Estimated Cost (INR)",
    uploadResolutionProof: "Upload Resolution Evidence Photo",
    officerNotes: "Officer Remarks",
    submitForVerification: "Submit to Verification Pipeline",

    // Independent Verification
    verificationStation: "Independent Evidence Verification",
    beforeEvidence: "Before Repair (Citizen Evidence)",
    afterEvidence: "After Repair (Officer Proof)",
    pHashCheck: "Perceptual Hash Duplicate Check",
    pHashPassed: "Passed: Unique new repair photo",
    pHashFraud: "ALERT: Duplicate / Reused Photo Detected!",
    approveResolution: "Approve & Publish Public Proof",
    rejectResolution: "Reject & Reopen for Rework",
    justification: "Review Justification",

    // Citizen Actions
    rateResolution: "Rate Resolution Quality",
    disputeButton: "Dispute Resolution",
    disputeReason: "Reason for Dispute",

    // Public Proof
    publicProofTitle: "Public Proof & Open Governance Certificate",
    publicReference: "Public Reference No",
    proofSummary: "Verification Audit Summary",
    scanQR: "Verification QR Code",
    privacyNotice: "Privacy Guaranteed: Citizen phone, email, and exact residential premises are strictly sanitized from public display.",

    // General UI
    search: "Search...",
    filter: "Filter",
    viewDetails: "View Details",
    noData: "No records found",
    errorOccurred: "An error occurred. Please try again.",
    success: "Success!",
  }
};
