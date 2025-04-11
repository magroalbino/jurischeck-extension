// backend/utils/formatUtils.js

// Função para formatar a resposta de jurisprudência antes de enviar para o frontend
const formatJurisprudenceResponse = (jurisprudenceData) => {
  if (!jurisprudenceData) {
    return null;
  }

  return {
    title: jurisprudenceData.title || 'Título não disponível',
    content: jurisprudenceData.content || 'Conteúdo não disponível',
    links: jurisprudenceData.links || [],
    themes: jurisprudenceData.themes || [],
  };
};

// Função para formatar uma lista de sugestões de jurisprudência
const formatSuggestionList = (suggestions) => {
  if (!suggestions || suggestions.length === 0) {
    return [];
  }

  return suggestions.map((suggestion) => ({
    id: suggestion.id || 'ID não disponível',
    title: suggestion.title || 'Título não disponível',
    link: suggestion.link || 'Link não disponível',
  }));
};

// Função para formatar a citação gerada para petições
const formatCitation = (jurisprudenceId, title, court) => {
  return `${title}, ${court}. Jurisprudência ID: ${jurisprudenceId}.`;
};

module.exports = {
  formatJurisprudenceResponse,
  formatSuggestionList,
  formatCitation,
};

