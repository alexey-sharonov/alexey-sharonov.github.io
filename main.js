const statusEl = document.getElementById('status');
const chatEl = document.getElementById('chat');
const promptInput = document.getElementById('prompt');
const sendBtn = document.getElementById('send');

// Регистрируем Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// Создаём воркер
const worker = new Worker('worker.js');

// Получаем сообщения от воркера
worker.onmessage = (e) => {
  const { type, data } = e.data;

  switch (type) {
    case 'status':
      statusEl.textContent = data;
      break;
    case 'model-ready':
      statusEl.textContent = 'Модель загружена ✅';
      promptInput.disabled = false;
      sendBtn.disabled = false;
      break;
    case 'token':
      chatEl.textContent += data;
      chatEl.scrollTop = chatEl.scrollHeight;
      break;
    case 'done':
      // Генерация завершена
      break;
    case 'error':
      statusEl.textContent = 'Ошибка: ' + data;
      break;
  }
};

// Инициируем загрузку модели (можно по кнопке, но здесь автоматически)
worker.postMessage({ type: 'load' });

// Обработчик отправки промпта
sendBtn.addEventListener('click', () => {
  const prompt = promptInput.value.trim();
  if (!prompt) return;
  chatEl.textContent += '\n🧑 Вы: ' + prompt + '\n🤖 Ассистент: ';
  worker.postMessage({ type: 'generate', prompt });
  promptInput.value = '';
});