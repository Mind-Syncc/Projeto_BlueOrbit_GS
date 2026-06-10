# 🚀 BlueOrbit – Space Safety Intelligence

## 📖 Sobre o Projeto

O **BlueOrbit** é uma aplicação mobile desenvolvida em **React Native com Expo**, criada para contribuir com a segurança espacial por meio do monitoramento de satélites e detritos espaciais.

A plataforma utiliza dados orbitais para apresentar informações sobre objetos espaciais, identificar possíveis riscos de colisão, gerar alertas e oferecer suporte à tomada de decisões com auxílio de Inteligência Artificial.

O projeto foi desenvolvido como parte da **Global Solution FIAP**, abordando os desafios relacionados ao crescimento do lixo espacial e à segurança das operações em órbita terrestre.

## 🎯 Objetivo

Oferecer uma ferramenta acessível para visualização e monitoramento de objetos espaciais, permitindo que usuários acompanhem informações orbitais, recebam alertas de risco e consultem análises geradas por Inteligência Artificial.

## 🛠️ Tecnologias Utilizadas

- React Native
- Expo SDK 54
- Firebase Authentication
- Firebase Firestore
- React Navigation
- AsyncStorage
- Expo Notifications
- React Native SVG
- API CelesTrak
- Inteligência Artificial Generativa
- Plataforma Groq
- Modelo Llama 3.3

## 🤖 Inteligência Artificial

O BlueOrbit conta com integração de Inteligência Artificial Generativa utilizando a plataforma **Groq** e o modelo **Llama 3.3**.

A IA é responsável por:

- Responder perguntas sobre objetos espaciais monitorados;
- Auxiliar na análise de riscos orbitais;
- Fornecer recomendações relacionadas à segurança espacial;
- Interpretar dados apresentados pelo sistema;
- Oferecer uma experiência conversacional em linguagem natural.

Quando o usuário realiza uma pergunta, a aplicação envia a solicitação para a API da Groq, que processa a informação utilizando o modelo Llama 3.3 e retorna uma resposta contextualizada em tempo real.

## 📱 Funcionalidades

### Autenticação

- Cadastro de usuários
- Login seguro
- Gerenciamento de sessão

### Monitoramento Espacial

- Listagem de objetos espaciais
- Visualização de satélites e detritos espaciais
- Consulta de informações orbitais
- Mapa orbital interativo

### Inteligência Artificial

- Chat com IA
- Análises automatizadas
- Recomendações relacionadas à segurança espacial

### Alertas e Ocorrências

- Notificações de eventos
- Registro de ocorrências
- Histórico de monitoramento
- Classificação de riscos

## 🌟 Recursos Implementados

### Interface Mobile

O aplicativo foi desenvolvido com foco em dispositivos móveis, oferecendo navegação intuitiva e uma experiência fluida para o usuário.

### Telas Implementadas

- Login
- Cadastro
- Dashboard Principal
- Listagem de Objetos Espaciais
- Detalhes do Objeto Espacial
- Mapa Orbital
- Ocorrências
- Notificações
- Perfil do Usuário
- Análise por IA
- Chat com IA

## 🔄 Fluxo de Utilização

1. Criar uma conta ou realizar login;
2. Acessar o dashboard principal;
3. Consultar objetos espaciais monitorados;
4. Visualizar informações detalhadas sobre satélites e detritos espaciais;
5. Receber notificações e alertas;
6. Registrar e acompanhar ocorrências;
7. Utilizar a Inteligência Artificial para análises e consultas;
8. Explorar o mapa orbital interativo.

## 💾 Manipulação de Dados

O sistema utiliza diferentes fontes de dados para garantir uma experiência completa:

- Firebase Authentication para autenticação de usuários;
- Firebase Firestore para armazenamento de informações;
- AsyncStorage para persistência local;
- API CelesTrak para obtenção de dados orbitais;
- Dados simulados para cenários de monitoramento e análise de riscos.

As informações são apresentadas por meio de dashboards, listas, indicadores e telas detalhadas.

## 📲 Recursos Mobile

O aplicativo faz uso de funcionalidades nativas do ambiente mobile, incluindo:

- Notificações locais;
- Armazenamento local;
- Navegação nativa;
- Integração com serviços em nuvem;
- Interface responsiva e otimizada para smartphones.

## ✅ Validações e Tratamento de Erros

Para garantir uma utilização segura e consistente, o sistema implementa:

- Validação de campos obrigatórios;
- Validação de autenticação;
- Mensagens de erro amigáveis;
- Tratamento de falhas de comunicação com APIs;
- Controle de estados de carregamento;
- Tratamento para dados indisponíveis ou inválidos.

## 🎥 Demonstração do Projeto

### Vídeo Demonstrativo

> Inserir link do vídeo apresentando a aplicação.

### Funcionalidades Demonstradas

- Cadastro e Login
- Navegação entre telas
- Consulta de objetos espaciais
- Visualização do mapa orbital
- Recebimento de notificações
- Utilização da Inteligência Artificial
- Registro e consulta de ocorrências

## 🚀 Instalação

```bash
cd Projeto_BlueOrbit_GS
npm install
```

## ▶️ Execução

```bash
# Expo Go
npx expo start

# Web
npx expo start --web

# iOS
npx expo start --ios
```

Escaneie o QR Code utilizando o aplicativo **Expo Go** ou pressione **W** para executar no navegador.

## 📁 Estrutura do Projeto

```text
Projeto_BlueOrbit_GS/
├── App.js
├── app.json
├── babel.config.js
├── package.json
└── src/
    ├── components/
    │   ├── BottomNav.js
    │   └── UI.js
    ├── firebase/
    │   ├── authService.js
    │   ├── config.js
    │   └── databaseService.js
    ├── screens/
    │   ├── AIAnalysisScreen.js
    │   ├── AIChatScreen.js
    │   ├── DashboardScreen.js
    │   ├── LoginScreen.js
    │   ├── NotificationsScreen.js
    │   ├── OccurrencesScreen.js
    │   ├── OrbitalMapScreen.js
    │   ├── ProfileScreen.js
    │   ├── RegisterScreen.js
    │   ├── SpaceObjectDetailScreen.js
    │   └── SpaceObjectsScreen.js
    ├── services/
    │   └── celestrakService.js
    ├── styles/
    │   └── theme.js
    └── utils/
        └── mockData.js
```

## 🌍 Aplicação do Tema

O BlueOrbit foi desenvolvido para contribuir com a conscientização sobre segurança espacial, auxiliando na identificação de riscos envolvendo satélites e detritos espaciais.

Por meio do monitoramento orbital, análise de dados e Inteligência Artificial, a solução demonstra como a tecnologia pode apoiar a prevenção de colisões e uma gestão mais eficiente do crescente volume de objetos em órbita terrestre.

## 👥 Equipe

### Integrantes

- Heloísa Fleury Jardim — RM556378
- Juan Fuentes Rufino — RM557673
- Rickelmyn de Souza Ruescas — RM556055
- Paulo Henrique Monteiro Golovanevsky — RM555300
- Pedro Henrique Silva Batista — RM558137

## 🚀 BlueOrbit

**Monitorando o espaço hoje para proteger o futuro das operações orbitais.**

Projeto desenvolvido para a **Global Solution FIAP**.
