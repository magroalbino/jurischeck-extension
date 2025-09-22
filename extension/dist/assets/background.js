/* eslint-env webextensions */
/* global chrome */

// background.js - Script de background para extensão Chrome

chrome.runtime.onInstalled.addListener(() => {
  console.log("JurisCheck Extension Installed!");
});

chrome.action.onClicked.addListener((tab) => {
  console.log("Extensão ativada!", tab);
});