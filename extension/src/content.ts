// content.ts - Script que roda nas páginas web
/// <reference types="chrome"/>

interface SelectionInfo {
  text: string;
  context: string;
  url: string;
  pageTitle: string;
  selectionPosition: {
    start: number;
    end: number;
  };
}

interface JurisCheckTooltip {
  element: HTMLElement;
  visible: boolean;
}

interface JurisprudenceResult {
  tribunal: string;
  numero: string;
  relator: string;
  dataJulgamento: string;
  ementa: string;
  link: string;
}

interface PageContext {
  url: string;
  title: string;
  domain: string;
  path: string;
  isLegalSite: boolean;
  pageType: string;
  lastUpdate: string;
}

interface MessageRequest {
  action: string;
  text?: string;
  context?: PageContext;
}

interface MessageResponse {
  success?: boolean;
  results?: JurisprudenceResult[];
  text?: string;
}

// Tipagem específica para diferentes tipos de ações
interface SearchMessageRequest extends MessageRequest {
  action: 'searchFromContent' | 'searchJurisprudence';
  text: string;
  context: PageContext;
}

interface HighlightMessageRequest extends MessageRequest {
  action: 'highlightText';
  text: string;
}

interface GetTextMessageRequest extends MessageRequest {
  action: 'getSelectedText';
}

interface GetContextMessageRequest extends MessageRequest {
  action: 'getPageContext';
}

type AllMessageRequests = SearchMessageRequest | HighlightMessageRequest | GetTextMessageRequest | GetContextMessageRequest;

class JurisCheckContent {
  private tooltip: JurisCheckTooltip | null = null;
  private lastSelection: string = '';
  private isProcessing: boolean = false;
  private observer: MutationObserver;
  private selectionTimeout: number | null = null;

  constructor() {
    this.init();
    this.setupSelectionListener();
    this.setupMessageListener();
    this.observer = new MutationObserver(() => this.handlePageChanges());
    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  private init(): void {
    console.log('JurisCheck Content Script iniciado');
    this.injectStyles();
  }

  private injectStyles(): void {
    if (document.getElementById('jurischeck-styles')) return;

    const styles = `
      .jurischeck-tooltip {
        position: absolute;
        background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        font-weight: 500;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        z-index: 10000;
        max-width: 280px;
        border: 1px solid rgba(255,255,255,0.1);
        backdrop-filter: blur(10px);
        animation: jurischeck-fadeIn 0.2s ease-out;
        cursor: pointer;
        user-select: none;
      }

      .jurischeck-tooltip:hover {
        background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
        transform: translateY(-2px);
        transition: all 0.2s ease;
      }

      .jurischeck-tooltip::before {
        content: '';
        position: absolute;
        top: -8px;
        left: 50%;
        transform: translateX(-50%);
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-bottom: 8px solid #1e3a8a;
      }

      .jurischeck-tooltip .icon {
        display: inline-block;
        width: 16px;
        height: 16px;
        margin-right: 8px;
        vertical-align: middle;
      }

      .jurischeck-highlight {
        background-color: rgba(59, 130, 246, 0.15);
        border-radius: 3px;
        padding: 1px 2px;
        transition: background-color 0.2s ease;
      }

      .jurischeck-processing {
        background-color: rgba(251, 191, 36, 0.15);
      }

      @keyframes jurischeck-fadeIn {
        from {
          opacity: 0;
          transform: translateY(-10px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes jurischeck-pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.7;
        }
      }

      .jurischeck-loading {
        animation: jurischeck-pulse 1.5s infinite;
      }
    `;

    const styleElement = document.createElement('style');
    styleElement.id = 'jurischeck-styles';
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }

  private setupSelectionListener(): void {
    document.addEventListener('mouseup', (event: MouseEvent) => {
      if (this.selectionTimeout) {
        clearTimeout(this.selectionTimeout);
      }
      
      this.selectionTimeout = window.setTimeout(() => {
        this.handleTextSelection(event);
      }, 300); // Delay para evitar múltiplos triggers
    });

    // Remove tooltip ao clicar fora
    document.addEventListener('mousedown', (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (this.tooltip && target && !this.tooltip.element.contains(target)) {
        this.hideTooltip();
      }
    });

    // Remove tooltip ao fazer scroll
    document.addEventListener('scroll', () => {
      this.hideTooltip();
    }, { passive: true });
  }

  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((
      request: AllMessageRequests, 
      _sender: chrome.runtime.MessageSender, 
      sendResponse: (response: SelectionInfo | PageContext | MessageResponse) => void
    ) => {
      switch (request.action) {
        case 'getSelectedText': {
          const selection = this.getCurrentSelection();
          sendResponse(selection ?? { success: false } as MessageResponse);
          break;
        }

        case 'highlightText': {
          const highlightRequest = request as HighlightMessageRequest;
          this.highlightText(highlightRequest.text);
          sendResponse({ success: true });
          break;
        }

        case 'searchJurisprudence': {
          const searchRequest = request as SearchMessageRequest;
          this.searchAndShowResults(searchRequest.text);
          sendResponse({ success: true });
          break;
        }

        case 'getPageContext': {
          const context = this.getPageContext();
          sendResponse(context);
          break;
        }

        default: {
          sendResponse({ success: false });
          break;
        }
      }
      
      // Retorna true para indicar resposta assíncrona
      return true;
    });
  }

