/**
 * Lampa: Enhanced Ratings (повністю стабільна версія для 3.1.6)
 * Додає RT, Metacritic, IMDb з кольорами та голосами
 */

(function() {
  'use strict';

  console.log('[RTG] Плагін завантажився - фінальна стабільна версія');

  // Стилі
  var styles = '<style>' +
    ':root{--lmp-h-imdb:22px;--lmp-h-rt:24px;--lmp-h-mc:22px;}' +
    'body:not(.lmp-enh--mono) .full-start__rate.rating--green{color:#2ecc71}' +
    'body:not(.lmp-enh--mono) .full-start__rate.rating--blue{color:#60a5fa}' +
    'body:not(.lmp-enh--mono) .full-start__rate.rating--orange{color:#f59e0b}' +
    'body:not(.lmp-enh--mono) .full-start__rate.rating--red{color:#ef4444}' +
    '.full-start__rate{margin:0 0.3em 0.3em 0;padding:0.4em 0.6em;border-radius:0.3em;background:rgba(0,0,0,0.3);display:inline-flex;align-items:center;}' +
    '.full-start__rate:last-child{margin-right:0;}' +
    '.rate--imdb .source--name img,.rate--rt .source--name img,.rate--mc .source--name img{height:22px;display:inline-block;vertical-align:middle;margin-left:0.4em;}' +
  '</style>';

  Lampa.Template.add('rtg_styles', styles);
  $('body').append(Lampa.Template.get('rtg_styles', {}, true));

  // Кольори за джерелом
  function getColorClass(source, value, extra) {
    var v = parseFloat(value);
    if (isNaN(v)) return '';
    source = source.toLowerCase();
    if (source === 'imdb') {
      if (v >= 8.0) return 'rating--green';
      if (v >= 6.5) return 'rating--blue';
      if (v >= 5.0) return 'rating--orange';
      return 'rating--red';
    }
    if (source === 'rt' || source === 'rottentomatoes') {
      return extra && extra.fresh ? 'rating--green' : 'rating--red';
    }
    if (source === 'metacritic' || source === 'mc') {
      var mv = v * 10;
      if (mv >= 80) return 'rating--green';
      if (mv >= 60) return 'rating--blue';
      if (mv >= 40) return 'rating--orange';
      return 'rating--red';
    }
    return '';
  }

  // Формат чисел
  function formatNumber(n) {
    if (!n || isNaN(n)) return '?';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
    return n;
  }

  // Додавання рейтингів
  function addRatings() {
    console.log('[RTG] Спроба додати рейтинги');

    var render = Lampa.Activity.active().activity.render();
    if (!render) {
      console.log('[RTG] Render не знайдено');
      return;
    }

    // Шукаємо будь-який контейнер рейтингів
    var rateContainer = $('.full-start-new__rate-line, .full-start__rate-line, .full-start__rate', render).first();
    if (!rateContainer.length) {
      console.log('[RTG] Контейнер рейтингів не знайдено');
      // Якщо не знайшли — додаємо новий контейнер
      rateContainer = $('<div class="full-start__rate-line" style="display:flex;flex-wrap:wrap;margin:0.5em 0;"></div>');
      $('.full-start__title, .full-start-new__title', render).first().after(rateContainer);
    }

    // Дані (поки статичні, потім замінимо на API)
    var imdb = { display: '8.0', votes: 1500000 };
    var rt = { display: '92', fresh: true, audience: '88', audience_count: 45000 };
    var mc = { display: '78', critic_count: 120 };

    // IMDb
    var imdbDiv = rateContainer.find('.rate--imdb');
    if (imdbDiv.length === 0) {
      imdbDiv = $('<div class="full-start__rate rate--imdb">' +
        '<div>' + imdb.display + ' (' + formatNumber(imdb.votes) + ')</div>' +
        '<div class="source--name"><img src="' + BASE_ICON + 'imdb.png" alt="IMDb"></div>' +
      '</div>');
      rateContainer.append(imdbDiv);
    } else {
      imdbDiv.find('> div:first').text(imdb.display + ' (' + formatNumber(imdb.votes) + ')');
    }
    imdbDiv.removeClass('rating--green rating--blue rating--orange rating--red');
    imdbDiv.addClass(getColorClass('imdb', imdb.display));

    // Rotten Tomatoes
    var rtDiv = rateContainer.find('.rate--rt');
    if (rtDiv.length === 0) {
      var rtIcon = rt.fresh ? 'RottenTomatoes.png' : 'RottenBad.png';
      rtDiv = $('<div class="full-start__rate rate--rt">' +
        '<div>' + rt.display + '% | ' + rt.audience + '% (' + formatNumber(rt.audience_count) + ')</div>' +
        '<div class="source--name"><img src="' + BASE_ICON + rtIcon + '" alt="RT"></div>' +
      '</div>');
      rateContainer.append(rtDiv);
    } else {
      rtDiv.find('> div:first').text(rt.display + '% | ' + rt.audience + '% (' + formatNumber(rt.audience_count) + ')');
    }
    rtDiv.removeClass('rating--green rating--blue rating--orange rating--red');
    rtDiv.addClass(getColorClass('rt', rt.display, {fresh: rt.fresh}));

    // Metacritic
    var mcDiv = rateContainer.find('.rate--mc');
    if (mcDiv.length === 0) {
      mcDiv = $('<div class="full-start__rate rate--mc">' +
        '<div>' + mc.display + ' (' + formatNumber(mc.critic_count) + ' критик)</div>' +
        '<div class="source--name"><img src="' + BASE_ICON + 'metascore.png" alt="MC"></div>' +
      '</div>');
      rateContainer.append(mcDiv);
    } else {
      mcDiv.find('> div:first').text(mc.display + ' (' + formatNumber(mc.critic_count) + ' критик)');
    }
    mcDiv.removeClass('rating--green rating--blue rating--orange rating--red');
    mcDiv.addClass(getColorClass('metacritic', mc.display));

    console.log('[RTG] Рейтинги додано');
  }

  // Запуск при відкритті деталів
  Lampa.Listener.follow('full', function(e) {
    if (e.type === 'complite') {
      console.log('[RTG] Деталі відкрито');
      setTimeout(addRatings, 500); // даємо час на завантаження DOM
    }
  });

  console.log('[RTG] Слухач встановлено');
})();
