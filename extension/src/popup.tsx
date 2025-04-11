// src/popup.tsx

import React, { useState } from 'react';
import { verifyJurisprudence, suggestJurisprudence } from './api';
import Loader from './components/loader'; // Importando o componente Loader

const Popup = () => {
  const [jurisprudenceId, setJurisprudenceId] = useState('');
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Estado para controlar o carregamento

  const handleVerify = async () => {
    if (!jurisprudenceId) {
      alert('Por favor, insira um ID de jurisprudência!');
      return;
    }

    setIsLoading(true); // Ativa o carregamento
    const data = await verifyJurisprudence(jurisprudenceId);
    setResult(data);
    setIsLoading(false); // Desativa o carregamento após a resposta
  };

  const handleSuggest = async () => {
    if (!text) {
      alert('Por favor, insira um texto para sugestão!');
      return;
    }

    setIsLoading(true); // Ativa o carregamento
    const data = await suggestJurisprudence(text);
    setResult(data);
    setIsLoading(false); // Desativa o carregamento após a resposta
  };

  return (
    <div className="popup-container">
      <h1>JurisCheck</h1>

      <div>
        <input
          type="text"
          placeholder="ID da Jurisprudência"
          value={jurisprudenceId}
          onChange={(e) => setJurisprudenceId(e.target.value)}
        />
        <button onClick={handleVerify}>Verificar Jurisprudência</button>
      </div>

      <div>
        <textarea
          placeholder="Insira o texto para sugestão"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button onClick={handleSuggest}>Sugerir Jurisprudência</button>
      </div>

      {/* Exibe o Loader enquanto as requisições estão sendo processadas */}
      {isLoading && <Loader />}

      {result && (
        <div className="result">
          <h2>Resultado</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default Popup;