  private handleTextSelection(event: MouseEvent): void {
    const selection = window.getSelection();
    
    if (!selection || selection.isCollapsed) {
      this.hideTooltip();
      return;
    }

    const selectedText = selection.toString().trim();
    
    if (selectedText.length < 10 || selectedText.length > 500) {
      this.hideTooltip();
      return;
    }

    // Verifica se é texto jurídico relevante
    if (!this.isLegalText(selectedText)) {
      this.hideTooltip();
      return;
    }

    this.lastSelection = selectedText;
    this.showTooltip(event, selectedText);
  }

  private isLegalText(text: string): boolean {
    const legalKeywords = [
      // Termos gerais
      'jurisprudência', 'tribunal', 'decisão', 'acórdão', 'sentença',
      'recurso', 'apelação', 'agravo', 'embargos', 'habeas corpus',
      
      // Direitos
      'direito', 'lei', 'código', 'constituição', 'artigo', 'inciso',
      'responsabilidade', 'obrigação', 'contrato', 'dano', 'indenização',
      
      // Áreas específicas
      'civil', 'penal', 'trabalhista', 'tributário', 'administrativo',
      'constitucional', 'processual', 'empresarial', 'consumidor',
      
      // Tribunais
      'STF', 'STJ', 'TST', 'TRF', 'TJSP', 'TJRJ', 'TJMG',
      
      // Processos
      'petição', 'contestação', 'tréplica', 'execução', 'cumprimento'
    ];

    const textLower = text.toLowerCase();
    return legalKeywords.some(keyword => textLower.includes(keyword.toLowerCase()));
  }

  private showTooltip(event: MouseEvent, selectedText: string): void {
    this.hideTooltip();

    const tooltip = document.createElement('div');
    tooltip.className = 'jurischeck-tooltip';
    tooltip.innerHTML = `
      <div style="display: flex; align-items: center;">
        <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L13.5 2.5L16.17 5.17L10.59 10.75C10.21 11.13 10.21 11.75 10.59 12.13L11.87 13.41C12.25 13.79 12.87 13.79 13.25 13.41L18.83 7.83L21.5 10.5L23 9H21ZM1 21H23L12 10L1 21Z"/>
        </svg>
        <span>Buscar jurisprudências</span>
      </div>
    `;

    // Posiciona o tooltip
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    tooltip.style.left = `${rect.left + (rect.width / 2) - 140}px`;
    tooltip.style.top = `${rect.top - 50 + window.scrollY}px`;

    // Ajusta posição se sair da tela
    document.body.appendChild(tooltip);
    const tooltipRect = tooltip.getBoundingClientRect();
    
    if (tooltipRect.left < 10) {
      tooltip.style.left = '10px';
    }
    if (tooltipRect.right > window.innerWidth - 10) {
      tooltip.style.left = `${window.innerWidth - tooltipRect.width - 10}px`;
    }

    // Adiciona event listeners
    tooltip.addEventListener('click', () => {
      this.handleTooltipClick(selectedText);
    });

    this.tooltip = { element: tooltip, visible: true };

    // Auto-hide após 5 segundos
    setTimeout(() => {
      if (this.tooltip?.element === tooltip) {
        this.hideTooltip();
      }
    }, 5000);
  }

  private hideTooltip(): void {
    if (this.tooltip && this.tooltip.visible) {
      this.tooltip.element.remove();
      this.tooltip = null;
    }
  }

