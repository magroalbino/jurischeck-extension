# ⚖️ JurisCheck Extension
> **Inteligência Artificial aplicada à busca e análise de jurisprudência em tempo real.**

O **JurisCheck** é uma extensão de navegador (Manifest V3) projetada para transformar a forma como advogados e profissionais do Direito pesquisam precedentes. Ao selecionar qualquer texto jurídico em seu navegador, a ferramenta utiliza IA para analisar o contexto, buscar acórdãos reais e fornecer um resumo executivo da aplicabilidade daquela decisão ao seu caso.

---

## ✨ Funcionalidades Principais

- **🔍 Busca Contextual Inteligente**: Selecione um parágrafo de uma petição ou notícia e encontre jurisprudências relacionadas instantaneamente.
- **🤖 Resumo Executivo com IA**: Cada resultado inclui uma análise automática explicando *por que* aquela decisão é relevante para o seu texto.
- **📊 Match Jurídico (%)**: Indicador visual de compatibilidade entre o seu caso e o precedente encontrado.
- **📜 Histórico de Pesquisas**: Acesso rápido às suas últimas 20 buscas, salvas localmente para sua conveniência.
- **🖥️ Dashboard do Backend**: Painel administrativo para monitorar o status do servidor, latência e atividade em tempo real.
- **🌐 Busca Real**: Integração com fontes públicas (como JusBrasil) para trazer dados atualizados de tribunais como STF, STJ e TST.

---

## 🛠️ Estrutura do Projeto

O ecossistema JurisCheck é dividido em duas partes principais:

### 1. Extension (`/extension`)
Interface do usuário construída com **React**, **Vite** e **Tailwind CSS**. Gerencia a captura de texto, o histórico local e a exibição dos resultados enriquecidos por IA.

### 2. Backend (`/backend`)
Servidor **Node.js** com **Express** que orquestra:
- **IA Service**: Processamento de linguagem natural para extração de termos e geração de resumos.
- **Search Service**: Motor de busca real com lógica de scraping e detecção de tribunais.
- **Dashboard**: Interface web para monitoramento do sistema.

---

## 🚀 Como Instalar e Usar (Passo a Passo)

### Passo 1: Configurar o Backend
O backend é o "cérebro" da extensão. Ele precisa estar rodando para que as buscas funcionem.
1. Abra o terminal na pasta `backend`.
2. Instale as dependências: `npm install`.
3. Inicie o servidor: `npm start`.
4. Verifique se o dashboard está ativo em: `http://localhost:3000`.

### Passo 2: Adicionar a Extensão ao Navegador
1. No Chrome ou Edge, acesse o endereço: `chrome://extensions`.
2. No canto superior direito, ative o **"Modo do desenvolvedor"**.
3. Clique no botão **"Carregar sem compactação"** (Load unpacked).
4. Selecione a pasta `extension` (ou a pasta `dist` dentro de extension, se você já tiver feito o build).
5. O ícone do JurisCheck aparecerá na sua barra de ferramentas!

### Passo 3: Utilizar na Prática
1. Navegue em qualquer site jurídico ou portal de notícias.
2. **Selecione um texto** que você deseja pesquisar.
3. Clique no ícone da extensão ou use o atalho (configurável).
4. Veja a IA analisar o texto e trazer os melhores precedentes com resumos exclusivos.

---

## ⚙️ Requisitos Técnicos
- **Node.js** (v16 ou superior)
- **Navegador** baseado em Chromium (Chrome, Edge, Brave, Opera)

---

## ⚖️ Contribuição e Licença
Este projeto é uma ferramenta de apoio e não substitui a análise técnica de um profissional do Direito. Contribuições são bem-vindas via Pull Requests.

**Desenvolvido por JurisCheck Team** ⚖️
