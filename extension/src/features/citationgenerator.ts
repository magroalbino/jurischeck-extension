// src/features/CitationGenerator.ts

export const generateCitation = (jurisprudence: any) => {
  if (!jurisprudence) return '';

  const { id, name, date, court } = jurisprudence;

  // Formatação da citação para ser inserida em petições
  return `${name}, ${date} - ${court}. Id: ${id}.`;
};

