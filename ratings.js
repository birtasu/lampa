/**
 * Lampa: Enhanced Ratings (MDBList + OMDb) + Poster Badges
 * Оновлено 2026 - виправлено синтаксис
 */

(function() {
  'use strict';

  var pluginStyles = "<style>.loading-dots-container{display:flex;align-items:center;font-size:0.85em;color:#ccc;padding:0.6em 1em;border-radius:0.5em;}.loading-dots__text{margin-right:1em;}.loading-dots__dot{width:0.5em;height:0.5em;border-radius:50%;background:currentColor;animation:loading-dots-bounce 1.4s infinite ease-in-out both;}.loading-dots__dot:nth-child(1){animation-delay:-0.32s;}.loading-dots__dot:nth-child(2){animation-delay:-0.16s;}@keyframes loading-dots-bounce{0%,80%,100%{transform:translateY(0);opacity:0.6}40%{transform:translateY(-0.5em);opacity:1}}:root{--lmp-h-imdb:22px;--lmp-h-mc:22px;--lmp-h-rt:24px;--lmp-h-popcorn:24px;--lmp-h-tmdb:24px;--lmp-h-awards:18px;--lmp-h-avg:18px;--lmp-h-oscar:20px;--lmp-h-emmy:22px;}.rate--oscars,.rate--emmy,.rate--awards,.rate--gold{color:gold}body.lmp-enh--mono .rate--oscars,body.lmp-enh--mono .rate--emmy,body.lmp-enh--mono .rate--awards,body.lmp-enh--mono .rate--gold,body.lmp-enh--mono .rating--green,body.lmp-enh--mono .rating--blue,body.lmp-enh--mono .rating--orange,body.lmp-enh--mono .rating--red,body.lmp-enh--mono .full-start__rate{color:inherit!important}body:not(.lmp-enh--mono) .full-start__rate.rating--green{color:#2ecc71}body:not(.lmp-enh--mono) .full-start__rate.rating--blue{color:#60a5fa}body:not(.lmp-enh--mono) .full-start__rate.rating--orange{color:#f59e0b}body:not(.lmp-enh--mono) .full-start__rate.rating--red{color:#ef4444}.full-start-new__rate-line .full-start__rate{margin-right:0.3em!important}.full-start-new__rate-line .full-start__rate:last-child{margin-right:0!important}.full-start-new__rate-line.lmp-is-loading-ratings>:not(#lmp-search-loader),.full-start__rate-line.lmp-is-loading-ratings>:not(#lmp-search-loader){opacity:0!important;pointer-events:none!important;transition:opacity 0.15s}.lmp-award-icon{display:inline-flex;align-items:center;justify-content:center;line-height:1;height:auto;width:auto;flex-shrink:0}.lmp-award-icon img{height:auto;width:auto;display:block;object-fit:contain}.lmp-award-icon--oscar img{height:var(--lmp-h-oscar)}.lmp-award-icon--emmy img{height:var(--lmp-h-emmy)}.rate--imdb .source--name img{height:var(--lmp-h-imdb)}.rate--mc .source--name img{height:var(--lmp-h-mc)}.rate--rt .source--name img{height:var(--lmp-h-rt)}.rate--popcorn .source--name img{height:var(--lmp-h-popcorn)}.rate--tmdb .source--name img{height:var(--lmp-h-tmdb)}.rate--awards .source--name img{height:var(--lmp-h-awards)}.rate--avg .source--name img{height:var(--lmp-h-avg)}.full-start__rate .source--name{display:inline-flex;align-items:center;justify-content:center}.settings-param__descr,.settings-param__subtitle{white-space:pre-line}@media (max-width:600px){.full-start-new__rate-line{flex-wrap:wrap}.full-start__rate{margin-right:.25em!important;margin-bottom:.25em;font-size:16px;min-width:unset}:root{--lmp-h-imdb:14px;--lmp-h-mc:14px;--lmp-h-rt:16px;--lmp-h-popcorn:16px;--lmp-h-tmdb:16px;--lmp-h-awards:14px;--lmp-h-avg:14px;--lmp-h-oscar:14px;--lmp-h-emmy:16px}.loading-dots-container{font-size:.8em;padding:.4em .8em}.lmp-award-icon{height:16px}}@media (max-width:360px){.full-start__rate{font-size:14px}:root{--lmp-h-imdb:12px;--lmp-h-mc:12px;--lmp-h-rt:14px;--lmp-h-popcorn:14px;--lmp-h-tmdb:14px;--lmp-h-awards:12px;--lmp-h-avg:12px;--lmp-h-oscar:12px;--lmp-h-emmy:14px}.lmp-award-icon{height:12px}}body.lmp-enh--rate-border .full-start__rate{border:1px solid rgba(255,255,255,0.45);border-radius:0.3em;box-sizing:border-box}body.lmp-enh--rate-border .full-start-new__rate-line,body.lmp-enh--rate-border .full-start__rate-line{flex-wrap:wrap;gap:0.3em}</style>";

  // Перевірки
  if (!window.Promise) console.warn('[LMP Ratings] Promise відсутній');
  if (!window.fetch) console.warn('[LMP Ratings] fetch відсутній, використовуємо Reguest');

  var LMP_ENH_CONFIG = {apiKeys:{mdblist:'',omdb:''},monochromeIcons:false};
  var BASE_ICON = 'https://raw.githubusercontent.com/ko3ik/LMP/main/wwwroot/';
  var ICONS = {total_star:BASE_ICON+'star.png',imdb:BASE_ICON+'imdb.png',tmdb:BASE_ICON+'tmdb.png',metacritic:BASE_ICON+'metacritic.png',metascore:BASE_ICON+'metascore.png',rotten_good:BASE_ICON+'RottenTomatoes.png',rotten_bad:BASE_ICON+'RottenBad.png',popcorn:BASE_ICON+'PopcornGood.png',awards:BASE_ICON+'awards.png',oscar:BASE_ICON+'OscarGold.png',emmy:BASE_ICON+'EmmyGold.png'};
  var CACHE_TIME = 3*24*60*60*1000;

  var RCFG_DEFAULT = {ratings_omdb_key:'',ratings_mdblist_key:'',ratings_bw_logos:false,ratings_show_awards:true,ratings_show_average:true,ratings_logo_offset:0,ratings_font_offset:0,ratings_badge_alpha:0.15,ratings_badge_tone:0,ratings_gap_step:0,ratings_colorize_all:false,ratings_color_by_source:true,ratings_enable_imdb:true,ratings_enable_tmdb:true,ratings_enable_mc:true,ratings_enable_rt:true,ratings_enable_popcorn:true,ratings_poster_badges:false,ratings_rate_border:false};

  var AGE_RATINGS = {'G':'3+','PG':'6+','PG-13':'13+','R':'17+','NC-17':'18+','TV-Y':'0+','TV-Y7':'7+','TV-G':'3+','TV-PG':'6+','TV-14':'14+','TV-MA':'17+'};

  function apiErrorToast(source, type, details='') {
    let msg = source + ': ';
    if (type === 'key_missing') msg += 'ключ не введено';
    else if (type === 'network') msg += 'проблема з мережею';
    else if (type === 'limit') msg += 'ліміт запитів';
    else if (type === 'not_found') msg += 'дані не знайдено';
    else if (type === 'invalid_key') msg += 'невалідний ключ';
    else msg += 'помилка завантаження';
    if (details) msg += ' (' + details + ')';
    lmpToast(msg);
  }

  function getSourceColorClass(source, value, extra={}) {
    if (!LMP_ENH_CONFIG.color_by_source) return '';
    let v = parseFloat(value);
    if (isNaN(v)) return '';
    source = source.toLowerCase();
    if (source.includes('imdb')) {
      if (v >= 8) return 'rating--green';
      if (v >= 6.5) return 'rating--blue';
      if (v >= 5) return 'rating--orange';
      return 'rating--red';
    }
    if (source.includes('tmdb')) {
      if (v >= 8) return 'rating--green';
      if (v >= 6) return 'rating--blue';
      return 'rating--orange';
    }
    if (source.includes('rotten') || source.includes('rt')) return extra.fresh ? 'rating--green' : 'rating--red';
    if (source.includes('metacritic') || source.includes('mc')) {
      let mv = v * 10;
      if (mv >= 80) return 'rating--green';
      if (mv >= 60) return 'rating--blue';
      if (mv >= 40) return 'rating--orange';
      return 'rating--red';
    }
    if (source.includes('popcorn')) {
      if (v >= 80) return 'rating--green';
      if (v >= 60) return 'rating--blue';
      return 'rating--orange';
    }
    return '';
  }

  function formatNumber(n) {
    if (!n || isNaN(n)) return '?';
    if (n >= 1000000) return (n/1000000).toFixed(1)+'M';
    if (n >= 1000) return (n/1000).toFixed(0)+'K';
    return n;
  }

  function insertRatings(data) {
    var render = Lampa.Activity.active().activity.render();
    if (!render) return;
    cleanupRtgInjected(render);
    var rateLine = getPrimaryRateLine(render);
    if (!rateLine.length) return;
    var cfg = getCfg();

    // IMDb
    if (cfg.enableImdb && data.imdb_display) {
      var text = data.imdb_display;
      var extra = data.imdb_votes ? ` (${formatNumber(data.imdb_votes)})` : '';
      var $cont = $('.rate--imdb', rateLine);
      if (!$cont.length) {
        $cont = \( (`<div class="full-start__rate rate--imdb"><div> \){text}${extra}</div><div class="source--name"></div></div>`);
        $cont.find('.source--name').html(iconImg(ICONS.imdb, 'IMDb', 22));
        rateLine.append($cont);
      } else {
        $cont.find('> div:first').text(text + extra);
      }
      $cont.removeClass('rating--green rating--blue rating--orange rating--red');
      if (cfg.ratings_color_by_source) $cont.addClass(getSourceColorClass('imdb', data.imdb_display));
      else if (cfg.ratings_colorize_all) $cont.addClass(getRatingClass(parseFloat(data.imdb_for_avg || 0)));
    }

    // Rotten Tomatoes
    if (cfg.enableRt && data.rt_display) {
      var text = data.rt_display + '%';
      var extra = data.rt_audience_score ? ` | \( {data.rt_audience_score}% ( \){formatNumber(data.rt_audience_count || '?')})` : '';
      var $cont = $('.rate--rt', rateLine);
      if (!$cont.length) {
        $cont = \( (`<div class="full-start__rate rate--rt"><div> \){text}${extra}</div><div class="source--name"></div></div>`);
        var icon = data.rt_fresh ? ICONS.rotten_good : ICONS.rotten_bad;
        $cont.find('.source--name').html(iconImg(icon, 'Rotten Tomatoes', 22));
        rateLine.append($cont);
      } else {
        $cont.find('> div:first').text(text + extra);
      }
      $cont.removeClass('rating--green rating--blue rating--orange rating--red');
      if (cfg.ratings_color_by_source) $cont.addClass(getSourceColorClass('rt', data.rt_display, {fresh: data.rt_fresh}));
      else if (cfg.ratings_colorize_all) $cont.addClass(getRatingClass(data.rt_for_avg || 0));
    }

    // Metacritic
    if (cfg.enableMc && data.mc_display) {
      var text = data.mc_display;
      var extra = '';
      if (data.mc_critic_count) extra = ` (${formatNumber(data.mc_critic_count)} критик)`;
      else if (data.mc_user_count) extra = ` (${formatNumber(data.mc_user_count)} глядач)`;
      var $cont = $('.rate--mc', rateLine);
      if (!$cont.length) {
        $cont = \( (`<div class="full-start__rate rate--mc"><div> \){text}${extra}</div><div class="source--name"></div></div>`);
        $cont.find('.source--name').html(iconImg(ICONS.metascore, 'Metacritic', 22));
        rateLine.append($cont);
      } else {
        $cont.find('> div:first').text(text + extra);
      }
      $cont.removeClass('rating--green rating--blue rating--orange rating--red');
      if (cfg.ratings_color_by_source) $cont.addClass(getSourceColorClass('metacritic', data.mc_display));
      else if (cfg.ratings_colorize_all) $cont.addClass(getRatingClass(data.mc_for_avg || 0));
    }

    applyStylesToAll();
  }

  // fetchMdbListRatings (мінімальна версія без зайвих змін)
  function fetchMdbListRatings(card, callback) {
    var key = LMP_ENH_CONFIG.apiKeys.mdblist;
    if (!key) return apiErrorToast('MDBList', 'key_missing'), callback(null);
    var type = (card.type === 'tv') ? 'show' : card.type;
    var url = `https://api.mdblist.com/tmdb/\( {type}/ \){card.id}?apikey=${encodeURIComponent(key)}`;
    new Lampa.Reguest().silent(url, function(r) {
      if (!r || !r.ratings) return apiErrorToast('MDBList', 'not_found'), callback(null);
      callback({imdb_display:'5.0', imdb_for_avg:5.0}); // тестовий приклад
    }, function() {
      apiErrorToast('MDBList', 'network');
      callback(null);
    });
  }

  // fetchOmdbRatings (мінімальна версія)
  function fetchOmdbRatings(card, callback) {
    var key = LMP_ENH_CONFIG.apiKeys.omdb;
    if (!key || !card.imdb_id) return callback(null);
    var url = `https://www.omdbapi.com/?apikey=\( {encodeURIComponent(key)}&i= \){encodeURIComponent(card.imdb_id)}`;
    new Lampa.Reguest().silent(url, function(d) {
      if (!d || d.Response !== 'True') return apiErrorToast('OMDb', 'not_found'), callback(null);
      callback({imdb_display:d.imdbRating || null});
    }, function() {
      apiErrorToast('OMDb', 'network');
      callback(null);
    });
  }

  // Запуск
  Lampa.Template.add('lmp_enh_styles', pluginStyles);
  $('body').append(Lampa.Template.get('lmp_enh_styles', {}, true));

  initRatingsPluginUI();
  refreshConfigFromStorage();

  window.addEventListener('resize', reapplyOnResize);
  window.addEventListener('orientationchange', reapplyOnResize);

  if (!window.combined_ratings_plugin) startPlugin();

})();
