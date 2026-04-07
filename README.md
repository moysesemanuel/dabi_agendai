# 💈 Prime Cut Barbershop

<p align="center">
  Sistema completo para barbearias modernas, unindo presença digital, agendamento online e gestão administrativa em um único produto.
</p>

<p align="center">
  <a href="https://portfolio-dabitech-beryl.vercel.app" target="_blank"><strong>Ver aplicação online</strong></a> •
  <a href="https://portfolio-dabitech-beryl.vercel.app/agendamento" target="_blank"><strong>Agendamento</strong></a> •
  <a href="https://portfolio-dabitech-beryl.vercel.app/admin" target="_blank"><strong>Painel administrativo</strong></a>
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" />
  <img alt="React" src="https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
</p>

---

## 🚀 O que é o produto

O **Prime Cut Barbershop** é uma aplicação full stack desenvolvida como um MVP real para barbearias que desejam profissionalizar sua operação.

A plataforma centraliza:

- presença digital  
- agendamento online  
- relacionamento com clientes  
- gestão administrativa  

Tudo em um único sistema.

---

## 💡 O que esse sistema resolve

Barbearias que utilizam WhatsApp ou processos manuais enfrentam:

- conflitos de agenda  
- perda de tempo com confirmações  
- experiência inconsistente para o cliente  
- retrabalho operacional  
- baixa visibilidade sobre o negócio  

O sistema resolve esse cenário ao estruturar toda a jornada do cliente e a operação interna em uma única plataforma.

---

## 🚀 O que você ganha com esse sistema

- Agenda organizada e automatizada  
- Redução de retrabalho manual  
- Melhor experiência para o cliente  
- Aumento de fidelização  
- Base pronta para crescimento do negócio  

---

## 📌 Status do projeto

- ✅ MVP funcional  
- ✅ Publicado na Vercel  
- ✅ Estrutura full stack integrada  
- 🔄 Em evolução contínua  

---

## 🌐 Ambiente publicado

A aplicação está disponível online e pode ser explorada nas principais áreas:

- Home  
- Agendamento  
- Fidelidade  
- Painel administrativo  

🔗 https://portfolio-dabitech-beryl.vercel.app

---

## 🧩 Módulos do sistema

### 📅 Agendamento inteligente
- Escolha de serviço, profissional e horário  
- Bloqueio automático de horários ocupados  

### 👤 Área do cliente
- Cadastro e login  
- Histórico e fidelidade  

### 🎁 Fidelidade
- Planos e recompensas  
- Acompanhamento de progresso  

### 🛒 Produtos e serviços
- Carrinho integrado  
- Complementos ao atendimento  

### ⚙️ Painel administrativo
- Gestão de agenda  
- Controle de serviços  
- Configuração do sistema  

---

## 🛠️ Stack

- Next.js 16  
- React 19  
- TypeScript  
- Prisma  
- PostgreSQL  
- CSS Modules  

---

## 🖼️ Imagens

### Home

![Preview da home](./public/img/localhost_3001_portfolio_barbearia.png)

### Painel administrativo

![Preview do painel administrativo](./public/img/localhost_3001_admin_agenda.png)

---

## ⚙️ Como rodar o projeto

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

📁 Estrutura do projeto
```bash
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

### 🧠 Organização
`src/app:` rotas da aplicação e endpoints  
`src/components/projects/barbershop:` componentes principais  
`src/components/shared:` componentes reutilizáveis  
`src/lib:` regras de negócio e integrações  
`prisma/schema.prisma:` modelagem do banco  

### 🧠 Visão técnica

* arquitetura full stack integrada
* separação clara entre interface, regras de negócio e persistência
* modelagem de dados orientada ao domínio
* uso de Prisma com PostgreSQL
* frontend estruturado com App Router

### 🚀 Por que esse projeto se destaca

* não é apenas uma interface visual, mas uma solução com fluxo de negócio completo
* conecta frontend, backend e banco de dados dentro de um mesmo contexto
* projeto publicado em ambiente real (Vercel), demonstrando entrega ponta a ponta
* demonstra preocupação com experiência do usuário e operação
* serve como base realista para MVP ou produto comercial

### 📈 Próximos passos
* autenticação administrativa mais robusta
* deploy com domínio customizado
* integração real com serviços de mensagens
* dashboard com métricas operacionais
* evolução da fidelidade dentro do fluxo do cliente

### 💬 Interesse no projeto

Esse sistema pode evoluir para um produto real ou ser adaptado para outros tipos de negócio.

Se quiser conversar sobre:

* uso comercial
* arquitetura
* personalização
Entre em contato 👇

### 📬 Contato
* GitHub: https://github.com/moysesemanuel  
* LinkedIn: https://www.linkedin.com/in/moysesemanuel  
* Portfólio: https://portfolio-dabitech-beryl.vercel.app/portfolio/barbearia
