# 🚀 Setup Completo - Deploy do Elo (Passo a Passo)

## PARTE 1: GitHub - Criar Conta e Repositório (10 min)

### Passo 1.1: Criar Conta no GitHub

1. Acesse: **https://github.com/signup**
2. Preencha:
   - **Email:** seu melhor email
   - **Password:** crie uma senha forte
   - **Username:** escolha um nome (ex: `seunome-dev`)
3. Verifique o email (GitHub vai enviar um código)
4. Complete o perfil básico
5. ✅ **Pronto! Conta criada**

---

### Passo 1.2: Criar Repositório

1. No GitHub, clique no **"+"** (canto superior direito)
2. Selecione **"New repository"**
3. Configure:
   - **Repository name:** `elo-app`
   - **Description:** "Elo - Rede Social Cristã"
   - **Visibilidade:** ✅ **Public** (marque público)
   - **NÃO** marque "Add a README file"
   - **NÃO** adicione .gitignore ou license ainda
4. Clique em **"Create repository"**
5. ✅ **Repositório criado!**

**IMPORTANTE:** Guarde a URL do repositório:
```
https://github.com/SEU_USUARIO/elo-app
```

---

### Passo 1.3: Fazer Upload do Código

Você tem **2 opções** (escolha a mais fácil para você):

#### **OPÇÃO A: Upload via Interface Web (MAIS FÁCIL)** ⭐

1. **Baixar o código do Emergent:**
   - Copie todo o conteúdo da pasta `/app/` do Emergent para seu computador
   - Ou use o ZIP que criei: `/tmp/elo-clean.zip`

2. **Fazer upload no GitHub:**
   - No repositório `elo-app` que você criou, clique em **"uploading an existing file"**
   - Ou clique em **"Add file"** → **"Upload files"**
   
3. **Selecionar arquivos:**
   - Arraste TODAS estas pastas/arquivos:
     ```
     ✅ backend/
     ✅ frontend/
     ✅ docs/
     ✅ vercel.json
     ✅ deploy.sh
     ✅ README.md
     ✅ DEPLOY_GUIDE.md
     ```
   
4. **Commit:**
   - Em "Commit changes"
   - Escreva: `Initial commit - Elo app`
   - Clique em **"Commit changes"**

5. ✅ **Código no GitHub!**

---

#### **OPÇÃO B: Usar Git CLI (Se você tem Git instalado)**

```bash
# 1. Ir para a pasta do projeto
cd ~/Downloads/elo-app  # ou onde você salvou

# 2. Inicializar Git
git init
git branch -M main

# 3. Configurar seu Git (primeira vez)
git config --global user.email "seu@email.com"
git config --global user.name "Seu Nome"

# 4. Adicionar arquivos
git add .

# 5. Fazer commit
git commit -m "Initial commit - Elo app"

# 6. Conectar com GitHub
git remote add origin https://github.com/SEU_USUARIO/elo-app.git

# 7. Fazer push
git push -u origin main
```

**Usuário e senha:** Use seu usuário do GitHub e um **Personal Access Token** (não a senha normal)

Como criar token:
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Marque: `repo` (todos)
4. Copy o token e use como senha no `git push`

---

## ✅ CHECKPOINT 1

Depois de completar a PARTE 1, você deve ter:
- ✅ Conta no GitHub criada
- ✅ Repositório `elo-app` criado
- ✅ Código do Elo no repositório

**Confirme:** Acesse `https://github.com/SEU_USUARIO/elo-app` e veja os arquivos lá!

---

## PARTE 2: Railway - Deploy do Backend (10 min)

### Passo 2.1: Criar Conta no Railway

1. Acesse: **https://railway.app**
2. Clique em **"Login"**
3. Selecione **"Login with GitHub"**
4. Autorize o Railway a acessar seus repositórios
5. ✅ **Conta criada e conectada ao GitHub!**

---

### Passo 2.2: Criar Projeto e Fazer Deploy

1. No Railway, clique em **"New Project"**
2. Selecione **"Deploy from GitHub repo"**
3. **Escolha:** `elo-app`
4. Railway vai começar a detectar o projeto automaticamente

---

