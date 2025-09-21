// background.ts - Service Worker para Manifest V3
/// <reference types="chrome"/>

// Definições de tipos locais
interface JurisprudenceResult {
  id: string;
  titulo: string;
  tribunal: string;
  numero: string;
  relator: string;
  dataJulgamento: string;
  ementa: string;
  link: string;
  relevancia: number;
  tema: string;
  tribunal_completo: string;
}

interface SearchResult {
  jurisprudencias: JurisprudenceResult[];
  totalFound: number;
  searchTime: number;
  metadata?: SearchMetadata;
}

interface SearchMetadata {
  originalQuery: string;
  processedQuery: string;
  keywords: string[];
  sources: string[];
}

interface ExtensionSettings {
  tribunals: string[];
  useGoogle: boolean;
  maxResults: number;
  autoSearch: boolean;
  notifications: boolean;
  cacheEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: 'pt-BR' | 'en-US';
}

interface SearchHistoryItem {
  id: string;
  query: string;
  results: number;
  timestamp: string;
  url?: string;
  tribunal?: string;
}

interface VerificationResponse {
  success: boolean;
  found: boolean;
  jurisprudencia?: JurisprudenceResult;
  similarResults?: JurisprudenceResult[];
  error?: string;
}

// Tipos para mensagens
interface BaseMessage {
  action: string;
  timestamp?: string;
}

interface SearchMessage extends BaseMessage {
  action: 'searchFromContent' | 'searchJurisprudence';
  text: string;
  context?: unknown;
  options?: SearchOptions;
}

interface VerifyMessage extends BaseMessage {
  action: 'verifyJurisprudence';
  numero: string;
  tribunal?: string;
}

interface OpenPopupMessage extends BaseMessage {
  action: 'openPopup';
}

type AllMessages = SearchMessage | VerifyMessage | OpenPopupMessage | BaseMessage;

interface BaseResponse {
  success: boolean;
  error?: string;
  timestamp?: string;
}

interface SearchResponse extends BaseResponse {
  results?: JurisprudenceResult[];
  searchTime?: number;
  totalFound?: number;
  metadata?: SearchMetadata;
}

interface VerificationResponseMessage extends BaseResponse {
  found?: boolean;
  jurisprudencia?: JurisprudenceResult;
  similarResults?: JurisprudenceResult[];
}

type AllResponses = SearchResponse | VerificationResponseMessage | BaseResponse;

interface SearchCache {
  [key: string]: {
    results: SearchResult;
    timestamp: number;
    expiry: number;
  };
}

interface SearchOptions {
  tribunals?: string[];
  useGoogle?: boolean;
  maxResults?: number;
  verifyMode?: boolean;
}

class JurisCheckBackground {
  private cache: SearchCache = {};
  private readonly CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutos
  private readonly API_BASE_URL = 'http://localhost:3000/api';
  private defaultSettings: ExtensionSettings = {
    tribunals: ['STF', 'STJ', 'TST'],
    useGoogle: true,
    maxResults: 10,
    autoSearch: true,
    notifications: true,
    cacheEnabled: true,
    theme: 'auto',
    language: 'pt-BR'
  };

  constructor() {
    this.init();
  }

  private init(): void {
    console.log('JurisCheck Background Service Worker iniciado');
    
    this.setupEventListeners();
    this.setupContextMenus();
    this.setupKeyboardShortcuts();
    this.loadUserSettings();
    
    // Limpa cache periodicamente
    setInterval(() => this.cleanCache(), 10 * 60 * 1000); // 10 minutos
  }

