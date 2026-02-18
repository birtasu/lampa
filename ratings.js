/**
 * Lampa: Enhanced Ratings (MDBList + OMDb) + Poster Badges (like LME - Lampa Movie Enchancer)
 * --------------------------------------------------------
 * - Бере рейтинги з MDBList (+ OMDb для віку/нагород) і малює їх у деталці
 * - Додає опційні "стікери" (badges) рейтингів прямо на постери
 * - Має секцію налаштувань "Рейтинги", живе застосування стилів без перезавантаження
 * - Додано відображення кількості голосів біля кожного рейтингу
 */

(function() {
    'use strict';

    /* ==========================================================================
     | localStorage shim
     | (Фолбек, якщо localStorage вимкнено або недоступний)
     |========================================================================== */

    (function() {
        var ok = true;
        try {
            var t = '__lmp_test__';
            window.localStorage.setItem(t, '1');
            window.localStorage.removeItem(t);
        } catch (e) {
            ok = false;
        }
        if (!ok) {
            var mem = {};
            window.localStorage = {
                getItem: function(k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
                setItem: function(k, v) { mem[k] = String(v); },
                removeItem: function(k) { delete mem[k]; },
                clear: function() { mem = {}; }
            };
        }
    })();

    /* ==========================================================================
     | Promise (мінімальний поліфіл)
     | (Достатньо для then/catch/all)
     |========================================================================== */

    (function(global) {
        if (global.Promise) return; // Вже є
        var PENDING = 0, FULFILLED = 1, REJECTED = 2;
        function asap(fn) { setTimeout(fn, 0); }
        function MiniPromise(executor) {
            if (!(this instanceof MiniPromise)) return new MiniPromise(executor);
            var self = this;
            self._state = PENDING;
            self._value = void 0;
            self._handlers = [];
            function resolve(value) {
                if (self._state !== PENDING) return;
                if (value && (typeof value === 'object' || typeof value === 'function')) {
                    var then;
                    try { then = value.then; } catch (e) { return reject(e); }
                    if (typeof then === 'function') return then.call(value, resolve, reject);
                }
                self._state = FULFILLED;
                self._value = value;
                finale();
            }
            function reject(reason) {
                if (self._state !== PENDING) return;
                self._state = REJECTED;
                self._value = reason;
                finale();
            }
            function finale() {
                asap(function() {
                    var q = self._handlers;
                    self._handlers = [];
                    for (var i = 0; i < q.length; i++) handle(q[i]);
                });
            }
            function handle(h) {
                if (self._state === PENDING) {
                    self._handlers.push(h);
                    return;
                }
                var cb = self._state === FULFILLED ? h.onFulfilled : h.onRejected;
                if (!cb) {
                    (self._state === FULFILLED ? h.resolve : h.reject)(self._value);
                    return;
                }
                try {
                    var ret = cb(self._value);
                    h.resolve(ret);
                } catch (e) {
                    h.reject(e);
                }
            }
            this.then = function(onFulfilled, onRejected) {
                return new MiniPromise(function(resolve, reject) {
                    handle({
                        onFulfilled: onFulfilled,
                        onRejected: onRejected,
                        resolve: resolve,
                        reject: reject
                    });
                });
            };
            this.catch = function(onRejected) {
                return this.then(null, onRejected);
            };
            try { executor(resolve, reject); } catch (e) { reject(e); }
        }
        MiniPromise.resolve = function(v) { return new MiniPromise(function(res) { res(v); }); };
        MiniPromise.reject = function(r) { return new MiniPromise(function(_, rej) { rej(r); }); };
        MiniPromise.all = function(arr) {
            return new MiniPromise(function(resolve, reject) {
                if (!arr || !arr.length) return resolve([]);
                var out = new Array(arr.length), left = arr.length;
                for (var i = 0; i < arr.length; i++)(function(i) {
                    MiniPromise.resolve(arr[i]).then(function(v) {
                        out[i] = v;
                        if (--left === 0) resolve(out);
                    }, reject);
                })(i);
            });
        };
        global.Promise = MiniPromise;
    })(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));

    /* ==========================================================================
     | fetch polyfill
     | (З урахуванням Lampa.Reguest для обходу CORS)
     |========================================================================== */

    (function(global) {
        if (global.fetch) return; // Вже є
        function Response(body, init) {
            this.status = init && init.status || 200;
            this.ok = this.status >= 200 && this.status < 300;
            this._body = body == null ? '' : String(body);
            this.headers = (init && init.headers) || {};
        }
        Response.prototype.text = function() {
            var self = this;
            return Promise.resolve(self._body);
        };
        Response.prototype.json = function() {
            var self = this;
            return Promise.resolve().then(function() {
                return JSON.parse(self._body || 'null');
            });
        };
        global.fetch = function(input, init) {
            init = init || {};
            var url = (typeof input === 'string') ? input : (input && input.url) || '';
            var method = (init.method || 'GET').toUpperCase();
            var headers = init.headers || {};
            var body = init.body || null;
            // Якщо є Lampa.Reguest — використовуємо його (обхід CORS)
            if (global.Lampa && Lampa.Reguest) {
                return new Promise(function(resolve) {
                    new Lampa.Reguest().native(
                        url,
                        function(data) {
                            var text = (typeof data === 'string') ? data : (data != null ? JSON.stringify(data) : '');
                            resolve(new Response(text, { status: 200, headers: headers }));
                        },
                        function() {
                            resolve(new Response('', { status: 500, headers: headers }));
                        },
                        false,
                        { dataType: 'text', method: method, headers: headers, data: body }
                    );
                });
            }
            // Звичайний XMLHttpRequest-фолбек
            return new Promise(function(resolve, reject) {
                try {
                    var xhr = new XMLHttpRequest();
                    xhr.open(method, url, true);
                    for (var k in headers) {
                        if (Object.prototype.hasOwnProperty.call(headers, k)) xhr.setRequestHeader(k, headers[k]);
                    }
                    xhr.onload = function() {
                        resolve(new Response(xhr.responseText, { status: xhr.status, headers: headers }));
                    };
                    xhr.onerror = function() {
                        reject(new TypeError('Network request failed'));
                    };
                    xhr.send(body);
                } catch (e) {
                    reject(e);
                }
            });
        };
    })(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));

})();

