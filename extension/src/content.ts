// src/content.ts

// Função para capturar o texto selecionado na página
const getSelectedText = () => {
  const selection = window.getSelection();
  return selection ? selection.toString() : '';
};

// Função para enviar texto selecionado para o backend e obter jurisprudências sugeridas
const fetchSuggestions = async () => {
  const selectedText = getSelectedText();
  if (!selectedText) {
    alert('Selecione um texto para verificar!');
    return;
  }

  const suggestions = await suggestJurisprudence(selectedText);
  if (suggestions) {
    alert(`Jurisprudências sugeridas: ${suggestions}`);
  }
};

// Escuta o evento de clique no botão flutuante ou outro gatilho
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'get_suggestions') {
    fetchSuggestions();
  }
});

