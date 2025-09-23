var m=Object.defineProperty;var f=(r,e,t)=>e in r?m(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t;var l=(r,e,t)=>f(r,typeof e!="symbol"?e+"":e,t);class p{constructor(){l(this,"tooltip",null);l(this,"lastSelection","");l(this,"isProcessing",!1);l(this,"observer");l(this,"selectionTimeout",null);this.init(),this.setupSelectionListener(),this.setupMessageListener(),this.observer=new MutationObserver(()=>this.handlePageChanges()),this.observer.observe(document.body,{childList:!0,subtree:!0})}init(){console.log("JurisCheck Content Script iniciado"),this.injectStyles()}injectStyles(){if(document.getElementById("jurischeck-styles"))return;const e=`
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
    `,t=document.createElement("style");t.id="jurischeck-styles",t.textContent=e,document.head.appendChild(t)}setupSelectionListener(){document.addEventListener("mouseup",e=>{this.selectionTimeout&&clearTimeout(this.selectionTimeout),this.selectionTimeout=window.setTimeout(()=>{this.handleTextSelection(e)},300)}),document.addEventListener("mousedown",e=>{const t=e.target;this.tooltip&&t&&!this.tooltip.element.contains(t)&&this.hideTooltip()}),document.addEventListener("scroll",()=>{this.hideTooltip()},{passive:!0})}setupMessageListener(){chrome.runtime.onMessage.addListener((e,t,i)=>{switch(e.action){case"getSelectedText":{const o=this.getCurrentSelection();i(o??{success:!1});break}case"highlightText":{const o=e;this.highlightText(o.text),i({success:!0});break}case"searchJurisprudence":{const o=e;this.searchAndShowResults(o.text),i({success:!0});break}case"getPageContext":{const o=this.getPageContext();i(o);break}default:{i({success:!1});break}}return!0})}handleTextSelection(e){const t=window.getSelection();if(!t||t.isCollapsed){this.hideTooltip();return}const i=t.toString().trim();if(i.length<10||i.length>500){this.hideTooltip();return}if(!this.isLegalText(i)){this.hideTooltip();return}this.lastSelection=i,this.showTooltip(e,i)}isLegalText(e){const t=["jurisprudência","tribunal","decisão","acórdão","sentença","recurso","apelação","agravo","embargos","habeas corpus","direito","lei","código","constituição","artigo","inciso","responsabilidade","obrigação","contrato","dano","indenização","civil","penal","trabalhista","tributário","administrativo","constitucional","processual","empresarial","consumidor","STF","STJ","TST","TRF","TJSP","TJRJ","TJMG","petição","contestação","tréplica","execução","cumprimento"],i=e.toLowerCase();return t.some(o=>i.includes(o.toLowerCase()))}showTooltip(e,t){this.hideTooltip();const i=document.createElement("div");i.className="jurischeck-tooltip",i.innerHTML=`
      <div style="display: flex; align-items: center;">
        <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L13.5 2.5L16.17 5.17L10.59 10.75C10.21 11.13 10.21 11.75 10.59 12.13L11.87 13.41C12.25 13.79 12.87 13.79 13.25 13.41L18.83 7.83L21.5 10.5L23 9H21ZM1 21H23L12 10L1 21Z"/>
        </svg>
        <span>Buscar jurisprudências</span>
      </div>
    `;const o=window.getSelection();if(!o||o.rangeCount===0)return;const s=o.getRangeAt(0).getBoundingClientRect();i.style.left=`${s.left+s.width/2-140}px`,i.style.top=`${s.top-50+window.scrollY}px`,document.body.appendChild(i);const n=i.getBoundingClientRect();n.left<10&&(i.style.left="10px"),n.right>window.innerWidth-10&&(i.style.left=`${window.innerWidth-n.width-10}px`),i.addEventListener("click",()=>{this.handleTooltipClick(t)}),this.tooltip={element:i,visible:!0},setTimeout(()=>{var a;((a=this.tooltip)==null?void 0:a.element)===i&&this.hideTooltip()},5e3)}hideTooltip(){this.tooltip&&this.tooltip.visible&&(this.tooltip.element.remove(),this.tooltip=null)}handleTooltipClick(e){this.isProcessing||(this.isProcessing=!0,this.updateTooltipState("loading"),chrome.runtime.sendMessage({action:"searchFromContent",text:e,context:this.getPageContext()},t=>{if(this.isProcessing=!1,chrome.runtime.lastError){console.warn("Erro na comunicação com background:",chrome.runtime.lastError),this.updateTooltipState("error");return}t&&t.success?(this.updateTooltipState("success"),this.highlightSelectedText(),chrome.runtime.sendMessage({action:"openPopup"})):this.updateTooltipState("error")}))}updateTooltipState(e){if(!this.tooltip)return;const t=this.tooltip.element;switch(e){case"loading":t.innerHTML=`
          <div style="display: flex; align-items: center;">
            <svg class="icon jurischeck-loading" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
            </svg>
            <span>Buscando...</span>
          </div>
        `;break;case"success":t.innerHTML=`
          <div style="display: flex; align-items: center;">
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/>
            </svg>
            <span>Jurisprudências encontradas!</span>
          </div>
        `,setTimeout(()=>this.hideTooltip(),2e3);break;case"error":t.innerHTML=`
          <div style="display: flex; align-items: center;">
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
            </svg>
            <span>Erro na busca</span>
          </div>
        `,setTimeout(()=>this.hideTooltip(),3e3);break}}highlightSelectedText(){const e=window.getSelection();if(!(!e||e.rangeCount===0))try{const t=e.getRangeAt(0),i=document.createElement("span");i.className="jurischeck-highlight",t.surroundContents(i),e.removeAllRanges(),setTimeout(()=>{if(i.parentNode){const o=i.parentNode;for(;i.firstChild;)o.insertBefore(i.firstChild,i);o.removeChild(i)}},1e4)}catch(t){console.warn("Erro ao destacar texto:",t)}}getCurrentSelection(){const e=window.getSelection();if(!e||e.isCollapsed)return null;const t=e.toString().trim();if(!t)return null;const i=e.getRangeAt(0);return{text:t,context:this.getSelectionContext(i),url:window.location.href,pageTitle:document.title,selectionPosition:{start:i.startOffset,end:i.endOffset}}}getSelectionContext(e){try{const i=e.commonAncestorContainer.textContent||"",o=Math.max(0,e.startOffset-100),s=Math.min(i.length,e.endOffset+100);return i.substring(o,s)}catch(t){return console.warn("Erro ao obter contexto da seleção:",t),""}}getPageContext(){return{url:window.location.href,title:document.title,domain:window.location.hostname,path:window.location.pathname,isLegalSite:this.isLegalWebsite(),pageType:this.detectPageType(),lastUpdate:new Date().toISOString()}}isLegalWebsite(){return["stf.jus.br","stj.jus.br","tst.jus.br","tjsp.jus.br","jusbrasil.com.br","conjur.com.br","migalhas.com.br","planalto.gov.br","receita.fazenda.gov.br"].some(t=>window.location.hostname.includes(t))}detectPageType(){const e=window.location.href.toLowerCase(),t=document.title.toLowerCase();return e.includes("jurisprudencia")||t.includes("jurisprudência")?"jurisprudence":e.includes("acordao")||t.includes("acórdão")?"decision":e.includes("lei")||t.includes("lei")?"legislation":e.includes("processo")||t.includes("processo")?"process":"general"}highlightText(e){const t=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,null),i=[];let o=t.nextNode();for(;o;)o.textContent&&o.textContent.includes(e)&&i.push(o),o=t.nextNode();i.forEach(s=>{if(!s.parentNode||s.parentNode.classList.contains("jurischeck-highlight"))return;const c=(s.textContent||"").indexOf(e);if(c!==-1){const u=document.createRange();u.setStart(s,c),u.setEnd(s,c+e.length);const h=document.createElement("span");h.className="jurischeck-highlight";try{u.surroundContents(h)}catch(g){console.warn("Erro ao destacar texto:",g)}}})}searchAndShowResults(e){chrome.runtime.sendMessage({action:"searchJurisprudence",text:e,context:this.getPageContext()},t=>{if(chrome.runtime.lastError){console.warn("Erro na busca:",chrome.runtime.lastError);return}t&&t.results&&this.showInlineResults(t.results)})}showInlineResults(e){const t=document.getElementById("jurischeck-inline-results");t&&t.remove();const i=document.createElement("div");i.id="jurischeck-inline-results",i.innerHTML=`
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
          ${e.slice(0,3).map(n=>`
            <div class="jurischeck-result-item" data-link="${n.link}" style="
              margin-bottom: 12px;
              padding: 12px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              cursor: pointer;
            ">
              <div style="font-weight: 600; color: #1e40af; margin-bottom: 4px;">
                ${n.tribunal} - ${n.numero}
              </div>
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                ${n.relator} | ${new Date(n.dataJulgamento).toLocaleDateString("pt-BR")}
              </div>
              <div style="font-size: 13px; color: #374151; line-height: 1.4;">
                ${n.ementa.substring(0,150)}...
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `,document.body.appendChild(i);const o=i.querySelector("#jurischeck-close-results");o&&o.addEventListener("click",()=>{i.remove()}),i.querySelectorAll(".jurischeck-result-item").forEach(n=>{const a=n;a.addEventListener("click",()=>{const c=a.getAttribute("data-link");c&&window.open(c,"_blank")})}),setTimeout(()=>{i.parentNode&&i.remove()},15e3)}handlePageChanges(){this.tooltip&&this.hideTooltip()}destroy(){this.hideTooltip(),this.selectionTimeout&&clearTimeout(this.selectionTimeout),this.observer&&this.observer.disconnect();const e=document.getElementById("jurischeck-styles");e&&e.remove();const t=document.getElementById("jurischeck-inline-results");t&&t.remove()}}let d;document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{d=new p}):d=new p;window.addEventListener("beforeunload",()=>{d&&d.destroy()});
