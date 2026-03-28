# Elo - Rede Social Cristã

<div align="center">
  <img src="https://via.placeholder.com/200x200/2563EB/FFFFFF?text=E" alt="Elo Logo" width="120" height="120" style="border-radius: 30px;"/>
  
  <h1>🔗 Elo</h1>
  <p>Rede social cristã moderna com vídeos, orações e comunidades</p>
  
  [![Deploy](https://img.shields.io/badge/deploy-vercel-black)](https://vercel.com)
  [![Backend](https://img.shields.io/badge/backend-railway-purple)](https://railway.app)
  [![Database](https://img.shields.io/badge/database-mongodb-green)](https://mongodb.com)
</div>

---

## ✨ Features

### 🎥 Feed de Vídeos
- Scroll infinito estilo TikTok
- Upload de vídeos verticais
- Curtidas, comentários e compartilhamentos
- Moderação automática com IA (OpenAI GPT-4o)

### 🙏 Pedidos de Oração
- Criação de pedidos
- Botão "Orei por você" com contador
- Comentários de apoio
- Versículo do dia integrado

### 👥 Comunidades
- Criação de grupos (igrejas, jovens, células)
- Chat em tempo real
- Sistema de moderadores

### 🔔 Notificações Push Inteligentes
- **Agrupamento automático** - "João e mais 4 pessoas curtiram seu vídeo"
- 7 tipos configuráveis (curtidas, comentários, orações, etc)
- Preferências personalizadas
- Background processor a cada 2 minutos

### 💳 Pagamentos
- Integração Stripe (PIX + Cartão)
- Sistema de doações
- Estrutura preparada para monetização

### 🔐 Autenticação
- Login com Google (OAuth2)
- Sessões seguras
- Perfis completos com bio e seguidores

---

## 🛠️ Tech Stack

### Frontend
- **React** 18 com Hooks
- **React Router** para navegação
- **Tailwind CSS** + design system customizado
- **Phosphor Icons** (duotone/fill)
- **Framer Motion** para animações
- **Service Worker** para PWA
- **Push Notifications API**

### Backend
- **FastAPI** (Python 3.11)
- **MongoDB** com Motor (async)
- **PyWebPush** para notificações
- **OpenAI GPT-4o** para moderação
- **Stripe** para pagamentos
- **AsyncIO** para background tasks

### Infraestrutura
- **Vercel** - Frontend hosting
- **Railway** - Backend + workers
- **MongoDB Atlas** - Database
- **Cloudflare** - CDN (opcional)

---

## 🚀 Quick Start

### Pré-requisitos

```bash
# Node.js 18+
node --version

# Python 3.11+
python --version

# MongoDB (local ou Atlas)
mongosh --version
```

### Instalação Local

```bash
# Clone o repositório
git clone https://github.com/SEU_USUARIO/elo-app.git
cd elo-app

# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env  # Configure as variáveis
uvicorn server:app --reload

# Frontend (em outro terminal)
cd frontend
yarn install
yarn start
```

Acesse: http://localhost:3000

---

## 🌐 Deploy em Produção

### Opção 1: Script Automático

```bash
chmod +x deploy.sh
./deploy.sh
```

### Opção 2: Manual

Siga o guia completo: [`DEPLOY_GUIDE.md`](./DEPLOY_GUIDE.md)

**Resumo:**
1. MongoDB Atlas (database)
2. Railway (backend)
3. Vercel (frontend)

**Custo total:** ~$0-5/mês

---

## 📊 Arquitetura

```
┌─────────────────┐
│   Vercel (CDN)   │
│  React Frontend  │
└───────┬────────┘
        │ HTTPS/WSS
        │
┌───────┴────────┐
│  Railway (API)   │
│ FastAPI Backend │
└─────┬───┬───┬───┘
      │    │    │
   ┌──┴─┐ │ ┌─┴──┐
   │ DB  │ │ │API│
   │Atlas│ │ │ AI│
   └─────┘ │ └────┘
          │
      ┌───┴───┐
      │ Storage │
      │  (S3)  │
      └───────┘
```

---

## 📋 Variáveis de Ambiente

### Backend (.env)

```env
MONGO_URL=mongodb+srv://...
DB_NAME=elo_production
CORS_ORIGINS=https://elo.vercel.app
EMERGENT_LLM_KEY=sk-emergent-...
STRIPE_API_KEY=sk_test_...
VAPID_PRIVATE_KEY=...
VAPID_PUBLIC_KEY=...
```

### Frontend (.env.production)

```env
REACT_APP_BACKEND_URL=https://api.elo.com
```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest tests/
```

### Frontend Tests

```bash
cd frontend
yarn test
```

### E2E Tests

```bash
yarn test:e2e
```

---

## 📚 Documentação

- [Guia de Deploy](./DEPLOY_GUIDE.md)
- [Sistema de Notificações](./docs/notification_grouping.md)
- [Credenciais de Teste](./memory/test_credentials.md)
- [API Docs](https://api.elo.com/docs) - Swagger UI

---

## 👥 Conta de Desenvolvedor

**Email:** dev@elo.app  
**Session Token:** `dev_session_1774673180279_secure`

[Ver instruções completas](./memory/test_credentials.md)

---

## 🚀 Roadmap

### ✅ Fase 1 - MVP (Concluído)
- [x] Autenticação Google OAuth
- [x] Feed de vídeos TikTok-style
- [x] Pedidos de oração
- [x] Comunidades com chat
- [x] Notificações push
- [x] Agrupamento de notificações
- [x] Sistema de pagamentos

### 🔄 Fase 2 - Melhorias
- [ ] Busca e filtros
- [ ] Modo escuro completo
- [ ] Dashboard de analytics
- [ ] Notificações ricas (com avatares)
- [ ] Sistema de badges/conquistas

### 🔮 Fase 3 - Escala
- [ ] CDN para vídeos
- [ ] Transcoding de vídeos
- [ ] Lives ao vivo
- [ ] Mensagens diretas
- [ ] Monetização para criadores

---

## 🤝 Contribuindo

Contribuições são bem-vindas!

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto é licenciado sob a licença MIT.

---

## 📧 Contato

**Email:** dev@elo.app  
**Website:** https://elo.vercel.app

---

<div align="center">
  <p>Feito com ❤️ para a comunidade cristã</p>
  <p>🙏 Conectando fé e tecnologia</p>
</div>
