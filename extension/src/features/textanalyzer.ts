// src/features/TextAnalyzer.ts

export const analyzeText = (text: string): string[] => {
  // Simulação de análise de texto. Uma implementação real utilizaria NLP para extrair tópicos.
  const keywords = ['direito', 'jurisprudência', 'STF', 'STJ', 'processo'];
  const foundKeywords = keywords.filter((keyword) => text.toLowerCase().includes(keyword));

  return foundKeywords;
};

