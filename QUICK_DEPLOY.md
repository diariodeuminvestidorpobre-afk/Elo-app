# 🚀 Deploy Rápido do Elo - Guia Simplificado

## ⚡ Deploy em 3 Passos (15 minutos)

### 📦 ANTES DE COMEÇAR

O arquivo ZIP está em: `/tmp/elo-clean.zip` (87KB)

**Você precisa baixar este código do Emergent primeiro.**

---

## PASSO 1: GitHub (5 min)

### 1.1 Criar Repositório

1. Vá em: https://github.com/new
2. Nome do repositório: `elo-app`
3. Deixe PÚBLICO
4. **NÃO** marque "Add a README"
5. Clique em **"Create repository"**

### 1.2 Fazer Upload do Código

**Opção A: Via Web (mais fácil)**

1. No repositório criado, clique em **"uploading an existing file"**
2. Descompacte o ZIP localmente
3. Arraste TODAS as pastas para o GitHub
4. Commit message: `Initial commit`
5. Clique em **"Commit changes"**

**Opção B: Via Git (se você tem Git instalado)**

```bash
# Descompacte o ZIP
unzip elo-clean.zip -d ~/elo-app
cd ~/elo-app

# Configure Git (se ainda não fez)
git config --global user.email "seu@email.com"
git config --global user.name "Seu Nome"

# Inicialize e faça push
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/elo-app.git
git push -u origin main
```

✅ **Checkpoint:** Repositório está no GitHub!

---

## PASSO 2: Railway (Backend - 5 min)

### 2.1 Criar Projeto

1. Acesse: https://railway.app
2. Clique em **"Login"** → Login com GitHub
3. Clique em **"New Project"**
4. Selecione **"Deploy from GitHub repo"**
5. Escolha `elo-app`
6. Railway detecta Python automaticamente ✅

### 2.2 Configurar Root Directory

1. Vá em **Settings**
2. Em **"Root Directory"**, coloque: `backend`
3. Salve (Railway faz redeploy)

### 2.3 Adicionar Variáveis de Ambiente

1. Vá na aba **"Variables"**
2. Clique em **"+ New Variable"**
3. Adicione CADA uma dessas (copie e cole):

```
MONGO_URL=mongodb+srv://elo:EloCristao2024@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=elo_production
CORS_ORIGINS=*
EMERGENT_LLM_KEY=sk-emergent-87c1055C5A0EaA7857
STRIPE_API_KEY=sk_test_emergent
VAPID_PRIVATE_KEY=MHcCAQEEIBz5qC9vQ8xQp5qGz_q2c0Q6oZ5qCPCPmXQfD5M8xqGIoAoGCCqGSM49AwEHoUQDQgAEebqJRiBS+8HiS7-MbqD5qGz_q2c0Q6oZ5qCPCPmXQfD5M8xqGIV5qWQlGmqHXjGQm0d9x5qNKqWZkL5g2Qkk==
VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv-GyuBGpqGz_q2c0Q6oZ5qCPCPmXQfD5M8xqGIV5qWQlGmqHXjGQm0d9x5qNKqWZkL5g2Qkk
PORT=8000
```

**IMPORTANTE:** Por enquanto, deixe `MONGO_URL` assim mesmo. Vamos configurar MongoDB depois.

### 2.4 Copiar URL do Backend

1. Vá na aba **"Settings"**
2. Em **"Domains"**, clique em **"Generate Domain"**
3. **Copie a URL** (exemplo: `elo-production.up.railway.app`)
4. **GUARDE ESSA URL!** 📝

✅ **Checkpoint:** Backend está no ar! Teste acessando: `https://SUA-URL/api/verses/daily`

---

## PASSO 3: Vercel (Frontend - 5 min)

### 3.1 Atualizar Backend URL no Código

**IMPORTANTE:** Antes de fazer deploy no Vercel, você precisa atualizar a URL do backend!

