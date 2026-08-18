/* Юридические страницы v2 (consent.html, legal-info.html) — RU/EN.
   Отдельный маленький словарь, а не общий js/i18n.js: тот в setLang() ещё и
   переписывает <title>/og-теги главной и дёргает синхронизацию планировок с
   пинами Nuanu — на юрстранице это только навредило бы.
   Язык берём из того же localStorage-ключа bso_lang, что пишет главная, —
   значит открытая с EN-версии страница откроется на английском. По умолчанию
   EN, как и основной сайт. */
(function () {
  var DICT = {
    ru: {
      "legal.back": "← Вернуться на сайт Black Sands Oasis",
      "consent.title": "Согласие на обработку персональных данных — Black Sands Oasis",
      "consent.h1": "Согласие на обработку персональных данных",
      "consent.intro": "Оставляя заявку на сайте, в мессенджере или на личной консультации, вы даёте согласие PT. UNIT NUANU PROPERTY (Jl Pantai Nyanyi No. 88, Beraban, Tabanan, Bali 80351, Indonesia) на обработку своих персональных данных на условиях, изложенных ниже.",
      "consent.h2_what": "Какие данные обрабатываются",
      "consent.what1": "Имя и контактные данные: телефон, мессенджер (WhatsApp/Telegram), email",
      "consent.what2": "Содержание обращения и запрошенные материалы (презентация, финансовая модель, планировки)",
      "consent.what3": "Технические данные браузера/устройства при посещении сайта (для аналитики, без прямой идентификации личности)",
      "consent.h2_why": "Цели обработки",
      "consent.why1": "Обработка заявки и обратная связь по проекту Black Sands Oasis",
      "consent.why2": "Проведение консультаций, подбор юнита, отправка индивидуального предложения",
      "consent.why3": "Коммуникация по статусу сделки и объекта",
      "consent.why4": "Улучшение сайта и сервиса",
      "consent.h2_basis": "Правовое основание",
      "consent.basis": "Обработка осуществляется на основании вашего согласия и в объёме, необходимом для заключения и исполнения договора, в соответствии с Законом Республики Индонезия № 27 от 2022 года «О защите персональных данных» (UU No. 27/2022 tentang Pelindungan Data Pribadi).",
      "consent.h2_safety": "Защита данных",
      "consent.safety": "Данные хранятся в защищённых информационных системах с ограниченным доступом сотрудников по принципу необходимой достаточности. Компания применяет организационные и технические меры защиты, соразмерные характеру обрабатываемых данных.",
      "consent.h2_third": "Передача третьим лицам",
      "consent.third": "Компания не продаёт персональные данные третьим лицам. Подрядчики и партнёры, привлекаемые для обработки заявок (например, платёжные и коммуникационные сервисы), получают доступ только к данным, необходимым для выполнения своей задачи.",
      "consent.h2_rights": "Ваши права",
      "consent.right1": "Запросить доступ к своим данным",
      "consent.right2": "Потребовать исправления неточных данных",
      "consent.right3": "Потребовать удаления данных",
      "consent.right4": "Ограничить обработку",
      "consent.right5": "Отозвать согласие в любой момент — это не влияет на законность обработки до отзыва",
      "consent.h2_operator": "Оператор данных",
      "consent.note": "Для отзыва согласия или вопросов по обработке данных — свяжитесь с нами через форму на сайте.",
      "legal.title": "Юридическая информация — Black Sands Oasis",
      "legal.h1": "Юридическая информация",
      "legal.h2_company": "Реквизиты компании",
      "legal.company1": "PT. UNIT NUANU PROPERTY — компания с ограниченной ответственностью, учреждённая и действующая по законодательству Республики Индонезия.",
      "legal.company2": "Юридический адрес: Jl Pantai Nyanyi No. 88, Beraban, Tabanan, Bali 80351, Indonesia.",
      "legal.h2_activity": "Деятельность",
      "legal.activity": "Компания специализируется на девелопменте жилой и коммерческой недвижимости на Бали: проектирование, строительство и меблировка объектов, включая бренд UNIT.FURNITURE. Проект Black Sands Oasis реализуется в кластере Nuanu на земле, предоставленной по договору с Wooden Fish Village (Nuanu).",
      "legal.h2_materials": "Статус материалов сайта",
      "legal.mat1": "Все материалы на сайте (тексты, визуализации, рендеры, планировки, расчёты доходности) носят исключительно информационный характер и не являются публичной офертой.",
      "legal.mat2": "Визуализации могут отличаться от итогового результата строительства.",
      "legal.mat3": "Точные характеристики юнита, сроки и условия сделки фиксируются в договоре бронирования/купли-продажи, заключаемом индивидуально.",
      "legal.mat4": "Указанные на сайте цены — ориентировочные (prelaunch), в долларах США для справки; валюта расчётов фиксируется договором.",
      "legal.h2_ip": "Интеллектуальная собственность",
      "legal.ip": "Товарные знаки UNIT и UNIT.FURNITURE, структура сайта, тексты, фотографии и визуализации являются интеллектуальной собственностью компании либо используются на основании соответствующих прав/разрешений. Копирование и использование без согласия компании не допускается.",
      "legal.h2_pd": "Обработка персональных данных",
      "legal.pd_before": "Условия обработки персональных данных посетителей сайта и клиентов описаны отдельно — см. ",
      "legal.pd_link": "Согласие на обработку персональных данных",
      "legal.h2_contacts": "Контакты",
      "legal.contacts": "По юридическим вопросам и вопросам партнёрства: через форму на сайте или менеджера, указанного при обращении."
    },

    en: {
      "legal.back": "← Back to the Black Sands Oasis site",
      "consent.title": "Personal Data Consent — Black Sands Oasis",
      "consent.h1": "Personal Data Consent",
      "consent.intro": "By submitting a request on the site, in a messenger or at a personal consultation, you consent to PT. UNIT NUANU PROPERTY (Jl Pantai Nyanyi No. 88, Beraban, Tabanan, Bali 80351, Indonesia) processing your personal data on the terms set out below.",
      "consent.h2_what": "What data is processed",
      "consent.what1": "Name and contact details: phone, messenger (WhatsApp/Telegram), email",
      "consent.what2": "The content of your request and the materials you asked for (presentation, financial model, floor plans)",
      "consent.what3": "Technical browser/device data collected during your visit (for analytics, without direct identification)",
      "consent.h2_why": "Purposes of processing",
      "consent.why1": "Handling your request and getting back to you about the Black Sands Oasis project",
      "consent.why2": "Running consultations, selecting a unit, sending an individual offer",
      "consent.why3": "Communication about the status of the deal and the property",
      "consent.why4": "Improving the site and the service",
      "consent.h2_basis": "Legal basis",
      "consent.basis": "Processing is carried out on the basis of your consent and to the extent required to conclude and perform the contract, in accordance with Law of the Republic of Indonesia No. 27 of 2022 on Personal Data Protection (UU No. 27/2022 tentang Pelindungan Data Pribadi).",
      "consent.h2_safety": "Data protection",
      "consent.safety": "Data is stored in secured information systems with employee access limited on a need-to-know basis. The company applies organisational and technical safeguards proportionate to the nature of the data processed.",
      "consent.h2_third": "Transfer to third parties",
      "consent.third": "The company does not sell personal data to third parties. Contractors and partners engaged to process requests (for example, payment and communication services) are given access only to the data required to perform their task.",
      "consent.h2_rights": "Your rights",
      "consent.right1": "Request access to your data",
      "consent.right2": "Request correction of inaccurate data",
      "consent.right3": "Request deletion of your data",
      "consent.right4": "Restrict processing",
      "consent.right5": "Withdraw consent at any time — this does not affect the lawfulness of processing before the withdrawal",
      "consent.h2_operator": "Data controller",
      "consent.note": "To withdraw your consent or ask a question about data processing, contact us through the form on the site.",
      "legal.title": "Company Legal Information — Black Sands Oasis",
      "legal.h1": "Company Legal Information",
      "legal.h2_company": "Company details",
      "legal.company1": "PT. UNIT NUANU PROPERTY is a limited liability company incorporated and operating under the laws of the Republic of Indonesia.",
      "legal.company2": "Registered address: Jl Pantai Nyanyi No. 88, Beraban, Tabanan, Bali 80351, Indonesia.",
      "legal.h2_activity": "Activities",
      "legal.activity": "The company develops residential and commercial real estate in Bali: design, construction and furnishing of properties, including the UNIT.FURNITURE brand. Black Sands Oasis is being delivered inside the Nuanu cluster on land provided under an agreement with Wooden Fish Village (Nuanu).",
      "legal.h2_materials": "Status of the site materials",
      "legal.mat1": "All materials on the site (texts, visualisations, renders, floor plans, yield calculations) are for information only and do not constitute a public offer.",
      "legal.mat2": "Visualisations may differ from the final built result.",
      "legal.mat3": "The exact characteristics of a unit, timelines and terms of the deal are fixed in the reservation / purchase agreement concluded individually.",
      "legal.mat4": "Prices shown on the site are indicative (prelaunch) and quoted in US dollars for reference; the settlement currency is fixed in the contract.",
      "legal.h2_ip": "Intellectual property",
      "legal.ip": "The UNIT and UNIT.FURNITURE trademarks, the structure of the site, texts, photographs and visualisations are the intellectual property of the company or are used under the relevant rights/permissions. Copying and use without the company’s consent is not permitted.",
      "legal.h2_pd": "Personal data processing",
      "legal.pd_before": "The terms on which the personal data of site visitors and clients is processed are described separately — see ",
      "legal.pd_link": "Personal Data Consent",
      "legal.h2_contacts": "Contacts",
      "legal.contacts": "For legal and partnership enquiries: through the form on the site or the manager handling your request."
    }
  };

  var TITLE_KEY = document.documentElement.getAttribute('data-title-key');

  function apply(lang) {
    var dict = DICT[lang] || DICT.en;
    document.documentElement.lang = lang;
    if (TITLE_KEY && dict[TITLE_KEY]) document.title = dict[TITLE_KEY];
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (dict[k] != null) el.textContent = dict[k];
    });
    document.querySelectorAll('[data-lang]').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.lang === lang);
    });
    try { localStorage.setItem('bso_lang', lang); } catch (e) {}
  }

  var saved = 'en';
  try { saved = localStorage.getItem('bso_lang') || 'en'; } catch (e) {}
  apply(saved === 'ru' ? 'ru' : 'en');

  document.querySelectorAll('[data-lang]').forEach(function (b) {
    b.addEventListener('click', function () { apply(b.dataset.lang); });
  });
})();
