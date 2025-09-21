// src/features/SuggestionList.ts

interface Suggestion {
  id: string;
  title: string;
  link: string;
  tribunal?: string;
  numero?: string;
  relator?: string;
  dataJulgamento?: string;
  ementa?: string;
  relevancia?: number;
}

interface SuggestionListOptions {
  suggestions: Suggestion[];
  onSuggestionClick?: (suggestion: Suggestion) => void;
  containerId: string;
  isLoading?: boolean;
  error?: string;
}

class SuggestionListManager {
  private container: HTMLElement | null = null;
  private suggestions: Suggestion[] = [];
  private onSuggestionClick?: (suggestion: Suggestion) => void;

  constructor(private options: SuggestionListOptions) {
    this.suggestions = options.suggestions;
    this.onSuggestionClick = options.onSuggestionClick;
    this.container = document.getElementById(options.containerId);
    
    if (!this.container) {
      console.error(`Container with id '${options.containerId}' not found`);
      return;
    }

    this.render();
  }

  private render(): void {
    if (!this.container) return;

    this.container.innerHTML = '';

    if (this.options.isLoading) {
      this.renderLoading();
      return;
    }

    if (this.options.error) {
      this.renderError(this.options.error);
      return;
    }

    if (!this.suggestions || this.suggestions.length === 0) {
      this.renderEmpty();
      return;
    }

    this.renderSuggestions();
  }

  private renderLoading(): void {
    if (!this.container) return;

    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = `
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 200px;
      font-family: Arial, sans-serif;
    `;

    const content = document.createElement('div');
    content.style.textAlign = 'center';

    const spinner = document.createElement('div');
    spinner.style.cssText = `
      width: 32px;
      height: 32px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 12px;
    `;

    const text = document.createElement('p');
    text.textContent = 'Carregando sugestões...';

    content.appendChild(spinner);
    content.appendChild(text);
    loadingDiv.appendChild(content);
    this.container.appendChild(loadingDiv);

    // Adiciona CSS para animação
    this.addSpinAnimation();
  }

  private renderError(errorMessage: string): void {
    if (!this.container) return;

    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 200px;
      font-family: Arial, sans-serif;
    `;

    const content = document.createElement('div');
    content.style.cssText = 'text-align: center; color: #e74c3c;';

    const title = document.createElement('h3');
    title.textContent = 'Erro ao carregar sugestões';

    const message = document.createElement('p');
    message.textContent = errorMessage;

    const retryButton = document.createElement('button');
    retryButton.textContent = 'Tentar novamente';
    retryButton.style.cssText = `
      padding: 8px 16px;
      background-color: #3498db;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    `;
    retryButton.onclick = () => window.location.reload();

    content.appendChild(title);
    content.appendChild(message);
    content.appendChild(retryButton);
    errorDiv.appendChild(content);
    this.container.appendChild(errorDiv);
  }

  private renderEmpty(): void {
    if (!this.container) return;

    const emptyDiv = document.createElement('div');
    emptyDiv.style.cssText = `
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 200px;
      font-family: Arial, sans-serif;
    `;

    const content = document.createElement('div');
    content.style.cssText = 'text-align: center; color: #7f8c8d;';

    const title = document.createElement('h3');
    title.textContent = 'Nenhuma sugestão encontrada';

    const message = document.createElement('p');
    message.textContent = 'Tente refinar sua busca ou selecionar um texto diferente.';

    content.appendChild(title);
    content.appendChild(message);
    emptyDiv.appendChild(content);
    this.container.appendChild(emptyDiv);
  }

  private renderSuggestions(): void {
    if (!this.container) return;

    const mainDiv = document.createElement('div');
    mainDiv.style.cssText = `
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      font-family: Arial, sans-serif;
    `;

    // Header
    const header = this.createHeader();
    mainDiv.appendChild(header);

    // Container das sugestões
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 16px;
    `;

    this.suggestions.forEach(suggestion => {
      const suggestionElement = this.createSuggestionElement(suggestion);
      suggestionsContainer.appendChild(suggestionElement);
    });

    mainDiv.appendChild(suggestionsContainer);
    this.container.appendChild(mainDiv);
  }

  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 2px solid #ecf0f1;
    `;

    const title = document.createElement('h2');
    title.textContent = 'Sugestões de Jurisprudência';
    title.style.cssText = 'margin: 0; color: #2c3e50;';

    const count = document.createElement('span');
    count.textContent = `${this.suggestions.length} ${this.suggestions.length === 1 ? 'resultado' : 'resultados'}`;
    count.style.cssText = 'color: #7f8c8d; font-size: 14px;';

    header.appendChild(title);
    header.appendChild(count);

    return header;
  }

