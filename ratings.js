(function() {
  'use strict';

  console.log('[TEST RTG] Плагін завантажився успішно');

  var pluginStyles = "<style>" +
    ":root { --lmp-test-color: #00ff00; }" +
    ".full-start__rate { color: var(--lmp-test-color) !important; font-weight: bold; }" +
    "</style>";

  Lampa.Template.add('test_styles', pluginStyles);
  $('body').append(Lampa.Template.get('test_styles', {}, true));

  // Просто тестовий вивід
  lmpToast('Тестовий плагін RTG працює!');

  // Якщо є функція запуску — викликаємо
  if (typeof startPlugin === 'function') startPlugin();

})();
