(function() {
  'use strict';

  console.log('[RTG CLEAN] Плагін завантажився');

  // Тільки стилі та простий toast
  var styles = "<style>" +
    ":root { --lmp-green: #2ecc71; }" +
    ".full-start__rate { color: var(--lmp-green) !important; font-weight: bold; font-size: 1.2em; }" +
    ".full-start__rate .source--name { color: white !important; }" +
  "</style>";

  Lampa.Template.add('rtg_clean_styles', styles);
  $('body').append(Lampa.Template.get('rtg_clean_styles', {}, true));

  // Повідомлення
  if (typeof lmpToast === 'function') {
    lmpToast('RTG CLEAN: Плагін працює! Рейтинги мають бути зеленими');
  } else {
    console.log('[RTG CLEAN] lmpToast відсутній');
  }

  // Перевірка активності
  if (Lampa.Activity && Lampa.Activity.active()) {
    console.log('[RTG CLEAN] Активна картка знайдена');
  }

})();
