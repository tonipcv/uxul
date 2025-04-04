# Documentação da API Mobile - Med1

Esta documentação detalha todos os endpoints disponíveis para a aplicação mobile do Med1, fornecendo informações sobre requisitos, parâmetros e respostas.

## 1. Autenticação

### 1.1. Verificar Token
**Endpoint:** `GET /api/mobile/auth/verify`

Verifica se um token JWT é válido e retorna informações básicas do usuário.

**Headers:**
- `Authorization`: Bearer {token}

**Respostas:**
- `200 OK`: Token válido
  ```json
  {
    "isValid": true,
    "user": {
      "id": "user_id",
      "name": "Nome do Usuário",
      "email": "email@exemplo.com"
    }
  }
  ```
- `401 Unauthorized`: Token inválido ou expirado
  ```json
  {
    "isValid": false,
    "error": "Token expirado"
  }
  ```

### 1.2. Renovar Token
**Endpoint:** `POST /api/mobile/auth/refresh`

Renova um token JWT que está prestes a expirar ou já expirou.

**Corpo da Requisição:**
```json
{
  "token": "token_jwt_atual"
}
```

**Respostas:**
- `200 OK`: Token renovado com sucesso
  ```json
  {
    "token": "novo_token_jwt",
    "user": {
      "id": "user_id",
      "name": "Nome do Usuário",
      "email": "email@exemplo.com"
    }
  }
  ```
- `401 Unauthorized`: Token inválido ou não renovável

## 2. Perfil do Usuário

### 2.1. Obter Perfil
**Endpoint:** `GET /api/mobile/profile`

Obtém informações detalhadas do perfil do usuário autenticado.

**Headers:**
- `Authorization`: Bearer {token}

**Respostas:**
- `200 OK`: Perfil obtido com sucesso
  ```json
  {
    "id": "user_id",
    "name": "Nome do Usuário",
    "email": "email@exemplo.com",
    "phone": "11999999999",
    "specialty": "Cardiologia",
    "plan": "premium",
    "planExpiresAt": "2023-12-31T23:59:59Z",
    "stats": {
      "totalIndications": 10,
      "totalLeads": 25,
      "recentClicks": 150,
      "recentLeads": 15,
      "conversionRate": 10
    }
  }
  ```
- `401 Unauthorized`: Usuário não autenticado

### 2.2. Atualizar Perfil
**Endpoint:** `PUT /api/mobile/profile`

Atualiza informações do perfil do usuário.

**Headers:**
- `Authorization`: Bearer {token}

**Corpo da Requisição:**
```json
{
  "name": "Novo Nome",
  "phone": "11988888888",
  "specialty": "Neurologia",
  "currentPassword": "senha_atual",
  "newPassword": "nova_senha"
}
```

**Respostas:**
- `200 OK`: Perfil atualizado com sucesso
  ```json
  {
    "success": true,
    "message": "Perfil atualizado com sucesso",
    "user": {
      "id": "user_id",
      "name": "Novo Nome",
      "email": "email@exemplo.com",
      "phone": "11988888888",
      "specialty": "Neurologia"
    }
  }
  ```
- `400 Bad Request`: Dados inválidos
- `401 Unauthorized`: Senha atual incorreta ou usuário não autenticado

## 3. Indicações

### 3.1. Listar Indicações
**Endpoint:** `GET /api/indications`

Lista todas as indicações do usuário.

**Headers:**
- `Authorization`: Bearer {token}

**Parâmetros de Query:**
- `withStats` (boolean, opcional): Inclui estatísticas básicas (default: false)
- `period` (string, opcional): Período para estatísticas - "day", "week", "month", "year", "all" (default: "month")

**Respostas:**
- `200 OK`: Lista de indicações
  ```json
  [
    {
      "id": "indication_id",
      "slug": "cardiologia-sp",
      "name": "Cardiologia SP",
      "createdAt": "2023-01-15T10:30:00Z",
      "stats": {
        "clicks": 120,
        "leads": 12,
        "conversionRate": 10,
        "period": "month"
      }
    }
  ]
  ```
- `401 Unauthorized`: Usuário não autenticado