  private setupEventListeners(): void {
    // Listener para instalação/atualização
    chrome.runtime.onInstalled.addListener((details: chrome.runtime.InstalledDetails) => {
      this.handleInstallation(details);
    });

    // Listener para mensagens do content script e popup
    chrome.runtime.onMessage.addListener((
      request: AllMessages, 
      _sender: chrome.runtime.MessageSender, 
      sendResponse: (response: AllResponses) => void
    ) => {
      this.handleMessage(request, sendResponse);
      return true; // Indica resposta assíncrona
    });

    // Listener para mudanças de aba
    chrome.tabs.onActivated.addListener((activeInfo: chrome.tabs.TabActiveInfo) => {
      this.handleTabChange(activeInfo);
    });

    // Listener para atualizações de aba
    chrome.tabs.onUpdated.addListener((
      tabId: number, 
      changeInfo: chrome.tabs.TabChangeInfo, 
      tab: chrome.tabs.Tab
    ) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });
  }

  private handleInstallation(details: chrome.runtime.InstalledDetails): void {
    if (details.reason === 'install') {
      // Primeira instalação
      this.showWelcomeNotification();
      this.initializeDefaultSettings();
    } else if (details.reason === 'update') {
      // Atualização
      this.handleUpdate(details.previousVersion);
    }
  }

  private async handleMessage(
    request: AllMessages, 
    sendResponse: (response: AllResponses) => void
  ): Promise<void> {
    try {
      switch (request.action) {
        case 'searchFromContent': {
          if ('text' in request && 'context' in request) {
            const searchResults = await this.performSearch(
              request.text, 
              request.options ?? {}
            );
            const response: SearchResponse = { 
              success: true, 
              results: searchResults.jurisprudencias,
              searchTime: searchResults.searchTime,
              totalFound: searchResults.totalFound
            };
            sendResponse(response);
          } else {
            sendResponse({ success: false, error: 'Dados insuficientes para busca' });
          }
          break;
        }

        case 'searchJurisprudence': {
          if ('text' in request) {
            const results = await this.searchJurisprudence(
              request.text, 
              request.options ?? {}
            );
            const response: SearchResponse = { success: true, results };
            sendResponse(response);
          } else {
            sendResponse({ success: false, error: 'Texto não fornecido' });
          }
          break;
        }

        case 'openPopup': {
          await this.openPopup();
          sendResponse({ success: true });
          break;
        }

        case 'verifyJurisprudence': {
          if ('numero' in request) {
            const verification = await this.verifyJurisprudence(
              request.numero, 
              request.tribunal
            );
            const response: VerificationResponseMessage = {
              success: true,
              found: verification.found,
              jurisprudencia: verification.jurisprudencia,
              similarResults: verification.similarResults
            };
            sendResponse(response);
          } else {
            sendResponse({ success: false, error: 'Número do processo não fornecido' });
          }
          break;
        }

        default: {
          sendResponse({ success: false, error: 'Ação não reconhecida' });
          break;
        }
      }
    } catch (catchError) {
      console.error('Erro no background script:', catchError);
      sendResponse({ 
        success: false,
        error: 'Erro interno'
      });
    }
  }

  private setupContextMenus(): void {
    chrome.contextMenus.removeAll(() => {
      // Menu principal
      chrome.contextMenus.create({
        id: 'jurischeck-search',
        title: 'Buscar jurisprudências para "%s"',
        contexts: ['selection'],
        visible: true
      });

      // Submenu para tribunais específicos
      chrome.contextMenus.create({
        id: 'search-stf',
        parentId: 'jurischeck-search',
        title: 'Buscar no STF',
        contexts: ['selection']
      });

      chrome.contextMenus.create({
        id: 'search-stj',
        parentId: 'jurischeck-search',
        title: 'Buscar no STJ',
        contexts: ['selection']
      });

      chrome.contextMenus.create({
        id: 'search-tst',
        parentId: 'jurischeck-search',
        title: 'Buscar no TST',
        contexts: ['selection']
      });

      chrome.contextMenus.create({
        id: 'separator1',
        parentId: 'jurischeck-search',
        type: 'separator',
        contexts: ['selection']
      });

      chrome.contextMenus.create({
        id: 'verify-jurisprudence',
        parentId: 'jurischeck-search',
        title: 'Verificar jurisprudência',
        contexts: ['selection']
      });
    });

    // Listener para cliques no menu de contexto
    chrome.contextMenus.onClicked.addListener((
      info: chrome.contextMenus.OnClickData, 
      tab?: chrome.tabs.Tab
    ) => {
      this.handleContextMenuClick(info, tab);
    });
  }

  private setupKeyboardShortcuts(): void {
    chrome.commands.onCommand.addListener((command: string) => {
      this.handleKeyboardShortcut(command);
    });
  }

  private async handleKeyboardShortcut(command: string): Promise<void> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    switch (command) {
      case 'search-selection': {
        chrome.tabs.sendMessage(tab.id, { action: 'getSelectedText' }, (response) => {
          if (response?.text) {
            void this.performSearch(response.text, {});
          }
        });
        break;
      }

      case 'toggle-popup': {
        await this.openPopup();
        break;
      }

      case 'quick-search': {
        chrome.tabs.sendMessage(tab.id, { action: 'showQuickSearch' });
        break;
      }
    }
  }

  private async handleContextMenuClick(
    info: chrome.contextMenus.OnClickData, 
    tab?: chrome.tabs.Tab
  ): Promise<void> {
    if (!info.selectionText || !tab?.id) return;

    const options: SearchOptions = {};
    
    switch (info.menuItemId) {
      case 'search-stf': {
        options.tribunals = ['STF'];
        break;
      }
      case 'search-stj': {
        options.tribunals = ['STJ'];
        break;
      }
      case 'search-tst': {
        options.tribunals = ['TST'];
        break;
      }
      case 'verify-jurisprudence': {
        options.verifyMode = true;
        break;
      }
    }

    await this.performSearch(info.selectionText, options);
    
    if (options.verifyMode) {
      this.showNotification('Verificação', 'Verificando jurisprudência...');
    } else {
      this.showNotification(
        'Busca', 
        `Buscando em ${options.tribunals?.join(', ') ?? 'todos os tribunais'}...`
      );
    }
  }

  private async performSearch(text: string, options: SearchOptions = {}): Promise<SearchResult> {
    const cacheKey = this.generateCacheKey(text, options);
    
    // Verifica cache
    if (this.isCacheValid(cacheKey)) {
      console.log('Retornando resultado do cache');
      return this.cache[cacheKey].results;
    }

    try {
      const settings = await this.getUserSettings();
      const searchOptions = { ...settings, ...options };

      const response = await fetch(`${this.API_BASE_URL}/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          options: searchOptions
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na busca: ${response.status}`);
      }

      const results: SearchResult = await response.json();
      
      // Salva no cache
      if (settings.cacheEnabled) {
        this.saveToCache(cacheKey, results);
      }

      // Salva no histórico
      await this.saveToHistory(text, results, options);

      // Atualiza estatísticas
      await this.updateStatistics('search', results);

      return results;
    } catch (fetchError) {
      console.error('Erro na busca de jurisprudências:', fetchError);
      
      this.showNotification(
        'Erro na Busca', 
        'Não foi possível buscar jurisprudências. Verifique sua conexão.'
      );
      
      throw fetchError;
    }
  }

  private async searchJurisprudence(text: string, options: SearchOptions = {}): Promise<JurisprudenceResult[]> {
    const result = await this.performSearch(text, options);
    return result.jurisprudencias;
  }

  private async verifyJurisprudence(numero: string, tribunal?: string): Promise<VerificationResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ numero, tribunal })
      });

      if (!response.ok) {
        throw new Error(`Erro na verificação: ${response.status}`);
      }

      const result: VerificationResponse = await response.json();
      return result;
    } catch (verifyError) {
      console.error('Erro na verificação:', verifyError);
      return {
        success: false,
        found: false,
        error: verifyError instanceof Error ? verifyError.message : 'Erro desconhecido'
      };
    }
  }

  private async openPopup(): Promise<void> {
    try {
      // Para Manifest V3, usamos a action API
      await chrome.action.openPopup();
    } catch (popupError) {
      console.warn('Não foi possível abrir popup programaticamente:', popupError);
      // Fallback: mostra notificação
      this.showNotification('JurisCheck', 'Clique no ícone da extensão para abrir');
    }
  }

  private generateCacheKey(text: string, options: SearchOptions): string {
    const cleanText = text.replace(/\s+/g, '_');
    const optionsString = JSON.stringify(options);
    return `${cleanText}_${optionsString}`;
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache[key];
    return cached && Date.now() < cached.expiry;
  }

  private saveToCache(key: string, data: SearchResult): void {
    this.cache[key] = {
      results: data,
      timestamp: Date.now(),
      expiry: Date.now() + this.CACHE_EXPIRY
    };
  }

  private cleanCache(): void {
    const now = Date.now();
    Object.keys(this.cache).forEach(key => {
      if (this.cache[key].expiry < now) {
        delete this.cache[key];
      }
    });
  }

  private async loadUserSettings(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get('jurischeck_settings');
      if (!result.jurischeck_settings) {
        await this.initializeDefaultSettings();
      }
    } catch (settingsError) {
      console.error('Erro ao carregar configurações:', settingsError);
      await this.initializeDefaultSettings();
    }
  }

  private async initializeDefaultSettings(): Promise<void> {
    try {
      await chrome.storage.sync.set({
        jurischeck_settings: this.defaultSettings
      });
      console.log('Configurações padrão inicializadas');
    } catch (initError) {
      console.error('Erro ao inicializar configurações:', initError);
    }
  }

  private async getUserSettings(): Promise<ExtensionSettings> {
    try {
      const result = await chrome.storage.sync.get('jurischeck_settings');
      return result.jurischeck_settings ?? this.defaultSettings;
    } catch (getError) {
      console.error('Erro ao obter configurações:', getError);
      return this.defaultSettings;
    }
  }

  private async saveToHistory(text: string, results: SearchResult, options: SearchOptions): Promise<void> {
    try {
      const historyItem: SearchHistoryItem = {
        id: Date.now().toString(),
        query: text,
        results: results.jurisprudencias?.length ?? 0,
        timestamp: new Date().toISOString(),
        url: await this.getCurrentTabUrl(),
        tribunal: options.tribunals?.[0]
      };

      const { jurischeck_history = [] } = await chrome.storage.local.get('jurischeck_history');
      
      // Mantém apenas os últimos 100 itens
      const updatedHistory = [historyItem, ...jurischeck_history.slice(0, 99)];
      
      await chrome.storage.local.set({
        jurischeck_history: updatedHistory
      });
    } catch (historyError) {
      console.error('Erro ao salvar no histórico:', historyError);
    }
  }

  private async updateStatistics(action: string, data?: SearchResult): Promise<void> {
    try {
      const { jurischeck_stats = {} } = await chrome.storage.local.get('jurischeck_stats');
      
      const today = new Date().toISOString().split('T')[0];
      
      if (!jurischeck_stats[today]) {
        jurischeck_stats[today] = {
          searches: 0,
          results: 0,
          tribunals: {},
          avgResponseTime: 0
        };
      }

      const dayStats = jurischeck_stats[today];
      
      switch (action) {
        case 'search': {
          dayStats.searches++;
          dayStats.results += data?.jurisprudencias?.length ?? 0;
          
          if (data?.searchTime) {
            dayStats.avgResponseTime = Math.round(
              (dayStats.avgResponseTime * (dayStats.searches - 1) + data.searchTime) / dayStats.searches
            );
          }
          
          // Conta por tribunal
          data?.jurisprudencias?.forEach((juris: JurisprudenceResult) => {
            const tribunal = juris.tribunal;
            dayStats.tribunals[tribunal] = (dayStats.tribunals[tribunal] ?? 0) + 1;
          });
          break;
        }
      }

      await chrome.storage.local.set({ jurischeck_stats });
    } catch (statsError) {
      console.error('Erro ao atualizar estatísticas:', statsError);
    }
  }

  private async getCurrentTabUrl(): Promise<string> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return tab?.url ?? '';
    } catch (tabError) {
      console.warn('Erro ao obter URL da aba:', tabError);
      return '';
    }
  }

  private handleTabChange(activeInfo: chrome.tabs.TabActiveInfo): void {
    // Implementar lógica para mudança de aba se necessário
    console.log('Aba ativa alterada:', activeInfo.tabId);
  }

  private handleTabUpdate(
    tabId: number, 
    changeInfo: chrome.tabs.TabChangeInfo, 
    tab: chrome.tabs.Tab
  ): void {
    // Detecta sites jurídicos e oferece funcionalidades automáticas
    if (changeInfo.status === 'complete' && tab.url) {
      void this.detectLegalSite(tab);
    }
  }

  private async detectLegalSite(tab: chrome.tabs.Tab): Promise<void> {
    if (!tab.url || !tab.id) return;

    const legalDomains = [
      'stf.jus.br', 'stj.jus.br', 'tst.jus.br', 
      'jusbrasil.com.br', 'conjur.com.br'
    ];

    const isLegalSite = legalDomains.some(domain => 
      tab.url!.includes(domain)
    );

    if (isLegalSite) {
      const settings = await this.getUserSettings();
      
      if (settings.autoSearch) {
        // Injeta script para detecção automática de jurisprudências
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: this.injectLegalSiteEnhancement
          });
        } catch (scriptError) {
          console.warn('Erro ao injetar script de melhoria:', scriptError);
        }
      }
    }
  }

  private injectLegalSiteEnhancement(): void {
    // Função que será injetada em sites jurídicos
    const jurisNumbers = document.body.innerText.match(
      /\b(RE|REsp|AI|RR|HC|MS)\s+\d+/g
    );
    
    if (jurisNumbers && jurisNumbers.length > 0) {
      console.log('JurisCheck: Jurisprudências detectadas:', jurisNumbers);
      
      // Poderia adicionar botões de busca rápida
      jurisNumbers.forEach(processNumber => {
        // Implementar destaque ou botões de ação
        console.log('Processo detectado:', processNumber);
      });
    }
  }

  private showWelcomeNotification(): void {
    this.showNotification(
      'JurisCheck Instalado!',
      'Bem-vindo! Selecione texto jurídico e clique com o botão direito para buscar jurisprudências.'
    );
  }

  private handleUpdate(previousVersion?: string): void {
    const currentVersion = chrome.runtime.getManifest().version;
    console.log(`JurisCheck atualizado de ${previousVersion ?? 'desconhecida'} para ${currentVersion}`);
    
    this.showNotification(
      'JurisCheck Atualizado',
      'Nova versão instalada com melhorias na busca de jurisprudências!'
    );
    
    // Limpa cache antigo após atualização
    this.clearCache();
  }

  private clearCache(): void {
    this.cache = {};
    console.log('Cache limpo');
  }

  private showNotification(title: string, message: string): void {
    if (chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title,
        message,
        silent: false
      });
    }
  }
}

// Inicializa o background service worker
new JurisCheckBackground();

export default JurisCheckBackground;