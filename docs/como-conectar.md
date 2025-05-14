# Como Conectar na API do med1.app

## 1. Configuração Inicial

### 1.1 Instale as Dependências

```bash
# Com npm
npm install axios

# Com yarn
yarn add axios

# Com pnpm
pnpm add axios
```

### 1.2 Configure a URL da API

Crie um arquivo `.env.local`:

```env
NEXT_PUBLIC_MED1_API_URL=https://app.med1.app
```

## 2. Cliente HTTP Básico

Crie um arquivo `src/lib/api.ts`:

```typescript
import axios from 'axios'

// Cliente HTTP configurado
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_MED1_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Funções para acessar a API
export const portalApi = {
  // Validar paciente
  validatePatient: async (email: string) => {
    const { data } = await api.post('/api/portal/validate', { email })
    return data
  },

  // Buscar perfil do paciente
  getPatientProfile: async (email: string) => {
    const { data } = await api.get('/api/portal/me', {
      params: { email }
    })
    return data
  },

  // Buscar links de indicação
  getReferrals: async (email: string) => {
    const { data } = await api.get('/api/portal/referrals', {
      params: { email }
    })
    return data
  },

  // Buscar recompensas
  getRewards: async (email: string) => {
    const { data } = await api.get('/api/portal/rewards', {
      params: { email }
    })
    return data
  }
}
```

## 3. Exemplo de Uso

```typescript
// src/app/page.tsx
'use client'

import { useState } from 'react'
import { portalApi } from '@/lib/api'

export default function TestPage() {
  const [email, setEmail] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function handleTest() {
    try {
      setLoading(true)
      setData(null)
      
      // Busca todos os dados do paciente
      const [profile, referrals, rewards] = await Promise.all([
        portalApi.getPatientProfile(email),
        portalApi.getReferrals(email),
        portalApi.getRewards(email)
      ])

      setData({
        profile,
        referrals,
        rewards
      })
    } catch (err) {
      console.error('Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Teste da API med1.app</h1>
      
      <div className="flex gap-2 mb-4">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Digite o email do paciente"
          className="border p-2 rounded"
        />
        <button
          onClick={handleTest}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Carregando...' : 'Buscar Dados'}
        </button>
      </div>

      {data && (
        <div className="space-y-4">
          {/* Perfil */}
          <div>
            <h2 className="text-xl font-bold">Perfil</h2>
            <pre className="bg-gray-100 p-4 rounded">
              {JSON.stringify(data.profile, null, 2)}
            </pre>
          </div>

          {/* Links de Indicação */}
          <div>
            <h2 className="text-xl font-bold">Links de Indicação</h2>
            <pre className="bg-gray-100 p-4 rounded">
              {JSON.stringify(data.referrals, null, 2)}
            </pre>
          </div>

          {/* Recompensas */}
          <div>
            <h2 className="text-xl font-bold">Recompensas</h2>
            <pre className="bg-gray-100 p-4 rounded">
              {JSON.stringify(data.rewards, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
```

## 4. Como Testar

1. Inicie seu projeto:
```bash
npm run dev
```

2. Acesse:
```
http://localhost:3000
```

3. Digite o email de um paciente e clique em "Buscar Dados"

## 5. Retorno da API

### Perfil do Paciente
```typescript
{
  id: string
  name: string
  email: string
  phone: string
  hasActiveProducts: boolean
  doctor: {
    name: string
    specialty: string
  } | null
}
```

### Links de Indicação
```typescript
{
  id: string
  slug: string
  stats: {
    visits: number
    leads: number
    sales: number
  }
}[]
```

### Recompensas
```typescript
{
  id: string
  title: string
  description: string
  isUnlocked: boolean
  progress: number
}[]
```

## 6. Problemas Comuns

### 6.1 Erro de CORS
Se receber erro de CORS, verifique se está usando a URL correta da API.

### 6.2 Erro de Rede
- Verifique se a URL base está correta no .env
- Confirme se o serviço está online

## 7. Próximos Passos

Depois que a integração básica estiver funcionando:

1. Adicione tratamento de erros mais robusto
2. Implemente cache com React Query
3. Crie componentes para exibir os dados
4. Adicione loading states e feedback visual
5. Implemente a autenticação quando necessário 