### 3.2. Criar Indicação
**Endpoint:** `POST /api/indications`

Cria uma nova indicação.

**Headers:**
- `Authorization`: Bearer {token}

**Corpo da Requisição:**
```json
{
  "name": "Nova Indicação"
}
```

**Respostas:**
- `201 Created`: Indicação criada com sucesso
  ```json
  {
    "id": "indication_id",
    "slug": "nova-indicacao",
    "name": "Nova Indicação",
    "userId": "user_id",
    "createdAt": "2023-06-01T14:25:30Z"
  }
  ```
- `400 Bad Request`: Dados inválidos
- `401 Unauthorized`: Usuário não autenticado

### 3.3. Detalhes da Indicação
**Endpoint:** `GET /api/indications/{slug}`

Obtém detalhes de uma indicação específica.

**Headers:**
- `Authorization`: Bearer {token}

**Parâmetros de URL:**
- `slug`: Slug da indicação

**Respostas:**
- `200 OK`: Detalhes da indicação
  ```json
  {
    "id": "indication_id",
    "slug": "cardiologia-sp",
    "name": "Cardiologia SP",
    "userId": "user_id",
    "createdAt": "2023-01-15T10:30:00Z",
    "clickStats": {
      "total": 120,
      "last30Days": [
        {"date": "2023-05-01", "count": 5},
        {"date": "2023-05-02", "count": 7}
      ]
    },
    "recentLeads": [
      {
        "id": "lead_id",
        "name": "Nome do Lead",
        "createdAt": "2023-05-28T09:15:10Z"
      }
    ]
  }
  ```
- `401 Unauthorized`: Usuário não autenticado
- `404 Not Found`: Indicação não encontrada

### 3.4. Atualizar Indicação
**Endpoint:** `PUT /api/indications/{slug}`

Atualiza uma indicação específica.

**Headers:**
- `Authorization`: Bearer {token}

**Parâmetros de URL:**
- `slug`: Slug da indicação

**Corpo da Requisição:**
```json
{
  "name": "Nome Atualizado"
}
```

**Respostas:**
- `200 OK`: Indicação atualizada com sucesso
  ```json
  {
    "id": "indication_id",
    "slug": "cardiologia-sp",
    "name": "Nome Atualizado",
    "userId": "user_id",
    "createdAt": "2023-01-15T10:30:00Z"
  }
  ```
- `401 Unauthorized`: Usuário não autenticado
- `404 Not Found`: Indicação não encontrada

### 3.5. Estatísticas de Indicações
**Endpoint:** `GET /api/indications/stats`

Obtém estatísticas detalhadas sobre indicações.

**Headers:**
- `Authorization`: Bearer {token}

**Parâmetros de Query:**
- `period` (string, opcional): Período para estatísticas - "day", "week", "month", "year", "all" (default: "month")

**Respostas:**
- `200 OK`: Estatísticas obtidas com sucesso
  ```json
  {
    "overall": {
      "totalIndications": 5,
      "totalClicks": 350,
      "totalLeads": 32,
      "overallConversionRate": 9,
      "period": "month"
    },
    "indications": [
      {
        "id": "indication_id",
        "slug": "cardiologia-sp",
        "name": "Cardiologia SP",
        "clicks": 120,
        "leads": 12,
        "conversionRate": 10
      }
    ],
    "dailyStats": {
      "clicks": [
        {"createdAt": "2023-05-28", "_count": {"_all": 25}},
        {"createdAt": "2023-05-29", "_count": {"_all": 30}}
      ],
      "leads": [
        {"createdAt": "2023-05-28", "_count": {"_all": 2}},
        {"createdAt": "2023-05-29", "_count": {"_all": 3}}
      ]
    }
  }
  ```
- `401 Unauthorized`: Usuário não autenticado

### 3.6. Gerar Link de Indicação
**Endpoint:** `POST /api/indications/generate`

Gera um URL personalizado para uma indicação com parâmetros de rastreamento.

**Headers:**
- `Authorization`: Bearer {token}

**Corpo da Requisição:**
```json
{
  "indicationId": "indication_id",
  "utmSource": "instagram",
  "utmMedium": "bio",
  "utmCampaign": "promo_junho",
  "utmTerm": "cardiologista",
  "utmContent": "post_stories"
}
```

