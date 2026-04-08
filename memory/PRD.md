# Corações Peludos - PRD (Product Requirements Document)

## Data: 2026-01-08

## Descrição do Projeto
Sistema web completo para adoção responsável de animais, conectando usuários a ONGs que cadastram animais para adoção, com fórum interativo para comunidade.

## User Personas
1. **Adotante (User)** - Pessoa que deseja adotar um animal
2. **ONG** - Organização que cadastra e gerencia animais para adoção
3. **Admin** - Administrador do sistema

## Arquitetura
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Storage**: Emergent Object Storage
- **Auth**: JWT + Google OAuth (Emergent Auth)

## Core Requirements (Static)

### Autenticação
- [x] Login com email/senha (JWT)
- [x] Login com Google OAuth
- [x] Registro de usuário comum
- [x] Registro de ONG
- [x] Proteção de rotas autenticadas
- [x] Brute force protection
- [x] Admin seeding

### Pets
- [x] CRUD completo de pets (ONG)
- [x] Upload de fotos de pets
- [x] Listagem com filtros (tipo, idade, porte, localização)
- [x] Detalhes do pet com informações da ONG
- [x] Sistema de favoritos

### Adoção
- [x] Solicitação de adoção pelo usuário
- [x] Aprovação/rejeição pela ONG
- [x] Notificações de status

### Fórum
- [x] CRUD de posts
- [x] Comentários
- [x] Curtidas
- [x] Categorias (Dicas, Curiosidades, Saúde, Adoção)

### Mensagens
- [x] Sistema de mensagens entre usuário e ONG
- [x] Conversas agrupadas
- [x] Indicador de mensagens não lidas

### Dashboard
- [x] Dashboard do usuário (favoritos, solicitações)
- [x] Dashboard da ONG (pets, interessados, notificações)
- [x] Notificações visuais

## What's Been Implemented (2026-01-08)

### Backend (/app/backend/server.py)
- FastAPI com todas as rotas API
- MongoDB com indexes otimizados
- JWT Auth + Google OAuth
- Object Storage para imagens
- CRUD: Users, Pets, Adoptions, Forum Posts, Comments, Messages, Notifications
- Admin seeding automático

### Frontend (/app/frontend/src/)
- Home page com hero section e listagem de pets
- Páginas: Auth, PetsList, PetDetails, Forum, ForumPost, Messages, Profile
- Dashboards: UserDashboard, OngDashboard
- Header com navegação responsiva
- Design: Paleta roxa/branco, Outfit+Figtree fonts

## P0 Features (MVP Complete) ✅
- [x] Autenticação JWT + Google
- [x] CRUD Pets com upload de fotos
- [x] Sistema de adoção
- [x] Fórum com comentários
- [x] Mensagens simples
- [x] Dashboards

## P1 Features (Next Phase)
- [ ] Chat em tempo real (WebSocket)
- [ ] Sistema de denúncias no fórum
- [ ] Notificações push
- [ ] Busca avançada de pets

## P2 Features (Future)
- [ ] App mobile (React Native)
- [ ] Integração com redes sociais
- [ ] Analytics de adoção
- [ ] Gamificação (badges para ONGs)

## Test Credentials
- Admin: admin@coracoespeludos.com / Admin@123

## Next Tasks
1. Adicionar mais pets de exemplo para demonstração
2. Melhorar filtros de busca
3. Adicionar funcionalidade de chat em tempo real
