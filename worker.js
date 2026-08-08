// worker.js (ES-модуль)
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js';

function postStatus(msg) {
  self.postMessage({ type: 'status', data: msg });
}

let generator = null;

async function loadModel() {
  postStatus('Загрузка модели Qwen2.5-1.5B (ожидайте, ~1.5 ГБ)...');
  try {
    generator = await pipeline('text-generation', 'Xenova/Qwen2.5-1.5B-Instruct', {
      device: 'webgpu',
      dtype: 'q4f16',
      progress_callback: (progress) => {
        if (progress.status === 'downloading') {
          const pct = ((progress.loaded / progress.total) * 100).toFixed(1);
          postStatus(`Загрузка модели: ${pct}%`);
        } else if (progress.status === 'loading') {
          postStatus('Загрузка модели в память...');
        }
      }
    });
    self.postMessage({ type: 'model-ready' });
  } catch (err) {
    self.postMessage({ type: 'error', data: err.message });
  }
}

async function generate(prompt) {
  if (!generator) {
    self.postMessage({ type: 'error', data: 'Модель ещё не загружена' });
    return;
  }
  try {
    const result = await generator(prompt, {
      max_new_tokens: 256,
      temperature: 0.7,
      top_p: 0.9,
      callback_function: (tokens) => {
        const latest = tokens[tokens.length - 1];
        self.postMessage({ type: 'token', data: latest });
      }
    });
    self.postMessage({ type: 'done' });
  } catch (err) {
    self.postMessage({ type: 'error', data: err.message });
  }
}

self.onmessage = (e) => {
  const { type, prompt } = e.data;
  if (type === 'load') loadModel();
  else if (type === 'generate') generate(prompt);
};