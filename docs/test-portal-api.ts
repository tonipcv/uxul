import axios from 'axios'

// Configure axios for local testing
const api = axios.create({
  baseURL: 'http://localhost:3000/api/portal',
  headers: {
    'Content-Type': 'application/json',
  },
  // Important: Include credentials for session cookies
  withCredentials: true
})

// Types for API responses
interface ValidateResponse {
  exists: boolean
  hasAccess?: boolean
}

interface Doctor {
  id: string
  name: string
  specialty?: string
  image?: string
}

interface PatientProfile {
  id: string
  name: string
  email: string
  phone: string
  hasPortalAccess: boolean
  hasActiveProducts: boolean
  doctor: Doctor | null
}

// Example usage:
async function testPortalApi() {
  try {
    // 1. First validate if patient exists
    const validateResponse = await api.post<ValidateResponse>('/validate', {
      email: 'patient@example.com'
    })
    console.log('Validate response:', validateResponse.data)

    if (validateResponse.data.exists && validateResponse.data.hasAccess) {
      // 2. Get patient profile using GET (this requires an active session)
      const profileResponse = await api.get<PatientProfile>('/me')
      console.log('Profile response:', profileResponse.data)
      
      if (profileResponse.data.doctor) {
        console.log('Doctor info:', profileResponse.data.doctor)
      }
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('API Error:', error.response?.data)
      // If unauthorized, redirect to login
      if (error.response?.status === 401) {
        console.log('Session expired or not logged in. Redirect to login page.')
      }
    } else {
      console.error('Error:', error)
    }
  }
}

// Run the test
testPortalApi() 