No arquivo `/frontend/.env.production`, mude para:

```
REACT_APP_BACKEND_URL=https://SUA-URL-DO-RAILWAY.up.railway.app
```

Faça commit dessa mudança no GitHub:

```bash
# No repositório local
cd frontend
# Edite .env.production com a URL correta
git add .
git commit -m "Update backend URL"
git push
```

### 3.2 Deploy no Vercel

1. Acesse: https://vercel.com
2. Clique em **"Login"** → Login com GitHub
3. Clique em **"Add New Project"**
4. Selecione `elo-app`
5. Configure:
   - **Framework Preset:** `Create React App`
   - **Root Directory:** `frontend` ← IMPORTANTE!
   - **Build Command:** `yarn build`
   - **Output Directory:** `build`

### 3.3 Adicionar Variável de Ambiente

1. Em **"Environment Variables"**
2. Adicione:
   - **Name:** `REACT_APP_BACKEND_URL`
   - **Value:** `https://SUA-URL-RAILWAY.up.railway.app`
3. Selecione **Production**, **Preview**, e **Development**

### 3.4 Deploy

1. Clique em **"Deploy"**
2. Aguarde ~3 minutos
3. 🎉 **PRONTO!**

✅ **Seu app está no ar!**

URL: `https://elo-app.vercel.app`

---

## 🎉 TESTANDO O APP

1. Acesse sua URL do Vercel
2. Clique em **"Entrar com Google"**
3. Faça login
4. Teste:
   - ✅ Ver versículo do dia
   - ✅ Criar pedido de oração
   - ✅ Explorar comunidades
   - ✅ Ativar notificações

---

## 🗄️ MONGODB (Opcional - Para Produção Real)

Se quiser usar um banco de dados de verdade (não o temporário):

### 1. MongoDB Atlas

1. Acesse: https://mongodb.com/cloud/atlas
2. Crie conta gratuita
3. Crie cluster FREE (M0 Sandbox)
4. Escolha região: São Paulo
5. Crie usuário: `elo` / senha forte
6. Libere IP: 0.0.0.0/0 (todos)
7. Copie a connection string
8. Volte no Railway → Variables
9. Atualize `MONGO_URL` com sua string real

---

## 🐛 Problemas Comuns

### Frontend não carrega

- Verifique se está acessando a URL correta do Vercel
- Veja logs em Vercel → Deployments → Logs

### API não conecta

- Verifique se `REACT_APP_BACKEND_URL` está correto
- Teste backend direto: `https://SUA-URL-RAILWAY/api/verses/daily`

### Erro 500 no backend

- Veja logs em Railway → Deployments → View Logs
- Verifique se todas as variáveis de ambiente estão corretas

---

## 📱 Compartilhar com Amigos

Seu app está pronto! Compartilhe:

```
🔗 Acesse: https://seu-app.vercel.app
📱 Funciona no celular
🔔 Aceite notificações para melhor experiência
```

---

## 💰 Custos

- ✅ Vercel: GRÁTIS (100GB/mês)
- ✅ Railway: GRÁTIS por 500 horas (~$5/mês depois)
- ✅ MongoDB Atlas: GRÁTIS (512MB)

**Total: $0-5/mês** 🎉

---

## 🆘 Precisa de Ajuda?

Se algo não funcionar:

1. **Vercel Logs:** Vercel → Deployments → Logs
2. **Railway Logs:** Railway → Deployments → View Logs
3. **Teste Backend:** `curl https://sua-url-railway/api/verses/daily`

---

## ✨ Próximos Passos

1. **Domínio Próprio** (opcional)
   - Compre `elo.com.br`
   - Configure em Vercel → Settings → Domains

2. **MongoDB Real** (recomendado)
   - Siga instruções acima
   - Dados permanentes

3. **Analytics**
   - Google Analytics
   - Vercel Analytics (grátis)

Pronto! Seu **Elo** está no ar! 🚀
