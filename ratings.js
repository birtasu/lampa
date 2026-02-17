/**
 * Lampa: Enhanced Ratings (MDBList + OMDb) + Poster Badges
 * Оновлено 2026:
 * • видалено зайві поліфіли (залишено тільки перевірки Promise/fetch)
 * • додано votes / percent / count до плиток (IMDb, RT, Metacritic)
 * • додано кольори за джерелом (незалежно від colorize_all)
 * • покращено повідомлення про помилки API
 */

(function() {
  'use strict';

  var pluginStyles = "<style>" +
    ".loading-dots-container {" +
    "    display: flex;" +
    "    align-items: center;" +
    "    font-size: 0.85em;" +
    "    color: #ccc;" +
    "    padding: 0.6em 1em;" +
    "    border-radius: 0.5em;" +
    "}" +
    ".loading-dots__text {" +
    "    margin-right: 1em;" +
    "}" +
    ".loading-dots__dot {" +
    "    width: 0.5em;" +
    "    height: 0.5em;" +
    "    border-radius: 50%;" +
    "    background-color: currentColor;" +
    "    animation: loading-dots-bounce 1.4s infinite ease-in-out both;" +
    "}" +
    ".loading-dots__dot:nth-child(1) {" +
    "    animation-delay: -0.32s;" +
    "}" +
    ".loading-dots__dot:nth-child(2) {" +
    "    animation-delay: -0.16s;" +
    "}" +
    "@keyframes loading-dots-bounce {" +
    "    0%, 80%, 100% { transform: translateY(0); opacity: 0.6; }" +
    "    40% { transform: translateY(-0.5em); opacity: 1; }" +
    "}" +


    ":root{" +
    "  --lmp-h-imdb:22px;" +
    "  --lmp-h-mc:22px;" +
    "  --lmp-h-rt:24px;" +
    "  --lmp-h-popcorn:24px;" +
    "  --lmp-h-tmdb:24px;" +
    "  --lmp-h-awards:18px;" + 
    "  --lmp-h-avg:18px;" + 
    "  --lmp-h-oscar:20px;" + 
    "  --lmp-h-emmy:22px;" + 
    "}" +

    ".rate--oscars, .rate--emmy, .rate--awards, .rate--gold {" +
    "    color: gold;" +
    "}" +


    "body.lmp-enh--mono .rate--oscars," +
    "body.lmp-enh--mono .rate--emmy," +
    "body.lmp-enh--mono .rate--awards," +
    "body.lmp-enh--mono .rate--gold," +
    "body.lmp-enh--mono .rating--green," +
    "body.lmp-enh--mono .rating--blue," +
    "body.lmp-enh--mono .rating--orange," +
    "body.lmp-enh--mono .rating--red," +
    "body.lmp-enh--mono .full-start__rate {" +
    "    color: inherit !important;" +
    "}" +


    "body:not(.lmp-enh--mono) .full-start__rate.rating--green  { color: #2ecc71; }" + /* ≥ 8.0  */
    "body:not(.lmp-enh--mono) .full-start__rate.rating--blue   { color: #60a5fa; }" + /* 6.0–7.9 */
    "body:not(.lmp-enh--mono) .full-start__rate.rating--orange { color: #f59e0b; }" + /* 4.0–5.9 */
    "body:not(.lmp-enh--mono) .full-start__rate.rating--red    { color: #ef4444; }" + /* < 4.0   */


    ".full-start-new__rate-line .full-start__rate {" +
    "    margin-right: 0.3em !important;" +
    "}" +
    ".full-start-new__rate-line .full-start__rate:last-child {" +
    "    margin-right: 0 !important;" +
    "}" +


    ".full-start-new__rate-line.lmp-is-loading-ratings > :not(#lmp-search-loader)," +
    ".full-start__rate-line.lmp-is-loading-ratings > :not(#lmp-search-loader) {" +
    "    opacity: 0 !important;" +
    "    pointer-events: none !important;" +
    "    transition: opacity 0.15s;" +
    "}" +


    ".lmp-award-icon{" +
    "  display:inline-flex;" +
    "  align-items:center;" +
    "  justify-content:center;" +
    "  line-height:1;" +
    "  height:auto;" +
    "  width:auto;" +
    "  flex-shrink:0;" +
    "}" +
    ".lmp-award-icon img{" +
    "  height:auto;" +
    "  width:auto;" +
    "  display:block;" +
    "  object-fit:contain;" +
    "}" +
    ".lmp-award-icon--oscar img{height:var(--lmp-h-oscar);}" +
    ".lmp-award-icon--emmy  img{height:var(--lmp-h-emmy);}" +


    ".rate--imdb    .source--name img{height:var(--lmp-h-imdb);}" +
    ".rate--mc      .source--name img{height:var(--lmp-h-mc);}" +
    ".rate--rt      .source--name img{height:var(--lmp-h-rt);}" +
    ".rate--popcorn .source--name img{height:var(--lmp-h-popcorn);}" +
    ".rate--tmdb    .source--name img{height:var(--lmp-h-tmdb);}" +
    ".rate--awards  .source--name img{height:var(--lmp-h-awards);}" +
    ".rate--avg     .source--name img{height:var(--lmp-h-avg);}" +


    ".full-start__rate .source--name{" +
    "  display:inline-flex;" +
    "  align-items:center;" +
    "  justify-content:center;" +
    "}" +


    ".settings-param__descr,.settings-param__subtitle{white-space:pre-line;}" +


    "@media (max-width: 600px){" +
    "  .full-start-new__rate-line{flex-wrap:wrap;}" +
    "  .full-start__rate{" +
    "    margin-right:.25em !important;" +
    "    margin-bottom:.25em;" +
    "    font-size:16px;" +
    "    min-width:unset;" +
    "  }" +
    "  :root{" +
    "    --lmp-h-imdb:14px; --lmp-h-mc:14px; --lmp-h-rt:16px;" +
    "    --lmp-h-popcorn:16px; --lmp-h-tmdb:16px; --lmp-h-awards:14px;" +
    "    --lmp-h-avg:14px; --lmp-h-oscar:14px; --lmp-h-emmy:16px;" +
    "  }" +
    "  .loading-dots-container{font-size:.8em; padding:.4em .8em;}" +
    "  .lmp-award-icon{height:16px;}" +
    "}" +


    "@media (max-width: 360px){" +
    "  .full-start__rate{font-size:14px;}" +
    "  :root{" +
    "    --lmp-h-imdb:12px; --lmp-h-mc:12px; --lmp-h-rt:14px;" +
    "    --lmp-h-popcorn:14px; --lmp-h-tmdb:14px; --lmp-h-awards:12px;" +
    "    --lmp-h-avg:12px; --lmp-h-oscar:12px; --lmp-h-emmy:14px;" +
    "  }" +
    "  .lmp-award-icon{height:12px;}" +
    "}" +


    "body.lmp-enh--rate-border .full-start__rate{" +
    "  border: 1px solid rgba(255, 255, 255, 0.45);" +
    "  border-radius: 0.3em;" +
    "  box-sizing: border-box;" +
    "}" +

    "body.lmp-enh--rate-border .full-start-new__rate-line, " +
    "body.lmp-enh--rate-border .full-start__rate-line{" +
    "}"
    "</style>";

  // ────────────────────────────────────────────────────────────────
  // Мінімальні перевірки Promise та fetch
  // ────────────────────────────────────────────────────────────────

  if (!window.Promise) {
    console.warn('[LMP Ratings] Native Promise відсутній — дуже стара платформа');
    // Якщо потрібно — можна додати повний MiniPromise, але краще не
  }

  if (!window.fetch) {
    console.warn('[LMP Ratings] Використовуємо Lampa.Reguest як фолбек для fetch');
  }

  // ────────────────────────────────────────────────────────────────
  // Константи та конфігурація
  // ────────────────────────────────────────────────────────────────

  var LMP_ENH_CONFIG = {
    apiKeys: {
      mdblist: '',
      omdb: ''
    },
    monochromeIcons: false
  };

  var BASE_ICON = 'https://raw.githubusercontent.com/ko3ik/LMP/main/wwwroot/'; // або свій шлях

  var ICONS = {
    total_star: BASE_ICON + 'star.png',
    imdb:       BASE_ICON + 'imdb.png',
    tmdb:       BASE_ICON + 'tmdb.png',
    metacritic: BASE_ICON + 'metacritic.png',
    metascore:  BASE_ICON + 'metascore.png',
    rotten_good: BASE_ICON + 'RottenTomatoes.png',
    rotten_bad:  BASE_ICON + 'RottenBad.png',
    popcorn:     BASE_ICON + 'PopcornGood.png',
    awards:      BASE_ICON + 'awards.png',
    oscar:       BASE_ICON + 'OscarGold.png',
    emmy:        BASE_ICON + 'EmmyGold.png'
  };

  var CACHE_TIME = 3 * 24 * 60 * 60 * 1000; // 3 дні

  var RCFG_DEFAULT = {
    ratings_omdb_key: '',
    ratings_mdblist_key: '',
    ratings_bw_logos: false,
    ratings_show_awards: true,
    ratings_show_average: true,
    ratings_logo_offset: 0,
    ratings_font_offset: 0,
    ratings_badge_alpha: 0.15,
    ratings_badge_tone: 0,
    ratings_gap_step: 0,
    ratings_colorize_all: false,
    ratings_color_by_source: true,       // НОВА — кольори за джерелом
    ratings_enable_imdb: true,
    ratings_enable_tmdb: true,
    ratings_enable_mc: true,
    ratings_enable_rt: true,
    ratings_enable_popcorn: true,
    ratings_poster_badges: false,
    ratings_rate_border: false
  };

  var AGE_RATINGS = {
    'G': '3+', 'PG': '6+', 'PG-13': '13+', 'R': '17+', 'NC-17': '18+',
    'TV-Y': '0+', 'TV-Y7': '7+', 'TV-G': '3+', 'TV-PG': '6+', 'TV-14': '14+', 'TV-MA': '17+'
  };

  // ────────────────────────────────────────────────────────────────
  // Покращені повідомлення про помилки
  // ────────────────────────────────────────────────────────────────

  function apiErrorToast(source, errorType, details = '') {
    let msg = '';
    switch (errorType) {
      case 'key_missing':   msg = `API ключ для ${source} не введено в налаштуваннях`; break;
      case 'network':       msg = `${source}: проблема з'єднання з мережею`; break;
      case 'limit':         msg = `${source}: ліміт запитів вичерпано на сьогодні`; break;
      case 'not_found':     msg = `${source}: дані по фільму/серіалу не знайдено (404)`; break;
      case 'invalid_key':   msg = `${source}: невалідний або заблокований API ключ`; break;
      case 'parse_error':   msg = `${source}: помилка обробки відповіді сервера`; break;
      default:              msg = `${source}: не вдалося завантажити рейтинги`;
    }
    if (details) msg += ` (${details})`;
    lmpToast(msg);
    console.error('[LMP Ratings Error]', source, errorType, details);
  }

  // ────────────────────────────────────────────────────────────────
  // Кольори за джерелом (незалежно від colorize_all)
  // ────────────────────────────────────────────────────────────────

  function getSourceColorClass(source, value, extra = {}) {
    if (!LMP_ENH_CONFIG || !LMP_ENH_CONFIG.color_by_source) return '';

    let v = parseFloat(value);
    if (isNaN(v)) return '';

    switch (source.toLowerCase()) {
      case 'imdb':
        if (v >= 8.0) return 'rating--green';
        if (v >= 6.5) return 'rating--blue';
        if (v >= 5.0) return 'rating--orange';
        return 'rating--red';

      case 'tmdb':
        if (v >= 8.0) return 'rating--green';
        if (v >= 6.0) return 'rating--blue';
        return 'rating--orange';

      case 'rottentomatoes':
      case 'rt':
      case 'tomato':
        return extra.fresh ? 'rating--green' : 'rating--red';

      case 'metacritic':
      case 'mc':
      case 'metascore':
        let mv = v * 10; // часто приходить у 10-бальній шкалі
        if (mv >= 80) return 'rating--green';
        if (mv >= 60) return 'rating--blue';
        if (mv >= 40) return 'rating--orange';
        return 'rating--red';

      case 'popcorn':
      case 'audience':
        if (v >= 80) return 'rating--green';
        if (v >= 60) return 'rating--blue';
        return 'rating--orange';

      default:
        return '';
    }
  }

  // ────────────────────────────────────────────────────────────────
  // Допоміжна функція форматування чисел (1.2M, 45K)
  // ────────────────────────────────────────────────────────────────

  function formatNumber(n) {
    if (!n || isNaN(n)) return '?';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(0)   + 'K';
    return n.toString();
  }

  // ────────────────────────────────────────────────────────────────
  // Оновлена функція insertRatings з votes / percent / count
  // ────────────────────────────────────────────────────────────────

  function insertRatings(data) {
    var render = Lampa.Activity.active().activity.render();
    if (!render) return;

    cleanupRtgInjected(render);
    var rateLine = getPrimaryRateLine(render);
    if (!rateLine.length) return;

    var cfg = getCfg();

    // IMDb
    (function() {
      if (!cfg.enableImdb || !data.imdb_display) return;

      var text = data.imdb_display;
      var extra = '';
      if (data.imdb_votes) extra = ` (${formatNumber(data.imdb_votes)})`;

      var $cont = $('.rate--imdb', rateLine);
      if (!$cont.length) {
        $cont = $(`
          <div class="full-start__rate rate--imdb">
            <div>\( {text} \){extra}</div>
            <div class="source--name"></div>
          </div>
        `);
        $cont.find('.source--name').html(iconImg(ICONS.imdb, 'IMDb', 22));
        rateLine.append($cont);
      } else {
        $cont.find('> div:first').text(text + extra);
      }

      $cont.removeClass('rating--green rating--blue rating--orange rating--red');
      if (cfg.ratings_color_by_source) {
        $cont.addClass(getSourceColorClass('imdb', data.imdb_display));
      } else if (cfg.ratings_colorize_all) {
        $cont.addClass(getRatingClass(parseFloat(data.imdb_for_avg || 0)));
      }
    })();

    // Rotten Tomatoes
    (function() {
      if (!cfg.enableRt || !data.rt_display) return;

      var text = data.rt_display + '%';
      var extra = '';
      if (data.rt_audience_score) {
        extra += ` | \( {data.rt_audience_score}% ( \){formatNumber(data.rt_audience_count || '?')})`;
      }

      var $cont = $('.rate--rt', rateLine);
      if (!$cont.length) {
        $cont = $(`
          <div class="full-start__rate rate--rt">
            <div>\( {text} \){extra}</div>
            <div class="source--name"></div>
          </div>
        `);
        var icon = data.rt_fresh ? ICONS.rotten_good : ICONS.rotten_bad;
        $cont.find('.source--name').html(iconImg(icon, 'Rotten Tomatoes', 22));
        rateLine.append($cont);
      } else {
        $cont.find('> div:first').text(text + extra);
      }

      $cont.removeClass('rating--green rating--blue rating--orange rating--red');
      if (cfg.ratings_color_by_source) {
        $cont.addClass(getSourceColorClass('rt', data.rt_display, {fresh: data.rt_fresh}));
      } else if (cfg.ratings_colorize_all) {
        $cont.addClass(getRatingClass(data.rt_for_avg || 0));
      }
    })();

    // Metacritic
    (function() {
      if (!cfg.enableMc || !data.mc_display) return;

      var text = data.mc_display;
      var extra = '';
      if (data.mc_critic_count) {
        extra = ` (${formatNumber(data.mc_critic_count)} критик)`;
      } else if (data.mc_user_count) {
        extra = ` (${formatNumber(data.mc_user_count)} глядач)`;
      }

      var $cont = $('.rate--mc', rateLine);
      if (!$cont.length) {
        $cont = $(`
          <div class="full-start__rate rate--mc">
            <div>\( {text} \){extra}</div>
            <div class="source--name"></div>
          </div>
        `);
        $cont.find('.source--name').html(iconImg(ICONS.metascore, 'Metacritic', 22));
        rateLine.append($cont);
      } else {
        $cont.find('> div:first').text(text + extra);
      }

      $cont.removeClass('rating--green rating--blue rating--orange rating--red');
      if (cfg.ratings_color_by_source) {
        $cont.addClass(getSourceColorClass('metacritic', data.mc_display));
      } else if (cfg.ratings_colorize_all) {
        $cont.addClass(getRatingClass(data.mc_for_avg || 0));
      }
    })();

    // ─── Інші джерела (TMDB, Popcorn, AVG, нагороди) ─────────────────
    // можна розширити аналогічно, якщо потрібно

    applyStylesToAll();
  }

  // ────────────────────────────────────────────────────────────────
  // Оновлений fetchMdbListRatings з votes/count та помилками
  // ────────────────────────────────────────────────────────────────

  function fetchMdbListRatings(card, callback) {
    var key = LMP_ENH_CONFIG.apiKeys.mdblist;
    if (!key) {
      apiErrorToast('MDBList', 'key_missing');
      return callback(null);
    }

    var typeSegment = (card.type === 'tv') ? 'show' : card.type;
    var url = `https://api.mdblist.com/tmdb/\( {typeSegment}/ \){card.id}?apikey=${encodeURIComponent(key)}`;

    new Lampa.Reguest().silent(url,
      function(response) {
        if (!response || !response.ratings || !Array.isArray(response.ratings)) {
          apiErrorToast('MDBList', 'not_found', 'немає рейтингів у відповіді');
          return callback(null);
        }

        var res = {
          tmdb_display: null, tmdb_for_avg: null,
          imdb_display: null, imdb_for_avg: null, imdb_votes: null,
          mc_user_display: null, mc_user_for_avg: null, mc_user_count: null,
          mc_critic_display: null, mc_critic_for_avg: null, mc_critic_count: null,
          rt_display: null, rt_for_avg: null, rt_fresh: null,
          rt_audience_score: null, rt_audience_count: null,
          popcorn_display: null, popcorn_for_avg: null,
          _mdblist_ratings: response.ratings.slice()
        };

        response.ratings.forEach(r => {
          let src = (r.source || '').toLowerCase();
          let val = parseFloat(r.value || r.score || r.percent || r.rating);
          if (isNaN(val)) return;

          if (src.includes('tmdb')) {
            let t = val > 10 ? val / 10 : val;
            res.tmdb_display = t.toFixed(1);
            res.tmdb_for_avg = t;
          }
          if (src.includes('imdb')) {
            let i = val > 10 ? val / 10 : val;
            res.imdb_display = i.toFixed(1);
            res.imdb_for_avg = i;
            if (r.votes) res.imdb_votes = r.votes;
          }
          if (src.includes('metacritic') && src.includes('user')) {
            let u = val > 10 ? val / 10 : val;
            res.mc_user_display = u.toFixed(1);
            res.mc_user_for_avg = u;
            if (r.reviews || r.votes) res.mc_user_count = r.reviews || r.votes;
          }
          if (src.includes('metacritic') && !src.includes('user')) {
            let c = val > 10 ? val / 10 : val;
            res.mc_critic_display = c.toFixed(1);
            res.mc_critic_for_avg = c;
            if (r.reviews || r.votes) res.mc_critic_count = r.reviews || r.votes;
          }
          if (src.includes('rotten') || src.includes('tomato')) {
            res.rt_display = Math.round(val).toString();
            res.rt_for_avg = val / 10;
            res.rt_fresh = val >= 60;
            if (r.audience_score) res.rt_audience_score = Math.round(r.audience_score);
            if (r.audience_votes || r.audience_count) res.rt_audience_count = r.audience_votes || r.audience_count;
          }
          if (src.includes('popcorn') || src.includes('audience')) {
            res.popcorn_display = Math.round(val).toString();
            res.popcorn_for_avg = val / 10;
          }
        });

        callback(res);
      },
      function(status, err) {
        let type = 'network';
        if (status === 401 || status === 403) type = 'invalid_key';
        if (status === 429) type = 'limit';
        if (status === 404) type = 'not_found';
        apiErrorToast('MDBList', type, err || status);
        callback(null);
      }
    );
  }

  // ────────────────────────────────────────────────────────────────
  // fetchOmdbRatings — додано votes та помилки
  // ────────────────────────────────────────────────────────────────

  function fetchOmdbRatings(card, callback) {
    var key = LMP_ENH_CONFIG.apiKeys.omdb;
    if (!key || !card.imdb_id) {
      if (!key) apiErrorToast('OMDb', 'key_missing');
      if (!card.imdb_id) console.warn('[LMP Ratings] OMDb: відсутній IMDb ID');
      return callback(null);
    }

    var typeParam = card.type === 'tv' ? '&type=series' : '';
    var url = `https://www.omdbapi.com/?apikey=\( {encodeURIComponent(key)}&i= \){encodeURIComponent(card.imdb_id)}${typeParam}`;

    new Lampa.Reguest().silent(url, function(data) {
      if (!data || data.Response !== 'True') {
        let type = data.Error?.includes('Incorrect') ? 'invalid_key' :
                   data.Error?.includes('not found') ? 'not_found' : 'network';
        apiErrorToast('OMDb', type, data.Error || '');
        return callback(null);
      }

      var awardsParsed = parseAwards(data.Awards || '');
      var rtScore = null, mcScore = null;

      if (Array.isArray(data.Ratings)) {
        data.Ratings.forEach(r => {
          if (r.Source === 'Rotten Tomatoes') {
            rtScore = parseInt((r.Value || '').replace('%', '')) || null;
          }
          if (r.Source === 'Metacritic') {
            mcScore = parseInt((r.Value || '').split('/')[0]) || null;
          }
        });
      }

      var res = {
        imdb_display: data.imdbRating !== 'N/A' ? parseFloat(data.imdbRating).toFixed(1) : null,
        imdb_for_avg: data.imdbRating !== 'N/A' ? parseFloat(data.imdbRating) : null,
        imdb_votes: data.imdbVotes !== 'N/A' ? parseInt(data.imdbVotes.replace(/,/g, '')) : null,
        mc_critic_display: mcScore ? (mcScore / 10).toFixed(1) : null,
        mc_critic_for_avg: mcScore ? (mcScore / 10) : null,
        rt_display: rtScore ? rtScore.toString() : null,
        rt_for_avg: rtScore ? rtScore / 10 : null,
        rt_fresh: rtScore ? rtScore >= 60 : null,
        ageRating: data.Rated !== 'N/A' ? data.Rated : null,
        oscars: awardsParsed.oscars,
        emmy: awardsParsed.emmy,
        awards: awardsParsed.awards
      };

      callback(res);
    }, function() {
      apiErrorToast('OMDb', 'network');
      callback(null);
    });
  }

  // ────────────────────────────────────────────────────────────────
  // Далі йде решта коду без суттєвих змін (можна вставити з попередньої версії)
  // mergeRatings, getImdbIdFromTmdb, renderPosterBadges, addSettingsSection тощо
  // ────────────────────────────────────────────────────────────────

  // Приклад: додати нову опцію в налаштування (якщо ще не додано)
  // У функції addSettingsSection() вставити:

  /*
  Lampa.SettingsApi.addParam({
    component: 'lmp_ratings',
    param: { name: 'ratings_color_by_source', type: 'trigger', "default": true },
    field: {
      name: 'Кольори за джерелом',
      description: 'Кожне джерело має власну кольорову схему (незалежно від "Кольорові оцінки")'
    }
  });
  */

  // ────────────────────────────────────────────────────────────────
  // Запуск плагіну (залишається без змін)
  // ────────────────────────────────────────────────────────────────

  Lampa.Template.add('lmp_enh_styles', pluginStyles); // pluginStyles має бути визначено раніше
  $('body').append(Lampa.Template.get('lmp_enh_styles', {}, true));

  initRatingsPluginUI();
  refreshConfigFromStorage();

  window.addEventListener('resize', reapplyOnResize);
  window.addEventListener('orientationchange', reapplyOnResize);

  if (!window.combined_ratings_plugin) {
    startPlugin();
  }

})();
