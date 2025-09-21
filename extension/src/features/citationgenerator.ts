// src/features/CitationGenerator.ts

// Interface para tipagem da jurisprudência
interface JurisprudenceData {
  id: string;
  name?: string;
  titulo?: string;
  date?: string;
  dataJulgamento?: string;
  court?: string;
  tribunal?: string;
  numero?: string;
  relator?: string;
  ementa?: string;
  link?: string;
}

// Tipos de formato de citação
type CitationFormat = 'abnt' | 'apa' | 'chicago' | 'simple';

// Interface para opções de citação
interface CitationOptions {
  format?: CitationFormat;
  includeLink?: boolean;
  includeEmenta?: boolean;
  maxEmentaLength?: number;
}

// Função principal para gerar citação
export const generateCitation = (
  jurisprudence: JurisprudenceData, 
  options: CitationOptions = {}
): string => {
  if (!jurisprudence) return '';

  const {
    format = 'simple',
    includeLink = false,
    includeEmenta = false,
    maxEmentaLength = 100
  } = options;

  switch (format) {
    case 'abnt':
      return generateABNTCitation(jurisprudence, includeLink, includeEmenta, maxEmentaLength);
    case 'apa':
      return generateAPACitation(jurisprudence, includeLink);
    case 'chicago':
      return generateChicagoCitation(jurisprudence, includeLink);
    case 'simple':
    default:
      return generateSimpleCitation(jurisprudence, includeLink);
  }
};

// Função para gerar citação no formato ABNT
function generateABNTCitation(
  jurisprudence: JurisprudenceData, 
  includeLink: boolean, 
  includeEmenta: boolean, 
  maxEmentaLength: number
): string {
  const tribunal = jurisprudence.tribunal || jurisprudence.court || 'Tribunal';
  const numero = jurisprudence.numero || jurisprudence.id;
  const titulo = jurisprudence.titulo || jurisprudence.name || 'Sem título';
  const relator = jurisprudence.relator || 'Relator não informado';
  const data = jurisprudence.dataJulgamento || jurisprudence.date;
  
  const ano = data ? new Date(data).getFullYear() : new Date().getFullYear();
  
  let citation = `${tribunal.toUpperCase()}. ${numero}. ${titulo}. Relator: ${relator}. ${ano}.`;
  
  if (includeEmenta && jurisprudence.ementa) {
    const ementa = jurisprudence.ementa.length > maxEmentaLength 
      ? `${jurisprudence.ementa.substring(0, maxEmentaLength)}...`
      : jurisprudence.ementa;
    citation += ` Ementa: ${ementa}`;
  }
  
  if (includeLink && jurisprudence.link) {
    citation += ` Disponível em: ${jurisprudence.link}`;
  }
  
  return citation;
}

// Função para gerar citação no formato APA
function generateAPACitation(jurisprudence: JurisprudenceData, includeLink: boolean): string {
  const tribunal = jurisprudence.tribunal || jurisprudence.court || 'Tribunal';
  const numero = jurisprudence.numero || jurisprudence.id;
  const titulo = jurisprudence.titulo || jurisprudence.name || 'Sem título';
  const relator = jurisprudence.relator || 'Relator não informado';
  const data = jurisprudence.dataJulgamento || jurisprudence.date;
  
  const ano = data ? new Date(data).getFullYear() : new Date().getFullYear();
  
  let citation = `${tribunal} (${ano}). ${titulo} (${numero}). ${relator} (Relator).`;
  
  if (includeLink && jurisprudence.link) {
    citation += ` ${jurisprudence.link}`;
  }
  
  return citation;
}

// Função para gerar citação no formato Chicago
function generateChicagoCitation(jurisprudence: JurisprudenceData, includeLink: boolean): string {
  const tribunal = jurisprudence.tribunal || jurisprudence.court || 'Tribunal';
  const numero = jurisprudence.numero || jurisprudence.id;
  const titulo = jurisprudence.titulo || jurisprudence.name || 'Sem título';
  const relator = jurisprudence.relator || 'Relator não informado';
  const data = jurisprudence.dataJulgamento || jurisprudence.date;
  
  const dataFormatada = data ? formatDateChicago(data) : 'Data não informada';
  
  let citation = `${titulo}, ${numero} (${tribunal}, ${dataFormatada}), ${relator}.`;
  
  if (includeLink && jurisprudence.link) {
    citation += ` ${jurisprudence.link}.`;
  }
  
  return citation;
}

// Função para gerar citação simples (formato original)
function generateSimpleCitation(jurisprudence: JurisprudenceData, includeLink: boolean): string {
  const name = jurisprudence.titulo || jurisprudence.name || 'Jurisprudência';
  const date = jurisprudence.dataJulgamento || jurisprudence.date || 'Data não informada';
  const court = jurisprudence.tribunal || jurisprudence.court || 'Tribunal';
  const id = jurisprudence.numero || jurisprudence.id || 'ID não informado';

  let citation = `${name}, ${formatDateSimple(date)} - ${court}. ${id}.`;
  
  if (includeLink && jurisprudence.link) {
    citation += ` Link: ${jurisprudence.link}`;
  }
  
  return citation;
}

// Função auxiliar para formatar data no estilo Chicago
function formatDateChicago(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch {
    return dateString;
  }
}

// Função auxiliar para formatar data simples
function formatDateSimple(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
}

// Função para gerar citação para petição jurídica
export const generatePetitionCitation = (jurisprudence: JurisprudenceData): string => {
  const tribunal = jurisprudence.tribunal || jurisprudence.court || 'Tribunal';
  const numero = jurisprudence.numero || jurisprudence.id;
  const relator = jurisprudence.relator || 'Relator não informado';
  const data = jurisprudence.dataJulgamento || jurisprudence.date;
  const ano = data ? new Date(data).getFullYear() : new Date().getFullYear();
  
  return `Conforme entendimento do ${tribunal} no ${numero}, Relator ${relator} (${ano})`;
};

// Função para gerar múltiplas citações
export const generateMultipleCitations = (
  jurisprudences: JurisprudenceData[], 
  format: CitationFormat = 'simple'
): string[] => {
  return jurisprudences.map(jurisprudence => 
    generateCitation(jurisprudence, { format })
  );
};

// Função para validar dados da jurisprudência
export const validateJurisprudenceData = (jurisprudence: unknown): jurisprudence is JurisprudenceData => {
  if (!jurisprudence || typeof jurisprudence !== 'object') {
    return false;
  }
  
  const data = jurisprudence as Record<string, unknown>;
  
  // Pelo menos deve ter um identificador
  return !!(data.id || data.numero) && typeof (data.id || data.numero) === 'string';
};

// Exporta os tipos para uso em outros módulos
export type { JurisprudenceData, CitationOptions, CitationFormat };