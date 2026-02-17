/**
 * Lampa: Enhanced Ratings (MDBList + OMDb) + Poster Badges
 * Оновлено: видалено зайві поліфіли, додано votes/percent, кольори за джерелом, кращі помилки
 * --------------------------------------------------------
 */

(function() {
  'use strict';

  // ────────────────────────────────────────────────────────────────
  // 1. Мінімальні перевірки Promise + fetch (тільки це залишено)
  // ────────────────────────────────────────────────────────────────

  if (!window.Promise) {
    console.warn('[LMP Ratings] Native Promise missing - very old environment');
    // Якщо дуже потрібно, можна вставити MiniPromise сюди, але краще не
    // Для 99% пристроїв 2025+ це не спрацює
  }

  if (!window.fetch) {
    console.warn('[LMP Ratings] Using Lampa.Reguest fallback for fetch');
    // Фолбек вже є нижче в коді - нічого не додаємо сюди
  }

  // ────────────────────────────────────────────────────────────────
  // 2. Константи та конфіг (без змін, тільки дрібні покращення)
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
    imdb: BASE_ICON + 'imdb.png',
    tmdb: BASE_ICON + 'tmdb.png',
    metacritic: BASE_ICON + 'metacritic.png',
    metascore: BASE_ICON + 'metascore.png',
    rotten_good: BASE_ICON + 'RottenTomatoes.png',
    rotten_bad: BASE_ICON + 'RottenBad.png',
    popcorn: BASE_ICON + 'PopcornGood.png',
    awards: BASE_ICON + 'awards.png',
    oscar: BASE_ICON + 'OscarGold.png',
    emmy: BASE_ICON + 'EmmyGold.png'
  };

  var CACHE_TIME = 3 * 24 * 60 * 60 * 1000; // 3 дні

  var RCFG_DEFAULT = {
    // ... (весь попередній об'єкт без змін)
    ratings_enable_imdb: true,
    ratings_enable_tmdb: true,
    ratings_enable_mc: true,
    ratings_enable_rt: true,
    ratings_enable_popcorn: true,
    ratings_poster_badges: false,
    ratings_rate_border: false,
    ratings_colorize_all: false,
    ratings_color_by_source: true   // НОВА опція - кольори за джерелом
  };

  // ────────────────────────────────────────────────────────────────
  // 3. Покращені повідомлення про помилки
  // ────────────────────────────────────────────────────────────────

  function apiErrorToast(source, errorType, details = '') {
    let msg = '';
    switch (errorType) {
      case 'key_missing':   msg = `API ключ для ${source} не введено`; break;
      case 'network':       msg = `${source}: проблема з мережею`; break;
      case 'limit':         msg = `${source}: ліміт запитів вичерпано`; break;
      case 'not_found':     msg = `${source}: дані не знайдено (404)`; break;
      case 'invalid_key':   msg = `${source}: невалідний API ключ`; break;
      default:              msg = `${source}: помилка завантаження рейтингів`;
    }
    if (details) msg += ` (${details})`;
    lmpToast(msg);
    console.error('[LMP Ratings]', msg, errorType, details);
  }

  // ────────────────────────────────────────────────────────────────
  // 4. Функція для отримання кольору за джерелом (нова)
  // ────────────────────────────────────────────────────────────────

  function getSourceColorClass(source, value, extra = {}) {
    if (!LMP_ENH_CONFIG || !LMP_ENH_CONFIG.color_by_source) return '';

    switch (source.toLowerCase()) {
      case 'imdb':
        let iv = parseFloat(value);
        if (iv >= 8.0) return 'rating--green';
        if (iv >= 6.5) return 'rating--blue';
        if (iv >= 5.0) return 'rating--orange';
        return 'rating--red';

      case 'tmdb':
        let tv = parseFloat(value);
        if (tv >= 8.0) return 'rating--green';
        if (tv >= 6.0) return 'rating--blue';
        return 'rating--orange';

      case 'rottentomatoes':
      case 'rt':
        return extra.fresh ? 'rating--green' : 'rating--red';

      case 'metacritic':
      case 'mc':
      case 'metascore':
        let mv = parseFloat(value) * 10; // часто в 10-бальній шкалі
        if (mv >= 80) return 'rating--green';
        if (mv >= 60) return 'rating--blue';
        if (mv >= 40) return 'rating--orange';
        return 'rating--red';

      case 'popcorn':
      case 'audience':
        let pv = parseFloat(value);
        if (pv >= 80) return 'rating--green';
        if (pv >= 60) return 'rating--blue';
        return 'rating--orange';

      default:
        return '';
    }
  }

  // ────────────────────────────────────────────────────────────────
  // 5. Оновлена insertRatings — додано votes / percent / count
  // ────────────────────────────────────────────────────────────────

  function insertRatings(data) {
    var render = Lampa.Activity.active().activity.render();
    if (!render) return;

    cleanupRtgInjected(render);
    var rateLine = getPrimaryRateLine(render);
    if (!rateLine.length) return;

    var cfg = getCfg();

    // ─── IMDb ───────────────────────────────────────────────────────
    (function() {
      var cont = $('.rate--imdb', rateLine);
      if (!cfg.enableImdb || !data.imdb_display) {
        cont.remove();
        return;
      }

      var text = data.imdb_display;
      var extra = '';
      if (data.imdb_votes) {
        extra = ` (${formatNumber(data.imdb_votes)})`;
      }

      if (!cont.length) {
        cont = $(`
          <div class="full-start__rate rate--imdb">
            <div>\( {text} \){extra}</div>
            <div class="source--name"></div>
          </div>
        `);
        cont.find('.source--name').html(iconImg(ICONS.imdb, 'IMDb', 22));
        rateLine.append(cont);
      } else {
        cont.find('> div:first').text(text + extra);
      }

      cont.removeClass('rating--green rating--blue rating--orange rating--red');
      if (cfg.ratings_color_by_source) {
        cont.addClass(getSourceColorClass('imdb', data.imdb_display));
      } else if (cfg.ratings_colorize_all) {
        cont.addClass(getRatingClass(parseFloat(data.imdb_for_avg)));
      }
    })();

    // ─── Rotten Tomatoes ────────────────────────────────────────────
    (function() {
      var cont = $('.rate--rt', rateLine);
      if (!cfg.enableRt || !data.rt_display) {
        cont.remove();
        return;
      }

      var text = data.rt_display + '%';
      var extra = '';
      if (data.rt_audience_score) {
        extra += ` | \( {data.rt_audience_score}% ( \){formatNumber(data.rt_audience_count || '?')})`;
      }

      if (!cont.length) {
        cont = $(`
          <div class="full-start__rate rate--rt">
            <div>\( {text} \){extra}</div>
            <div class="source--name"></div>
          </div>
        `);
        var icon = data.rt_fresh ? ICONS.rotten_good : ICONS.rotten_bad;
        cont.find('.source--name').html(iconImg(icon, 'Rotten Tomatoes', 22));
        rateLine.append(cont);
      } else {
        cont.find('> div:first').text(text + extra);
      }

      cont.removeClass('rating--green rating--blue rating--orange rating--red');
      if (cfg.ratings_color_by_source) {
        cont.addClass(getSourceColorClass('rt', data.rt_display, {fresh: data.rt_fresh}));
      } else if (cfg.ratings_colorize_all) {
        cont.addClass(getRatingClass(data.rt_for_avg));
      }
    })();

    // ─── Metacritic ─────────────────────────────────────────────────
    (function() {
      var cont = $('.rate--mc', rateLine);
      if (!cfg.enableMc || !data.mc_display) {
        cont.remove();
        return;
      }

      var text = data.mc_display;
      var extra = '';
      if (data.mc_critic_count) {
        extra = ` (${formatNumber(data.mc_critic_count)} critics)`;
      } else if (data.mc_user_count) {
        extra = ` (${formatNumber(data.mc_user_count)} users)`;
      }

      if (!cont.length) {
        cont = $(`
          <div class="full-start__rate rate--mc">
            <div>\( {text} \){extra}</div>
            <div class="source--name"></div>
          </div>
        `);
        cont.find('.source--name').html(iconImg(ICONS.metascore, 'Metacritic', 22));
        rateLine.append(cont);
      } else {
        cont.find('> div:first').text(text + extra);
      }

      cont.removeClass('rating--green rating--blue rating--orange rating--red');
      if (cfg.ratings_color_by_source) {
        cont.addClass(getSourceColorClass('metacritic', data.mc_display));
      } else if (cfg.ratings_colorize_all) {
        cont.addClass(getRatingClass(data.mc_for_avg));
      }
    })();

    // ... (інші джерела — TMDB, Popcorn, AVG, нагороди — можна аналогічно розширити)

    applyStylesToAll();
  }

  // Допоміжна функція для форматування чисел (1.2M, 45K тощо)
  function formatNumber(num) {
    if (!num) return '?';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(0) + 'K';
    return num.toString();
  }

  // ────────────────────────────────────────────────────────────────
  // 6. Оновлення fetchMdbListRatings та fetchOmdbRatings
  //    (додаємо votes/count де можливо, кращі помилки)
  // ────────────────────────────────────────────────────────────────

  function fetchMdbListRatings(card, callback) {
    var key = LMP_ENH_CONFIG.apiKeys.mdblist;
    if (!key) {
      apiErrorToast('MDBList', 'key_missing');
      return callback(null);
    }

    var typeSegment = (card.type === 'tv') ? 'show' : card.type;
    var url = `https://api.mdblist.com/tmdb/\( {typeSegment}/ \){card.id}?apikey=${encodeURIComponent(key)}`;

    new Lampa.Reguest().silent(url, handleSuccess, handleFail);

    function handleFail(status, err) {
      let type = 'network';
      if (status === 401 || status === 403) type = 'invalid_key';
      if (status === 429) type = 'limit';
      if (status === 404) type = 'not_found';
      apiErrorToast('MDBList', type, err || status);
      callback(null);
    }

    function handleSuccess(response) {
      if (!response || !response.ratings) {
        apiErrorToast('MDBList', 'not_found', 'немає рейтингів');
        return callback(null);
      }

      var res = { /* ... попередня логіка ... */ };

      // Додаємо votes/count де є
      response.ratings.forEach(r => {
        let src = (r.source || '').toLowerCase();
        if (src.includes('imdb') && r.votes) res.imdb_votes = r.votes;
        if (src.includes('rotten') && r.audience_votes) {
          res.rt_audience_count = r.audience_votes;
          res.rt_audience_score = r.audience_score || r.value;
        }
        if (src.includes('metacritic') && r.reviews) {
          if (src.includes('critic')) res.mc_critic_count = r.reviews;
          if (src.includes('user'))   res.mc_user_count   = r.reviews;
        }
      });

      callback(res);
    }
  }

  // Аналогічно онови fetchOmdbRatings (додавай .imdbVotes, .Ratings з votes тощо)

  // ────────────────────────────────────────────────────────────────
  // 7. Додай нову опцію в налаштування
  // ────────────────────────────────────────────────────────────────

  // У addSettingsSection() додай:
  Lampa.SettingsApi.addParam({
    component: 'lmp_ratings',
    param: {
      name: 'ratings_color_by_source',
      type: 'trigger',
      "default": true
    },
    field: {
      name: 'Кольори за джерелом',
      description: 'Кожне джерело має власну кольорову схему (незалежно від "Кольорові оцінки")'
    }
  });

  // ────────────────────────────────────────────────────────────────
  // Решта коду (fetchOmdbRatings, mergeRatings, renderPosterBadges тощо)
  // залишається майже без змін — просто використовуй нові класи/повідомлення
  // ────────────────────────────────────────────────────────────────

  // ... (встав решту коду з попередньої версії)

})();