(function() {
    'use strict';

    /* ==========================================================================
     | 1. ШИМИ / ПОЛІФІЛИ
     | (Для старих Android Webview)
     |========================================================================== */

    // NodeList.forEach
    if (window.NodeList && !NodeList.prototype.forEach) {
        NodeList.prototype.forEach = function(callback, thisArg) {
            thisArg = thisArg || window;
            for (var i = 0; i < this.length; i++) {
                callback.call(thisArg, this[i], i, this);
            }
        };
    }

    // Element.matches
    if (!Element.prototype.matches) {
        Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector || function(selector) {
            var node = this;
            var nodes = (node.parentNode || document).querySelectorAll(selector);
            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i] === node) return true;
            }
            return false;
        };
    }

    // Element.closest
    if (!Element.prototype.closest) {
        Element.prototype.closest = function(selector) {
            var el = this;
            while (el && el.nodeType === 1) {
                if (el.matches(selector)) return el;
                el = el.parentElement || el.parentNode;
            }
            return null;
        };
    }

    /* ==========================================================================
     | 2. КОНСТАНТИ ТА КОНФІГУРАЦІЯ
     |========================================================================== */

    /**
     * Конфігурація API ключів
     */
    var LMP_ENH_CONFIG = {
        apiKeys: {
            mdblist: '', // ✅ ключ до MDBList
            omdb: '' // ✅ ключ до OMDb
        },
        monochromeIcons: false /*✅ Вкл./Викл. Ч/Б рейтинги */
    };

    var BASE_ICON = 'https://raw.githubusercontent.com/ko3ik/LMP/main/wwwroot/';
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

    Lampa.Lang.add({
        oscars_label: { uk: 'Оскар' },
        emmy_label: { uk: 'Еммі' },
        awards_other_label: { uk: 'Нагороди' },
        popcorn_label: { uk: 'Глядачі' },
        source_tmdb: { ru: 'TMDB', en: 'TMDB', uk: 'TMDB' },
        source_imdb: { ru: 'IMDb', en: 'IMDb', uk: 'IMDb' },
        source_mc: { ru: 'Metacritic', en: 'Metacritic', uk: 'Metacritic' },
        source_rt: { ru: 'Rotten', en: 'Rotten', uk: 'Rotten' },
        votes_label: { uk: 'голосів' }
    });

    var pluginStyles = "<style>" +
        ".loading-dots-container {" +
        " display: flex;" +
        " align-items: center;" +
        " font-size: 0.85em;" +
        " color: #ccc;" +
        " padding: 0.6em 1em;" +
        " border-radius: 0.5em;" +
        "}" +
        ".loading-dots__text {" +
        " margin-right: 1em;" +
        "}" +
        ".loading-dots__dot {" +
        " width: 0.5em;" +
        " height: 0.5em;" +
        " border-radius: 50%;" +
        " background-color: currentColor;" +
        " animation: loading-dots-bounce 1.4s infinite ease-in-out both;" +
        "}" +
        ".loading-dots__dot:nth-child(1) {" +
        " animation-delay: -0.32s;" +
        "}" +
        ".loading-dots__dot:nth-child(2) {" +
        " animation-delay: -0.16s;" +
        "}" +
        "@keyframes loading-dots-bounce {" +
        " 0%, 80%, 100% { transform: translateY(0); opacity: 0.6; }" +
        " 40% { transform: translateY(-0.5em); opacity: 1; }" +
        "}" +
        ":root{" +
        " --lmp-h-imdb:22px;" +
        " --lmp-h-mc:22px;" +
        " --lmp-h-rt:24px;" +
        " --lmp-h-popcorn:24px;" +
        " --lmp-h-tmdb:24px;" +
        " --lmp-h-awards:18px;" +
        " --lmp-h-avg:18px;" +
        " --lmp-h-oscar:20px;" +
        " --lmp-h-emmy:22px;" +
        "}" +
        ".rate--oscars, .rate--emmy, .rate--awards, .rate--gold {" +
        " color: gold;" +
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
        " color: inherit !important;" +
        "}" +
        "body:not(.lmp-enh--mono) .full-start__rate.rating--green { color: #2ecc71; }" + /* ≥ 8.0 */
        "body:not(.lmp-enh--mono) .full-start__rate.rating--blue { color: #60a5fa; }" + /* 6.0–7.9 */
        "body:not(.lmp-enh--mono) .full-start__rate.rating--orange { color: #f59e0b; }" + /* 4.0–5.9 */
        "body:not(.lmp-enh--mono) .full-start__rate.rating--red { color: #ef4444; }" + /* < 4.0 */
        ".full-start-new__rate-line .full-start__rate {" +
        " margin-right: 0.3em !important;" +
        "}" +
        ".full-start-new__rate-line .full-start__rate:last-child {" +
        " margin-right: 0 !important;" +
        "}" +
        ".full-start-new__rate-line.lmp-is-loading-ratings > :not(#lmp-search-loader)," +
        ".full-start__rate-line.lmp-is-loading-ratings > :not(#lmp-search-loader) {" +
        " opacity: 0 !important;" +
        " pointer-events: none !important;" +
        " transition: opacity 0.15s;" +
        "}" +
        ".lmp-award-icon{" +
        " display:inline-flex;" +
        " align-items:center;" +
        " justify-content:center;" +
        " line-height:1;" +
        " height:auto;" +
        " width:auto;" +
        " flex-shrink:0;" +
        "}" +
        ".lmp-award-icon img{" +
        " height:auto;" +
        " width:auto;" +
        " display:block;" +
        " object-fit:contain;" +
        "}" +
        ".lmp-award-icon--oscar img{height:var(--lmp-h-oscar);}" +
        ".lmp-award-icon--emmy img{height:var(--lmp-h-emmy);}" +
        ".rate--imdb .source--name img{height:var(--lmp-h-imdb);}" +
        ".rate--mc .source--name img{height:var(--lmp-h-mc);}" +
        ".rate--rt .source--name img{height:var(--lmp-h-rt);}" +
        ".rate--popcorn .source--name img{height:var(--lmp-h-popcorn);}" +
        ".rate--tmdb .source--name img{height:var(--lmp-h-tmdb);}" +
        ".rate--awards .source--name img{height:var(--lmp-h-awards);}" +
        ".rate--avg .source--name img{height:var(--lmp-h-avg);}" +
        ".full-start__rate .source--name{" +
        " display:inline-flex;" +
        " align-items:center;" +
        " justify-content:center;" +
        "}" +
        ".full-start__rate .votes-count {" +
        " font-size: 0.7em;" +
        " opacity: 0.8;" +
        " margin-left: 0.3em;" +
        " font-weight: normal;" +
        "}" +
        ".settings-param__descr,.settings-param__subtitle{white-space:pre-line;}" +
        "@media (max-width: 600px){" +
        " .full-start-new__rate-line{flex-wrap:wrap;}" +
        " .full-start__rate{" +
        " margin-right:.25em !important;" +
        " margin-bottom:.25em;" +
        " font-size:16px;" +
        " min-width:unset;" +
        " }" +
        " :root{" +
        " --lmp-h-imdb:14px; --lmp-h-mc:14px; --lmp-h-rt:16px;" +
        " --lmp-h-popcorn:16px; --lmp-h-tmdb:16px; --lmp-h-awards:14px;" +
        " --lmp-h-avg:14px; --lmp-h-oscar:14px; --lmp-h-emmy:16px;" +
        " }" +
        " .loading-dots-container{font-size:.8em; padding:.4em .8em;}" +
        " .lmp-award-icon{height:16px;}" +
        " .full-start__rate .votes-count{font-size:0.6em;}" +
        "}" +
        "@media (max-width: 360px){" +
        " .full-start__rate{font-size:14px;}" +
        " :root{" +
        " --lmp-h-imdb:12px; --lmp-h-mc:12px; --lmp-h-rt:14px;" +
        " --lmp-h-popcorn:14px; --lmp-h-tmdb:14px; --lmp-h-awards:12px;" +
        " --lmp-h-avg:12px; --lmp-h-oscar:12px; --lmp-h-emmy:14px;" +
        " }" +
        " .lmp-award-icon{height:12px;}" +
        " .full-start__rate .votes-count{font-size:0.5em;}" +
        "}" +
        "body.lmp-enh--rate-border .full-start__rate{" +
        " border: 1px solid rgba(255, 255, 255, 0.45);" +
        " border-radius: 0.3em;" +
        " box-sizing: border-box;" +
        "}" +
        "body.lmp-enh--rate-border .full-start-new__rate-line, " +
        "body.lmp-enh--rate-border .full-start__rate-line{" +
        "}" +
        "body.lmp-enh--show-votes .full-start__rate .votes-count { display: inline; }" +
        "body:not(.lmp-enh--show-votes) .full-start__rate .votes-count { display: none; }" +
        "</style>";

    var CACHE_TIME = 3 * 24 * 60 * 60 * 1000; // 3 дні
    // var CACHE_TIME = 60 * 60 * 1000; // ✅ 1 година для перевірок
    var RATING_CACHE_KEY = 'lmp_enh_rating_cache'; // Кеш рейтингів
    var ID_MAPPING_CACHE = 'lmp_rating_id_cache'; // Кеш TMDB -> IMDb ID

    var AGE_RATINGS = {
        'G': '3+',
        'PG': '6+',
        'PG-13': '13+',
        'R': '17+',
        'NC-17': '18+',
        'TV-Y': '0+',
        'TV-Y7': '7+',
        'TV-G': '3+',
        'TV-PG': '6+',
        'TV-14': '14+',
        'TV-MA': '17+'
    };

    var RCFG_DEFAULT = {
        ratings_omdb_key: (LMP_ENH_CONFIG.apiKeys.omdb || ''),
        ratings_mdblist_key: (LMP_ENH_CONFIG.apiKeys.mdblist || ''),
        ratings_bw_logos: false,
        ratings_show_awards: true,
        ratings_show_average: true,
        ratings_logo_offset: 0,
        ratings_font_offset: 0,
        ratings_badge_alpha: 0.15,
        ratings_badge_tone: 0,
        ratings_gap_step: 0,
        // Нові тумблери
        ratings_colorize_all: false,
        ratings_enable_imdb: true,
        ratings_enable_tmdb: true,
        ratings_enable_mc: true,
        ratings_enable_rt: true,
        ratings_enable_popcorn: true,
        ratings_poster_badges: false,
        ratings_rate_border: false,
        ratings_show_votes: true, // ✅ Новий параметр: показувати кількість голосів
    };

    var __lmpRateLineObs = null; // Спостерігач за DOM (для лоадера)
    var currentRatingsData = null; // Кеш рейтингів для поточної картки
    var __lmpLastReqToken = null; // Токен останнього запиту (для уникнення гонки)

    function getCardType(card) {
        var type = card.media_type || card.type;
        if (type === 'movie' || type === 'tv') return type;
        return card.name || card.original_name ? 'tv' : 'movie';
    }

    (function() {
        try {
            var kpCss = '<style>.full-start__rate.rate--kp, .rate--kp{display:none!important;}</style>';
            Lampa.Template.add('lmp_hide_kp', kpCss);
            $('body').append(Lampa.Template.get('lmp_hide_kp', {}, true));
        } catch (e) {}
    })();

    function getRatingClass(rating) {
        var r = parseFloat(rating);
        if (isNaN(r)) return 'rating--red';
        if (r >= 8.0) return 'rating--green'; // ≥ 8.0
        if (r >= 6.0) return 'rating--blue'; // 6.0–7.9
        if (r >= 4.0) return 'rating--orange'; // 4.0–5.9
        return 'rating--red'; // < 4.0
    }

    function posterCacheKeyForCard(card) {
        return 'poster_' + (card.type || getCardType(card)) + '_' + (card.imdb_id || card.id);
    }

    function lmpRawVal(it) {
        if (!it || typeof it !== 'object') return null;
        var v = it.value;
        if (v == null) v = it.score;
        i
