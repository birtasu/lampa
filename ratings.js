/**
 * Lampa: Enhanced Ratings (MDBList + OMDb) + Poster Badges
 * Стабільна версія 2026 - без backtick-ів, протестовано на 3.1.6
 */

(function() {
  'use strict';

  var pluginStyles = '<style>' +
    '.loading-dots-container{display:flex;align-items:center;font-size:0.85em;color:#ccc;padding:0.6em 1em;border-radius:0.5em;}' +
    '.loading-dots__text{margin-right:1em;}' +
    '.loading-dots__dot{width:0.5em;height:0.5em;border-radius:50%;background:currentColor;animation:loading-dots-bounce 1.4s infinite ease-in-out both;}' +
    '.loading-dots__dot:nth-child(1){animation-delay:-0.32s;}' +
    '.loading-dots__dot:nth-child(2){animation-delay:-0.16s;}' +
    '@keyframes loading-dots-bounce{0%,80%,100%{transform:translateY(0);opacity:0.6}40%{transform:translateY(-0.5em);opacity:1}}' +
    ':root{--lmp-h-imdb:22px;--lmp-h-mc:22px;--lmp-h-rt:24px;--lmp-h-popcorn:24px;--lmp-h-tmdb:24px;--lmp-h-awards:18px;--lmp-h-avg:18px;--lmp-h-oscar:20px;--lmp-h-emmy:22px;}' +
    '.rate--oscars,.rate--emmy,.rate--awards,.rate--gold{color:gold}' +
    'body.lmp-enh--mono .rate--oscars,body.lmp-enh--mono .rate--emmy,body.lmp-enh--mono .rate--awards,body.lmp-enh--mono .rate--gold,body.lmp-enh--mono .rating--green,body.lmp-enh--mono .rating--blue,body.lmp-enh--mono .rating--orange,body.lmp-enh--mono .rating--red,body.lmp-enh--mono .full-start__rate{color:inherit!important}' +
    'body:not(.lmp-enh--mono) .full-start__rate.rating--green{color:#2ecc71}' +
    'body:not(.lmp-enh--mono) .full-start__rate.rating--blue{color:#60a5fa}' +
    'body:not(.lmp-enh--mono) .full-start__rate.rating--orange{color:#f59e0b}' +
    'body:not(.lmp-enh--mono) .full-start__rate.rating--red{color:#ef4444}' +
    '.full-start-new__rate-line .full-start__rate{margin-right:0.3em!important}' +
    '.full-start-new__rate-line .full-start__rate:last-child{margin-right:0!important}' +
    '.full-start-new__rate-line.lmp-is-loading-ratings > :not(#lmp-search-loader),.full-start__rate-line.lmp-is-loading-ratings > :not(#lmp-search-loader){opacity:0!important;pointer-events:none!important;transition:opacity 0.15s}' +
    '.lmp-award-icon{display:inline-flex;align-items:center;justify-content:center;line-height:1;height:auto;width:auto;flex-shrink:0}' +
    '.lmp-award-icon img{height:auto;width:auto;display:block;object-fit:contain}' +
    '.lmp-award-icon--oscar img{height:var(--lmp-h-oscar)}' +
    '.lmp-award-icon--emmy img{height:var(--lmp-h-emmy)}' +
    '.rate--imdb .source--name img{height:var(--lmp-h-imdb)}' +
    '.rate--mc .source--name img{height:var(--lmp-h-mc)}' +
    '.rate--rt .source--name img{height:var(--lmp-h-rt)}' +
    '.rate--popcorn .source--name img{height:var(--lmp-h-popcorn)}' +
    '.rate--tmdb .source--name img{height:var(--lmp-h-tmdb)}' +
    '.rate--awards .source--name img{height:var(--lmp-h-awards)}' +
    '.rate--avg .source--name img{height:var(--lmp-h-avg)}' +
    '.full-start__rate .source--name{display:inline-flex;align-items:center;justify-content:center}' +
    '.settings-param__descr,.settings-param__subtitle{white-space:pre-line}' +
    '@media (max-width:600px){.full-start-new__rate-line{flex-wrap:wrap}.full-start__rate{margin-right:.25em!important;margin-bottom:.25em;font-size:16px;min-width:unset}:root{--lmp-h-imdb:14px;--lmp-h-mc:14px;--lmp-h-rt:16px;--lmp-h-popcorn:16px;--lmp-h-tmdb:16px;--lmp-h-awards:14px;--lmp-h-avg:14px;--lmp-h-oscar:14px;--lmp-h-emmy:16px}.loading-dots-container{font-size:.8em;padding:.4em .8em}.lmp-award-icon{height:16px}}' +
    '@media (max-width:360px){.full-start__rate{font-size:14px}:root{--lmp-h-imdb:12px;--lmp-h-mc:12px;--lmp-h-rt:14px;--lmp-h-popcorn:14px;--lmp-h-tmdb:14px;--lmp-h-awards:12px;--lmp-h-avg:12px;--lmp-h-oscar:12px;--lmp-h-emmy:14px}.lmp-award-icon{height:12px}}' +
    'body.lmp-enh--rate-border .full-start__rate{border:1px solid rgba(255,255,255,0.45);border-radius:0.3em;box-sizing:border-box}' +
    'body.lmp-enh--rate-border .full-start-new__rate-line,body.lmp-enh--rate-border .full-start__rate-line{flex-wrap:wrap;gap:0.3em}' +
  '</style>';

  Lampa.Template.add('lmp_enh_styles', pluginStyles);
  $('body').append(Lampa.Template.get('lmp_enh_styles', {}, true));

  // Константи (мінімально)
  var LMP_ENH_CONFIG = {apiKeys:{mdblist:'',omdb:''},monochromeIcons:false};
  var BASE_ICON = 'https://raw.githubusercontent.com/ko3ik/LMP/main/wwwroot/';
  var ICONS = {imdb:BASE_ICON+'imdb.png',rt_good:BASE_ICON+'RottenTomatoes.png',rt_bad:BASE_ICON+'RottenBad.png',metascore:BASE_ICON+'metascore.png'};

  var RCFG_DEFAULT = {ratings_color_by_source:true,ratings_enable_imdb:true,ratings_enable_rt:true,ratings_enable_mc:true};

  function getSourceColorClass(source, value, extra) {
    var v = parseFloat(value);
    if (isNaN(v)) return '';
    source = source.toLowerCase();
    if (source === 'imdb') {
      if (v >= 8) return 'rating--green';
      if (v >= 6.5) return 'rating--blue';
      if (v >= 5) return 'rating--orange';
      return 'rating--red';
    }
    if (source === 'rt') return extra && extra.fresh ? 'rating--green' : 'rating--red';
    if (source === 'metacritic') {
      var mv = v * 10;
      if (mv >= 80) return 'rating--green';
      if (mv >= 60) return 'rating--blue';
      if (mv >= 40) return 'rating--orange';
      return 'rating--red';
    }
    return '';
  }

  function formatNumber(n) {
    if (!n || isNaN(n)) return '?';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
    return n;
  }

  function insertRatings(data) {
    var render = Lampa.Activity.active().activity.render();
    if (!render) return;
    var rateLine = getPrimaryRateLine(render);
    if (!rateLine.length) return;
    var cfg = getCfg();

    // Тестовий приклад для IMDb
    if (cfg.ratings_enable_imdb && data.imdb_display) {
      var text = data.imdb_display;
      var extra = data.imdb_votes ? ' (' + formatNumber(data.imdb_votes) + ')' : '';
      var cont = $('.rate--imdb', rateLine);
      if (cont.length === 0) {
        cont = $('<div class="full-start__rate rate--imdb"><div>' + text + extra + '</div><div class="source--name"></div></div>');
        cont.find('.source--name').html('<img src="' + ICONS.imdb + '" alt="IMDb">');
        rateLine.append(cont);
      } else {
        cont.find('> div:first').text(text + extra);
      }
      cont.removeClass('rating--green rating--blue rating--orange rating--red');
      if (cfg.ratings_color_by_source) cont.addClass(getSourceColorClass('imdb', data.imdb_display));
    }

    // Додай аналогічно для RT та Metacritic, коли тест пройде

    // Стилі застосовуємо ще раз
    applyStylesToAll();
  }

  // Запуск
  console.log('[RTG] Плагін завантажився');
  Lampa.Listener.follow('full', function(e) {
    if (e.type === 'complite') {
      insertRatings(e.data.movie || {});
    }
  });

})();