**Respostas:**
- `200 OK`: Link gerado com sucesso
  ```json
  {
    "success": true,
    "indication": {
      "id": "indication_id",
      "slug": "cardiologia-sp",
      "name": "Cardiologia SP"
    },
    "link": "https://med1.app/cardiologia-sp?utm_source=instagram&utm_medium=bio&utm_campaign=promo_junho&utm_term=cardiologista&utm_content=post_stories",
    "utmParams": {
      "utmSource": "instagram",
      "utmMedium": "bio",
      "utmCampaign": "promo_junho",
      "utmTerm": "cardiologista",
      "utmContent": "post_stories"
    }
  }
  ```
- `400 Bad Request`: Dados inválidos
- `401 Unauthorized`: Usuário não autenticado
- `404 Not Found`: Indicação não encontrada

## 4. Leads

### 4.1. Listar Leads
**Endpoint:** `GET /api/leads`

Lista todos os leads do usuário com filtragem e paginação.

**Headers:**
- `Authorization`: Bearer {token}

**Parâmetros de Query:**
- `search` (string, opcional): Busca por nome, email ou telefone
- `status` (string, opcional): Filtro por status - "new", "contacted", "converted", "lost"
- `indication` (string, opcional): ID da indicação para filtrar
- `page` (number, opcional): Página atual (default: 1)
- `limit` (number, opcional): Itens por página (default: 10)
- `sortBy` (string, opcional): Campo para ordenação - "createdAt", "name", "status" (default: "createdAt")
- `sortOrder` (string, opcional): Direção da ordenação - "asc", "desc" (default: "desc")

**Respostas:**
- `200 OK`: Lista de leads
  ```json
  {
    "data": [
      {
        "id": "lead_id",
        "name": "Nome do Lead",
        "email": "lead@exemplo.com",
        "phone": "11977777777",
        "status": "contacted",
        "createdAt": "2023-05-20T15:30:00Z",
        "indication": {
          "id": "indication_id",
          "name": "Cardiologia SP",
          "slug": "cardiologia-sp"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 32,
      "totalPages": 4,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
  ```
- `401 Unauthorized`: Usuário não autenticado

### 4.2. Atualizar Status de Leads
**Endpoint:** `PUT /api/leads`

Atualiza o status de múltiplos leads de uma vez.

**Headers:**
- `Authorization`: Bearer {token}

**Corpo da Requisição:**
```json
{
  "ids": ["lead_id_1", "lead_id_2"],
  "status": "contacted"
}
```

**Respostas:**
- `200 OK`: Status atualizado com sucesso
  ```json
  {
    "success": true,
    "count": 2,
    "message": "Status de 2 lead(s) atualizado com sucesso"
  }
  ```
- `400 Bad Request`: Dados inválidos
- `401 Unauthorized`: Usuário não autenticado
- `403 Forbidden`: Um ou mais leads não pertencem ao usuário

### 4.3. Detalhes do Lead
**Endpoint:** `GET /api/leads/{id}`

Obtém detalhes de um lead específico.

**Headers:**
- `Authorization`: Bearer {token}

**Parâmetros de URL:**
- `id`: ID do lead

**Respostas:**
- `200 OK`: Detalhes do lead
  ```json
  {
    "id": "lead_id",
    "name": "Nome do Lead",
    "email": "lead@exemplo.com",
    "phone": "11977777777",
    "status": "contacted",
    "interest": "Consulta cardiológica",
    "utmSource": "instagram",
    "utmMedium": "bio",
    "utmCampaign": "promo_junho",
    "createdAt": "2023-05-20T15:30:00Z",
    "indication": {
      "id": "indication_id",
      "name": "Cardiologia SP",
      "slug": "cardiologia-sp"
    }
  }
  ```
- `401 Unauthorized`: Usuário não autenticado
- `404 Not Found`: Lead não encontrado

### 4.4. Atualizar Lead
**Endpoint:** `PATCH /api/leads/{id}`

Atualiza informações de um lead específico.