### Passo 2.3: Configurar Root Directory

⚠️ **IMPORTANTE:** Railway precisa saber que o backend está na pasta `/backend`

1. Vá em **"Settings"** (ícone de engrenagem)
2. Procure por **"Root Directory"**
3. Digite: `backend`
4. Salve (Railway fará redeploy automaticamente)

---

### Passo 2.4: Adicionar Variáveis de Ambiente

1. Clique na aba **"Variables"**
2. Clique em **"+ New Variable"**
3. Adicione UMA POR UMA (copie e cole exatamente):

```env
MONGO_URL=mongodb://localhost:27017
```
**Depois adicione:**
```env
DB_NAME=elo_production
```
**Depois:**
```env
CORS_ORIGINS=*
```
**Depois:**
```env
EMERGENT_LLM_KEY=sk-emergent-87c1055C5A0EaA7857
```
**Depois:**
```env
STRIPE_API_KEY=sk_test_emergent
```
**Depois:**
```env
VAPID_PRIVATE_KEY=MHcCAQEEIBz5qC9vQ8xQp5qGz_q2c0Q6oZ5qCPCPmXQfD5M8xqGIoAoGCCqGSM49AwEHoUQDQgAEebqJRiBS+8HiS7-MbqD5qGz_q2c0Q6oZ5qCPCPmXQfD5M8xqGIV5qWQlGmqHXjGQm0d9x5qNKqWZkL5g2Qkk==
```
**Depois:**
```env
VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv-GyuBGpqGz_q2c0Q6oZ5qCPCPmXQfD5M8xqGIV5qWQlGmqHXjGQm0d9x5qNKqWZkL5g2Qkk
```
**Depois:**
```env
PORT=8000
```

**Nota:** Por enquanto, o MONGO_URL está local. Vamos configurar MongoDB Atlas depois se quiser.

---

### Passo 2.5: Adicionar Plugin MongoDB

1. Na mesma página do projeto, clique em **"+ New"**
2. Selecione **"Database"** → **"Add MongoDB"**
3. Railway vai provisionar um MongoDB automaticamente
4. Depois que criar, copie a **Connection String**
5. Volte em **"Variables"** da sua aplicação principal
6. **Edite** a variável `MONGO_URL` e cole a connection string do MongoDB
7. Salve

---

### Passo 2.6: Gerar Domínio e Copiar URL

1. Vá em **"Settings"**
2. Procure por **"Domains"**
3. Clique em **"Generate Domain"**
4. Railway vai gerar algo como: `elo-production-abc123.up.railway.app`
5. **COPIE ESSA URL!** 📝 Vamos usar no próximo passo

---

### Passo 2.7: Testar Backend

Teste se está funcionando:

**No navegador, acesse:**
```
https://SUA-URL-RAILWAY.up.railway.app/api/verses/daily
```

**Deve retornar um JSON:**
```json
{
  "date": "2026-03-28",
  "verse_text": "Porque Deus amou...",
  "reference": "João 3:16",
  "translation": "NVI"
}
```

✅ **Backend funcionando!**

---

## ✅ CHECKPOINT 2

Você deve ter:
- ✅ Backend rodando no Railway
- ✅ URL do backend (ex: `https://elo-production.up.railway.app`)
- ✅ MongoDB configurado
- ✅ API respondendo em `/api/verses/daily`

---

## PARTE 3: Atualizar Código com URL do Backend (5 min)

**IMPORTANTE:** Antes de fazer deploy no Vercel, precisamos atualizar a URL do backend no código!

### Passo 3.1: Atualizar .env.production

No seu computador, abra o arquivo:
```
frontend/.env.production
```

Mude para:
```env
REACT_APP_BACKEND_URL=https://SUA-URL-DO-RAILWAY.up.railway.app
```

**Substitua** `SUA-URL-DO-RAILWAY` pela URL real que você copiou!

Exemplo:
```env
REACT_APP_BACKEND_URL=https://elo-production-abc123.up.railway.app
```

---

### Passo 3.2: Fazer Commit da Mudança

**Se usou interface web:**
1. No GitHub, vá no arquivo `frontend/.env.production`
2. Clique no ✏️ (editar)
3. Mude a URL
4. Commit changes

