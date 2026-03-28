# PRD - Elo (Rede Social Cristã)

## Problema Original
Criar um aplicativo web progressivo (PWA) chamado "Elo", uma rede social focada no público cristão com feed de vídeos estilo TikTok, versículo do dia, pedidos de oração, comunidades/grupos com chat, perfis de usuário, moderação de conteúdo com IA, autenticação por telefone+senha, notificações push, e preparação para monetização (Stripe/PIX).

## Arquitetura
- **Frontend:** React + Tailwind CSS + Shadcn/UI (hospedado no Vercel)
- **Backend:** FastAPI + MongoDB (hospedado no Emergent)
- **Banco de dados:** MongoDB local no Emergent
- **PWA:** Service Worker + Manifest

## Funcionalidades Implementadas

### Fase 1 - MVP (Concluído)
- [x] Autenticação por telefone + senha (registro/login) - 28/03/2026
- [x] Feed de vídeos estilo TikTok com scroll infinito
- [x] Versículo do dia
- [x] Pedidos de oração com contador "Orei por você"
- [x] Comunidades com chat
- [x] Notificações push inteligentes com agrupamento
- [x] PWA (Service Worker + Manifest)
- [x] UI redesenhada (gradiente azul/vermelho)
- [x] Moderação de conteúdo com IA (OpenAI GPT-4o)
- [x] Deploy frontend no Vercel: https://elo-app-eight.vercel.app/
- [x] Código no GitHub: diariodeuminvestidorpobre-afk/Elo-app

## Deploy
- **Frontend:** Vercel (https://elo-app-eight.vercel.app/)
  - Root Directory: `frontend`
  - Framework: Create React App
  - Env vars: REACT_APP_BACKEND_URL, CI=false
- **Backend:** Emergent (https://elo-cristao.preview.emergentagent.com)
- **Banco de dados:** MongoDB no Emergent

## Backlog (Priorizado)

### P0 (Próximo)
- [ ] Atualizar código no GitHub com auth por telefone (usar "Save to GitHub")

### P1
- [ ] Implementar integração PIX
- [ ] Lógica de anúncios e assinatura premium

### P2
- [ ] Busca e filtros
- [ ] Dashboard de analytics
- [ ] Sistema de badges/conquistas
- [ ] Modo escuro completo

### P3 (Futuro)
- [ ] CDN para vídeos
- [ ] Transcoding de vídeos
- [ ] Lives ao vivo
- [ ] Mensagens diretas
- [ ] Monetização para criadores
