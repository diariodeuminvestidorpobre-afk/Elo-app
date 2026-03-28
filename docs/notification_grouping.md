# Sistema de Agrupamento de Notificações - Elo

## 📋 Visão Geral

O sistema de agrupamento de notificações evita spam ao agrupar múltiplas notificações similares em uma única notificação mais informativa.

## 🎯 Comportamento

### Antes (Sem Agrupamento)
```
❤️ João curtiu seu vídeo
❤️ Maria curtiu seu vídeo
❤️ Pedro curtiu seu vídeo
❤️ Ana curtiu seu vídeo
❤️ Carlos curtiu seu vídeo
```
**Resultado:** 5 notificações separadas (spam!)

### Depois (Com Agrupamento)
```
❤️ João e mais 4 pessoas curtiram seu vídeo
```
**Resultado:** 1 notificação agrupada (limpo!)

## ⚙️ Como Funciona

### 1. Fila de Notificações
Quando uma ação acontece (curtida, comentário, oração):
- A notificação NÃO é enviada imediatamente
- É adicionada a uma fila (`pending_notifications`)
- Contém: recipient, sender, tipo, contexto, mensagem

### 2. Janela de Tempo
- **Aguarda 2 minutos** antes de processar
- Permite acumular notificações similares
- Balanceia entre tempo real e agrupamento

### 3. Agrupamento Inteligente
Notificações são agrupadas quando:
- ✅ Mesmo destinatário (recipient_user_id)
- ✅ Mesmo tipo (like, comment, prayer)
- ✅ Mesmo contexto (mesmo vídeo, mesmo pedido)
- ✅ Dentro da janela de 2 minutos

### 4. Formatação
**1 pessoa:**
- "João curtiu seu vídeo"

**2 pessoas:**
- "João e Maria curtiram seu vídeo"

**3+ pessoas:**
- "João e mais 2 pessoas curtiram seu vídeo"

## 🔄 Processamento Automático

### Background Task
```python
async def notification_processor():
    while True:
        await asyncio.sleep(120)  # 2 minutos
        await process_grouped_notifications()
```

- Roda em background automaticamente
- Processa fila a cada 2 minutos
- Agrupa e envia notificações
- Marca como processadas

### Fluxo Completo
```
Ação → Fila → Aguarda 2min → Agrupa → Envia → Marca Processado
```

## 📊 Exemplos por Tipo

### Curtidas (Like)
```
1 pessoa:  "João curtiu seu vídeo"
2 pessoas: "João e Maria curtiram seu vídeo"
3+ pessoas: "João e mais 4 pessoas curtiram seu vídeo"
```

### Comentários (Comment)
```
1 pessoa:  "João: Que vídeo incrível..."
2 pessoas: "João e Maria comentaram seu vídeo"
3+ pessoas: "João e mais 3 pessoas comentaram seu vídeo"
```

### Orações (Prayer)
```
1 pessoa:  "João orou pelo seu pedido"
2 pessoas: "João e Maria oraram pelo seu pedido"
3+ pessoas: "João e mais 5 pessoas oraram pelo seu pedido"
```

### Seguidores (Follow)
```
1 pessoa:  "João começou a seguir você"
2 pessoas: "João e Maria começaram a seguir você"
3+ pessoas: "João e mais 2 pessoas começaram a seguir você"
```

## 🗄️ Estrutura de Dados

### Collection: pending_notifications
```javascript
{
  notification_id: "notif_abc123",
  recipient_user_id: "user_xyz",
  sender_user_id: "user_abc",
  sender_name: "João Silva",
  notification_type: "like",  // like, comment, prayer, follow
  context_id: "video_123",
  context_type: "video",      // video, prayer, community, profile
  message: "curtiu seu vídeo",
  created_at: "2026-03-28T12:00:00Z",
  processed: false,
  processed_at: null
}
```

## 🎛️ Configuração

### Janela de Tempo
```python
cutoff_time = datetime.now(timezone.utc) - timedelta(minutes=2)
```
- **Padrão:** 2 minutos
- **Ajustável:** Altere o valor em `process_grouped_notifications()`

### Intervalo de Processamento
```python
await asyncio.sleep(120)  # 2 minutos
```
- **Padrão:** 120 segundos (2 min)
- **Ajustável:** Altere o valor em `notification_processor()`

## 🧪 Teste Manual

### Endpoint de Teste
```bash
# Processar fila manualmente
curl -X POST "https://elo-cristao.preview.emergentagent.com/api/notifications/process" \
  -H "Cookie: session_token=YOUR_TOKEN"
```

### Cenário de Teste
1. Faça login com 2 contas diferentes
2. Com a conta A, poste um vídeo/oração
3. Com a conta B, curta 5 vezes (ou simule múltiplas ações)
4. Aguarde 2 minutos OU chame o endpoint `/process`
5. Verifique a notificação agrupada

## 📈 Benefícios

### Experiência do Usuário
- ✅ Menos spam de notificações
- ✅ Informação mais clara e concisa
- ✅ Melhor contexto (quantas pessoas)
- ✅ Notificações mais relevantes

### Performance
- ✅ Reduz volume de push notifications em ~60-80%
- ✅ Menor uso de battery (menos wake-ups)
- ✅ Menor tráfego de rede
- ✅ Melhor para APIs de terceiros (rate limits)

### Estatísticas Estimadas
```
Sem agrupamento: 1000 notificações/dia
Com agrupamento: 200-300 notificações/dia
Economia: ~70%
```

## 🔧 Manutenção

### Limpar Notificações Antigas
```javascript
// Remover processadas com mais de 7 dias
db.pending_notifications.deleteMany({
  processed: true,
  processed_at: { $lt: new Date(Date.now() - 7*24*60*60*1000) }
});
```

### Monitoramento
```javascript
// Ver estatísticas
db.pending_notifications.aggregate([
  { $group: {
    _id: "$notification_type",
    count: { $sum: 1 },
    processed: { $sum: { $cond: ["$processed", 1, 0] } }
  }}
]);
```

## 🚀 Melhorias Futuras

1. **Priorização Inteligente**
   - Notificações de pessoas próximas enviadas mais rápido
   - VIP/verificados com menor delay

2. **Agrupamento por Tempo do Dia**
   - Manhã: enviar após acumular
   - Noite: enviar mais rápido (usuário ativo)

3. **Machine Learning**
   - Aprender padrões de uso do usuário
   - Ajustar janela de tempo dinamicamente

4. **Rich Notifications**
   - Incluir avatars dos primeiros N usuários
   - Preview de imagens/vídeos

5. **Resumo Diário**
   - "Você teve 50 interações hoje"
   - Breakdown por tipo
