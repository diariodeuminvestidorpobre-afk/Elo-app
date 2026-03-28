# 🚀 Guia de Deploy - Elo em Produção

## Visão Geral

Vamos fazer deploy do **Elo** em produção usando:
- ✅ **Vercel** - Frontend (React)
- ✅ **Railway** - Backend (FastAPI)  
- ✅ **MongoDB Atlas** - Database (grátis)

**Tempo estimado:** 20-30 minutos

---

## 📋 Pré-requisitos

1. Conta no GitHub (para conectar repositórios)
2. Conta no Vercel (grátis) - https://vercel.com
3. Conta no Railway (grátis) - https://railway.app
4. Conta no MongoDB Atlas (grátis) - https://mongodb.com/cloud/atlas

---

## Parte 1: MongoDB Atlas (Database)

### Passo 1: Criar Cluster

1. Acesse https://mongodb.com/cloud/atlas
2. Faça login ou crie uma conta
3. Clique em **"Create"** → **"Shared"** (FREE)
4. Escolha:
   - Provider: **AWS**
   - Region: **São Paulo (sa-east-1)** ou mais próximo
   - Cluster Tier: **M0 Sandbox (FREE)**
5. Nome do cluster: `elo-production`
6. Clique em **"Create Cluster"**

### Passo 2: Configurar Acesso

1. Vá em **Security → Database Access**
2. Clique **"Add New Database User"**
   - Username: `elo_admin`
   - Password: **(gere uma senha forte)**
   - Database User Privileges: **Read and write to any database**
3. Clique **"Add User"**

4. Vá em **Security → Network Access**
5. Clique **"Add IP Address"**
6. Selecione **"Allow Access from Anywhere"** (0.0.0.0/0)
7. Clique **"Confirm"**

### Passo 3: Obter String de Conexão

1. Vá em **Database → Clusters**
2. Clique em **"Connect"** no seu cluster
3. Selecione **"Connect your application"**
4. Copie a connection string:
   ```
   mongodb+srv://elo_admin:<password>@elo-production.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. **Substitua `<password>` pela senha que você criou**
6. **Guarde essa string!** Vamos usar no Railway

---

## Parte 2: Railway (Backend)

### Passo 1: Preparar Código

1. Faça push do código para um repositório GitHub:
   ```bash
   cd /app
   git init
   git add .
   git commit -m "Initial commit - Elo app"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/elo-app.git
   git push -u origin main
   ```

### Passo 2: Criar Projeto no Railway

1. Acesse https://railway.app
2. Faça login com GitHub
3. Clique em **"New Project"**
4. Selecione **"Deploy from GitHub repo"**
5. Escolha o repositório `elo-app`
6. Railway detectará automaticamente o Python/FastAPI

### Passo 3: Configurar Variáveis de Ambiente

1. No projeto Railway, vá em **"Variables"**
2. Adicione as seguintes variáveis:

```env
MONGO_URL=mongodb+srv://elo_admin:SUA_SENHA@elo-production.xxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=elo_production
CORS_ORIGINS=https://elo.vercel.app,https://elo-app.vercel.app
EMERGENT_LLM_KEY=sk-emergent-87c1055C5A0EaA7857
STRIPE_API_KEY=sk_test_emergent
VAPID_PRIVATE_KEY=MHcCAQEEIBz5qC9vQ8xQp5qGz_q2c0Q6oZ5qCPCPmXQfD5M8xqGIoAoGCCqGSM49AwEHoUQDQgAEebqJRiBS+8HiS7-MbqD5qGz_q2c0Q6oZ5qCPCPmXQfD5M8xqGIV5qWQlGmqHXjGQm0d9x5qNKqWZkL5g2Qkk==
VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv-GyuBGpqGz_q2c0Q6oZ5qCPCPmXQfD5M8xqGIV5qWQlGmqHXjGQm0d9x5qNKqWZkL5g2Qkk
PORT=8000
```

3. Clique em **"Add"** para cada variável

### Passo 4: Configurar Diretório Root

1. Em **"Settings"** → **"Service"**
2. Root Directory: `/backend`
3. Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`

