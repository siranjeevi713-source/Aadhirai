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
      setAiResult(data)
      const detected = data.predictedCategory || data.predicted_category || 'ROAD_DAMAGE'
      setCitizenCategory(detected)
      setTitle(`${detected.replace(/_/g, ' ')} reported via AI`)
      setDescription(`AI Computer Vision detected ${detected} with confidence ${(data.confidence || data.confidence_score || 0.9).toFixed(2)}.`)
    } catch (err) {
      console.warn('AI analysis error, proceeding with manual categorization:', err)
      setCitizenCategory('ROAD_DAMAGE')
      setTitle('Civic problem reported on road')
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
                <div style={{ padding: '12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', flex: 1, fontSize: '12px' }}>
                  <div style={{ fontWeight: 800, color: '#166534', marginBottom: '4px' }}>
                    AI Detection: {aiResult.predictedCategory || aiResult.predicted_category}
                  </div>
                  <div style={{ color: '#15803D' }}>
                    Confidence: {((aiResult.confidence || aiResult.confidence_score || 0.9) * 100).toFixed(1)}%
                  </div>
                  <div style={{ color: '#475569', marginTop: '4px' }}>
                    Suggested Dept: {aiResult.suggestedDepartment || 'Highways & Infrastructure'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Confirm Category */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
            Step 2: Confirm Category *
          </label>
          <select
            value={citizenCategory}
            onChange={e => setCitizenCategory(e.target.value)}
            className="input-field"
            required
          >
            <option value="ROAD_DAMAGE">Road Damage (Pothole / Broken Asphalt)</option>
            <option value="GARBAGE_ACCUMULATION">Garbage Accumulation & Waste</option>
            <option value="DRAINAGE_OVERFLOW">Drainage Overflow / Blocked Canal</option>
            <option value="WATER_LEAKAGE">Water Supply Pipe Leakage</option>
            <option value="BROKEN_STREETLIGHT">Broken Streetlight / Electrical Pole</option>
            <option value="FALLEN_TREE">Fallen Tree / Infrastructure Damage</option>
            <option value="PUBLIC_PROPERTY_DAMAGE">Public Property Damage</option>
            <option value="SEWAGE_OVERFLOW">Sewage Overflow</option>
            <option value="OTHER_UNCLEAR">Other / Unclear</option>
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

