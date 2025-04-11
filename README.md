# 🧠 JurisCheck Extension – Extensão Inteligente para Jurisprudência
JurisCheck é uma extensão para navegadores (Manifest V3) que utiliza inteligência artificial para verificar jurisprudências e sugerir precedentes jurídicos relevantes com base em textos selecionados diretamente nas páginas.

🔍 Ideal para estudantes de Direito, advogados e profissionais que atuam com petições e análise jurisprudencial.

## 📁 Estrutura do Projeto: jurischeck-extension (Manifest V3 + React + Node.js backend)

## 📦 Estrutura de Pastas
```
jurischeck-extension/
├── extension/                     # Código da extensão (frontend)
│   ├── public/                   # Ícones, imagens e arquivos estáticos
│   │   └── icons/                # Ícones da extensão (16, 48, 128 px etc.)
│   ├── manifest.json             # Manifesto V3 da extensão
│   ├── vite.config.ts            # Configuração do Vite
│   ├── tsconfig.json             # Configuração do TypeScript
│   └── src/                      # Código-fonte da extensão
│       ├── components/           # Componentes React reutilizáveis
│       │   └── loader.tsx        # Indicador de carregamento
│       ├── popup/                # Interface do popup da extensão
│       │   ├── popup.tsx         # Componente principal da UI
│       │   ├── main.tsx          # Entrada que renderiza o React
│       │   └── index.html        # HTML base do popup
│       ├── background.ts         # Script de background (service worker)
│       ├── content.ts            # Script que interage com o conteúdo da aba
│       ├── api.ts                # Módulo de chamada ao backend
│       └── types.ts              # Tipagens auxiliares
├── backend/                      # Backend Node.js com integração de IA
│   ├── index.js                  # Servidor Express principal
│   ├── routes/                   # Rotas da API
│   │   ├── verify.js             # Verificação de jurisprudência por ID
│   │   └── suggest.js            # Sugestão de jurisprudência com base em texto
│   ├── services/                 # Serviços externos e IA
│   │   ├── aiService.js          # Integração com IA (ChatGPT, Claude, etc.)
│   │   ├── scrapingService.js    # Scraping de sites jurídicos
│   │   ├── nlpService.js         # Análise de linguagem natural
│   │   ├── jurisSearch.js        # Busca direta por jurisprudência
│   │   └── linkFinder.js         # Busca por links oficiais (STF, STJ, etc.)
│   ├── utils/                    # Utilitários e formatação
│   │   └── formatUtils.js        # Funções de formatação das respostas
│   └── package.json              # Dependências e scripts do backend
└── README.md                     # Documentação do projeto
```

## ⚙️ Tecnologias envolvidas:
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

💻 **Vamos juntos tornar o JurisCheck uma ferramenta essencial para quem trabalha com Direito no Brasil.** ⚖️
