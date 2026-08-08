// worker.js
importScripts('transformers.min.js');

// Уведомления в основной поток
function postStatus(msg) {
  self.postMessage({ type: 'status', data: msg });
}

let generator = null;

// Загрузка модели
async function loadModel() {
  postStatus('Загрузка модели Qwen2.5-1.5B (ожидайте, ~1.5 ГБ)...');

  try {
    // Используем pipeline для text-generation
    generator = await pipeline('text-generation', 'Xenova/Qwen2.5-1.5B-Instruct', {
      // Форсируем WebGPU, если доступен, иначе Wasm
      device: 'webgpu',
      // Используем 4-битное квантование для экономии памяти
      dtype: 'q4f16',
      // Показываем прогресс загрузки
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

// Генерация ответа
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
      // Колбэк для потоковой выдачи токенов
      callback_function: (tokens) => {
        // tokens - массив сгенерированных токенов; берём последний
        const latest = tokens[tokens.length - 1];
        self.postMessage({ type: 'token', data: latest });
      }
    });
    self.postMessage({ type: 'done' });
  } catch (err) {
    self.postMessage({ type: 'error', data: err.message });
  }
}

// Обработка сообщений от основного потока
self.onmessage = (e) => {
  const { type, prompt } = e.data;
  if (type === 'load') {
    loadModel();
  } else if (type === 'generate') {
    generate(prompt);
  }
};
