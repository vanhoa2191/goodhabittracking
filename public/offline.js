// Localizes the offline page. It runs without the network and stores nothing; if it fails,
// the Vietnamese text already in offline.html stays visible.
(function () {
  'use strict';

  var LANGUAGE_KEY = 'kidhabit_language';
  var DEFAULT_LANGUAGE = 'vi';
  var TEXT = {
    vi: { title: 'KidHabit Hero đang ngoại tuyến', heading: 'Bạn đang ngoại tuyến', body: 'Hãy kết nối Internet rồi thử tải lại để nhận dữ liệu mới nhất của gia đình.', retry: 'Thử lại' },
    en: { title: 'KidHabit Hero is offline', heading: 'You are offline', body: 'Connect to the internet and reload to get your family’s latest data.', retry: 'Try again' },
    fr: { title: 'KidHabit Hero est hors ligne', heading: 'Vous êtes hors ligne', body: 'Connectez-vous à Internet puis rechargez la page pour obtenir les dernières données de votre famille.', retry: 'Réessayer' },
    de: { title: 'KidHabit Hero ist offline', heading: 'Du bist offline', body: 'Verbinde dich mit dem Internet und lade die Seite neu, um die neuesten Daten deiner Familie zu erhalten.', retry: 'Erneut versuchen' },
    it: { title: 'KidHabit Hero è offline', heading: 'Sei offline', body: 'Collegati a Internet e ricarica la pagina per ottenere gli ultimi dati della tua famiglia.', retry: 'Riprova' },
    es: { title: 'KidHabit Hero está sin conexión', heading: 'Estás sin conexión', body: 'Conéctate a Internet y vuelve a cargar la página para recibir los datos más recientes de tu familia.', retry: 'Reintentar' },
    zh: { title: 'KidHabit Hero 已离线', heading: '你已离线', body: '请连接互联网后重新加载，以获取家庭的最新数据。', retry: '重试' },
    ja: { title: 'KidHabit Hero はオフラインです', heading: 'オフラインになっています', body: 'インターネットに接続してから、もう一度読み込むと、ご家族の最新のデータが表示されます。', retry: 'もう一度試す' },
    ko: { title: 'KidHabit Hero 오프라인', heading: '오프라인 상태예요', body: '인터넷에 연결한 뒤 다시 불러오면 가족의 최신 데이터를 받을 수 있어요.', retry: '다시 시도' }
  };

  function supported(code) {
    if (typeof code !== 'string') return null;
    var primary = code.trim().toLowerCase().split(/[-_]/)[0];
    return Object.prototype.hasOwnProperty.call(TEXT, primary) ? primary : null;
  }

  function savedLanguage() {
    var prefix = LANGUAGE_KEY + '=';
    try {
      var entries = document.cookie.split(';');
      for (var i = 0; i < entries.length; i += 1) {
        var entry = entries[i].trim();
        if (entry.indexOf(prefix) === 0) {
          var fromCookie = supported(entry.slice(prefix.length));
          if (fromCookie) return fromCookie;
        }
      }
    } catch { /* cookies unavailable */ }
    try {
      var fromStorage = supported(localStorage.getItem(LANGUAGE_KEY));
      if (fromStorage) return fromStorage;
    } catch { /* storage unavailable */ }
    return null;
  }

  function browserLanguage() {
    var preferred = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language]);
    for (var i = 0; i < preferred.length; i += 1) {
      var match = supported(preferred[i]);
      if (match) return match;
    }
    return null;
  }

  function setText(id, value) {
    var element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  try {
    var language = savedLanguage() || browserLanguage() || DEFAULT_LANGUAGE;
    var text = TEXT[language];
    document.documentElement.lang = language;
    document.title = text.title;
    setText('offline-heading', text.heading);
    setText('offline-body', text.body);
    setText('offline-retry', text.retry);
  } catch { /* keep the Vietnamese text */ }

  var form = document.getElementById('offline-form');
  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      location.reload();
    });
  }
})();
