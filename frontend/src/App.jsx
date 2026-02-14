import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [backendStatus, setBackendStatus] = useState('')
  const [dbStatus, setDbStatus] = useState('')
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [parentId, setParentId] = useState(localStorage.getItem('parentId') || '')
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [assessments, setAssessments] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('children')
  
  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ full_name: '', email: '', phone: '', password: '' })
  const [childForm, setChildForm] = useState({ full_name: '', grade: '' })
  const [assessmentForm, setAssessmentForm] = useState({
    assessment_date: new Date().toISOString().split('T')[0],
    letter_recognition_score: '',
    word_reading_score: '',
    comprehension_score: '',
    overall_evaluation: ''
  })

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

  // Check backend health
  useEffect(() => {
    checkBackendHealth()
    checkDatabaseStatus()
  }, [])

  // Load data when authenticated
  useEffect(() => {
    if (token && parentId) {
      fetchChildren()
      fetchActivities()
    }
  }, [token, parentId])

  const checkBackendHealth = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/health`)
      setBackendStatus(`✓ ${response.data.status}`)
      setError('')
    } catch (err) {
      setBackendStatus('✗ Backend is not running')
      setError('Unable to connect to backend')
    }
  }

  const checkDatabaseStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/db-status`)
      setDbStatus('✓ Database connected')
    } catch (err) {
      setDbStatus('✗ Database not connected')
    }
  }

  const fetchChildren = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/children`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setChildren(response.data)
      if (response.data.length > 0 && !selectedChild) {
        setSelectedChild(response.data[0].id)
        fetchAssessments(response.data[0].id)
      }
      setError('')
    } catch (err) {
      console.error('Error fetching children:', err)
      setError('Failed to fetch children')
    } finally {
      setLoading(false)
    }
  }

  const fetchAssessments = async (childId) => {
    try {
      const response = await axios.get(`${API_URL}/api/assessments/child/${childId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAssessments(response.data)
    } catch (err) {
      console.error('Error fetching assessments:', err)
      setAssessments([])
    }
  }

  const fetchActivities = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/activities`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setActivities(response.data)
    } catch (err) {
      console.error('Error fetching activities:', err)
      setActivities([])
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const response = await axios.post(`${API_URL}/api/parents/login`, loginForm)
      const { token, parentId } = response.data
      setToken(token)
      setParentId(parentId)
      localStorage.setItem('token', token)
      localStorage.setItem('parentId', parentId)
      setLoginForm({ email: '', password: '' })
      setError('')
    } catch (err) {
      setError('Login failed: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await axios.post(`${API_URL}/api/parents/register`, registerForm)
      setRegisterForm({ full_name: '', email: '', phone: '', password: '' })
      setError('')
      alert('Registration successful! Please login.')
      setActiveTab('login')
    } catch (err) {
      setError('Registration failed: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleAddChild = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await axios.post(`${API_URL}/api/children`, childForm, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setChildForm({ full_name: '', grade: '' })
      await fetchChildren()
      setError('')
    } catch (err) {
      setError('Failed to create child: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleRecordAssessment = async (e) => {
    e.preventDefault()
    if (!selectedChild) {
      setError('Please select a child first')
      return
    }
    try {
      setLoading(true)
      await axios.post(`${API_URL}/api/assessments`, {
        child_id: selectedChild,
        ...assessmentForm
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAssessmentForm({
        assessment_date: new Date().toISOString().split('T')[0],
        letter_recognition_score: '',
        word_reading_score: '',
        comprehension_score: '',
        overall_evaluation: ''
      })
      await fetchAssessments(selectedChild)
      setError('')
    } catch (err) {
      setError('Failed to record assessment: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setToken('')
    setParentId('')
    setChildren([])
    setSelectedChild(null)
    setAssessments([])
    setActivities([])
    localStorage.removeItem('token')
    localStorage.removeItem('parentId')
    setActiveTab('login')
  }

  if (!token) {
    return (
      <div className="app">
        <header className="header">
          <h1>Dyslexia Support Platform</h1>
          <div className="status">
            <span className={backendStatus.includes('✓') ? 'success' : 'error'}>
              {backendStatus || 'Checking...'}
            </span>
            {' | '}
            <span className={dbStatus.includes('✓') ? 'success' : 'error'}>
              {dbStatus || 'Checking...'}
            </span>
          </div>
        </header>

        <main className="auth-section">
          <div className="auth-container">
            {error && <div className="error-message">{error}</div>}
            
            <div className="auth-tabs">
              <button
                className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => { setActiveTab('login'); setError(''); }}
              >
                Login
              </button>
              <button
                className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => { setActiveTab('register'); setError(''); }}
              >
                Register
              </button>
            </div>

            {activeTab === 'login' && (
              <form onSubmit={handleLogin} className="auth-form">
                <h2>Parent Login</h2>
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder="your@email.com"
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label>Password:</label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="Your password"
                    disabled={loading}
                  />
                </div>
                <button type="submit" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </button>
                <p className="help-text">Demo: john.smith@example.com / hashed_password_1</p>
              </form>
            )}

            {activeTab === 'register' && (
              <form onSubmit={handleRegister} className="auth-form">
                <h2>Register as Parent</h2>
                <div className="form-group">
                  <label>Full Name:</label>
                  <input
                    type="text"
                    value={registerForm.full_name}
                    onChange={(e) => setRegisterForm({ ...registerForm, full_name: e.target.value })}
                    placeholder="Your full name"
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    placeholder="your@email.com"
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label>Phone (optional):</label>
                  <input
                    type="tel"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label>Password:</label>
                  <input
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    placeholder="Create a password"
                    disabled={loading}
                  />
                </div>
                <button type="submit" disabled={loading}>
                  {loading ? 'Registering...' : 'Register'}
                </button>
              </form>
            )}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Dyslexia Support Platform</h1>
        <div className="header-right">
          <div className="status">
            <span className={backendStatus.includes('✓') ? 'success' : 'error'}>
              Backend: {backendStatus.split(' ')[0]}
            </span>
            {' | '}
            <span className={dbStatus.includes('✓') ? 'success' : 'error'}>
              Database: {dbStatus.split(' ')[0]}
            </span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="dashboard">
        {error && <div className="error-message">{error}</div>}

        <div className="sidebar">
          <h3>Dashboard</h3>
          <nav className="nav-tabs">
            <button
              className={`nav-tab ${activeTab === 'children' ? 'active' : ''}`}
              onClick={() => setActiveTab('children')}
            >
              Children
            </button>
            <button
              className={`nav-tab ${activeTab === 'assessments' ? 'active' : ''}`}
              onClick={() => setActiveTab('assessments')}
            >
              Assessments
            </button>
            <button
              className={`nav-tab ${activeTab === 'activities' ? 'active' : ''}`}
              onClick={() => setActiveTab('activities')}
            >
              Activities
            </button>
          </nav>
        </div>

        <div className="content">
          {activeTab === 'children' && (
            <section className="section">
              <h2>Your Children</h2>
              
              {loading && <p>Loading...</p>}

              <div className="form-card">
                <h3>Add New Child</h3>
                <form onSubmit={handleAddChild}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Child Name:</label>
                      <input
                        type="text"
                        value={childForm.full_name}
                        onChange={(e) => setChildForm({ ...childForm, full_name: e.target.value })}
                        placeholder="Child's full name"
                        disabled={loading}
                      />
                    </div>
                    <div className="form-group">
                      <label>Grade:</label>
                      <input
                        type="number"
                        value={childForm.grade}
                        onChange={(e) => setChildForm({ ...childForm, grade: e.target.value })}
                        placeholder="Grade level"
                        min="1"
                        max="12"
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Child'}
                  </button>
                </form>
              </div>

              {children.length > 0 && (
                <div className="children-grid">
                  {children.map((child) => (
                    <div
                      key={child.id}
                      className={`child-card ${selectedChild === child.id ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedChild(child.id)
                        fetchAssessments(child.id)
                      }}
                    >
                      <h4>{child.full_name}</h4>
                      <p>Grade: {child.grade}</p>
                      <small>{new Date(child.created_at).toLocaleDateString()}</small>
                    </div>
                  ))}
                </div>
              )}

              {children.length === 0 && !loading && (
                <p className="empty-state">No children added yet. Add one above!</p>
              )}
            </section>
          )}

          {activeTab === 'assessments' && (
            <section className="section">
              <h2>Assessments</h2>

              {selectedChild ? (
                <>
                  <div className="form-card">
                    <h3>Record New Assessment for {children.find(c => c.id === selectedChild)?.full_name}</h3>
                    <form onSubmit={handleRecordAssessment}>
                      <div className="form-group">
                        <label>Assessment Date:</label>
                        <input
                          type="date"
                          value={assessmentForm.assessment_date}
                          onChange={(e) => setAssessmentForm({ ...assessmentForm, assessment_date: e.target.value })}
                          disabled={loading}
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Letter Recognition Score (0-100):</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={assessmentForm.letter_recognition_score}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, letter_recognition_score: e.target.value })}
                            disabled={loading}
                          />
                        </div>
                        <div className="form-group">
                          <label>Word Reading Score (0-100):</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={assessmentForm.word_reading_score}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, word_reading_score: e.target.value })}
                            disabled={loading}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Comprehension Score (0-100):</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={assessmentForm.comprehension_score}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, comprehension_score: e.target.value })}
                            disabled={loading}
                          />
                        </div>
                        <div className="form-group">
                          <label>Overall Evaluation:</label>
                          <textarea
                            value={assessmentForm.overall_evaluation}
                            onChange={(e) => setAssessmentForm({ ...assessmentForm, overall_evaluation: e.target.value })}
                            placeholder="Assessment notes and recommendations"
                            disabled={loading}
                            rows="3"
                          />
                        </div>
                      </div>

                      <button type="submit" disabled={loading}>
                        {loading ? 'Recording...' : 'Record Assessment'}
                      </button>
                    </form>
                  </div>

                  {assessments.length > 0 && (
                    <div className="assessments-table">
                      <h3>Assessment History</h3>
                      <table>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Letter Recognition</th>
                            <th>Word Reading</th>
                            <th>Comprehension</th>
                            <th>Overall Evaluation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assessments.map((assessment) => (
                            <tr key={assessment.id}>
                              <td>{new Date(assessment.assessment_date).toLocaleDateString()}</td>
                              <td>{assessment.letter_recognition_score ? assessment.letter_recognition_score.toFixed(1) : 'N/A'}</td>
                              <td>{assessment.word_reading_score ? assessment.word_reading_score.toFixed(1) : 'N/A'}</td>
                              <td>{assessment.comprehension_score ? assessment.comprehension_score.toFixed(1) : 'N/A'}</td>
                              <td>{assessment.overall_evaluation || 'No notes'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {assessments.length === 0 && !loading && (
                    <p className="empty-state">No assessments recorded for this child yet.</p>
                  )}
                </>
              ) : (
                <p className="empty-state">Please select a child from the Children tab first.</p>
              )}
            </section>
          )}

          {activeTab === 'activities' && (
            <section className="section">
              <h2>Available Activities</h2>

              {loading && <p>Loading...</p>}

              {activities.length > 0 ? (
                <div className="activities-grid">
                  {activities.map((activity) => (
                    <div key={activity.id} className="activity-card">
                      <h4>{activity.name}</h4>
                      <p>{activity.description}</p>
                      <div className="difficulty">
                        Level: {['Easy', 'Medium', 'Hard'][activity.difficulty_level - 1] || activity.difficulty_level}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No activities available.</p>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
