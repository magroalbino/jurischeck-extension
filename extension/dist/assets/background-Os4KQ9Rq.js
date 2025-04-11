chrome.runtime.onInstalled.addListener(()=>{console.log("JurisCheck Extension Installed!")});chrome.action.onClicked.addListener(e=>{console.log("Extensão ativada!",e)});
