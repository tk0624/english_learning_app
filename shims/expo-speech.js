// Web shim for expo-speech using the browser's SpeechSynthesis API

let currentUtterance = null;

function speak(text, options = {}) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  // 既存の読み上げを停止
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.language || 'en-US';
  utterance.rate = options.rate || 1.0;
  utterance.pitch = options.pitch || 1.0;
  utterance.volume = options.volume != null ? options.volume : 1.0;

  if (options.onStart) utterance.onstart = options.onStart;
  if (options.onDone) utterance.onend = options.onDone;
  if (options.onError) utterance.onerror = options.onError;

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

function stop() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  currentUtterance = null;
}

function pause() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.pause();
}

function resume() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.resume();
}

async function isSpeakingAsync() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  return window.speechSynthesis.speaking;
}

async function getAvailableVoicesAsync() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices().map((v) => ({
    identifier: v.voiceURI,
    name: v.name,
    quality: 'Default',
    language: v.lang,
  }));
}

const VoiceQuality = {
  Default: 'Default',
  Enhanced: 'Enhanced',
};

module.exports = {
  speak,
  stop,
  pause,
  resume,
  isSpeakingAsync,
  getAvailableVoicesAsync,
  VoiceQuality,
};
