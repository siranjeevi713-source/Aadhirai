import React, { useState, useEffect } from 'react'
import api from '../../services/api'

export default function DistrictsPage() {
  const [districts, setDistricts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchDistricts()
  }, [])

  const fetchDistricts = () => {
    setLoading(true)
    api.get('/super-admin/districts')
      .then(res => setDistricts(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  const filtered = districts.filter(d => 
    d.nameEn.toLowerCase().includes(search.toLowerCase()) || 
    d.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px', color: '#082D50' }}>District Management</h1>
          <p style={{ margin: 0, color: '#64748B', fontSize: '13px' }}>Configure districts and GeoJSON central coordinates</p>
        </div>
        <input
          type="text"
          placeholder="Filter districts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field"
          style={{ width: '220px' }}
        />
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>District Name (English)</th>
              <th>District Name (Tamil)</th>
              <th>GeoJSON Center (Lat, Lng)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>Loading districts...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>No districts found.</td></tr>
            ) : (
              filtered.map(d => (
                <tr key={d._id}>
                  <td style={{ fontWeight: 700, color: '#075CE5' }}>{d.code}</td>
                  <td style={{ fontWeight: 600 }}>{d.nameEn}</td>
                  <td>{d.nameTa}</td>
                  <td style={{ fontSize: '12px', color: '#64748B' }}>
                    {d.center?.coordinates ? `${d.center.coordinates[1].toFixed(4)}, ${d.center.coordinates[0].toFixed(4)}` : 'N/A'}
                  </td>
                  <td>
                    <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: d.isActive ? '#DCFCE7' : '#F1F5F9', color: d.isActive ? '#15803D' : '#64748B' }}>
                      {d.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
