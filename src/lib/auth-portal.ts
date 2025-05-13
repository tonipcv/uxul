export function validatePortalApiKey(apiKey: string | null) {
  if (!apiKey) return false
  
  const validApiKey = process.env.PORTAL_API_KEY
  if (!validApiKey) {
    console.error('PORTAL_API_KEY não configurada')
    return false
  }

  return apiKey === validApiKey
} 