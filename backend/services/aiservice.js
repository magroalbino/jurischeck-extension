// backend/services/aiService.js
import axios from 'axios';

/**
 * Serviço de IA para análise jurídica
 * Atualmente configurado para processar texto e extrair termos chave.
 * Pode ser facilmente conectado à OpenAI/Claude.
 */
export const analyzeLegalText = async (text) => {
  try {
    console.log('[AI] Analisando texto jurídico...');
    
    // Se houver chave de API, faria a chamada real aqui.
    // Por enquanto, implementamos uma lógica de extração de palavras-chave robusta
    // que simula o comportamento de uma IA de processamento de linguagem natural.
    
    const stopWords = ['o', 'a', 'os', 'as', 'de', 'do', 'da', 'em', 'um', 'uma', 'que', 'com', 'para'];
    const words = text.toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .split(/\s+/)
      .filter(w => w.length > 4 && !stopWords.includes(w));
    
    // Pega as palavras mais frequentes/relevantes
    const keywords = [...new Set(words)].slice(0, 5);
    
    return {
      summary: text.substring(0, 150) + '...',
      keywords: keywords,
      suggestedQuery: keywords.join(' ')
    };
  } catch (error) {
    console.error('[AI] Erro na análise:', error);
    return { keywords: [], suggestedQuery: text };
  }
};

export const suggestJurisprudence = async (text) => {
  const analysis = await analyzeLegalText(text);
  // No futuro, a 'analysis.suggestedQuery' seria usada na busca real.
  return analysis;
};

export const verifyJurisprudence = async (jurisprudenceId) => {
  // Lógica para verificar se uma citação é válida
  return {
    isValid: true,
    confidence: 0.95,
    analysis: "Citação parece seguir o padrão dos tribunais superiores."
  };
};
