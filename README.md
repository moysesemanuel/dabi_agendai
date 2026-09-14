# DaBi Agendaí

Sistema de agendamento para prestadores de serviço com atendimento por horário — barbearias, salões, estúdios e clínicas. Reúne site institucional, agendamento online, área do cliente, carrinho e backoffice operacional em um único produto.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Prisma · PostgreSQL · Vercel

> Este repositório era `barbershop-app` e nasceu dentro do portfólio da DaBi Tech. Hoje é um produto independente. A barbearia **Prime Cut Studio** permanece no código como estabelecimento de demonstração — é dado de seed, não o nome do produto.

---

## O problema

Quem atende por horário marcado normalmente opera no WhatsApp e no caderno. O custo disso aparece como conflito de agenda, tempo perdido confirmando horário por mensagem, cliente que não aparece e nenhuma visão do próprio negócio.

O DaBi Agendaí estrutura essa operação: o cliente agenda sozinho, o estabelecimento vê a agenda em tempo real e o histórico fica registrado.

---

## Módulos

| Módulo | O que faz |
|---|---|
| **Site institucional** | Home com serviços, equipe, prova social e contato |
| **Agendamento** | Serviço → profissional → data → horário, com bloqueio de horário ocupado |
| **Área do cliente** | Cadastro, login, histórico, cancelamento e remarcação |
| **Carrinho** | Múltiplos serviços em uma mesma reserva |
| **Fidelidade** | Pontuação por atendimento, faixas e recompensas |
| **Backoffice** | Agenda do dia, reserva manual, catálogo de serviços, equipe, datas bloqueadas e cadastro de clientes |
| **Notificações** | Alerta de novo agendamento no painel (Notification API + som), por polling |

---

## Estado atual

Este é um **MVP funcional**, ainda não liberado para uso comercial:

| Área | Estado |
|---|---|
| Fluxo de agendamento ponta a ponta | ✅ funcionando |
| Backoffice operacional | ✅ funcionando |
| Autenticação e autorização | ⛔ **ausente** — bloqueador |
| Persistência das configurações do site | ⚠️ em `localStorage`, não no banco |
| Fuso horário | ⚠️ depende do fuso do servidor |
| Notificação para o **cliente** (WhatsApp/e-mail) | ⛔ não implementada |
| Pagamento / checkout | ⛔ não implementado |
| Testes automatizados | ⛔ inexistentes |

**Não publique este sistema com acesso público enquanto o `/admin` não tiver autenticação.**

---

## Rodando localmente

Pré-requisitos: Node.js 20+, Yarn 1.x, PostgreSQL.

```bash
yarn install
cp .env.example .env   # preencha DATABASE_URL e DIRECT_URL
yarn db:push
yarn dev               # http://localhost:3001
```

### Variáveis de ambiente

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
GOOGLE_PLACES_API_KEY=""   # opcional — avaliações do Google
GOOGLE_PLACE_ID=""         # opcional
```

Na primeira execução o banco é populado com serviços, profissionais e agendamentos de demonstração.

---

## Estrutura

```
prisma/schema.prisma                     modelagem (Barber, Customer, Service, Appointment, ClosedDate)
src/app/                                 rotas e endpoints
  ├── api/                               agendamentos, disponibilidade, sessão, sincronização
  ├── admin/                             backoffice
  ├── agendamento/  agendamentos/        fluxo do cliente
  └── fidelidade/
src/components/projects/barbershop/      componentes do produto
src/components/shared/                   componentes reutilizáveis
src/lib/booking.ts                       regras de agenda: slots, sobreposição, remarcação
```

O núcleo de negócio está em `src/lib/booking.ts`: geração de slots, checagem de sobreposição, horário de funcionamento, datas bloqueadas e busca do próximo horário livre.

---

## Roadmap

**Antes de qualquer cliente real**
- Autenticação com sessão no servidor e proteção de `/admin` e das rotas de API
- Configuração do estabelecimento no banco, não no navegador
- Fuso horário explícito em `America/Sao_Paulo`
- Constraint e transação no horário, para eliminar reserva concorrente

**Para o produto ficar completo**
- Confirmação e lembrete automáticos por WhatsApp e e-mail
- Horário de funcionamento e folga configuráveis por profissional
- Checkout e pagamento no carrinho
- Multi-tenant, para atender mais de um estabelecimento na mesma instalação

---

## Licença e contato

Projeto proprietário da DaBi Tech — Digital Solutions.

- GitHub: https://github.com/moysesemanuel
- LinkedIn: https://www.linkedin.com/in/moysesemanuel
