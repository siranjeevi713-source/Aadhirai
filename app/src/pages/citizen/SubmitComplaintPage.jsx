import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

export default function SubmitComplaintPage() {
  const navigate = useNavigate()

  // Form State
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [aiResult, setAiResult] = useState(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [citizenCategory, setCitizenCategory] = useState('')
  const [latitude, setLatitude] = useState(11.0168) // Default to Coimbatore
  const [longitude, setLongitude] = useState(76.9558)
  const [addressText, setAddressText] = useState('Gandhipuram Cross Cut Road, Coimbatore')
  const [landmark, setLandmark] = useState('Near Bus Stand')
  const [priority, setPriority] = useState('HIGH')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [successResult, setSuccessResult] = useState(null)

  const handleFileChange = async (e) => {
    const selected = e.target.files[0]
    if (!selected) return

    setFile(selected)
    setPreviewUrl(URL.createObjectURL(selected))
    setError(null)
    setAnalyzing(true)

    try {
      const formData = new FormData()
      formData.append('image', selected)

      const res = await api.post('/complaints/analyze-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const data = res.data
      const aiData = data.ai || data
      setAiResult(aiData)

      const isNonCivic = aiData.isCivicIssue === false || aiData.predictedCategory === 'NON_CIVIC_IMAGE' || aiData.isUnclear === true

      if (isNonCivic) {
        setCitizenCategory('NON_CIVIC_IMAGE')
        setTitle('')
        setDescription('')
        setError('⚠️ செல்லுபடியாகாத புகைப்படம்: இது பொதுப் பிரச்சனை (Civic Issue) அல்ல. தயவுசெய்து சாலைப் பள்ளம், தேங்கிய குப்பை, குடிநீர் கசிவு போன்ற பிரச்சனை புகைப்படத்தை பதிவேற்றவும். (The uploaded photo is not recognized as an actionable civic problem.)')
      } else {
        const detected = aiData.predictedCategory || aiData.predicted_category || 'GARBAGE_ACCUMULATION'
        setCitizenCategory(detected)
        setTitle(`${detected.replace(/_/g, ' ')} reported via AI`)
        setDescription(aiData.explanation || aiData.issue_description || `AI Computer Vision detected ${detected} with confidence ${((aiData.confidence || aiData.confidence_score || 0.9) * 100).toFixed(1)}%.`)
        setError(null)
      }
    } catch (err) {
      console.warn('AI analysis error, proceeding with manual categorization:', err)
      setCitizenCategory('GARBAGE_ACCUMULATION')
      setTitle('Civic problem reported by citizen')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude)
          setLongitude(pos.coords.longitude)
        },
        (err) => {
          console.warn('Location access denied, keeping manual coordinates:', err)
        }
      )
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (citizenCategory === 'NON_CIVIC_IMAGE') {
      setError('⚠️ செல்லுபடியாகாத புகார்: பொதுப் பிரச்சனை அல்லாத புகைப்படத்தை சமர்ப்பிக்க முடியாது. தயவுசெய்து சரியான பிரச்சனையின் புகைப்படத்தை பதிவேற்றவும். (Cannot submit non-civic photos. Please upload a genuine civic issue.)')
      return
    }

    setSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
      formData.append('citizenConfirmedCategory', citizenCategory)
      formData.append('latitude', latitude)
      formData.append('longitude', longitude)
      formData.append('addressText', addressText)
      formData.append('landmark', landmark)
      formData.append('priority', priority)

      if (file) {
        formData.append('evidenceFile', file)
      }

      const res = await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setSuccessResult(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit complaint.')
    } finally {
      setSubmitting(false)
    }
  }

  if (successResult) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '40px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px', fontWeight: 900 }}>
            ✓
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#082D50', margin: '0 0 8px' }}>
            Complaint Successfully Submitted!
          </h2>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#075CE5', marginBottom: '16px' }}>
            Ticket Number: {successResult.ticketNumber}
          </div>
          <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', textAlign: 'left', marginBottom: '24px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div><strong>Incident District:</strong> {successResult.incidentDistrict || 'Auto-Detected'}</div>
            <div><strong>Routed Department:</strong> {successResult.assignedDepartment || 'Routed Successfully'}</div>
            <div><strong>Initial Status:</strong> SUBMITTED → ROUTED</div>
            <div><strong>SLA Commitment:</strong> {successResult.slaHours || 48} Hours</div>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={() => navigate('/citizen/complaints')} className="btn btn-primary">
              View in My Complaints
            </button>
            <button onClick={() => { setSuccessResult(null); setFile(null); setPreviewUrl(null); }} className="btn btn-secondary">
              Report Another Problem
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px', color: '#082D50' }}>Report a Civic Problem</h1>
        <p style={{ margin: 0, color: '#64748B', fontSize: '13px' }}>AI-powered image analysis & GIS auto-routing to the responsible district department</p>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#FEE2E2', color: '#991B1B', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Step 1: Image Upload */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
            Step 1: Upload Photo of the Problem *
          </label>
          <input
            type="file"
            accept="image/*"
            required
            onChange={handleFileChange}
            className="input-field"
          />
          {analyzing && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#075CE5', fontWeight: 600 }}>
              Analyzing image with computer vision model on port 8001...
            </div>
          )}
          {previewUrl && (
            <div style={{ marginTop: '12px', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <img src={previewUrl} alt="Preview" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #CBD5E1' }} />
              {aiResult && (
                aiResult.isCivicIssue === false || aiResult.predictedCategory === 'NON_CIVIC_IMAGE' || aiResult.isUnclear ? (
                  <div style={{ padding: '14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', flex: 1, fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ fontWeight: 800, color: '#DC2626', fontSize: '14px' }}>
                        ⚠️ பொதுப் பிரச்சனை அல்ல / Not a Civic Issue
                      </div>
                      <span style={{ background: '#FEE2E2', color: '#B91C1C', padding: '2px 8px', borderRadius: '999px', fontWeight: 700, fontSize: '11px' }}>
                        செல்லுபடியாகாது / Rejected
                      </span>
                    </div>
                    <div style={{ color: '#991B1B', marginBottom: '6px', lineHeight: 1.4 }}>
                      <strong>AI விளக்கம்:</strong> {aiResult.explanation || aiResult.issue_description || 'The uploaded photo does not contain an actionable civic municipal defect.'}
                    </div>
                    <div style={{ color: '#B91C1C', fontWeight: 600, fontSize: '11px' }}>
                      🚫 இந்த புகைப்படத்தை புகாராக சமர்ப்பிக்க முடியாது. தயவுசெய்து சாலைப் பள்ளம், தேங்கிய குப்பை, குடிநீர் கசிவு, பழுதான தெருவிளக்கு போன்ற உண்மையான பொதுப் பிரச்சனையின் புகைப்படத்தை பதிவேற்றவும்.
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', flex: 1, fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ fontWeight: 800, color: '#166534', fontSize: '14px' }}>
                        ✓ AI கண்டறிந்தது: {aiResult.predictedCategory || aiResult.predicted_category}
                      </div>
                      <span style={{ background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: '999px', fontWeight: 700, fontSize: '11px' }}>
                        {((aiResult.confidence || aiResult.confidence_score || 0.9) * 100).toFixed(1)}% Confidence
                      </span>
                    </div>
                    <div style={{ color: '#334155', marginBottom: '4px', lineHeight: 1.4 }}>
                      <strong>விளக்கம்:</strong> {aiResult.explanation || aiResult.issue_description || 'Visual evidence identified.'}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', color: '#1E293B', marginTop: '6px', fontSize: '12px', background: '#DCFCE7', padding: '6px 10px', borderRadius: '6px' }}>
                      <div><strong>ஒதுக்கப்படும் அரசு துறை:</strong> {aiResult.suggestedDepartment || aiResult.suggested_department || 'Municipal Administration'}</div>
                      <div><strong>தீவிரம் (Severity):</strong> {aiResult.suggestedSeverity || aiResult.suggested_severity || 'HIGH'}</div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Step 2: Confirm Category */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
            Step 2: Confirm Category * (AI suggested above, you can modify if needed)
          </label>
          <select
            value={citizenCategory}
            onChange={e => {
              setCitizenCategory(e.target.value)
              if (e.target.value !== 'NON_CIVIC_IMAGE') setError(null)
            }}
            className="input-field"
            required
          >
            {citizenCategory === 'NON_CIVIC_IMAGE' && (
              <option value="NON_CIVIC_IMAGE">⚠️ பொதுப் பிரச்சனை அல்ல (செல்லுபடியாகாத புகைப்படம் - சமர்ப்பிக்க முடியாது)</option>
            )}
            <option value="GARBAGE_ACCUMULATION">குப்பை குவிப்பு / Garbage Accumulation (துப்புரவு & திடக்கழிவு மேலாண்மை துறை)</option>
            <option value="POTHOLE">சாலைக் குழி / Pothole (சாலை & உள்கட்டமைப்பு துறை)</option>
            <option value="ROAD_DAMAGE">சாலை சேதம் / Road Damage (சாலை & உள்கட்டமைப்பு துறை)</option>
            <option value="DRAINAGE_BLOCKAGE">வடிகால் அடைப்பு / Drainage Blockage (துப்புரவு & வடிகால் துறை)</option>
            <option value="SEWAGE_OVERFLOW">கழிவுநீர் பெருக்கெடுப்பு / Sewage Overflow (துப்புரவு துறை)</option>
            <option value="WATER_LEAKAGE">குடிநீர் குழாய் கசிவு / Water Leakage (குடிநீர் வழங்கல் துறை)</option>
            <option value="WATERLOGGING">மழைநீர் தேக்கம் / Waterlogging (குடிநீர் & வடிகால் துறை)</option>
            <option value="BROKEN_STREETLIGHT">பழுதான தெருவிளக்கு / Broken Streetlight (மின்சார பராமரிப்பு துறை)</option>
            <option value="DAMAGED_PUBLIC_INFRASTRUCTURE">பொதுக் கட்டமைப்பு சேதம் / Damaged Infrastructure (பொதுப்பணித்துறை)</option>
            <option value="FALLEN_TREE">விழுந்த மரம் / Fallen Tree (நெடுஞ்சாலை & பூங்கா துறை)</option>
            <option value="OTHER / UNCLEAR">மற்றவை / Other Civic Defect (நகராட்சி பொது நிர்வாகம்)</option>
          </select>
        </div>

        {/* Step 3: Location (GeoJSON) */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700 }}>
              Step 3: Incident GPS Location *
            </label>
            <button type="button" onClick={handleGetLocation} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>
              📍 Use Current Device GPS
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#64748B' }}>Latitude</span>
              <input type="number" step="0.0001" required value={latitude} onChange={e => setLatitude(parseFloat(e.target.value))} className="input-field" />
            </div>
            <div>
              <span style={{ fontSize: '11px', color: '#64748B' }}>Longitude</span>
              <input type="number" step="0.0001" required value={longitude} onChange={e => setLongitude(parseFloat(e.target.value))} className="input-field" />
            </div>
          </div>
          <div style={{ fontSize: '11px', color: '#64748B' }}>
            The backend uses these GPS coordinates to auto-detect the incident district (e.g. Coimbatore coordinates route to Coimbatore Roads Dept, even if your home is Salem).
          </div>
        </div>

        {/* Step 4: Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Address / Street *</label>
            <input type="text" required value={addressText} onChange={e => setAddressText(e.target.value)} className="input-field" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Landmark</label>
            <input type="text" value={landmark} onChange={e => setLandmark(e.target.value)} className="input-field" />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Complaint Title *</label>
          <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="input-field" />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>Description *</label>
          <textarea required rows="3" value={description} onChange={e => setDescription(e.target.value)} className="input-field" />
        </div>

        <button type="submit" disabled={submitting || analyzing} className="btn btn-primary" style={{ padding: '14px', fontSize: '14px', marginTop: '10px' }}>
          {submitting ? 'Submitting & Routing...' : 'Submit Grievance to Department →'}
        </button>
      </form>
    </div>
  )
}

