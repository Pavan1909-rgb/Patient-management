import React, { useState, useEffect } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

const initialFormState = {
  name: '',
  age: '',
  gender: 'Male',
  diagnosis: '',
  contactNumber: ''
}

export default function App() {
  const [patients, setPatients] = useState([])
  const [formData, setFormData] = useState(initialFormState)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Fetch all patients
  const fetchPatients = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/patients`)
      if (!response.ok) {
        throw new Error(`Failed to load patients (Status ${response.status})`)
      }
      const data = await response.json()
      setPatients(data)
    } catch (err) {
      setError(err.message || 'Error connecting to backend API')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  // Submit form (Add or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Patient name is required')
      return
    }

    const payload = {
      name: formData.name.trim(),
      age: formData.age ? parseInt(formData.age, 10) : null,
      gender: formData.gender,
      diagnosis: formData.diagnosis.trim(),
      contactNumber: formData.contactNumber.trim()
    }

    try {
      if (editingId) {
        // Update patient
        const response = await fetch(`${API_BASE_URL}/api/patients/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!response.ok) throw new Error('Failed to update patient')
      } else {
        // Add new patient
        const response = await fetch(`${API_BASE_URL}/api/patients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!response.ok) throw new Error('Failed to add patient')
      }

      setFormData(initialFormState)
      setEditingId(null)
      fetchPatients()
    } catch (err) {
      alert(err.message || 'Operation failed')
    }
  }

  // Populate form for editing
  const handleEdit = (patient) => {
    setEditingId(patient.id)
    setFormData({
      name: patient.name || '',
      age: patient.age !== null && patient.age !== undefined ? patient.age.toString() : '',
      gender: patient.gender || 'Male',
      diagnosis: patient.diagnosis || '',
      contactNumber: patient.contactNumber || ''
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Cancel editing
  const handleCancel = () => {
    setEditingId(null)
    setFormData(initialFormState)
  }

  // Delete patient
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/patients/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete patient')
      fetchPatients()
    } catch (err) {
      alert(err.message || 'Could not delete patient')
    }
  }

  return (
    <div className="container">
      <header>
        <div>
          <h1>Patient Management System</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Simple CRUD Application</p>
        </div>
        <span className="badge">Total Patients: {patients.length}</span>
      </header>

      {error && (
        <div className="alert alert-danger">
          <strong>Error: </strong> {error}
          <button
            onClick={fetchPatients}
            style={{ marginLeft: 12, padding: '4px 8px', fontSize: '0.8rem' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Patient Form */}
      <section className="card">
        <h2>{editingId ? 'Edit Patient' : 'Add New Patient'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g. John Doe"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="age">Age</label>
              <input
                id="age"
                name="age"
                type="number"
                placeholder="e.g. 45"
                min="0"
                max="130"
                value={formData.age}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="diagnosis">Diagnosis</label>
              <input
                id="diagnosis"
                name="diagnosis"
                type="text"
                placeholder="e.g. Type 2 Diabetes"
                value={formData.diagnosis}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="contactNumber">Contact Number</label>
              <input
                id="contactNumber"
                name="contactNumber"
                type="tel"
                placeholder="e.g. +1 555-1234"
                value={formData.contactNumber}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-actions">
            {editingId && (
              <button type="button" className="btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            )}
            <button type="submit" className="btn-primary">
              {editingId ? 'Update Patient' : 'Add Patient'}
            </button>
          </div>
        </form>
      </section>

      {/* Patient List */}
      <section className="card">
        <h2>Patient Records</h2>
        {loading ? (
          <p className="empty-state">Loading patient records...</p>
        ) : patients.length === 0 ? (
          <p className="empty-state">No patient records found. Add one above.</p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Diagnosis</th>
                  <th>Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id}>
                    <td>#{patient.id}</td>
                    <td><strong>{patient.name}</strong></td>
                    <td>{patient.age ?? '-'}</td>
                    <td>{patient.gender || '-'}</td>
                    <td>{patient.diagnosis || '-'}</td>
                    <td>{patient.contactNumber || '-'}</td>
                    <td>
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(patient)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(patient.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

