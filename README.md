# ReciclaSpot 🌱

Aplicativo móvel desenvolvido em **React Native (Expo)** para conectar cidadãos e voluntários a ecopontos próximos, permitindo busca por categoria de resíduo, visualização no mapa, registro fotográfico de descartes e cadastro de novos pontos de coleta.

---

## 📱 Funcionalidades

- **Explorar Ecopontos**: listagem dinâmica ordenada por proximidade, busca por nome/bairro/endereço, filtro por categoria (`Eletrônicos`, `Óleo Usado`, `Pilhas/Baterias`, `Recicláveis Gerais`, `Medicamentos`) e **Pull-to-Refresh**.
- **Mapa Interativo**: visualização dos ecopontos com marcadores personalizados, callouts de detalhes e cadastro de novos pontos por voluntários.
- **Detalhes do Ecoponto**: consulta de horários, endereço, telefone, materiais aceitos, localização no mapa e favoritos.
- **Perfil e Descartes**: registro de descartes com foto via câmera, histórico persistido e alternância entre perfis de **Cidadão** e **Voluntário**.
- **Resiliência de Rede**: tratamento de falhas com `try/catch/finally`, timeout configurado (8s) no cliente Axios e tela de erro com botão **Tentar Novamente**.

---

## 🧱 Arquitetura do Projeto

```text
src/
├── __tests__/      # Testes unitários com Jest
├── components/     # Componentes reutilizáveis de UI (EcoPin, PontoCard, ErrorState, NovoPontoModal)
├── constants/      # Constantes de domínio (categorias e ícones)
├── context/        # Provedores de estado global (EcopontosContext, UserContext)
├── docs/           # Screenshots do Projeto
├── hooks/          # Custom hooks (useEcopontos, useLocation, useFavoritos, usePontosFiltrados, useUser)
├── navigation/     # Configuração de rotas (Stack e Bottom Tabs)
├── screens/        # Telas da aplicação
├── services/       # Cliente HTTP Axios (api.ts), geolocalização e persistência
├── types/          # Interfaces e tipos TypeScript
└── utils/          # Funções puras de formatação e validação
```

---

## 🌐 Endpoints da API (`src/services/api.ts`)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/ecopontos` | Lista os ecopontos (suporta `?material=`, `lat`, `lng`, `raioKm`) |
| `GET` | `/ecopontos/:id` | Busca os detalhes completos de um ecoponto específico |
| `POST` | `/usuarios` | Cadastra um novo cidadão ou voluntário e salva o token JWT |

---

## 🚀 Como Executar

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar o servidor Expo
npx expo start
```

### Executar Testes Unitários

```bash
npm test
```

### Gerar Build Android (APK via EAS Build)

```bash
eas build -p android --profile preview
```

---

## Link para instalar o app

- **APK Android (Preview)**: `https://expo.dev/accounts/emilly.nascimento/projects/reciclaspot/builds/a10693c3-0f3b-48e6-b68b-04e3511675cb`

