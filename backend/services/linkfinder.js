// backend/services/linkFinder.js

const axios = require('axios');

// Função para localizar links oficiais de jurisprudência nos sites de referência (STF, STJ, JusBrasil)
const findLinksForJurisprudence = async (jurisprudenceId) => {
  try {
    const links = {
      STF: `https://www.stf.jus.br/jurisprudencia/doc/jurisprudencia/doc.jsp?s=${jurisprudenceId}`,
      STJ: `https://www.stj.jus.br/web/jurisprudencia/doc.jsp?s=${jurisprudenceId}`,
      JusBrasil: `https://www.jusbrasil.com.br/jurisprudencia/doc/jurisprudencia.jsp?s=${jurisprudenceId}`,
    };

    return links; // Retorna links oficiais encontrados
  } catch (error) {
    console.error('Erro ao encontrar links de jurisprudência:', error);
    throw new Error('Não foi possível localizar os links de jurisprudência.');
  }
};

module.exports = {
  findLinksForJurisprudence,
};

