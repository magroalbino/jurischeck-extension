/* eslint-env webextensions */
/* global chrome */

// content.js - Script de conteúdo para extensão Chrome JurisCheck

(() => {
  'use strict';

  // Função para sugerir jurisprudências baseadas no texto
  const suggestJurisprudence = async (text) => {
    return [`Jurisprudência relacionada a: ${text}`];
  };

  // Função para obter texto selecionado na página
  const getSelectedText = () => {
    const selection = window.getSelection();
    return selection ? selection.toString() : "";
  };

  // Função principal para processar sugestões
  const processSuggestions = async () => {
    try {
      const selectedText = getSelectedText();
      
      if (!selectedText) {
        alert("Selecione um texto para verificar!");
        return;
      }
      
      const suggestions = await suggestJurisprudence(selectedText);
      
      if (suggestions && suggestions.length > 0) {
        alert(`Jurisprudências sugeridas: ${suggestions.join(', ')}`);
      }
    } catch (error) {
      console.error('Erro ao processar sugestões:', error);
    }
  };

  // Listener para mensagens do background script
  if (chrome && chrome.runtime) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message && message.action === "get_suggestions") {
        processSuggestions().catch(console.error);
        sendResponse({ success: true });
      }
      return true; // Indica que a resposta será enviada de forma assíncrona
    });
  }

})();