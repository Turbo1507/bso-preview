/* BSO v2 — строки новых блоков (блок 3 «Виллы в комплексе будущего» и FAQ).
   Мержится в window.I18N между ../js/i18n.js и ../js/main.js, поэтому базовый
   словарь не трогаем — v1 и v2 живут на одном i18n.js без расхождений.

   EN для карточек 1, 2 и 4 взят из уже вычитанного словаря v1 (он, в свою
   очередь, снят с ENG-фреймов Figma) — не переведён заново. Собственный EN
   пришлось написать только там, где текст макета «бсо2» расходится с v1:
   заголовок блока, вводные абзацы, карточка «6-метровые потолки» и весь FAQ —
   в макете это RU-only, английской версии там нет. */
(function () {
  var ru = {
    "priv.photo_title": "Свой забор, сад и бассейн — у каждой виллы",

    "stepsSticky.lead": "От выбора юнита до ключей — пять шагов, каждый закреплён договором.",

    "gallery.alt7": "Обеденная зона виллы вечером",
    "gallery.alt8": "Интерьер с фактурной стеной во всю высоту",
    "gallery.alt9": "Гостиная за прозрачными шторами в пол",
    "gallery.alt10": "Спальня с рабочим уголком у кровати",
    "gallery.alt11": "Душевая, отделанная терраццо",
    "gallery.alt12": "Студия с кроватью лицом в сад",

    "gallery.title": "Галерея проекта",
    "gallery.alt1": "Клубный корпус комплекса среди пальм",
    "gallery.alt2": "Гостиная виллы в вечернем свете",
    "gallery.alt3": "Гостиная под шестиметровым скатным потолком",
    "gallery.alt4": "Спальня с выходом в приватный сад",
    "gallery.alt5": "Раковина из травертина у зелёной стены",
    "gallery.alt6": "Спальня пентхауса с панорамным видом",

    "villas.card1.alt": "Приватный двор с деревом за перфорированным терракотовым экраном",
    "villas.card2.alt": "Спальня в мягкой тени солнцезащитных панелей",
    "villas.card3.alt": "Обеденная зона под шестиметровым потолком с плетёными светильниками",
    "villas.card4.alt": "Терракотовые объёмы виллы среди пальм в сумерках",

    "nav.faq": "Вопросы",

    "villas.title": "Виллы в комплексе будущего это:",
    "villas.p1": "Black Sands Oasis находится в Nuanu, кластере на берегу океана с единым архитектурным планом и собственной инфраструктурой. Это локация, где удобно жить самому и куда охотно возвращаются гости, потому что рядом есть всё нужное и при этом сохраняется ощущение тишины.",
    "villas.p2": "Сами виллы сделаны как комфортное пространство для жизни и аренды. Большие окна в пол, натуральные материалы, спокойные природные оттенки и приватные дворы создают ощущение уединения и качества.",
    "villas.card1.t": "Приватность в личном мини-оазисе",
    "villas.card1.p": "Свой сад и бассейн позволяют в любой момент уединиться на приватной территории и почувствовать себя дома: в комфорте и безопасности",
    "villas.card2.t": "Ощущение прохлады в жарком климате",
    "villas.card2.p": "Продуманная вентиляция, тени, сценарии освещения и материалы — внутри виллы каждая деталь работает на ваш комфорт",
    "villas.card3.t": "6-метровые потолки",
    "villas.card3.p": "Много света и воздуха",
    "villas.card4.t": "Путешествие в Desert Modernism",
    "villas.card4.p": "Терракотовые перфорированные панели, натуральный камень и терраццо в мокрых зонах в сочетании с песочно-карамельной палитрой помогают виллам мягко слиться с ландшафтом",

    "faq.title": "Ответы на вопросы",
    "faq.q1": "Где находится проект",
    "faq.a1": "Black Sands Oasis строится внутри кластера Nuanu на западном побережье Бали — 45 гектаров у океана с единым мастер-планом и городской инфраструктурой. От комплекса 3 минуты до океана, 20 минут до Чангу и около часа до аэропорта Нгурах-Рай.",
    "faq.q2": "Что такое Nuanu и почему это важно",
    "faq.a2": "Nuanu — город будущего у океана: школы и сады, арт-объекты и мастер-классы, спа-комплекс, ботанические пространства, рестораны. Для владельца это готовая среда вокруг дома, а для инвестора — ограниченное предложение внутри растущей локации, что поддерживает и стоимость виллы, и её загрузку в аренде.",
    "faq.q3": "В каком стиле выполнены виллы",
    "faq.a3": "Desert Modernism: терракотовые перфорированные панели, натуральный камень, терраццо в мокрых зонах и песочно-карамельная палитра, за счёт которой архитектура мягко ложится в ландшафт. Потолки 6 метров, большие окна в пол, собственный сад и бассейн у каждой виллы.",
    "faq.q4": "Какие гарантии для инвестора",
    "faq.a4": "Полный возврат всех внесённых платежей, если не получена лицензия PBG. Гарантия 25 лет на конструктив, 5 лет на внутренние инженерные сети и 1 год на отделку и технику. Leasehold 35 лет плюс гарантированное продление на 20 лет.",
    "faq.q5": "Как устроена покупка и оплата",
    "faq.a5": "Депозит бронирования — $1 500 (условно невозвратный): он закрепляет юнит и фиксирует цену на 14 дней. Далее 30% после подписания договоров и платежи по этапам стройки. Старт строительства — февраль 2026, срок — 24 месяца по договору: передача студий в апреле 2028, вилл — в октябре 2028."
  };

  var en = {
    "priv.photo_title": "Your own fence, garden and pool — with every villa",

    "stepsSticky.lead": "From choosing a unit to the keys — five steps, each fixed in the contract.",

    "gallery.alt7": "Dining area of a villa after dark",
    "gallery.alt8": "Interior with a full-height textured wall",
    "gallery.alt9": "Living room behind sheer floor-to-ceiling curtains",
    "gallery.alt10": "Bedroom with a bedside working corner",
    "gallery.alt11": "Shower room finished in terrazzo",
    "gallery.alt12": "Studio with a bed facing the garden",

    "gallery.title": "Project gallery",
    "gallery.alt1": "Clubhouse of the complex among palms",
    "gallery.alt2": "Villa living room in the evening light",
    "gallery.alt3": "Living room under a pitched six-metre ceiling",
    "gallery.alt4": "Bedroom opening onto a private garden",
    "gallery.alt5": "Travertine washbasin against a planted wall",
    "gallery.alt6": "Penthouse bedroom with a panoramic view",

    "villas.card1.alt": "Private courtyard with a tree behind a perforated terracotta screen",
    "villas.card2.alt": "Bedroom in the soft shade of sun-screening panels",
    "villas.card3.alt": "Dining area under a six-metre ceiling with woven pendant lamps",
    "villas.card4.alt": "Terracotta villa volumes among palms at dusk",

    "nav.faq": "FAQ",

    "villas.title": "Villas in a community of the future:",
    "villas.p1": "Black Sands Oasis sits inside Nuanu, an oceanfront cluster with a single architectural plan and its own infrastructure. It is a place that works both for living and for hosting: everything you need is close by, and the sense of quiet stays intact.",
    "villas.p2": "The villas themselves are built as comfortable space for living and for renting out. Floor-to-ceiling windows, natural materials, calm earthy tones and private courtyards create a feeling of seclusion and quality.",
    "villas.card1.t": "A private mini-oasis",
    "villas.card1.p": "A private garden and pool create a territory of your own — a place to retreat, slow down and feel truly at home, in comfort and safety",
    "villas.card2.t": "A sense of coolness in a hot climate",
    "villas.card2.p": "Thoughtful ventilation, shade, lighting scenarios and materials — inside the villa every detail works for your comfort",
    "villas.card3.t": "Six-meter ceilings",
    "villas.card3.p": "Plenty of light and air",
    "villas.card4.t": "A journey into Desert Modernism",
    "villas.card4.p": "Perforated terracotta panels, natural stone and terrazzo in wet areas, paired with a sandy caramel palette, help the villas blend softly into the surrounding landscape",

    "faq.title": "Frequently asked questions",
    "faq.q1": "Where is the project located",
    "faq.a1": "Black Sands Oasis is being built inside the Nuanu cluster on the west coast of Bali — 45 hectares by the ocean with a single master plan and urban-grade infrastructure. It is 3 minutes to the ocean, 20 minutes to Canggu and about an hour to Ngurah Rai airport.",
    "faq.q2": "What is Nuanu and why it matters",
    "faq.a2": "Nuanu is a city of the future by the ocean: schools and kindergartens, art objects and master classes, a spa complex, botanical spaces and restaurants. For an owner it is a ready-made environment around the house; for an investor it is limited supply inside a growing location, which supports both the value of the villa and its rental occupancy.",
    "faq.q3": "What style are the villas built in",
    "faq.a3": "Desert Modernism: perforated terracotta panels, natural stone, terrazzo in wet areas and a sandy caramel palette that lets the architecture settle softly into the landscape. Six-meter ceilings, floor-to-ceiling windows, a private garden and pool with every villa.",
    "faq.q4": "What guarantees does an investor get",
    "faq.a4": "A full refund of all payments made if the PBG permit is not obtained. A 25-year structural warranty, 5 years on internal engineering systems and 1 year on finishes and appliances. Leasehold of 35 years plus a guaranteed 20-year extension.",
    "faq.q5": "How does the purchase and payment work",
    "faq.a5": "A $1,500 booking deposit (conditionally non-refundable) secures the unit and locks the price for 14 days. Then 30% after signing the agreements and payments tied to construction stages. Construction starts in February 2026 and runs 24 months under the agreement: studios handed over in April 2028, villas in October 2028."
  };

  if (!window.I18N) return;
  Object.assign(window.I18N.ru, ru);
  Object.assign(window.I18N.en, en);
})();