### Passo 5: Deploy

1. Railway fará deploy automaticamente
2. Aguarde o build completar (~3-5 minutos)
3. Após o deploy, copie a **URL pública**
   - Exemplo: `https://elo-backend-production.up.railway.app`
4. **Guarde essa URL!** Vamos usar no Vercel

---

## Parte 3: Vercel (Frontend)

### Passo 1: Preparar Frontend

1. Atualize o arquivo `/app/frontend/.env.production`:
   ```env
   REACT_APP_BACKEND_URL=https://elo-backend-production.up.railway.app
   ```

2. Commit as mudanças:
   ```bash
   git add .
   git commit -m "Update production backend URL"
   git push
   ```

### Passo 2: Criar Projeto no Vercel

1. Acesse https://vercel.com
2. Faça login com GitHub
3. Clique em **"Add New Project"**
4. Importe o repositório `elo-app`
5. Configure o projeto:
   - **Framework Preset:** Create React App
   - **Root Directory:** `frontend`
   - **Build Command:** `yarn build`
   - **Output Directory:** `build`

### Passo 3: Configurar Variáveis de Ambiente

1. Em **"Environment Variables"**, adicione:
   ```
   REACT_APP_BACKEND_URL=https://elo-backend-production.up.railway.app
   ```

### Passo 4: Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (~2-3 minutos)
3. Após o deploy, você terá uma URL:
   - **Exemplo:** `https://elo-app.vercel.app`

### Passo 5: Configurar Domínio Personalizado (Opcional)

1. Em **"Settings"** → **"Domains"**
2. Adicione seu domínio personalizado:
   - Exemplo: `elo.com.br`
3. Siga as instruções para configurar DNS

---

## Parte 4: Configuração Final

### Atualizar CORS no Backend

1. Volte no Railway
2. Atualize a variável `CORS_ORIGINS`:
   ```
   CORS_ORIGINS=https://elo-app.vercel.app,https://elo.com.br
   ```
3. Railway fará redeploy automaticamente

### Testar o App

1. Acesse sua URL do Vercel: `https://elo-app.vercel.app`
2. Teste o login com Google
3. Teste criação de vídeos, orações, etc
4. Ative notificações push

---

## 🎉 Pronto!

Seu app **Elo** está no ar!

**URLs Finais:**
- 🌐 **Frontend:** https://elo-app.vercel.app
- ⚙️ **Backend:** https://elo-backend-production.up.railway.app
- 🗄️ **Database:** MongoDB Atlas

---

## 📊 Custos

- **Vercel:** $0/mês (free tier)
- **Railway:** $0-5/mês (500h grátis, depois $5/mês)
- **MongoDB Atlas:** $0/mês (512MB grátis)
- **Total:** ~$0-5/mês

---

## 🔧 Troubleshooting

### Frontend não conecta ao Backend

1. Verifique se `REACT_APP_BACKEND_URL` está correta
2. Verifique se Railway está rodando
3. Verifique CORS no backend

### Notificações Push não funcionam

1. Certifique-se que está usando HTTPS (Vercel já tem)
2. Teste em navegador diferente
3. Verifique permissões do navegador

### Erro de Banco de Dados

1. Verifique se `MONGO_URL` está correta
2. Verifique se IP está liberado no Atlas (0.0.0.0/0)
3. Verifique credenciais do usuário

---

## 🚀 Próximos Passos

1. **Domínio Personalizado** - Compre elo.com.br
2. **Analytics** - Adicione Google Analytics
3. **Monitoramento** - Configure Sentry para erros
4. **CDN para Vídeos** - Use Cloudflare R2 ou Bunny.net
5. **Email Transacional** - Configure Resend ou SendGrid

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique logs no Railway (aba "Deployments")
2. Verifique logs no Vercel (aba "Deployments")
3. Teste endpoints da API diretamente

Boa sorte com o **Elo**! 🎉