**Headers:**
- `Authorization`: Bearer {token}

**Parâmetros de URL:**
- `id`: ID do lead

**Corpo da Requisição:**
```json
{
  "name": "Nome Atualizado",
  "email": "novoemail@exemplo.com",
  "phone": "11966666666",
  "status": "converted"
}
```

**Respostas:**
- `200 OK`: Lead atualizado com sucesso
  ```json
  {
    "success": true,
    "data": {
      "id": "lead_id",
      "name": "Nome Atualizado",
      "email": "novoemail@exemplo.com",
      "phone": "11966666666",
      "status": "converted"
    },
    "message": "Lead atualizado com sucesso"
  }
  ```
- `401 Unauthorized`: Usuário não autenticado
- `404 Not Found`: Lead não encontrado

### 4.5. Excluir Lead
**Endpoint:** `DELETE /api/leads/{id}`

Remove um lead específico.

**Headers:**
- `Authorization`: Bearer {token}

**Parâmetros de URL:**
- `id`: ID do lead

**Respostas:**
- `200 OK`: Lead removido com sucesso
  ```json
  {
    "success": true,
    "message": "Lead removido com sucesso"
  }
  ```
- `401 Unauthorized`: Usuário não autenticado
- `404 Not Found`: Lead não encontrado

### 4.6. Obter Anotações Médicas
**Endpoint:** `GET /api/leads/{id}/notes`

Obtém as anotações médicas de um lead específico.

**Headers:**
- `Authorization`: Bearer {token}

**Parâmetros de URL:**
- `id`: ID do lead

**Respostas:**
- `200 OK`: Anotações obtidas com sucesso
  ```json
  {
    "id": "lead_id",
    "name": "Nome do Lead",
    "medicalNotes": "Paciente com histórico de hipertensão...",
    "lastUpdated": "2023-06-01T09:45:30Z"
  }
  ```
- `401 Unauthorized`: Usuário não autenticado
- `404 Not Found`: Lead não encontrado

### 4.7. Adicionar/Atualizar Anotações Médicas
**Endpoint:** `POST /api/leads/{id}/notes`

Adiciona ou atualiza anotações médicas de um lead.

**Headers:**
- `Authorization`: Bearer {token}

**Parâmetros de URL:**
- `id`: ID do lead

**Corpo da Requisição:**
```json
{
  "medicalNotes": "Paciente com histórico de hipertensão. Última consulta mostrou pressão arterial de 140/90..."
}
```

**Respostas:**
- `200 OK`: Anotações adicionadas com sucesso
  ```json
  {
    "success": true,
    "message": "Anotações médicas adicionadas com sucesso",
    "data": {
      "id": "lead_id",
      "medicalNotes": "Paciente com histórico de hipertensão..."
    }
  }
  ```
- `400 Bad Request`: Dados inválidos
- `401 Unauthorized`: Usuário não autenticado
- `404 Not Found`: Lead não encontrado

## 5. Códigos de Status

- `200 OK`: Requisição bem-sucedida
- `201 Created`: Recurso criado com sucesso
- `400 Bad Request`: Erro de validação ou dados inválidos
- `401 Unauthorized`: Autenticação necessária ou falha na autenticação
- `403 Forbidden`: Sem permissão para acessar o recurso
- `404 Not Found`: Recurso não encontrado
- `500 Internal Server Error`: Erro no servidor

## 6. Recomendações de Uso

1. **Autenticação**:
   - Armazene o token JWT de forma segura
   - Implemente renovação automática quando o token estiver próximo de expirar
   
2. **Rate Limiting**:
   - A API possui limites de requisições para evitar sobrecarga
   - Implemente lógica para lidar com respostas 429 (Too Many Requests)
   
3. **Tratamento de Erros**:
   - Sempre verifique o código de status das respostas
   - Implemente recuperação de falhas e reexecução de requisições quando apropriado

4. **Desempenho**:
   - Use filtragem e paginação ao listar recursos para otimizar o desempenho
   - Evite solicitar dados desnecessários
   
5. **Segurança**:
   - Todas as requisições devem usar HTTPS
   - Nunca exponha tokens ou credenciais no código do cliente 