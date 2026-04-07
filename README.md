# Prime Cut Barbershop

<p align="center">
  Plataforma web full stack para barbearias, com foco em experiência do cliente, operação comercial e gestão administrativa.
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" />
  <img alt="React" src="https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
</p>

---

## Demo

- **Home:** `http://localhost:3001`
- **Agendamento:** `http://localhost:3001/agendamento`
- **Fidelidade:** `http://localhost:3001/fidelidade`
- **Admin:** `http://localhost:3001/admin`

> Se publicar o projeto, troque os links locais pela URL pública.

## O que é o projeto

O **Prime Cut Barbershop** é um projeto full stack desenvolvido como case de portfólio para representar a operação de uma barbearia moderna em um cenário próximo do real.

A aplicação foi pensada para ir além de uma landing page, reunindo em um único produto:

- site institucional
- agendamento online
- área de fidelidade
- carrinho
- painel administrativo

## Problema que resolve

Muitas barbearias ainda operam com processos fragmentados, como agenda no WhatsApp, confirmação manual, catálogo pouco estruturado e pouca integração entre atendimento e operação.

Isso normalmente gera:

- conflitos de agenda
- demora para marcar ou remarcar atendimentos
- experiência inconsistente para o cliente
- retrabalho operacional
- baixa visibilidade sobre recorrência, fidelização e rotina do negócio

O projeto resolve esse cenário ao centralizar a jornada pública e a operação interna em uma única plataforma.

## Principais funcionalidades

- site institucional com apresentação da marca, serviços e diferenciais
- fluxo de agendamento por serviço, profissional, data e horário
- validação de disponibilidade com bloqueio de horários ocupados
- carrinho para produtos e complementos
- área de fidelidade com planos, progresso e recompensas
- sessão de cliente com login/cadastro
- avaliações com fallback local e estrutura preparada para Google Reviews
- painel administrativo para gestão operacional
- gerenciamento de catálogo, agenda, bloqueios de data e conteúdo do site
- atalhos de contato e confirmação via WhatsApp

## Stack

- **Next.js 16**
- **React 19**
- **TypeScript**
- **Prisma**
- **PostgreSQL**
- **CSS Modules**

## Imagens

### Home

![Preview da home](./public/img/localhost_3001_portfolio_barbearia.png)

### Painel administrativo

![Preview do painel administrativo](./public/img/localhost_3001_admin_agenda.png)

## Como rodar

### Pré-requisitos

- Node.js 20+
- Yarn 1.x
- PostgreSQL

### Instalação

```bash
yarn install
cp .env.example .env
```

### Variáveis de ambiente

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
GOOGLE_PLACES_API_KEY=""
GOOGLE_PLACE_ID=""
```

### Banco de dados

```bash
yarn db:push
```

### Ambiente de desenvolvimento

```bash
yarn dev
```

A aplicação ficará disponível em:

- `http://localhost:3001`
- `http://localhost:3001/agendamento`
- `http://localhost:3001/fidelidade`
- `http://localhost:3001/admin`

## Estrutura básica

```text
.
|-- prisma/
|   `-- schema.prisma
|-- public/
|   `-- img/
`-- src/
    |-- app/
    |   |-- admin/
    |   |-- agendamento/
    |   |-- fidelidade/
    |   `-- api/
    |-- components/
    |   |-- projects/barbershop/
    |   `-- shared/
    `-- lib/
```

### Organização

- `src/app`: rotas da aplicação e endpoints
- `src/components/projects/barbershop`: componentes principais da interface
- `src/components/shared`: componentes e utilitários compartilhados
- `src/lib`: regras de negócio, integrações e acesso ao banco
- `prisma/schema.prisma`: modelagem do banco de dados

## Desafios técnicos

- estruturar uma aplicação com áreas públicas e administrativas no mesmo projeto
- organizar regras de agendamento e disponibilidade de forma consistente
- modelar entidades centrais do negócio com Prisma e PostgreSQL
- manter a experiência do usuário simples em um fluxo com múltiplas etapas
- preparar integrações externas sem acoplar o projeto a serviços obrigatórios desde o início

## Aprendizados

- construção de uma aplicação full stack orientada a produto
- modelagem de dados para um cenário operacional real
- separação de responsabilidades entre interface, regras de negócio e persistência
- organização de frontend com App Router e componentes reutilizáveis
- evolução de um projeto de portfólio para algo próximo de um MVP

## Por que esse projeto se destaca

- não é apenas uma interface visual, mas uma solução com fluxo de negócio completo
- conecta frontend, backend e banco de dados dentro de um mesmo contexto de produto
- demonstra preocupação com experiência do usuário e rotina operacional
- mostra capacidade de estruturar um projeto escalável com stack moderna
- serve como base realista para MVP, produto comercial ou expansão futura

## Destaques para recrutador

- visão de produto completa
- domínio prático de Next.js, React, TypeScript e Prisma
- integração entre interface, lógica de negócio e persistência
- preocupação com usabilidade, operação e consistência técnica
- projeto com perfil forte de portfólio profissional

## Próximos passos

- autenticação administrativa mais robusta
- deploy em produção
- integração real com serviços externos de mensagens
- dashboard com métricas operacionais
- evolução da fidelidade para resgate dentro do fluxo do cliente

## Contato

Se quiser conversar sobre o projeto, arquitetura ou oportunidades, este repositório representa bem meu estilo de construção: foco em produto, organização técnica e execução ponta a ponta.

- **GitHub:** `SEU_GITHUB_AQUI`
- **LinkedIn:** `SEU_LINKEDIN_AQUI`
- **Portfólio:** `SEU_PORTFOLIO_AQUI`
