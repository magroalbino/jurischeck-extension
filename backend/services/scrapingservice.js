// backend/services/scrapingService.js

import cheerio from 'cheerio';
import axios from 'axios';

// Função para fazer scraping de sites de jurisprudência (exemplo com JusBrasil)
export const scrapeJurisprudence = async (jurisprudenceId) => {
  try {
    const url = `https://www.jusbrasil.com.br/jurisprudencia/doc/jurisprudencia.jsp?s=${jurisprudenceId}`;
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const jurisprudenceData = {
      title: $('h1').text(), // Exemplo de extração de título
      content: $('div.jurisprudencia-content').text(), // Exemplo de conteúdo
    };

    return jurisprudenceData;
  } catch (error) {
    console.error('Erro ao realizar scraping da jurisprudência:', error);
    throw new Error('Não foi possível realizar scraping da jurisprudência.');
  }
};

export default {
  scrapeJurisprudence,
};