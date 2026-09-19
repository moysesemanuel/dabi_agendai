# DaBi Agendaí

Sistema de agendamento multi-tenant para prestadores de serviço com atendimento por horário — barbearias, salões, estúdios e clínicas. Cada estabelecimento tem seu próprio subdomínio, com site institucional, agendamento online, área do cliente, cobrança recorrente e um backoffice completo.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Prisma · PostgreSQL · Vercel

> Este repositório era `barbershop-app` e nasceu dentro do portfólio da DaBi Tech. Hoje é um produto independente. A barbearia **Prime Cut Studio** permanece no código como estabelecimento de demonstração — é dado de seed, não o nome do produto.

---

## O problema

Quem atende por horário marcado normalmente opera no WhatsApp e no caderno. O custo disso aparece como conflito de agenda, tempo perdido confirmando horário por mensagem, cliente que não aparece e nenhuma visão do próprio negócio.

O DaBi Agendaí estrutura essa operação: o cliente agenda sozinho, o estabelecimento vê a agenda em tempo real, o histórico fica registrado e o dono é avisado na hora de cada novo agendamento — sem precisar ficar de olho no WhatsApp.

---

## Módulos

| Módulo | O que faz |
|---|---|
| **Site institucional** | Home com serviços, equipe, planos, prova social e contato — um subdomínio por barbearia |
| **Cadastro self-service** | A barbearia se cadastra sozinha, escolhe um plano e já sai no ar com subdomínio próprio |
| **Agendamento** | Serviço → profissional → data → horário, com bloqueio de horário ocupado e carrinho para múltiplos serviços |
| **Área do cliente** | Cadastro, login, histórico, cancelamento, remarcação e recuperação de senha por e-mail |
| **Fidelidade** | Pontuação por atendimento, níveis e recompensas configuráveis |
| **Backoffice** | Agenda, catálogo de serviços e produtos, equipe, datas bloqueadas, dados de clientes/receita e FAQ |
| **Cobrança** | Assinatura recorrente via Mercado Pago, com bloqueio automático de acesso em caso de inadimplência |
| **Notificações** | Aviso automático de novo agendamento por Web Push e Telegram, mesmo com o painel fechado |

---

## O que já funciona hoje

| Área | Estado |
|---|---|
| Multi-tenant real (subdomínio e dados isolados por barbearia) | ✅ |
| Autenticação e autorização (admin e cliente, por tenant) | ✅ |
| Cobrança recorrente com bloqueio por inadimplência | ✅ |
| Cadastro self-service, sem intervenção manual | ✅ |
| Notificação automática de novo agendamento (Web Push + Telegram) | ✅ |
| Configuração do site persistida no banco, por tenant | ✅ |
| Troca/upgrade de plano pelo próprio painel | ⛔ ainda manual, via suporte |
| Testes automatizados | ⛔ ainda inexistentes |

---

## Rodando localmente

Pré-requisitos: Node.js 20+, Yarn 1.x, PostgreSQL.

```bash
yarn install
cp .env.example .env   # preencha as variáveis (banco, sessão, Mercado Pago, Resend, VAPID, Telegram)
yarn db:push
yarn dev
```

O schema não usa `prisma migrate` — mudanças de schema são aplicadas com `yarn db:push` (dev) e via SQL direto em produção.

---

## Roadmap

- Testes automatizados para o fluxo de agendamento e de cobrança
- Troca/upgrade de plano de assinatura pelo próprio painel
- Reduzir o flash de conteúdo de demonstração ao carregar o `/admin` (já corrigido nas páginas públicas)
- Adaptar copy e FAQ para outros tipos de negócio além de barbearia

---

## Licença e contato

Projeto proprietário da DaBi Tech — Digital Solutions.

- GitHub: https://github.com/moysesemanuel
- LinkedIn: https://www.linkedin.com/in/moysesemanuel
