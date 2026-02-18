(function() {
  'use strict';

  console.log('[RTG TEST] Плагін завантажився без помилок');

  var pluginStyles = "<style>" +
    ":root { --lmp-test-color: #00ff00; }" +
    ".full-start__rate { color: var(--lmp-test-color) !important; font-weight: bold; }" +
  "</style>";

  Lampa.Template.add('lmp_test_styles', pluginStyles);
  $('body').append(Lampa.Template.get('lmp_test_styles', {}, true));

  lmpToast('Тест 1: Стилі та toast працюють');

  // Перевірка наявності потрібних функцій Lampa
  if (typeof Lampa.Activity === 'undefined') {
    lmpToast('Помилка: Lampa.Activity відсутній');
  } else {
    lmpToast('Тест 2: Lampa.Activity присутній');
  }

})();
