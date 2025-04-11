// src/background.ts

chrome.runtime.onInstalled.addListener(() => {
  console.log('JurisCheck Extension Installed!');
});

// Evento de clique no ícone da extensão
chrome.action.onClicked.addListener((tab) => {
  console.log('Extensão ativada!', tab);
  // Pode adicionar mais lógica aqui para manipular a aba ou interagir com o conteúdo
});

