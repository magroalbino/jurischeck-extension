import React from 'react';
import ReactDOM from 'react-dom/client';
import JurisCheckPopup from './popup'; // Mudança: nome correto do componente

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <JurisCheckPopup />
    </React.StrictMode>
);