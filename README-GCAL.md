# Configuração da Integração com Google Calendar

Este documento explica como configurar a integração com o Google Calendar para a funcionalidade de agenda da aplicação.

## Pré-requisitos

1. Acesso ao Google Cloud Console (https://console.cloud.google.com/)
2. Conta do Google com permissões para criar projetos

## Passos para Configuração

### 1. Criar um Projeto no Google Cloud

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Clique em "Criar Projeto"
3. Dê um nome ao projeto (ex: "MED1 Agenda")
4. Clique em "Criar"

### 2. Configurar a API do Google Calendar

1. No menu lateral, navegue até "APIs e Serviços" > "Biblioteca"
2. Pesquise por "Google Calendar API"
3. Clique na API e depois em "Ativar"

### 3. Configurar Credenciais OAuth

1. No menu lateral, navegue até "APIs e Serviços" > "Credenciais"
2. Clique em "Criar Credenciais" > "ID do Cliente OAuth"
3. Configure a tela de consentimento:
   - Tipo de usuário: Externo
   - Nome do aplicativo: "MED1 Agenda"
   - Domínios autorizados: inclua o domínio da aplicação (ex: "med1.app")
   - Informações de contato de desenvolvedor: adicione um email

4. Configure os escopos de acesso:
   - Adicione o escopo: `https://www.googleapis.com/auth/calendar`
   - Adicione o escopo: `https://www.googleapis.com/auth/calendar.events`

5. Crie o ID do Cliente OAuth:
   - Tipo de aplicativo: "Aplicativo da Web"
   - Nome: "MED1 Web Application"
   - URIs de redirecionamento autorizados: adicione seu URL de callback
     - Ex: `https://med1.app/api/google/callback`
     - Para desenvolvimento: `http://localhost:3000/api/google/callback`

6. Anote o "Client ID" e "Client Secret" gerados

### 4. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis de ambiente ao arquivo `.env.local`:

```
GOOGLE_CLIENT_ID=seu_client_id
GOOGLE_CLIENT_SECRET=seu_client_secret
```

## Testando a Integração

1. Acesse a página de Agenda na aplicação
2. Clique em "Conectar Google Calendar"
3. Siga o fluxo de autorização do Google
4. Após autorizar, você será redirecionado de volta à aplicação
5. Seus eventos do Google Calendar serão exibidos na página

## Solução de Problemas

### Erro no Callback

Se você encontrar erros durante o redirecionamento:

1. Verifique se as URIs de redirecionamento estão configuradas corretamente no Google Cloud Console
2. Verifique se as variáveis de ambiente `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` estão definidas corretamente
3. Verifique se a API do Google Calendar está ativada

### Tokens Inválidos

Se os tokens expirarem ou se tornarem inválidos:

1. A aplicação tentará atualizar automaticamente o token usando o refresh_token
2. Se isso falhar, o usuário precisará se reconectar

## Dicas de Segurança

1. Nunca compartilhe seu Client Secret
2. Mantenha as variáveis de ambiente seguras
3. Em produção, considere restringir o acesso da API apenas aos usuários necessários 