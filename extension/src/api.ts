// src/api.ts

const API_URL = 'http://localhost:5000'; // URL do backend, ajuste conforme necessário

// Função para verificar se a jurisprudência existe
export const verifyJurisprudence = async (jurisprudenceId: string) => {
  try {
    const response = await fetch(`${API_URL}/api/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jurisprudenceId }),
    });

    if (!response.ok) {
      throw new Error('Erro ao verificar jurisprudência');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro de rede:', error);
    return null;
  }
};

// Função para sugerir jurisprudências baseadas no texto
export const suggestJurisprudence = async (text: string) => {
  try {
    const response = await fetch(`${API_URL}/api/suggest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error('Erro ao sugerir jurisprudência');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro de rede:', error);
    return null;
  }
};

