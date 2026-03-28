#!/bin/bash

# Script de Deploy Automático - Elo
# Este script prepara e faz deploy do app completo

set -e

echo "🚀 Iniciando deploy do Elo..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para imprimir mensagens
print_step() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Verificar se estamos no diretório correto
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    print_error "Execute este script na raiz do projeto (/app)"
    exit 1
fi

print_step "Verificando dependências..."

# Verificar Git
if ! command -v git &> /dev/null; then
    print_error "Git não encontrado. Instale o Git primeiro."
    exit 1
fi

# Verificar se já é um repositório Git
if [ ! -d ".git" ]; then
    print_warning "Inicializando repositório Git..."
    git init
    git branch -M main
fi

print_step "Criando .gitignore..."

cat > .gitignore << 'EOF'
# Dependencies
node_modules/
__pycache__/
*.py[cod]
*$py.class
*.so
.Python

# Environment variables
.env
.env.local
.env.development.local
.env.test.local

# Build outputs
frontend/build/
dist/
build/
*.egg-info/

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
.pytest_cache/

# Misc
.cache/
*.pid
*.seed
*.pid.lock
EOF

print_step ".gitignore criado"

print_step "Adicionando arquivos ao Git..."
git add .

# Verificar se há mudanças para commit
if git diff-index --quiet HEAD --; then
    print_warning "Nenhuma mudança para commit"
else
    git commit -m "Prepare for production deployment" || true
fi

echo ""
echo "${GREEN}========================================${NC}"
echo "${GREEN}🎉 Preparação completa!${NC}"
echo "${GREEN}========================================${NC}"
echo ""
echo "${YELLOW}Próximos passos:${NC}"
echo ""
echo "1️⃣  Crie um repositório no GitHub:"
echo "   https://github.com/new"
echo ""
echo "2️⃣  Conecte este repositório:"
echo "   ${GREEN}git remote add origin https://github.com/SEU_USUARIO/elo-app.git${NC}"
echo "   ${GREEN}git push -u origin main${NC}"
echo ""
echo "3️⃣  Siga o guia completo em:"
echo "   ${GREEN}cat /app/DEPLOY_GUIDE.md${NC}"
echo ""
echo "4️⃣  URLs dos serviços:"
echo "   🐛 GitHub: https://github.com"
echo "   🔺 Vercel: https://vercel.com"
echo "   🚂 Railway: https://railway.app"
echo "   🍃 MongoDB: https://mongodb.com/cloud/atlas"
echo ""