  private handleTooltipClick(selectedText: string): void {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.updateTooltipState('loading');

    // Envia mensagem para o popup/background
    chrome.runtime.sendMessage({
      action: 'searchFromContent',
      text: selectedText,
      context: this.getPageContext()
    } as SearchMessageRequest, (response: MessageResponse) => {
      this.isProcessing = false;
      
      if (chrome.runtime.lastError) {
        console.warn('Erro na comunicação com background:', chrome.runtime.lastError);
        this.updateTooltipState('error');
        return;
      }
      
      if (response && response.success) {
        this.updateTooltipState('success');
        this.highlightSelectedText();
        
        // Abre popup automaticamente
        chrome.runtime.sendMessage({ action: 'openPopup' });
      } else {
        this.updateTooltipState('error');
      }
    });
  }

  private updateTooltipState(state: 'loading' | 'success' | 'error'): void {
    if (!this.tooltip) return;

    const tooltip = this.tooltip.element;
    
    switch (state) {
      case 'loading':
        tooltip.innerHTML = `
          <div style="display: flex; align-items: center;">
            <svg class="icon jurischeck-loading" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
            </svg>
            <span>Buscando...</span>
          </div>
        `;
        break;
        
      case 'success':
        tooltip.innerHTML = `
          <div style="display: flex; align-items: center;">
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/>
            </svg>
            <span>Jurisprudências encontradas!</span>
          </div>
        `;
        setTimeout(() => this.hideTooltip(), 2000);
        break;
        
      case 'error':
        tooltip.innerHTML = `
          <div style="display: flex; align-items: center;">
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
            </svg>
            <span>Erro na busca</span>
          </div>
        `;
        setTimeout(() => this.hideTooltip(), 3000);
        break;
    }
  }

