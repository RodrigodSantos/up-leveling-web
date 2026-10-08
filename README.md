# 🎮 Up Leveling Web

![CI](https://github.com/RodrigodSantos/up-leveling-web/actions/workflows/ci.yml/badge.svg)

Frontend do **Up Leveling**: hábitos gamificados. Cumpra seus hábitos, ganhe XP, mantenha sequências e suba de nível.

> 🚧 **Em construção.** A API já está publicada: [up-leveling](https://github.com/RodrigodSantos/up-leveling) · [Swagger](https://up-leveling-api.onrender.com).

## 🛠️ Stack

- **React 19** + **TypeScript**, com **Vite**
- **Tailwind CSS 4** + **shadcn/ui** (componentes acessíveis)
- **React Router** (rotas) e **TanStack Query** (dados da API, cache e atualização)
- **Vitest** + **Testing Library** (testes)
- **oxlint** + **Prettier** (padrão de código)
- Deploy na **Vercel**

## 🚀 Como rodar

Pré-requisito: Node 22.

```bash
npm install
npm run dev
```

Abre em http://localhost:5173. Por padrão, o front chama a API em `http://localhost:8080` (o backend rodando local). Para usar a API publicada, crie um `.env.local`:

```bash
VITE_API_URL=https://up-leveling-api.onrender.com
```

### Scripts

| Comando             | O que faz                                           |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento, com recarga automática |
| `npm test`          | Testes (Vitest)                                     |
| `npm run lint`      | Lint (oxlint)                                       |
| `npm run typecheck` | Checagem de tipos do TypeScript                     |
| `npm run format`    | Formata o código (Prettier)                         |
| `npm run build`     | Gera a versão de produção em `dist/`                |

## 📁 Estrutura

```
src
├── app/            # rotas e cache de dados (TanStack Query)
├── components/
│   ├── layout/     # cabeçalho, menu e moldura das telas
│   └── ui/         # componentes do shadcn/ui (botão, modal...)
├── lib/
│   ├── api/        # cliente HTTP: token, JSON e erros da API (RFC 9457)
│   └── auth/       # sessão (token e expiração) no navegador
└── test/           # configuração dos testes
```

## 🗺️ Roadmap

- [x] Fundação: Vite, Tailwind, shadcn/ui, rotas, cliente da API, testes, CI
- [ ] Login, cadastro e conta demo
- [ ] Tela "Hoje": check-ins, meta diária, streak, nível
- [ ] Hábitos: criar, editar, pausar e excluir
- [ ] Histórico com gráfico de XP e perfil
- [ ] Responsivo, tema escuro e acabamento