**Se usou Git CLI:**
```bash
cd elo-app
git add frontend/.env.production
git commit -m "Update backend URL"
git push
```

✅ **Código atualizado!**

---

## PARTE 4: Vercel - Deploy do Frontend (5 min)

### Passo 4.1: Conectar GitHub com Vercel

1. Acesse: **https://vercel.com**
2. Você já tem conta, então faça login
3. Se ainda não conectou GitHub, clique em **"Import Git Repository"**
4. Autorize Vercel a acessar seus repositórios do GitHub

---

### Passo 4.2: Importar Projeto

1. No Vercel, clique em **"Add New..."** → **"Project"**
2. Procure por `elo-app` na lista
3. Clique em **"Import"**

---

### Passo 4.3: Configurar Projeto

**⚠️ MUITO IMPORTANTE - Configure exatamente assim:**

1. **Framework Preset:** 
   - Selecione: `Create React App`

2. **Root Directory:**
   - Clique em **"Edit"**
   - Digite: `frontend`
   - ✅ Confirme

3. **Build and Output Settings:**
   - Build Command: `yarn build` (já vem preenchido)
   - Output Directory: `build` (já vem preenchido)
   - Install Command: `yarn install` (já vem preenchido)

4. **Environment Variables:**
   - Clique em **"Environment Variables"**
   - Adicione:
     - **Name:** `REACT_APP_BACKEND_URL`
     - **Value:** `https://SUA-URL-DO-RAILWAY.up.railway.app`
   - Marque: ✅ Production, ✅ Preview, ✅ Development
   - Clique em **"Add"**

---

### Passo 4.4: Deploy!

1. Revise tudo
2. Clique em **"Deploy"**
3. ⏳ Aguarde ~3 minutos (você verá os logs do build)
4. 🎉 **Deploy concluído!**

---

### Passo 4.5: Acessar o App

Vercel vai te dar uma URL tipo:
```
https://elo-app.vercel.app
```

**Acesse essa URL e teste:**
- ✅ Login com Google
- ✅ Ver versículo do dia
- ✅ Criar pedido de oração
- ✅ Explorar comunidades

---

## ✅ CHECKPOINT FINAL

Você deve ter:
- ✅ Frontend rodando na Vercel
- ✅ Backend rodando no Railway
- ✅ MongoDB configurado
- ✅ App funcionando completamente!

**URLs finais:**
- 🌐 **App:** https://elo-app.vercel.app
- ⚙️ **API:** https://elo-production.up.railway.app

---

## 🎉 PARABÉNS! SEU APP ESTÁ NO AR!

Agora você pode:

1. ✅ **Compartilhar com amigos:**
   ```
   Conheça o Elo - Rede Social Cristã
   🔗 https://elo-app.vercel.app
   ```

2. ✅ **Configurar domínio próprio** (opcional):
   - Compre `elo.com.br`
   - No Vercel: Settings → Domains → Add
   - Configure DNS

3. ✅ **Monitorar:**
   - Railway: Ver logs do backend
   - Vercel: Ver analytics e logs

---

## 🐛 Problemas Comuns

### Frontend não conecta no backend

**Solução:**
1. Verifique se `REACT_APP_BACKEND_URL` está correto na Vercel
2. Teste backend direto: `https://sua-url-railway/api/verses/daily`
3. Verifique logs no Railway

### Erro no build da Vercel

**Solução:**
1. Confirme que Root Directory é `frontend`
2. Veja logs de build na Vercel
3. Confirme que package.json existe em `/frontend/`

### MongoDB não conecta

**Solução:**
1. Verifique se adicionou o plugin MongoDB no Railway
2. Copie a connection string correta
3. Veja logs no Railway para erros específicos

---

## 💰 Custos

```
GitHub:  GRÁTIS
Vercel:  GRÁTIS (100GB/mês)
Railway: GRÁTIS (500h) depois $5/mês
────────────────────────
TOTAL:   $0-5/mês
```

---

## 📞 Precisa de Ajuda?

Em qual passo você está? Me avise se tiver dúvidas em qualquer parte!
