# JurisCheck-extension

## 📁 Estrutura do Projeto: jurischeck-extension (Manifest V3 + React + Node.js backend)

## 📦 Estrutura de Pastas
- `jurischeck-extension/`
  - `extension/` – Código da extensão (frontend)
    - `public/` – Ícones, imagens e arquivos estáticos
    - `manifest.json` – Manifesto V3 da extensão
    - `vite.config.ts` – Configuração com Vite
    - `src/`
      - `components/` – Componentes React reutilizáveis
      - `popup/` – Interface principal da extensão
      - `content/` – Scripts que interagem com páginas abertas
      - `background/` – Scripts de background (eventos e lifecycle)
      - `utils/` – Funções auxiliares
      - `features/` – Funcionalidades centrais
        - `TextAnalyzer.ts` – Analisa e extrai temas do texto
        - `SuggestionList.tsx` – Exibe sugestões de jurisprudência
        - `CitationGenerator.ts` – Gera citação formatada para petições
        - `FloatingButton.tsx` – Botão flutuante para ativar extensão
      - `index.tsx` – Entrada principal do React
  - `backend/` – Backend da IA (verificador de jurisprudência)
    - `index.js` – Servidor Express
    - `routes/`
      - `verify.js` – Verificação de jurisprudência
      - `suggest.js` – Sugestão de jurisprudência
    - `services/`
      - `aiService.js` – Conecta à IA (ChatGPT, Claude, etc.)
      - `scrapingService.js` – Scraper de sites jurídicos
      - `nlpService.js` – Processamento de linguagem natural
      - `jurisSearch.js` – Busca direta por jurisprudência
      - `linkFinder.js` – Localiza links oficiais (STJ, STF, etc.)
    - `utils/`
      - `formatUtils.js` – Formatação das respostas
    - `package.json` – Dependências do backend
  - `README.md` – Documentação do projeto

## 🧠 Tecnologias envolvidas:
 - Frontend: React, Vite, Manifest V3, Tailwind (opcional)
 - Backend: Node.js, Express, OpenAI/Claude API, Cheerio (scraping), NLP.js ou spaCy (via API externa)

## ▶️ Para rodar o projeto:
 1. Ir até `/backend` e rodar `npm install && node index.js`
 2. Ir até `/extension` e rodar `npm install && npm run dev`
 3. Carregar a extensão no Chrome via "Modo de Desenvolvedor" > "Carregar sem compactação"

## ✅ Com isso, você terá uma extensão que:
 - Analisa o texto selecionado e extrai temas jurídicos
 - Sugere jurisprudências reais e relevantes
 - Verifica se jurisprudência existente é real
 - Gera citações para petições com link oficial e explicação

## 🚀 Contribua com o JurisCheck

Este projeto ainda está em fase inicial e em constante evolução. Se você é desenvolvedor, jurista ou apenas alguém interessado em melhorar o acesso à jurisprudência de forma confiável, toda colaboração é bem-vinda!

Sinta-se livre para abrir issues, sugerir melhorias ou enviar pull requests.  
**Vamos juntos tornar o JurisCheck uma ferramenta essencial para quem trabalha com Direito no Brasil.** ⚖️💻