  private createSuggestionElement(suggestion: Suggestion): HTMLElement {
    const suggestionDiv = document.createElement('div');
    suggestionDiv.style.cssText = `
      background-color: white;
      border: 1px solid #bdc3c7;
      border-radius: 8px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;

    // Hover effects
    suggestionDiv.addEventListener('mouseenter', () => {
      suggestionDiv.style.borderColor = '#3498db';
      suggestionDiv.style.transform = 'translateY(-2px)';
      suggestionDiv.style.boxShadow = '0 4px 8px rgba(52,152,219,0.2)';
    });

    suggestionDiv.addEventListener('mouseleave', () => {
      suggestionDiv.style.borderColor = '#bdc3c7';
      suggestionDiv.style.transform = 'translateY(0)';
      suggestionDiv.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    });

    // Click handler
    suggestionDiv.addEventListener('click', () => {
      this.handleSuggestionClick(suggestion);
    });

    // Header da sugestão
    const suggestionHeader = this.createSuggestionHeader(suggestion);
    suggestionDiv.appendChild(suggestionHeader);

    // Detalhes da sugestão
    if (suggestion.numero || suggestion.relator || suggestion.dataJulgamento) {
      const details = this.createSuggestionDetails(suggestion);
      suggestionDiv.appendChild(details);
    }

    // Ementa
    if (suggestion.ementa) {
      const ementa = this.createSuggestionEmenta(suggestion.ementa);
      suggestionDiv.appendChild(ementa);
    }

    // Actions
    const actions = this.createSuggestionActions(suggestion);
    suggestionDiv.appendChild(actions);

    return suggestionDiv;
  }

  private createSuggestionHeader(suggestion: Suggestion): HTMLElement {
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    `;

    const titleContainer = document.createElement('div');
    titleContainer.style.cssText = 'display: flex; align-items: center; gap: 12px; flex: 1;';

    const title = document.createElement('h3');
    title.textContent = suggestion.title;
    title.style.cssText = 'margin: 0; color: #2c3e50; font-size: 16px; font-weight: 600;';

    titleContainer.appendChild(title);

    // Badge de relevância
    if (suggestion.relevancia) {
      const relevanceBadge = document.createElement('span');
      relevanceBadge.textContent = `${suggestion.relevancia}%`;
      const color = suggestion.relevancia >= 90 ? '#d5f5d5' : 
                   suggestion.relevancia >= 70 ? '#fff3cd' : '#f8d7da';
      const textColor = suggestion.relevancia >= 90 ? '#155724' : 
                       suggestion.relevancia >= 70 ? '#856404' : '#721c24';
      
      relevanceBadge.style.cssText = `
        font-size: 12px;
        font-weight: 600;
        padding: 4px 8px;
        border-radius: 12px;
        background-color: ${color};
        color: ${textColor};
      `;
      titleContainer.appendChild(relevanceBadge);
    }

    header.appendChild(titleContainer);

    // Badge do tribunal
    if (suggestion.tribunal) {
      const tribunalBadge = document.createElement('span');
      tribunalBadge.textContent = suggestion.tribunal;
      tribunalBadge.style.cssText = `
        background-color: #3498db;
        color: white;
        font-size: 12px;
        font-weight: 600;
        padding: 4px 12px;
        border-radius: 16px;
      `;
      header.appendChild(tribunalBadge);
    }

    return header;
  }

  private createSuggestionDetails(suggestion: Suggestion): HTMLElement {
    const details = document.createElement('div');
    details.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 12px;
      font-size: 14px;
      color: #7f8c8d;
    `;

    if (suggestion.numero) {
      const numero = document.createElement('span');
      numero.innerHTML = `<strong>Nº:</strong> ${suggestion.numero}`;
      details.appendChild(numero);
    }

    if (suggestion.relator) {
      const relator = document.createElement('span');
      relator.innerHTML = `<strong>Rel.:</strong> ${suggestion.relator}`;
      details.appendChild(relator);
    }

    if (suggestion.dataJulgamento) {
      const data = document.createElement('span');
      data.innerHTML = `<strong>Data:</strong> ${this.formatDate(suggestion.dataJulgamento)}`;
      details.appendChild(data);
    }

    return details;
  }

  private createSuggestionEmenta(ementa: string): HTMLElement {
    const ementaDiv = document.createElement('div');
    ementaDiv.style.cssText = `
      margin-bottom: 16px;
      padding: 12px;
      background-color: #f8f9fa;
      border-radius: 6px;
      border-left: 4px solid #3498db;
    `;

    const ementaText = document.createElement('p');
    ementaText.textContent = this.truncateText(ementa);
    ementaText.style.cssText = `
      margin: 0;
      color: #495057;
      font-size: 14px;
      line-height: 1.5;
    `;

    ementaDiv.appendChild(ementaText);
    return ementaDiv;
  }

  private createSuggestionActions(suggestion: Suggestion): HTMLElement {
    const actions = document.createElement('div');
    actions.style.cssText = 'display: flex; gap: 8px; justify-content: flex-end;';

    const viewButton = document.createElement('button');
    viewButton.textContent = 'Ver Original';
    viewButton.style.cssText = `
      padding: 6px 12px;
      background-color: #3498db;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
    `;
    viewButton.addEventListener('click', (e) => {
      e.stopPropagation();
      window.open(suggestion.link, '_blank', 'noopener,noreferrer');
    });

    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copiar Link';
    copyButton.style.cssText = `
      padding: 6px 12px;
      background-color: transparent;
      color: #7f8c8d;
      border: 1px solid #bdc3c7;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
    `;
    copyButton.addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(suggestion.link);
    });

    actions.appendChild(viewButton);
    actions.appendChild(copyButton);

    return actions;
  }

  private handleSuggestionClick(suggestion: Suggestion): void {
    if (this.onSuggestionClick) {
      this.onSuggestionClick(suggestion);
    } else {
      window.open(suggestion.link, '_blank', 'noopener,noreferrer');
    }
  }

  private formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  }

  private truncateText(text: string, maxLength: number = 150): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  private addSpinAnimation(): void {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  // Métodos públicos para atualizar o componente
  public updateSuggestions(suggestions: Suggestion[]): void {
    this.suggestions = suggestions;
    this.render();
  }

  public setLoading(isLoading: boolean): void {
    this.options.isLoading = isLoading;
    this.render();
  }

  public setError(error: string | null): void {
    this.options.error = error || undefined;
    this.render();
  }
}

// Funções utilitárias para usar sem classe
export function createSuggestionList(options: SuggestionListOptions): SuggestionListManager {
  return new SuggestionListManager(options);
}

export function renderSuggestions(containerId: string, suggestions: Suggestion[]): void {
  new SuggestionListManager({
    containerId,
    suggestions
  });
}

export { SuggestionListManager };
export type { Suggestion, SuggestionListOptions };