  private highlightSelectedText(): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    try {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.className = 'jurischeck-highlight';
      
      range.surroundContents(span);
      selection.removeAllRanges();
      
      // Remove highlight após 10 segundos
      setTimeout(() => {
        if (span.parentNode) {
          const parent = span.parentNode;
          while (span.firstChild) {
            parent.insertBefore(span.firstChild, span);
          }
          parent.removeChild(span);
        }
      }, 10000);
    } catch (error) {
      console.warn('Erro ao destacar texto:', error);
    }
  }

  private getCurrentSelection(): SelectionInfo | null {
    const selection = window.getSelection();
    
    if (!selection || selection.isCollapsed) {
      return null;
    }

    const selectedText = selection.toString().trim();
    if (!selectedText) return null;

    const range = selection.getRangeAt(0);
    
    return {
      text: selectedText,
      context: this.getSelectionContext(range),
      url: window.location.href,
      pageTitle: document.title,
      selectionPosition: {
        start: range.startOffset,
        end: range.endOffset
      }
    };
  }

  private getSelectionContext(range: Range): string {
    try {
      // Pega texto ao redor da seleção para contexto
      const container = range.commonAncestorContainer;
      const containerText = container.textContent || '';
      
      const start = Math.max(0, range.startOffset - 100);
      const end = Math.min(containerText.length, range.endOffset + 100);
      
      return containerText.substring(start, end);
    } catch (error) {
      console.warn('Erro ao obter contexto da seleção:', error);
      return '';
    }
  }

  private getPageContext(): PageContext {
    return {
      url: window.location.href,
      title: document.title,
      domain: window.location.hostname,
      path: window.location.pathname,
      isLegalSite: this.isLegalWebsite(),
      pageType: this.detectPageType(),
      lastUpdate: new Date().toISOString()
    };
  }

  private isLegalWebsite(): boolean {
    const legalDomains = [
      'stf.jus.br', 'stj.jus.br', 'tst.jus.br', 'tjsp.jus.br',
      'jusbrasil.com.br', 'conjur.com.br', 'migalhas.com.br',
      'planalto.gov.br', 'receita.fazenda.gov.br'
    ];

    return legalDomains.some(domain => window.location.hostname.includes(domain));
  }

  private detectPageType(): string {
    const url = window.location.href.toLowerCase();
    const title = document.title.toLowerCase();

    if (url.includes('jurisprudencia') || title.includes('jurisprudência')) {
      return 'jurisprudence';
    }
    if (url.includes('acordao') || title.includes('acórdão')) {
      return 'decision';
    }
    if (url.includes('lei') || title.includes('lei')) {
      return 'legislation';
    }
    if (url.includes('processo') || title.includes('processo')) {
      return 'process';
    }
    
    return 'general';
  }

  private highlightText(text: string): void {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );

    const textNodes: Node[] = [];
    let node: Node | null = walker.nextNode();

    while (node) {
      if (node.textContent && node.textContent.includes(text)) {
        textNodes.push(node);
      }
      node = walker.nextNode();
    }

    textNodes.forEach(textNode => {
      if (!textNode.parentNode) return;

      const parent = textNode.parentNode as Element;
      if (parent.classList.contains('jurischeck-highlight')) return;

      const content = textNode.textContent || '';
      const index = content.indexOf(text);
      
      if (index !== -1) {
        const range = document.createRange();
        range.setStart(textNode, index);
        range.setEnd(textNode, index + text.length);

        const span = document.createElement('span');
        span.className = 'jurischeck-highlight';
        
        try {
          range.surroundContents(span);
        } catch (error) {
          console.warn('Erro ao destacar texto:', error);
        }
      }
    });
  }

  private searchAndShowResults(text: string): void {
    // Implementa busca inline de resultados
    chrome.runtime.sendMessage({
      action: 'searchJurisprudence',
      text: text,
      context: this.getPageContext()
    } as SearchMessageRequest, (response: MessageResponse) => {
      if (chrome.runtime.lastError) {
        console.warn('Erro na busca:', chrome.runtime.lastError);
        return;
      }
      
      if (response && response.results) {
        this.showInlineResults(response.results);
      }
    });
  }

  private showInlineResults(results: JurisprudenceResult[]): void {
    // Remove widget existente se houver
    const existingWidget = document.getElementById('jurischeck-inline-results');
    if (existingWidget) {
      existingWidget.remove();
    }

    // Cria widget inline com resultados
    const widget = document.createElement('div');
    widget.id = 'jurischeck-inline-results';
    widget.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        width: 350px;
        max-height: 400px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        z-index: 10001;
        overflow: hidden;
        border: 1px solid #e5e7eb;
      ">
        <div style="
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          color: white;
          padding: 16px;
          font-weight: 600;
        ">
          JurisCheck - Resultados
          <button id="jurischeck-close-results" style="
            float: right;
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
          ">×</button>
        </div>
        <div style="
          padding: 16px;
          max-height: 320px;
          overflow-y: auto;
        ">
          ${results.slice(0, 3).map(result => `
            <div class="jurischeck-result-item" data-link="${result.link}" style="
              margin-bottom: 12px;
              padding: 12px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              cursor: pointer;
            ">
              <div style="font-weight: 600; color: #1e40af; margin-bottom: 4px;">
                ${result.tribunal} - ${result.numero}
              </div>
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                ${result.relator} | ${new Date(result.dataJulgamento).toLocaleDateString('pt-BR')}
              </div>
              <div style="font-size: 13px; color: #374151; line-height: 1.4;">
                ${result.ementa.substring(0, 150)}...
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(widget);

    // Adiciona event listeners
    const closeButton = widget.querySelector('#jurischeck-close-results') as HTMLButtonElement;
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        widget.remove();
      });
    }

    // Adiciona listeners para os resultados
    const resultItems = widget.querySelectorAll('.jurischeck-result-item');
    resultItems.forEach((item: Element) => {
      const htmlItem = item as HTMLElement;
      htmlItem.addEventListener('click', () => {
        const link = htmlItem.getAttribute('data-link');
        if (link) {
          window.open(link, '_blank');
        }
      });
    });

    // Auto remove após 15 segundos
    setTimeout(() => {
      if (widget.parentNode) {
        widget.remove();
      }
    }, 15000);
  }

  private handlePageChanges(): void {
    // Reaplica funcionalidades quando a página muda dinamicamente
    // (útil para SPAs)
    if (this.tooltip) {
      this.hideTooltip();
    }
  }

  // Método público para cleanup
  public destroy(): void {
    this.hideTooltip();
    
    if (this.selectionTimeout) {
      clearTimeout(this.selectionTimeout);
    }
    
    if (this.observer) {
      this.observer.disconnect();
    }
    
    const styles = document.getElementById('jurischeck-styles');
    if (styles) {
      styles.remove();
    }

    const widget = document.getElementById('jurischeck-inline-results');
    if (widget) {
      widget.remove();
    }
  }
}

// Inicializa o content script
let jurisCheckContent: JurisCheckContent;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    jurisCheckContent = new JurisCheckContent();
  });
} else {
  jurisCheckContent = new JurisCheckContent();
}

// Cleanup ao descarregar a página
window.addEventListener('beforeunload', () => {
  if (jurisCheckContent) {
    jurisCheckContent.destroy();
  }
});

export {};