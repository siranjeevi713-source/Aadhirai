import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import StatusBadge from '../../components/StatusBadge'

export default function HomePage() {
  const [ticketNumber, setTicketNumber] = useState('')
  const [trackResult, setTrackResult] = useState(null)
  const [trackLoading, setTrackLoading] = useState(false)
  const [trackError, setTrackError] = useState(null)

  const handleTrack = async (e) => {
    e.preventDefault()
    if (!ticketNumber.trim()) return
    setTrackError(null)
    setTrackResult(null)
    setTrackLoading(true)

    try {
      const res = await api.get(`/complaints/public/${encodeURIComponent(ticketNumber.trim())}`)
      setTrackResult(res.data)
    } catch (err) {
      setTrackError(err.response?.data?.message || 'Complaint not found. Please verify ticket number (e.g. ADH-2026-COI-0001).')
    } finally {
      setTrackLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F4F8FC' }}>
      {/* Top Header */}
      <header style={{ background: '#082D50', color: '#fff', padding: '12px 24px', borderBottom: '1px solid #064A86' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #13C6B5, #075CE5)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              A
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '0.5px' }}>AADHIRAI</div>
              <div style={{ fontSize: '10px', color: '#13C6B5', fontWeight: 600 }}>NAMMAOOR AI • CIVIC ACCOUNTABILITY ENGINE</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/login" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }}>
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '12px' }}>
              Register as Citizen
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ background: 'linear-gradient(180deg, #082D50 0%, #064A86 100%)', color: '#fff', padding: '60px 24px 80px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', padding: '6px 14px', background: 'rgba(19, 198, 181, 0.15)', border: '1px solid rgba(19, 198, 181, 0.3)', borderRadius: '20px', color: '#13C6B5', fontSize: '12px', fontWeight: 700, marginBottom: '20px' }}>
            AI-Powered Civic Accountability Platform
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: 900, lineHeight: 1.2, margin: '0 0 16px' }}>
            A Cleaner, Safer, Better <span style={{ color: '#13C6B5' }}>Tamil Nadu</span>
          </h1>
          <p style={{ fontSize: '16px', color: '#CBD5E1', maxWidth: '640px', margin: '0 auto 32px', lineHeight: 1.6 }}>
            Report civic problems with a photo. Let AI identify the issue, automatically route it to the responsible district department, and verify resolution with photographic proof.
          </p>

          {/* Action CTAs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '14px' }}>
              Report a Civic Problem
            </Link>
            <Link to="/login" className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: '14px' }}>
              Access Dashboard
            </Link>
          </div>

          {/* Quick Track Box */}
          <div style={{ marginTop: '48px', maxWidth: '580px', margin: '48px auto 0', background: 'rgba(255, 255, 255, 0.95)', padding: '24px', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', color: '#0F172A', textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px', color: '#082D50' }}>
              Track Complaint by Ticket Number
            </div>
            <form onSubmit={handleTrack} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Enter Ticket # (e.g. ADH-2026-COI-0001)"
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value)}
                className="input-field"
                style={{ flex: 1 }}
                required
              />
              <button type="submit" disabled={trackLoading} className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                {trackLoading ? 'Searching...' : 'Track'}
              </button>
            </form>

            {trackError && (
              <div style={{ marginTop: '12px', padding: '10px 14px', background: '#FEE2E2', color: '#991B1B', borderRadius: '8px', fontSize: '12px' }}>
                {trackError}
              </div>
            )}

            {trackResult && (
              <div style={{ marginTop: '16px', padding: '14px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '13px', color: '#075CE5' }}>{trackResult.ticketNumber}</span>
                  <StatusBadge status={trackResult.status} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{trackResult.title}</div>
                <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '6px' }}>{trackResult.description}</div>
                <div style={{ fontSize: '11px', color: '#475569', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <span><strong>District:</strong> {trackResult.district?.nameEn || 'N/A'}</span>
                  <span><strong>Category:</strong> {trackResult.category?.nameEn || 'N/A'}</span>
                  <span><strong>Dept:</strong> {trackResult.assignedDepartment?.nameEn || 'Routing Pending'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4 Feature Steps */}
      <section style={{ maxWidth: '1200px', margin: '-40px auto 60px', padding: '0 24px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#EFF6FF', color: '#075CE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontWeight: 900 }}>1</div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px', color: '#082D50' }}>Citizen Photo Report</h3>
            <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
              Citizens upload a photo with GPS location. AI validates image clarity before submission.
            </p>
          </div>

          <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F5F3FF', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontWeight: 900 }}>2</div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px', color: '#082D50' }}>AI Vision & SLA</h3>
            <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
              FastAPI ML engine detects issue type, scores confidence, and assigns priority SLA.
            </p>
          </div>

          <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontWeight: 900 }}>3</div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px', color: '#082D50' }}>GIS Auto-Routing</h3>
            <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
              GeoJSON coordinates determine incident district and route directly to the designated department.
            </p>
          </div>

          <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontWeight: 900 }}>4</div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px', color: '#082D50' }}>Verified Proof</h3>
            <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
              Independent reviewer verifies resolution evidence before complaint is marked VERIFIED.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', background: '#082D50', color: '#94A3B8', padding: '32px 24px', fontSize: '12px', textAlign: 'center', borderTop: '1px solid #064A86' }}>
        <p style={{ margin: 0 }}>AADHIRAI Civic Accountability Platform • Tamil Nadu GovTech</p>
        <p style={{ margin: '4px 0 0', color: '#64748B' }}>Complaints don't end at submit. They end at proof.</p>
      </footer>
    </div>
  )
}
