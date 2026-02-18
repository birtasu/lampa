/**
 * Lampa: Enhanced Ratings (стабільна версія для 3.1.6)
 * Додає IMDb, RT, Metacritic з кольорами та голосами
 */

(function() {
  'use strict';

  console.log('[RTG] Плагін завантажився - стабільна версія');

  // Стилі (мінімальні, але достатні)
  var styles = '<style>' +
    ':root{--lmp-h-imdb:22px;--lmp-h-rt:24px;--lmp-h-mc:22px;}' +
    'body:not(.lmp-enh--mono) .full-start__rate.rating--green{color:#2ecc71}' +
    'body:not(.lmp-enh--mono) .full-start__rate.rating--blue{color:#60a5fa}' +
    'body:not(.lmp-enh--mono) .full-start__rate.rating--orange{color:#f59e0b}' +
    'body:not(.lmp-enh--mono) .full-start__rate.rating--red{color:#ef4444}' +
    '.full-start__rate{margin-right:0.3em!important;}' +
    '.full-start__rate:last-child{margin-right:0!important;}' +
    '.rate--imdb .source--name img,.rate--rt .source--name img,.rate--mc .source--name img{height:22px;display:inline-block;vertical-align:middle;}' +
  '</style>';

  Lampa.Template.add('rtg_styles', styles);
  $('body').append(Lampa.Template.get('rtg_styles', {}, true));

  // Проста функція кольору за джерелом
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

  // Функція форматування чисел
  function formatNumber(n) {
    if (!n || isNaN(n)) return '?';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
    return n;
  }

  // Основна функція додавання рейтингів
  function addRatings() {
    var render = Lampa.Activity.active().activity.render();
    if (!render) return;

    var rateLine = $('.full-start-new__rate-line, .full-start__rate-line', render).first();
    if (!rateLine.length) return;

    console.log('[RTG] Лінія рейтингів знайдена');

    // Приклад даних (в реальності заміни на дані з API або card)
    var imdbData = { display: '8.0', votes: 1500000 };
    var rtData = { display: '92', fresh: true, audience: '88', audience_count: 45000 };
    var mcData = { display: '78', critic_count: 120 };

    // IMDb
    var imdbDiv = $('.rate--imdb', rateLine);
    if (imdbDiv.length === 0) {
      imdbDiv = $('<div class="full-start__rate rate--imdb">' +
        '<div>' + imdbData.display + ' (' + formatNumber(imdbData.votes) + ')</div>' +
        '<div class="source--name"><img src="' + BASE_ICON + 'imdb.png" alt="IMDb"></div>' +
      '</div>');
      rateLine.append(imdbDiv);
    } else {
      imdbDiv.find('> div:first').text(imdbData.display + ' (' + formatNumber(imdbData.votes) + ')');
    }
    imdbDiv.removeClass('rating--green rating--blue rating--orange rating--red');
    imdbDiv.addClass(getColorClass('imdb', imdbData.display));

    // Rotten Tomatoes
    var rtDiv = $('.rate--rt', rateLine);
    if (rtDiv.length === 0) {
      var rtIcon = rtData.fresh ? 'RottenTomatoes.png' : 'RottenBad.png';
      rtDiv = $('<div class="full-start__rate rate--rt">' +
        '<div>' + rtData.display + '% | ' + rtData.audience + '% (' + formatNumber(rtData.audience_count) + ')</div>' +
        '<div class="source--name"><img src="' + BASE_ICON + rtIcon + '" alt="RT"></div>' +
      '</div>');
      rateLine.append(rtDiv);
    } else {
      rtDiv.find('> div:first').text(rtData.display + '% | ' + rtData.audience + '% (' + formatNumber(rtData.audience_count) + ')');
    }
    rtDiv.removeClass('rating--green rating--blue rating--orange rating--red');
    rtDiv.addClass(getColorClass('rt', rtData.display, {fresh: rtData.fresh}));

    // Metacritic
    var mcDiv = $('.rate--mc', rateLine);
    if (mcDiv.length === 0) {
      mcDiv = $('<div class="full-start__rate rate--mc">' +
        '<div>' + mcData.display + ' (' + formatNumber(mcData.critic_count) + ' критик)</div>' +
        '<div class="source--name"><img src="' + BASE_ICON + 'metascore.png" alt="MC"></div>' +
      '</div>');
      rateLine.append(mcDiv);
    } else {
      mcDiv.find('> div:first').text(mcData.display + ' (' + formatNumber(mcData.critic_count) + ' критик)');
    }
    mcDiv.removeClass('rating--green rating--blue rating--orange rating--red');
    mcDiv.addClass(getColorClass('metacritic', mcData.display));

    console.log('[RTG] Рейтинги додано/оновлено');
  }

  // Слухач на відкриття деталів
  Lampa.Listener.follow('full', function(e) {
    if (e.type === 'complite') {
      console.log('[RTG] Деталі фільму відкрито');
      addRatings();
    }
  });

})();
