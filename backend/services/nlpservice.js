// backend/services/nlpService.js

const nlp = require('compromise'); // Exemplo de NLP com Compromise (pode ser substituído por spaCy ou NLP.js)

// Função para analisar o texto e extrair temas jurídicos
const extractLegalThemes = (text) => {
  const doc = nlp(text);
  const topics = doc.topics().out('array'); // Extrai tópicos do texto
  return topics;
};

module.exports = {
  extractLegalThemes,
};

