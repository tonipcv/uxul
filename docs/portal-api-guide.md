# Guia de Integração - Portal do Paciente (care.med1.app)

Este guia explica como consumir as APIs do med1.app no portal do paciente.

## 🔐 Configuração Inicial

1. Instale as dependências necessárias:
```bash
npm install axios @tanstack/react-query
```

2. Configure as variáveis de ambiente no `.env`:
```env
NEXT_PUBLIC_MED1_API_URL=https://app.med1.app
NEXT_PUBLIC_MED1_API_KEY=sua-chave-aqui # Solicitar ao time do med1.app
```

## 📡 Cliente HTTP

Crie um arquivo `lib/api.ts` com o seguinte conteúdo:

```typescript
import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_MED1_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.NEXT_PUBLIC_MED1_API_KEY
  }
})

// Interceptor para tratamento de erros
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      console.error('Erro de autenticação - verificar API Key')
    } else if (error.response?.status === 404) {
      console.error('Recurso não encontrado')
    }
    return Promise.reject(error)
  }
)

// Funções de API tipadas
export const portalApi = {
  // Validar acesso do paciente
  validateAccess: async (email: string) => {
    const { data } = await api.post<{
      exists: boolean
      hasPortalAccess: boolean
      hasActiveProducts: boolean
    }>('/api/portal/validate', { email })
    return data
  },

  // Buscar perfil do paciente
  getProfile: async () => {
    const { data } = await api.get<{
      id: string
      name: string
      email: string
      phone: string
      hasActiveProducts: boolean
      doctor: {
        id: string
        name: string
        specialty: string
        image: string
      } | null
    }>('/api/portal/me')
    return data
  },

  // Buscar referrals do paciente
  getReferrals: async () => {
    const { data } = await api.get<Array<{
      id: string
      slug: string
      stats: {
        visits: number
        leads: number
        sales: number
      }
      rewards: Array<{
        id: string
        title: string
        isUnlocked: boolean
        progress: number
      }>
    }>>('/api/portal/referrals')
    return data
  },

  // Buscar recompensas do paciente
  getRewards: async () => {
    const { data } = await api.get<Array<{
      id: string
      type: 'PAGE' | 'TEXT'
      title: string
      description: string
      isUnlocked: boolean
      progress: number
      page?: {
        id: string
        title: string
        slug: string
      }
    }>>('/api/portal/rewards')
    return data
  }
}
```

## 🚀 Exemplos de Uso

### 1. Login do Paciente

```typescript
import { portalApi } from '@/lib/api'

export async function handleLogin(email: string) {
  try {
    const { exists, hasPortalAccess } = await portalApi.validateAccess(email)
    
    if (!exists) {
      throw new Error('Paciente não encontrado')
    }
    
    if (!hasPortalAccess) {
      throw new Error('Paciente sem acesso ao portal')
    }
    
    // Prosseguir com login local do care.med1.app
    return true
  } catch (error) {
    console.error('Erro ao validar acesso:', error)
    return false
  }
}
```

### 2. Dashboard do Paciente com React Query

```typescript
import { useQuery } from '@tanstack/react-query'
import { portalApi } from '@/lib/api'

export function PatientDashboard() {
  // Queries
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['patient-profile'],
    queryFn: () => portalApi.getProfile()
  })

  const { data: referrals, isLoading: loadingReferrals } = useQuery({
    queryKey: ['patient-referrals'],
    queryFn: () => portalApi.getReferrals()
  })

  const { data: rewards, isLoading: loadingRewards } = useQuery({
    queryKey: ['patient-rewards'],
    queryFn: () => portalApi.getRewards()
  })

  // Loading state
  if (loadingProfile || loadingReferrals || loadingRewards) {
    return <div>Carregando...</div>
  }

  // Error state
  if (!profile) {
    return <div>Erro ao carregar perfil</div>
  }

  return (
    <div>
      {/* Dados do Paciente */}
      <section>
        <h1>Olá, {profile.name}</h1>
        {profile.doctor && (
          <p>Seu médico: Dr(a). {profile.doctor.name}</p>
        )}
      </section>

      {/* Links de Indicação */}
      <section>
        <h2>Seus Links de Indicação</h2>
        {referrals?.map(referral => (
          <div key={referral.id}>
            <h3>Link: {referral.slug}</h3>
            <div>
              <p>Visitas: {referral.stats.visits}</p>
              <p>Leads: {referral.stats.leads}</p>
              <p>Vendas: {referral.stats.sales}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Recompensas */}
      <section>
        <h2>Suas Recompensas</h2>
        {rewards?.map(reward => (
          <div key={reward.id}>
            <h3>{reward.title}</h3>
            <p>{reward.description}</p>
            <div>
              <p>Progresso: {reward.progress}%</p>
              {reward.isUnlocked && <p>✅ Desbloqueada!</p>}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
```

## ⚠️ Tratamento de Erros

```typescript
try {
  const data = await portalApi.getProfile()
} catch (error) {
  if (axios.isAxiosError(error)) {
    switch (error.response?.status) {
      case 401:
        // Erro de API Key
        console.error('Verifique a chave de API')
        break
      case 404:
        // Paciente não encontrado
        console.error('Paciente não encontrado')
        break
      default:
        // Erro genérico
        console.error('Erro ao buscar perfil:', error.message)
    }
  }
}
```

## 🔒 Segurança e Boas Práticas

1. **API Key**
   - Nunca exponha a API Key no código
   - Use sempre variáveis de ambiente
   - Mantenha a key em segredo

2. **Validação de Dados**
   - Sempre valide os dados antes de usar
   - Use TypeScript para garantir tipos corretos
   - Trate erros adequadamente

3. **Cache**
   - Use React Query para caching automático
   - Configure tempos de cache adequados
   - Implemente invalidação de cache quando necessário

4. **Performance**
   - Minimize o número de requisições
   - Use loading states
   - Implemente error boundaries

## 📝 Tipos TypeScript

```typescript
// types/api.ts
export interface Patient {
  id: string
  name: string
  email: string
  phone: string
  hasActiveProducts: boolean
  doctor: Doctor | null
}

export interface Doctor {
  id: string
  name: string
  specialty: string
  image: string
}

export interface Referral {
  id: string
  slug: string
  stats: {
    visits: number
    leads: number
    sales: number
  }
  rewards: Reward[]
}

export interface Reward {
  id: string
  type: 'PAGE' | 'TEXT'
  title: string
  description: string
  isUnlocked: boolean
  progress: number
  page?: {
    id: string
    title: string
    slug: string
  }
}
```

## 🤝 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação acima
2. Confira as variáveis de ambiente
3. Verifique os logs de erro
4. Contate o time do med1.app 