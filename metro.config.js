// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Le enseñamos a Expo a empaquetar archivos WebAssembly (.wasm)
config.resolver.assetExts.push('wasm');

module.exports = config;