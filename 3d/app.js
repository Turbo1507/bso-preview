import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { computeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
// лучи по слитой сцене (сотни тысяч треугольников) идут через BVH, иначе метки и выбор виллы тормозят
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { HL, maquette, buildEarthChunk, plinthTop, trimToOutline, footprint } from './maquette.js?v=20261023b';

const q = new URLSearchParams(location.search);
const MODEL = new URL('model.glb?v=20261023b', import.meta.url).href;
// у языковых страниц <base href="/">, так что assets/ всегда от корня сайта
const SITE = '';

/* ---------- тексты: язык страницы, 9 языков сайта ---------- */
const VIEWS = (garden, ocean, palms, volcano, river) => ({ 'GARDEN': garden, 'OCEAN': ocean, 'PALMS+OCEAN': palms, 'VOLCANO VIEW': volcano, 'OCEAN VIEW': ocean, 'RIVER': river });
const T = {
  en: {
    all: 'All villas', avail: 'Available only', reset: 'Full view', studios: 'Studios',
    st: { early: 'Available', prebooked: 'Reserved', booked: 'Sold' },
    stLegend: { early: 'Available', prebooked: 'Reserved', booked: 'Sold' },
    villa: n => `Villa ${n}`, studio: n => `Studio ${n}`, penthouse: n => `Penthouse ${n}`,
    area: 'Size', price: 'From', sold: 'Sold', m2: 'm²',
    bookV: n => `Reserve villa ${n}`, bookS: n => `Reserve studio ${n}`, bookP: n => `Reserve penthouse ${n}`,
    similar: 'Find a similar villa', plan: 'View floor plan', studioTitle: 'Studios and penthouses',
    studioLead: 'Building at the entrance, 4 floors', floor: f => f === 4 ? 'Penthouses, 4th floor' : ['', '1st floor', '2nd floor', '3rd floor'][f],
    back: 'All studios', close: 'Close', prev: 'Previous photo', next: 'Next photo',
    noGL: 'This browser does not support 3D. Open the page in an up-to-date Chrome, Safari or Firefox.', loadErr: 'The model failed to load.', retry: 'Try again',
    types: { studio: 'Studio', '1bd': 'One-bedroom villa', '1bdsky': '1BD SKY villa with a roof terrace', '2bd': 'Two-bedroom villa', '3bd': 'Three-bedroom villa', '3bdsky': '3BD SKY villa with a roof terrace', '4bd': 'Four-bedroom villa', '4bdsky': 'Four-bedroom villa with a roof terrace', penthouse: 'Penthouse' },
    views: VIEWS('garden view', 'ocean view', 'palm and ocean view', 'volcano view', 'by the river'),
  },
  ru: {
    all: 'Все виллы', avail: 'Только свободные', reset: 'Общий вид', studios: 'Студии',
    st: { early: 'Свободна', prebooked: 'Бронь', booked: 'Продана' },
    stLegend: { early: 'Свободна', prebooked: 'Забронирована', booked: 'Продана' },
    villa: n => `Вилла ${n}`, studio: n => `Студия ${n}`, penthouse: n => `Пентхаус ${n}`,
    area: 'Площадь', price: 'Цена от', sold: 'Продана', m2: 'м²',
    bookV: n => `Забронировать виллу ${n}`, bookS: n => `Забронировать студию ${n}`, bookP: n => `Забронировать пентхаус ${n}`,
    similar: 'Подобрать похожую виллу', plan: 'Смотреть планировку', studioTitle: 'Студии и пентхаусы',
    studioLead: 'Корпус у входа в комплекс, 4 этажа', floor: f => f === 4 ? 'Пентхаусы, 4 этаж' : `${f} этаж`,
    back: 'Ко всем студиям', close: 'Закрыть', prev: 'Предыдущее фото', next: 'Следующее фото',
    noGL: 'Браузер не поддерживает 3D. Откройте страницу в Chrome, Safari или Firefox последней версии.', loadErr: 'Не удалось загрузить модель.', retry: 'Повторить',
    types: { studio: 'Студия', '1bd': 'Вилла с одной спальней', '1bdsky': 'Вилла 1BD SKY с террасой на крыше', '2bd': 'Вилла с двумя спальнями', '3bd': 'Вилла с тремя спальнями', '3bdsky': 'Вилла 3BD SKY с террасой на крыше', '4bd': 'Вилла с четырьмя спальнями', '4bdsky': 'Вилла с четырьмя спальнями и террасой на крыше', penthouse: 'Пентхаус' },
    views: VIEWS('вид на сад', 'вид на океан', 'вид на пальмы и океан', 'вид на вулкан', 'у реки'),
  },
  id: {
    all: 'Semua vila', avail: 'Hanya yang tersedia', reset: 'Tampilan penuh', studios: 'Studio',
    st: { early: 'Tersedia', prebooked: 'Dipesan', booked: 'Terjual' },
    stLegend: { early: 'Tersedia', prebooked: 'Dipesan', booked: 'Terjual' },
    villa: n => `Vila ${n}`, studio: n => `Studio ${n}`, penthouse: n => `Penthouse ${n}`,
    area: 'Luas', price: 'Mulai dari', sold: 'Terjual', m2: 'm²',
    bookV: n => `Pesan vila ${n}`, bookS: n => `Pesan studio ${n}`, bookP: n => `Pesan penthouse ${n}`,
    similar: 'Cari vila serupa', plan: 'Lihat denah', studioTitle: 'Studio dan penthouse',
    studioLead: 'Gedung di pintu masuk, 4 lantai', floor: f => f === 4 ? 'Penthouse, lantai 4' : `Lantai ${f}`,
    back: 'Semua studio', close: 'Tutup', prev: 'Foto sebelumnya', next: 'Foto berikutnya',
    noGL: 'Browser ini tidak mendukung 3D. Buka halaman di Chrome, Safari, atau Firefox versi terbaru.', loadErr: 'Model gagal dimuat.', retry: 'Coba lagi',
    types: { studio: 'Studio', '1bd': 'Vila satu kamar tidur', '1bdsky': 'Vila 1BD SKY dengan teras atap', '2bd': 'Vila dua kamar tidur', '3bd': 'Vila tiga kamar tidur', '3bdsky': 'Vila 3BD SKY dengan teras atap', '4bd': 'Vila empat kamar tidur', '4bdsky': 'Vila empat kamar tidur dengan teras atap', penthouse: 'Penthouse' },
    views: VIEWS('pemandangan taman', 'pemandangan laut', 'pemandangan pohon palem dan laut', 'pemandangan gunung berapi', 'di tepi sungai'),
  },
  fr: {
    all: 'Toutes les villas', avail: 'Disponibles uniquement', reset: 'Vue d’ensemble', studios: 'Studios',
    st: { early: 'Disponible', prebooked: 'Réservée', booked: 'Vendue' },
    stLegend: { early: 'Disponible', prebooked: 'Réservée', booked: 'Vendue' },
    villa: n => `Villa ${n}`, studio: n => `Studio ${n}`, penthouse: n => `Penthouse ${n}`,
    area: 'Surface', price: 'À partir de', sold: 'Vendue', m2: 'm²',
    bookV: n => `Réserver la villa ${n}`, bookS: n => `Réserver le studio ${n}`, bookP: n => `Réserver le penthouse ${n}`,
    similar: 'Trouver une villa similaire', plan: 'Voir le plan', studioTitle: 'Studios et penthouses',
    studioLead: 'Bâtiment à l’entrée, 4 étages', floor: f => f === 4 ? 'Penthouses, 4e étage' : f === 1 ? '1er étage' : `${f}e étage`,
    back: 'Tous les studios', close: 'Fermer', prev: 'Photo précédente', next: 'Photo suivante',
    noGL: 'Ce navigateur ne prend pas en charge la 3D. Ouvrez la page dans une version récente de Chrome, Safari ou Firefox.', loadErr: 'Le modèle n’a pas pu être chargé.', retry: 'Réessayer',
    types: { studio: 'Studio', '1bd': 'Villa une chambre', '1bdsky': 'Villa 1BD SKY avec toit-terrasse', '2bd': 'Villa deux chambres', '3bd': 'Villa trois chambres', '3bdsky': 'Villa 3BD SKY avec toit-terrasse', '4bd': 'Villa quatre chambres', '4bdsky': 'Villa quatre chambres avec toit-terrasse', penthouse: 'Penthouse' },
    views: VIEWS('vue jardin', 'vue mer', 'vue palmiers et mer', 'vue volcan', 'au bord de la rivière'),
  },
  es: {
    all: 'Todas las villas', avail: 'Solo disponibles', reset: 'Vista general', studios: 'Estudios',
    st: { early: 'Disponible', prebooked: 'Reservada', booked: 'Vendida' },
    stLegend: { early: 'Disponible', prebooked: 'Reservada', booked: 'Vendida' },
    villa: n => `Villa ${n}`, studio: n => `Estudio ${n}`, penthouse: n => `Penthouse ${n}`,
    area: 'Superficie', price: 'Desde', sold: 'Vendida', m2: 'm²',
    bookV: n => `Reservar la villa ${n}`, bookS: n => `Reservar el estudio ${n}`, bookP: n => `Reservar el penthouse ${n}`,
    similar: 'Buscar una villa similar', plan: 'Ver plano', studioTitle: 'Estudios y penthouses',
    studioLead: 'Edificio en la entrada, 4 plantas', floor: f => f === 4 ? 'Penthouses, 4.ª planta' : `${f}.ª planta`,
    back: 'Todos los estudios', close: 'Cerrar', prev: 'Foto anterior', next: 'Foto siguiente',
    noGL: 'Este navegador no admite 3D. Abre la página en una versión actual de Chrome, Safari o Firefox.', loadErr: 'No se pudo cargar el modelo.', retry: 'Reintentar',
    types: { studio: 'Estudio', '1bd': 'Villa de un dormitorio', '1bdsky': 'Villa 1BD SKY con terraza en la azotea', '2bd': 'Villa de dos dormitorios', '3bd': 'Villa de tres dormitorios', '3bdsky': 'Villa 3BD SKY con terraza en la azotea', '4bd': 'Villa de cuatro dormitorios', '4bdsky': 'Villa de cuatro dormitorios con terraza en la azotea', penthouse: 'Penthouse' },
    views: VIEWS('vista al jardín', 'vista al mar', 'vista a las palmeras y al mar', 'vista al volcán', 'junto al río'),
  },
  uk: {
    all: 'Усі вілли', avail: 'Лише вільні', reset: 'Загальний вигляд', studios: 'Студії',
    st: { early: 'Вільна', prebooked: 'Бронь', booked: 'Продана' },
    stLegend: { early: 'Вільна', prebooked: 'Заброньована', booked: 'Продана' },
    villa: n => `Вілла ${n}`, studio: n => `Студія ${n}`, penthouse: n => `Пентхаус ${n}`,
    area: 'Площа', price: 'Ціна від', sold: 'Продана', m2: 'м²',
    bookV: n => `Забронювати віллу ${n}`, bookS: n => `Забронювати студію ${n}`, bookP: n => `Забронювати пентхаус ${n}`,
    similar: 'Підібрати схожу віллу', plan: 'Дивитися планування', studioTitle: 'Студії та пентхауси',
    studioLead: 'Корпус біля входу в комплекс, 4 поверхи', floor: f => f === 4 ? 'Пентхауси, 4 поверх' : `${f} поверх`,
    back: 'До всіх студій', close: 'Закрити', prev: 'Попереднє фото', next: 'Наступне фото',
    noGL: 'Браузер не підтримує 3D. Відкрийте сторінку в Chrome, Safari або Firefox останньої версії.', loadErr: 'Не вдалося завантажити модель.', retry: 'Повторити',
    types: { studio: 'Студія', '1bd': 'Вілла з однією спальнею', '1bdsky': 'Вілла 1BD SKY з терасою на даху', '2bd': 'Вілла з двома спальнями', '3bd': 'Вілла з трьома спальнями', '3bdsky': 'Вілла 3BD SKY з терасою на даху', '4bd': 'Вілла з чотирма спальнями', '4bdsky': 'Вілла з чотирма спальнями і терасою на даху', penthouse: 'Пентхаус' },
    views: VIEWS('вид на сад', 'вид на океан', 'вид на пальми та океан', 'вид на вулкан', 'біля річки'),
  },
  it: {
    all: 'Tutte le ville', avail: 'Solo disponibili', reset: 'Vista d’insieme', studios: 'Studio',
    st: { early: 'Disponibile', prebooked: 'Prenotata', booked: 'Venduta' },
    stLegend: { early: 'Disponibile', prebooked: 'Prenotata', booked: 'Venduta' },
    villa: n => `Villa ${n}`, studio: n => `Studio ${n}`, penthouse: n => `Penthouse ${n}`,
    area: 'Superficie', price: 'Da', sold: 'Venduta', m2: 'm²',
    bookV: n => `Prenota la villa ${n}`, bookS: n => `Prenota lo studio ${n}`, bookP: n => `Prenota il penthouse ${n}`,
    similar: 'Trova una villa simile', plan: 'Vedi la planimetria', studioTitle: 'Studio e penthouse',
    studioLead: 'Edificio all’ingresso, 4 piani', floor: f => f === 4 ? 'Penthouse, 4° piano' : `${f}° piano`,
    back: 'Tutti gli studio', close: 'Chiudi', prev: 'Foto precedente', next: 'Foto successiva',
    noGL: 'Questo browser non supporta il 3D. Apri la pagina in una versione aggiornata di Chrome, Safari o Firefox.', loadErr: 'Impossibile caricare il modello.', retry: 'Riprova',
    types: { studio: 'Studio', '1bd': 'Villa con una camera da letto', '1bdsky': 'Villa 1BD SKY con terrazza sul tetto', '2bd': 'Villa con due camere da letto', '3bd': 'Villa con tre camere da letto', '3bdsky': 'Villa 3BD SKY con terrazza sul tetto', '4bd': 'Villa con quattro camere da letto', '4bdsky': 'Villa con quattro camere da letto e terrazza sul tetto', penthouse: 'Penthouse' },
    views: VIEWS('vista giardino', 'vista oceano', 'vista palme e oceano', 'vista vulcano', 'sul fiume'),
  },
  tr: {
    all: 'Tüm villalar', avail: 'Yalnızca müsait', reset: 'Genel görünüm', studios: 'Stüdyolar',
    st: { early: 'Müsait', prebooked: 'Rezerve', booked: 'Satıldı' },
    stLegend: { early: 'Müsait', prebooked: 'Rezerve', booked: 'Satıldı' },
    villa: n => `Villa ${n}`, studio: n => `Stüdyo ${n}`, penthouse: n => `Penthouse ${n}`,
    area: 'Alan', price: 'Başlangıç', sold: 'Satıldı', m2: 'm²',
    bookV: n => `Villa ${n} için rezervasyon yap`, bookS: n => `Stüdyo ${n} için rezervasyon yap`, bookP: n => `Penthouse ${n} için rezervasyon yap`,
    similar: 'Benzer bir villa bul', plan: 'Kat planını gör', studioTitle: 'Stüdyolar ve penthouse’lar',
    studioLead: 'Girişteki bina, 4 kat', floor: f => f === 4 ? 'Penthouse’lar, 4. kat' : `${f}. kat`,
    back: 'Tüm stüdyolar', close: 'Kapat', prev: 'Önceki fotoğraf', next: 'Sonraki fotoğraf',
    noGL: 'Bu tarayıcı 3D’yi desteklemiyor. Sayfayı Chrome, Safari veya Firefox’un güncel sürümünde açın.', loadErr: 'Model yüklenemedi.', retry: 'Tekrar dene',
    types: { studio: 'Stüdyo', '1bd': 'Tek yatak odalı villa', '1bdsky': 'Çatı teraslı 1BD SKY villa', '2bd': 'İki yatak odalı villa', '3bd': 'Üç yatak odalı villa', '3bdsky': 'Çatı teraslı 3BD SKY villa', '4bd': 'Dört yatak odalı villa', '4bdsky': 'Çatı teraslı dört yatak odalı villa', penthouse: 'Penthouse' },
    views: VIEWS('bahçe manzaralı', 'okyanus manzaralı', 'palmiye ve okyanus manzaralı', 'yanardağ manzaralı', 'nehir kenarında'),
  },
  nl: {
    all: 'Alle villa’s', avail: 'Alleen beschikbaar', reset: 'Totaaloverzicht', studios: 'Studio’s',
    st: { early: 'Beschikbaar', prebooked: 'Gereserveerd', booked: 'Verkocht' },
    stLegend: { early: 'Beschikbaar', prebooked: 'Gereserveerd', booked: 'Verkocht' },
    villa: n => `Villa ${n}`, studio: n => `Studio ${n}`, penthouse: n => `Penthouse ${n}`,
    area: 'Oppervlakte', price: 'Vanaf', sold: 'Verkocht', m2: 'm²',
    bookV: n => `Villa ${n} reserveren`, bookS: n => `Studio ${n} reserveren`, bookP: n => `Penthouse ${n} reserveren`,
    similar: 'Vind een vergelijkbare villa', plan: 'Plattegrond bekijken', studioTitle: 'Studio’s en penthouses',
    studioLead: 'Gebouw bij de ingang, 4 verdiepingen', floor: f => f === 4 ? 'Penthouses, 4e verdieping' : `${f}e verdieping`,
    back: 'Alle studio’s', close: 'Sluiten', prev: 'Vorige foto', next: 'Volgende foto',
    noGL: 'Deze browser ondersteunt geen 3D. Open de pagina in een recente versie van Chrome, Safari of Firefox.', loadErr: 'Het model kon niet worden geladen.', retry: 'Opnieuw proberen',
    types: { studio: 'Studio', '1bd': 'Villa met één slaapkamer', '1bdsky': '1BD SKY-villa met dakterras', '2bd': 'Villa met twee slaapkamers', '3bd': 'Villa met drie slaapkamers', '3bdsky': '3BD SKY-villa met dakterras', '4bd': 'Villa met vier slaapkamers', '4bdsky': 'Villa met vier slaapkamers en dakterras', penthouse: 'Penthouse' },
    views: VIEWS('uitzicht op de tuin', 'uitzicht op de oceaan', 'uitzicht op palmen en oceaan', 'uitzicht op de vulkaan', 'aan de rivier'),
  },
};
const pageLang = () => { const l = window.__bsoLang || document.documentElement.lang || 'en'; return T[l] ? l : 'en'; };
let lang = pageLang();

/* ---------- данные ---------- */
const STATUS = s => (s === 'presale' ? 'early' : s);
const UNITS = Object.fromEntries(BSO_UNITS.map(u => [u.n, { ...u, st: STATUS(u.st) }]));
const TYPES = [
  { k: 'studio', re: /^(STUDIO|PENTHOUSE)/ },
  { k: '1bd', label: '1BD', re: /^1BD$/ },
  { k: '1bdsky', label: '1BD SKY', re: /^1BD SKY$/ },
  { k: '2bd', label: '2BD', re: /^2BD$/ },
  { k: '3bd', label: '3BD', re: /^3BD$/ },
  { k: '3bdsky', label: '3BD SKY', re: /^3BD SKY$/ },
  { k: '4bd', label: '4BD', re: /^4BD/ },
];
const typeKey = t => (TYPES.find(x => x.re.test(t)) || TYPES[0]).k;
const PHOTOS = {
  studio: ['villa-studio-detail1.jpg', 'villa-studio-detail2.jpg', 'villa-studio-detail3.jpg', 'plan-studio.png'],
  '1bd': ['villa-1bd-detail1.jpg', 'villa-1bd-detail2.jpg', 'villa-1bd-detail3.jpg', 'plan-1bd.png'],
  '1bdsky': ['villa-1bdsky-detail1.jpg', 'villa-1bdsky-detail2.jpg', 'villa-1bdsky-detail3.jpg', 'plan-1bdsky-f1.png'],
  '2bd': ['villa-2bd-detail1.jpg', 'villa-2bd-detail2.jpg', 'villa-2bd-detail3.jpg', 'plan-2bd-f1.png'],
  '3bd': ['villa-3bd-detail1.jpg', 'villa-3bd-detail2.jpg', 'villa-3bd-detail3.jpg', 'plan-3bd-f1.png'],
  '3bdsky': ['villa-3bdsky-detail1.jpg', 'villa-3bdsky-detail2.jpg', 'villa-3bdsky-detail3.jpg', 'plan-3bdsky-f1.png'],
  '4bd': ['villa-4bd-detail1.jpg', 'villa-4bd-detail2.jpg', 'villa-4bd-detail3.jpg', 'plan-4bd-f1.png'],
};
// корпус студий: этажи по мастер-плану
const STUDIO_FLOORS = [
  [1, ['1', '2', '3', '4']],
  [2, ['5', '6', '7', '8', '9', '10', '11', '12']],
  [3, ['13', '14', '15', '16', '17', '18', '19', '20']],
  [4, ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8']],
];

const fmtPrice = c => '$' + Math.round(c).toLocaleString('en-US').replace(/,/g, '\u00a0');
const fmtArea = s => String(s).replace('.', lang === 'en' ? '.' : ',') + '\u00a0' + T[lang].m2;

/* ---------- сцена ---------- */
const canvas = document.getElementById('m3dCanvas');
// телефоны: плотность пикселей и тени скромнее, иначе греется и садит батарею
const coarse = matchMedia('(pointer: coarse)').matches;
const wrap = document.getElementById('m3d');
function fail(text, retry) {
  const box = document.getElementById('m3dLoader');
  box.classList.remove('is-done'); box.classList.add('is-error');
  box.innerHTML = `<p>${text}</p>` + (retry ? `<button type="button" class="m3d-reset">${T[lang].retry}</button>` : '');
  if (retry) box.querySelector('button').onclick = () => location.reload();
}
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: !coarse, alpha: true, powerPreference: 'high-performance' }); }
catch (e) { fail(T[lang].noGL); throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, coarse ? 1.5 : 2));
// потеря контекста (свернули вкладку на телефоне, драйвер сбросил GPU): three восстановит сам, просим только перерисовать
canvas.addEventListener('webglcontextlost', e => e.preventDefault());
canvas.addEventListener('webglcontextrestored', () => { renderer.shadowMap.needsUpdate = true; invalidate(); });
renderer.shadowMap.enabled = true;
renderer.localClippingEnabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(28, 1, 1, 3000);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 40;
controls.maxDistance = 520;
controls.minPolarAngle = 0.15;
controls.maxPolarAngle = 1.2;
controls.screenSpacePanning = false;
// на телефоне вертикальный свайп листает страницу (touch-action: pan-y), горизонтальный вращает, два пальца приближают
controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
// OrbitControls сам ставит канвасу touch-action:none, и страница пальцем через макет не листалась
canvas.style.touchAction = 'pan-y';
controls.enableZoom = coarse;
if (!coarse) {
  canvas.addEventListener('pointerdown', () => { controls.enableZoom = true; });
  canvas.addEventListener('pointerleave', () => { controls.enableZoom = false; });
}

scene.add(new THREE.HemisphereLight('#fffdf8', '#5b5750', 1.5));
const sun = new THREE.DirectionalLight('#fff3df', 2.6);
sun.castShadow = true;
sun.shadow.mapSize.set(coarse ? 2048 : 4096, coarse ? 2048 : 4096);
sun.shadow.bias = -0.0003;
sun.shadow.normalBias = 0.05;
scene.add(sun, sun.target);

const MAT = {
  build: maquette('#f3f0ea', { tex: 'paper', highlight: true }),
  ground: maquette('#c4a77c', { tex: 'cork' }),
  path: maquette('#d9d5cc', { tex: 'path' }),
  green: maquette('#9fae7c', { tex: 'grass', roughness: 1 }),
  glass: maquette('#4a5559', { tex: 'glass', roughness: 0.25, metalness: 0.1, highlight: true }),
  water: maquette('#ffffff', { tex: 'water', roughness: 0.3, metalness: 0.05, side: THREE.DoubleSide }),
  soil: maquette('#ffffff', { tex: 'soil', roughness: 1, flatShading: true, side: THREE.DoubleSide }),
  earth: maquette('#ffffff', { tex: 'soil', roughness: 1, flatShading: true, clip: false, side: THREE.DoubleSide }),
  trunk: new THREE.MeshStandardMaterial({ name: 'trunk', color: '#d8d2c6', roughness: 1 }),
  palmleaf: new THREE.MeshStandardMaterial({ name: 'palmleaf', color: '#8f9c74', roughness: 0.95, side: THREE.DoubleSide }),
  rock: new THREE.MeshStandardMaterial({ name: 'rock', color: '#474747', roughness: 1, flatShading: true }),
  vine: new THREE.MeshStandardMaterial({ name: 'vine', vertexColors: true, roughness: 0.9, side: THREE.DoubleSide }),
};
// у запечённых плоских слоёв нет нормалей в файле: тот же материал, но нормаль из производных
const flatCache = new Map();
function flat(m) {
  if (m.flatShading) return m;
  if (!flatCache.has(m)) {
    const f = m.clone(); f.flatShading = true;
    // без нормали смещение тени по нормали превращается в NaN и тень пропадает: смещаем только обычным bias
    f.onBeforeCompile = (sh, r) => {
      if (m.onBeforeCompile) m.onBeforeCompile(sh, r);
      sh.vertexShader = sh.vertexShader.replace('#include <shadowmap_vertex>', THREE.ShaderChunk.shadowmap_vertex.replace('inverseTransformDirection( transformedNormal, viewMatrix )', 'vec3( 0.0 )'));
    };
    f.customProgramCacheKey = () => (m.customProgramCacheKey ? m.customProgramCacheKey() : '') + 'flat';
    flatCache.set(m, f);
  }
  return flatCache.get(m);
}
const SHADOW = new Set(['build', 'glass', 'trunk', 'palmleaf']);
// роли материалов SketchUp-выгрузки (см. разбор: цвета модели = типы вилл)
const ROLE = {
  Material8: 'green', Material14: 'water', Material28: 'soil',
  Material12: 'path', Material13: 'path', Material10: 'ground', Material27: 'ground', Material11: 'ground',
  Material22: 'glass', Material39: 'hide',
};

let modelRoot, buildMeshes = [], groundMeshes = [], pinY = null, homeBox = null;
const modelBox = () => homeBox ? new THREE.Box3(new THREE.Vector3().fromArray(homeBox), new THREE.Vector3().fromArray(homeBox, 3)) : new THREE.Box3().setFromObject(modelRoot);
let units3d, unitList = [], fitDist = 300;
const pinsEl = document.getElementById('m3dPins');

const loader = document.getElementById('m3dLoader');
const perf = { t0: 0 };
/* грузим модель, когда блок подходит к экрану: на сайте он ниже первого экрана и не должен мешать загрузке страницы */
function start() {
perf.t0 = performance.now();
Promise.all([
  fetch(new URL('units-3d.json?v=20261023b', import.meta.url)).then(r => r.json()),
  new Promise((res, rej) => new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load(MODEL, res,
    e => e.total && loader.style.setProperty('--p', (e.loaded / e.total).toFixed(3)), rej)),
]).then(([u3d, gltf]) => {
  perf.load = performance.now() - perf.t0;
  units3d = u3d;
  const ts = performance.now();
  setupModel(gltf.scene);
  perf.setup = performance.now() - ts;
  let tq = performance.now();
  setupUnits(); perf.units = performance.now() - tq; tq = performance.now();
  buildUI(); perf.ui = performance.now() - tq; tq = performance.now();
  renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
  resize(); perf.resize = performance.now() - tq;
  loader.classList.add('is-done');
  window.__ready = { units: unitList.length };
  window.__m3d = { camera, controls, unitList, perf };
  perf.ready = performance.now() - perf.t0;
}).catch((e) => { console.error(e); fail(T[lang].loadErr, true); });
}
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); start(); } }, { rootMargin: '600px 0px' });
  io.observe(wrap);
} else start();

function setupModel(root) {
  modelRoot = root;
  // запечённая сцена (bake.js): земля, срезы, пальмы и лианы уже в файле, роль меша в extras
  let baked = null; root.traverse(o => { if (o.userData.bakedR) { baked = o.userData.bakedR; pinY = o.userData.pinY || null; homeBox = o.userData.homeBox || null; } });
  if (baked) {
    root.traverse((o) => {
      if (!o.isMesh) return;
      const role = o.userData.role;
      o.material = o.geometry.attributes.normal ? MAT[role] : flat(MAT[role]);
      o.castShadow = SHADOW.has(role); o.receiveShadow = true;
      if (role === 'build' || role === 'glass') buildMeshes.push(o);
      else if (role !== 'trunk' && role !== 'palmleaf' && role !== 'rock' && role !== 'vine') groundMeshes.push(o);
    });
    scene.add(root);
    root.updateMatrixWorld(true);
    // индекс для выбора виллы мышью строим после первого кадра, чтобы не держать загрузку
    const idle = window.requestIdleCallback || (f => setTimeout(f, 300));
    idle(() => { const tb = performance.now(); buildMeshes.forEach(m => m.geometry.computeBoundsTree()); perf.bvh = performance.now() - tb; });
    sun.shadow.bias = -0.0006;
    setupLight(baked);
    return;
  }
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.userData.mat = o.material.name;
    const role = ROLE[o.material.name] || 'build';
    if (role === 'hide') { o.visible = false; return; }
    o.material = MAT[role];
    o.castShadow = role === 'build' || role === 'glass';
    o.receiveShadow = true;
    (role === 'build' || role === 'glass' ? buildMeshes : groundMeshes).push(o);
  });
  scene.add(root);
  // тот же центр, что у вида сверху, по которому снимались координаты юнитов
  const box = new THREE.Box3().setFromObject(root);
  const c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
  root.position.sub(c); root.position.y += s.y / 2;
  root.updateMatrixWorld(true);
  root.traverse(o => { if (o.isMesh && o.userData.mat === 'Material28') { const ch = buildEarthChunk(o, MAT.earth, topAt); if (ch) scene.add(ch);
    let water; root.traverse(w => { if (w.userData.mat === 'Material14') water = w; });
    const top = new THREE.Mesh(plinthTop(o, water), MAT.earth); top.receiveShadow = true;
    const polys = ch ? [ch.userData.outline] : [];
    if (water) { const wch = buildEarthChunk(null, MAT.earth, topAt, footprint(water)); if (wch) { scene.add(wch); polys.push(wch.userData.outline); } }
    // у воды оставляем только поверхность: нижняя грань плиты выглядывала из-под среза
    const wTop = water ? new THREE.Box3().setFromObject(water).max.y - 0.5 : -1e9;
    if (polys.length) groundMeshes.forEach(m => { if (m !== o) m.geometry = trimToOutline(m, polys, 1.5, m === water ? wTop : -1e9); });
    o.visible = false; groundMeshes = groundMeshes.filter(m => m !== o); scene.add(top); groundMeshes.push(top); } });
  const R = Math.max(s.x, s.z);
  setupLight(R);
  addPalms(R);
}

let lastR = 0;
function setupLight(R) {
  lastR = R;
  sun.position.set(-R * 0.45, R * 0.55, -R * 0.2);
  const sc = sun.shadow.camera;
  sc.left = sc.bottom = -R * 0.62; sc.right = sc.top = R * 0.62; sc.near = 1; sc.far = R * 2.5; sc.updateProjectionMatrix();
  fitDist = R * 1.25;
}

// высота земли у края: лиана начинается там, где кончается газон или дорожка
function topAt(x, z) {
  ray.set(new THREE.Vector3(x, 300, z), new THREE.Vector3(0, -1, 0));
  const hit = ray.intersectObjects(groundMeshes, false)[0];
  return hit ? hit.point.y : 10.5;
}

/* газон бывает и во дворах под навесом: пальма там прорастала сквозь крышу и стены.
   Ствол: луч вверх из точки и лучи вбок. Крона: лучи вверх с высоты листьев по кругу,
   пальма у стены с кроной над крышей остаётся */
const upRay = new THREE.Raycaster();
function underRoof(p) {
  const up = new THREE.Vector3(0, 1, 0);
  upRay.set(new THREE.Vector3(p.x, p.y + 0.3, p.z), up); upRay.far = 14;
  if (upRay.intersectObjects(buildMeshes, false).length) return true;
  for (const [dx, dz] of [[2.5, 0], [-2.5, 0], [0, 2.5], [0, -2.5], [1.8, 1.8], [-1.8, 1.8], [1.8, -1.8], [-1.8, -1.8]]) {
    upRay.set(new THREE.Vector3(p.x + dx, p.y + 5, p.z + dz), up); upRay.far = 8;
    if (upRay.intersectObjects(buildMeshes, false).length) return true;
  }
  for (let a = 0; a < 8; a++) {
    const d = new THREE.Vector3(Math.cos(a * Math.PI / 4), 0, Math.sin(a * Math.PI / 4));
    for (const y of [1.5, 5]) {
      upRay.set(new THREE.Vector3(p.x, p.y + y, p.z), d); upRay.far = 1.2;
      if (upRay.intersectObjects(buildMeshes, false).length) return true;
    }
  }
  return false;
}

/* пальмы: инстансы на зелёных полосах, ствол с наклоном + веер листьев */
function addPalms() {
  const greens = groundMeshes.filter(m => m.material === MAT.green);
  const tris = [];
  let total = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (const m of greens) {
    const pos = m.geometry.attributes.position, idx = m.geometry.index;
    const n = idx ? idx.count : pos.count;
    for (let i = 0; i < n; i += 3) {
      const ia = idx ? idx.getX(i) : i, ib = idx ? idx.getX(i + 1) : i + 1, ic = idx ? idx.getX(i + 2) : i + 2;
      a.fromBufferAttribute(pos, ia).applyMatrix4(m.matrixWorld);
      b.fromBufferAttribute(pos, ib).applyMatrix4(m.matrixWorld);
      c.fromBufferAttribute(pos, ic).applyMatrix4(m.matrixWorld);
      const nrm = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
      const area = nrm.length() / 2;
      if (area < 0.5 || Math.abs(nrm.normalize().y) < 0.7) continue; // только горизонтальные куски
      total += area; tris.push([a.clone(), b.clone(), c.clone(), total]);
    }
  }
  if (!tris.length) return;
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pts = [];
  for (let k = 0; k < 4000 && pts.length < 260; k++) {
    const r = rnd() * total;
    const t = tris.find(x => x[3] >= r);
    let u = rnd(), v = rnd(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
    const p = t[0].clone().add(t[1].clone().sub(t[0]).multiplyScalar(u)).add(t[2].clone().sub(t[0]).multiplyScalar(v));
    if (pts.every(o => o.distanceToSquared(p) > 30) && !underRoof(p)) pts.push(p);
  }
  // геометрия одной пальмы
  const trunkG = new THREE.CylinderGeometry(0.16, 0.24, 1, 6, 4, true).translate(0, 0.5, 0);
  const leafG = new THREE.PlaneGeometry(0.9, 3.4, 1, 6).translate(0, 1.7, 0);
  { // лист выгибается вниз дугой
    const p = leafG.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setZ(i, -0.08 * y * y); p.setX(i, p.getX(i) * (1 - y / 3.6)); }
    leafG.rotateX(-Math.PI / 2 + 0.55); leafG.computeVertexNormals();
  }
  const trunkM = MAT.trunk, leafM = MAT.palmleaf;
  const LEAVES = 9;
  const trunks = new THREE.InstancedMesh(trunkG, trunkM, pts.length);
  const leaves = new THREE.InstancedMesh(leafG, leafM, pts.length * LEAVES);
  trunks.castShadow = leaves.castShadow = true;
  const mtx = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e = new THREE.Euler();
  pts.forEach((p, i) => {
    const h = 6 + rnd() * 5, lean = (rnd() - 0.5) * 0.25, yaw = rnd() * Math.PI * 2;
    e.set(lean, yaw, lean * 0.6); q4.setFromEuler(e);
    mtx.compose(p, q4, new THREE.Vector3(1, h, 1)); trunks.setMatrixAt(i, mtx);
    const top = new THREE.Vector3(0, h, 0).applyQuaternion(q4).add(p);
    for (let j = 0; j < LEAVES; j++) {
      e.set(-0.15 + rnd() * 0.3, yaw + (j / LEAVES) * Math.PI * 2 + rnd() * 0.3, 0); q4.setFromEuler(e);
      const s = 0.85 + rnd() * 0.3;
      mtx.compose(top, q4, new THREE.Vector3(s, s, s)); leaves.setMatrixAt(i * LEAVES + j, mtx);
    }
  });
  scene.add(trunks, leaves);
}

/* ---------- юниты ---------- */
const ray = new THREE.Raycaster();
ray.firstHitOnly = true;
function setupUnits() {
  const ang = THREE.MathUtils.degToRad(units3d.angleDeg);
  HL.uAxis.value.set(Math.cos(ang), Math.sin(ang));
  const [mx, mz] = units3d.mPerPlanPx;
  for (const [n, [x, z]] of Object.entries(units3d.units)) {
    const group = n === 'STUDIO';
    const u = group ? null : UNITS[n];
    if (!group && !u) continue;
    // высота метки: верх здания под точкой (в запечённой сцене уже посчитана)
    let y = pinY && pinY[n];
    if (y == null) {
      ray.set(new THREE.Vector3(x, 300, z), new THREE.Vector3(0, -1, 0));
      const hit = ray.intersectObjects(buildMeshes, false)[0] || ray.intersectObjects(groundMeshes, false)[0];
      y = (hit ? hit.point.y : 0) + 1.2;
    }
    const k = group ? 'studio' : typeKey(u.t);
    // подсветка по площади виллы: 1BD ~71 м², крупные форматы шире
    const big = group ? 1 : Math.min(1.5, Math.max(1, Math.sqrt(parseFloat(u.s) / 71.3)));
    const half = new THREE.Vector2(36 * mx * big, 28 * mz * big);
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'm3d-pin' + (group ? ' is-group' : ' is-' + u.st);
    el.addEventListener('click', (ev) => { ev.stopPropagation(); select(item); });
    el.addEventListener('pointerenter', () => hover(item));
    el.addEventListener('pointerleave', () => hover(null));
    pinsEl.appendChild(el);
    const item = { n, group, u, k, pos: new THREE.Vector3(x, y, z), half, el, sx: 0, sy: 0, vis: true };
    unitList.push(item);
  }
}

/* ---------- состояние фильтров ---------- */
let fType = null, fAvail = false, selected = null, hovered = null;
const passes = it => {
  if (it.group) return (!fType || fType === 'studio') && (!fAvail || studioUnits().some(u => u.st === 'early'));
  return (!fType || fType === it.k) && (!fAvail || it.u.st === 'early');
};
const studioUnits = () => STUDIO_FLOORS.flatMap(([, ns]) => ns).map(n => UNITS[n]).filter(Boolean);

function hover(it) {
  invalidate();
  hovered = it;
  unitList.forEach(x => x.el.classList.toggle('is-hover', x === it));
  if (it && !it.group) { HL.uHov.value.set(it.pos.x, it.pos.z, 1, 0); HL.uHalfH.value.copy(it.half); }
  else HL.uHov.value.z = 0;
  canvas.style.cursor = it ? 'pointer' : '';
}
function select(it, opts = {}) {
  invalidate();
  selected = it;
  unitList.forEach(x => x.el.classList.toggle('is-sel', x === it));
  if (it && !it.group) { HL.uSel.value.set(it.pos.x, it.pos.z, 1, 0); HL.uHalf.value.copy(it.half); }
  else HL.uSel.value.z = 0;
  if (it) { openCard(it, opts.unit); flyTo(it.pos); } else closeCard();
}

/* ---------- камера ---------- */
let POL = 0.9;
const MOB_POL = 0.9, MOB_MY = 0.72;
let fly = null, homePose = null;
/* общий вид: перебираем азимут и берём тот, при котором комплекс крупнее всего
   влезает в кадр с полями под панели (на телефоне длинная ось сама встаёт вертикально) */
function fitHome() {
  POL = innerWidth < 761 ? (+q.get('pol') || MOB_POL) : 0.9;
  const pts = unitList.map(it => it.pos.clone());
  const box = modelBox();
  for (const x of [box.min.x, box.max.x]) for (const z of [box.min.z, box.max.z]) pts.push(new THREE.Vector3(x, groundY(), z));
  const ctr = box.getCenter(new THREE.Vector3()); ctr.y = groundY();
  // реальный контур участка точнее углов габарита: точки юнитов + края, ужатые к центру
  const fitPts = innerWidth < 761 ? pts.slice(0, unitList.length) : pts.map(p => p.clone().lerp(ctr, 0.12));
  const cam = camera.clone();
  // на телефоне участок шире экрана при любом повороте: даём краям чуть уйти, иначе комплекс мелкий
  const mob = innerWidth < 761, H = wrap.clientHeight, lg = wrap.querySelector('.m3d-legend');
  const prev = wrap.classList.contains('is-preview');
  const fy0 = prev ? 16 : mob ? topBarBottom() + 56 : 0, fy1 = prev ? H - 16 : mob && lg ? lg.offsetTop - 16 : H;
  const mx = mob ? 0.86 : 0.84, my = mob ? (fy1 - fy0) / H : 0.74, cy = mob ? 1 - (fy0 + fy1) / H : 0;
  let best = null;
  const azFix = q.get('az');
  for (let a = 0; a < 360; a += 5) {
    if (azFix !== null && a !== Math.round(+azFix / 5) * 5) continue;
    const az = THREE.MathUtils.degToRad(a);
    const dir = new THREE.Vector3().setFromSphericalCoords(1, POL, az);
    let d = 800;
    for (let i = 0; i < 5; i++) {
      cam.position.copy(ctr).addScaledVector(dir, d); cam.lookAt(ctr); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
      let m = 0;
      let y0 = 1e9, y1 = -1e9;
      for (const p of fitPts) { const v2 = p.clone().project(cam); m = Math.max(m, Math.abs(v2.x) / mx); y0 = Math.min(y0, v2.y); y1 = Math.max(y1, v2.y); }
      m = Math.max(m, (mob ? (y1 - y0) / 2 : Math.max(-y0, y1)) / my);
      d *= m;
    }
    if (!best || d < best.d) best = { d, az };
  }
  // участок несимметричный: двигаем точку взгляда по земле, пока проекция не встанет по центру
  const off = new THREE.Vector3().setFromSphericalCoords(best.d, POL, best.az);
  const fwd = new THREE.Vector3(-off.x, 0, -off.z).normalize(), right = new THREE.Vector3(-fwd.z, 0, fwd.x);
  for (let i = 0; i < 4; i++) {
    cam.position.copy(ctr).add(off); cam.lookAt(ctr); cam.updateMatrixWorld();
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const p of fitPts) { const v2 = p.clone().project(cam); x0 = Math.min(x0, v2.x); x1 = Math.max(x1, v2.x); y0 = Math.min(y0, v2.y); y1 = Math.max(y1, v2.y); }
    const hw = best.d * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    ctr.addScaledVector(right, (x0 + x1) / 2 * hw * cam.aspect).addScaledVector(fwd, ((y0 + y1) / 2 - cy) * hw / Math.cos(POL));
  }
  homePose = { t: ctr, p: ctr.clone().add(off) };
  controls.maxDistance = best.d * 1.6;
}
function homeView(instant) {
  fitHome();
  animateTo(homePose.p, homePose.t, instant);
}
function flyTo(target) {
  const off = camera.position.clone().sub(controls.target);
  const d = Math.min(off.length(), innerWidth < 761 ? 210 : 200);
  const t = target.clone(); t.y = Math.max(groundY(), target.y - 6);
  animateTo(t.clone().add(off.setLength(d)), t);
}
// уровень земли: самая низкая метка стоит на земле +1.2
let gY = null;
const groundY = () => gY ?? (gY = Math.min(...unitList.map(u => u.pos.y)) - 1.2);
/* карточка закрывает часть экрана: сдвигаем центр проекции в свободную часть */
let shift = { x: 0, y: 0 }, shiftTo = { x: 0, y: 0 };
function updateShift() {
  invalidate();
  const w = wrap.clientWidth, h = wrap.clientHeight, open = card.classList.contains('is-open');
  shiftTo = !open ? { x: 0, y: 0 } : w < 761 ? { x: 0, y: (card.offsetHeight - topBarBottom()) / 2 } : { x: (card.offsetWidth + 16) / 2, y: 0 };
}
function applyShift() {
  shift.x += (shiftTo.x - shift.x) * 0.12; shift.y += (shiftTo.y - shift.y) * 0.12;
  const w = wrap.clientWidth, h = wrap.clientHeight;
  if (Math.abs(shift.x) < 0.5 && Math.abs(shift.y) < 0.5 && !shiftTo.x && !shiftTo.y) { if (camera.view) camera.clearViewOffset(); return; }
  camera.setViewOffset(w, h, shift.x, shift.y, w, h);
}
function animateTo(p, t, instant) {
  if (instant) { camera.position.copy(p); controls.target.copy(t); controls.update(); return; }
  fly = { p0: camera.position.clone(), t0: controls.target.clone(), p, t, s: performance.now() };
}
controls.addEventListener('start', () => { fly = null; });

/* ---------- клики по самой модели ---------- */
const ndc = new THREE.Vector2();
let downXY = null;
canvas.addEventListener('pointerdown', e => { downXY = [e.clientX, e.clientY]; });
canvas.addEventListener('pointerup', e => {
  if (!downXY || Math.hypot(e.clientX - downXY[0], e.clientY - downXY[1]) > 6) return;
  const it = pick(e);
  select(it || null);
});
canvas.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && !e.buttons) hover(pick(e)); });
function pick(e) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(buildMeshes, false)[0];
  if (!hit) return null;
  const ax = HL.uAxis.value;
  let best = null, bd = 1e9;
  for (const it of unitList) {
    if (!it.vis) continue;
    const dx = hit.point.x - it.pos.x, dz = hit.point.z - it.pos.z;
    const lx = Math.abs(dx * ax.x + dz * ax.y), lz = Math.abs(-dx * ax.y + dz * ax.x);
    const lim = it.group ? 16 : 1;
    if (it.group ? Math.hypot(dx, dz) < lim : (lx < it.half.x && lz < it.half.y)) {
      const d = dx * dx + dz * dz; if (d < bd) { bd = d; best = it; }
    }
  }
  return best;
}

/* ---------- метки: проекция + разводка, чтобы не налезали ---------- */
const v = new THREE.Vector3();
const topBar = wrap.querySelector('.m3d-top');
// низ верхней панели от верха канваса, а не окна: иначе при прокрутке страницы метки мигают
const topBarBottom = () => topBar.getBoundingClientRect().bottom - canvas.getBoundingClientRect().top;
function layoutPins() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  const placed = [];
  const topH = topBarBottom();
  const mob = innerWidth < 761, cr = canvas.getBoundingClientRect(), lr = document.getElementById('m3dLegend').getBoundingClientRect();
  const legTop = lr.height ? lr.top - cr.top - 8 : h, legRight = lr.right - cr.left + 8;
  const far = innerWidth < 761 && homePose && camera.position.distanceTo(controls.target) > homePose.p.distanceTo(homePose.t) * 0.7, g = far ? 6 : 0;
  const order = unitList.slice().sort((a, b) => prio(b) - prio(a));
  for (const it of order) {
    it.vis = passes(it);
    v.copy(it.pos).project(camera);
    const on = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
    it.sx = (v.x * 0.5 + 0.5) * w; it.sy = (-v.y * 0.5 + 0.5) * h;
    const el = it.el;
    if (it.group) { const lab = mob ? T[lang].studios : T[lang].studioTitle; if (el.textContent !== lab) el.textContent = lab; }
    const pw = it.group ? el.offsetWidth || 150 : 52, ph = 30, mid = it.group && mob ? ph / 2 : 0;
    // широкую метку у края не режем, точку не двигаем
    if (it.group) it.sx = Math.min(Math.max(it.sx, pw / 2 + 8), w - pw / 2 - 8);
    // под верхней панелью метки не показываем: просвечивают и мешают нажать чипы
    if (!on || ((it !== selected || innerWidth < 761) && it.sy - 30 < topH) || (it !== selected && far && !it.group && (!it.vis || it.u.st === 'booked'))) { el.classList.add('is-hidden'); continue; }
    el.classList.remove('is-hidden');
    el.classList.toggle('is-off', !it.vis);
    // корпус у самой легенды: метку чуть поднимаем, она всё ещё на нём; корпус ушёл под легенду совсем, прячем
    if (mid && it !== selected && it.sy + mid > legTop && it.sx - pw / 2 < legRight) { if (it.sy + mid - legTop > 40) { el.classList.add('is-hidden'); continue; } it.sy = legTop - mid; }
    const box = [it.sx - pw / 2 - g, it.sy - ph + mid - g, it.sx + pw / 2 + g, it.sy + mid + g];
    const free = it.vis && (it === selected || placed.every(b => box[2] < b[0] || box[0] > b[2] || box[3] < b[1] || box[1] > b[3]));
    if ((far || mob && it.u && it.u.st === 'booked') && !free && it !== selected) { el.classList.add('is-hidden'); continue; }
    el.classList.toggle('is-dot', !free);
    if (free) placed.push(box);
    el.style.transform = `translate(${it.sx}px, ${it.sy}px) translate(-50%, ${mid ? -50 : -100}%)`;
    el.style.zIndex = it === selected ? 1000 : free ? 500 + Math.round(v.z * -100) : 10;
  }
}
const prio = it => (it === selected ? 100 : 0) + (it.group ? 6 : 0) + (it.u && it.u.st === 'early' ? 3 : it.u && it.u.st === 'prebooked' ? 1 : 0) - (it.vis ? 0 : 50);

/* ---------- карточка ---------- */
const card = document.getElementById('m3dCard');
const body = document.getElementById('m3dCardBody');
document.getElementById('m3dClose').addEventListener('click', () => select(null));
addEventListener('keydown', e => { if (e.key === 'Escape' && card.classList.contains('is-open')) select(null); });

const chev = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
function photosHTML(k) {
  const list = PHOTOS[k] || [], t = T[lang];
  return `<div class="c-gal">
    <div class="c-photos">${list.map(f => `<img src="${SITE}assets/${f}" alt="" loading="lazy"${f.startsWith('plan-') ? ' class="is-plan"' : ''}>`).join('')}</div>
    <button class="c-arrow prev" type="button" data-dir="-1" aria-label="${t.prev}" disabled>${chev('M15 5l-7 7 7 7')}</button>
    <button class="c-arrow next" type="button" data-dir="1" aria-label="${t.next}">${chev('M9 5l7 7-7 7')}</button>
    <div class="c-dots">${list.map((_, i) => `<i${i ? '' : ' class="on"'}></i>`).join('')}</div>
  </div>`;
}
function unitHTML(u, k, back) {
  const t = T[lang];
  const ph = /^P\d/.test(u.n);
  const name = ph ? t.penthouse(u.n) : k === 'studio' ? t.studio(u.n) : t.villa(u.n);
  const book = ph ? t.bookP(u.n) : k === 'studio' ? t.bookS(u.n) : t.bookV(u.n);
  // бронь и продажа: забронировать нельзя, предлагаем похожую
  const cta = u.st !== 'early'
    ? `<button class="m3d-btn m3d-btn-gold" type="button" data-similar="${u.n}">${t.similar}</button>`
    : `<button class="m3d-btn m3d-btn-gold" type="button" data-book="${u.n}">${book}</button>`;
  // у пентхаусов своего таба в планировках нет
  const plan = ph ? '' : `<button class="m3d-btn m3d-btn-ghost m3d-btn-plan" type="button" data-plan="${k}" aria-label="${t.plan}" title="${t.plan}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true"><path d="M3 3H21V21H3Z"/><path stroke-linecap="butt" d="M11 3.75V8M11 11.25V20.25M11.75 12H14M17 12H20.25M3.75 15H7"/></svg></button>`;
  return `${photosHTML(k)}
  <div class="c-main">
    ${back ? `<button class="c-back" type="button" data-back>${arrow()}${t.back}</button>` : ''}
    <div class="c-head"><h3 class="c-title">${name}</h3><span class="c-status is-${u.st}">${t.st[u.st]}</span></div>
    <p class="c-type">${prettyType(u.t, k)}</p>
    <dl class="c-facts">
      <div><dt>${t.area}</dt><dd>${fmtArea(u.s)}</dd></div>
      ${u.st === 'booked' ? '' : `<div><dt>${t.price}</dt><dd>${fmtPrice(u.c)}</dd></div>`}
    </dl>
    <div class="c-actions">${cta}${plan}</div>
  </div>`;
}
function prettyType(t, k) {
  // «STUDIO PALMS+OCEAN» → «Студия, вид на пальмы и океан»
  const d = T[lang];
  const m = t.match(/^(STUDIO|PENTHOUSE|4BD)\s+(.+)$/);
  if (m && d.views[m[2]]) return `${m[1] === 'PENTHOUSE' ? d.types.penthouse : d.types[k]}, ${d.views[m[2]]}`;
  if (/^4BD SKY/.test(t)) return d.types['4bdsky'];
  return d.types[k];
}
const arrow = () => '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 3 5 8l5 5"/></svg>';

function studioHTML() {
  const t = T[lang];
  return `${photosHTML('studio')}
  <div class="c-main">
    <div class="c-head"><h3 class="c-title">${t.studioTitle}</h3></div>
    <p class="c-type">${t.studioLead}</p>
    <ul class="c-list">${STUDIO_FLOORS.map(([f, ns]) => `<li><h4>${t.floor(f)}</h4>${ns.map(n => UNITS[n]).filter(Boolean).map(u =>
      `<button type="button" data-unit="${u.n}" class="is-${u.st}"><span class="n">${u.n}</span><span class="p">${u.st === 'booked' ? t.st.booked : t.st[u.st] + ', ' + fmtPrice(u.c)}</span></button>`).join('')}</li>`).join('')}</ul>
  </div>`;
}
let cardState = null;
function openCard(it, unitN) {
  cardState = { it, unitN };
  if (it.group && !unitN) body.innerHTML = studioHTML();
  else { const u = it.group ? UNITS[unitN] : it.u; body.innerHTML = unitHTML(u, it.group ? 'studio' : it.k, it.group); }
  body.scrollTop = 0;
  const ph = body.querySelector('.c-photos'), dots = body.querySelectorAll('.c-dots i');
  if (ph) {
    const gal = ph.parentNode, arrows = gal.querySelectorAll('.c-arrow'), imgs = ph.querySelectorAll('img');
    // на светлом слайде с планом стрелки и точки тёмные, иначе белое на белом
    const sync = () => {
      const i = Math.round(ph.scrollLeft / ph.clientWidth);
      dots.forEach((d, j) => d.classList.toggle('on', i === j));
      arrows[0].disabled = i <= 0; arrows[1].disabled = i >= imgs.length - 1;
      gal.classList.toggle('on-plan', !!(imgs[i] && imgs[i].classList.contains('is-plan')));
    };
    ph.addEventListener('scroll', sync, { passive: true });
    arrows.forEach(a => a.addEventListener('click', () => ph.scrollBy({ left: ph.clientWidth * a.dataset.dir, behavior: 'smooth' })));
    dots.forEach((d, j) => d.addEventListener('click', () => ph.scrollTo({ left: ph.clientWidth * j, behavior: 'smooth' })));
  }
  body.querySelectorAll('[data-unit]').forEach(b => b.addEventListener('click', () => openCard(it, b.dataset.unit)));
  const bk = body.querySelector('[data-back]'); bk && bk.addEventListener('click', () => openCard(it));
  const bb = body.querySelector('[data-book]'); bb && bb.addEventListener('click', () => window.openLeadForUnit && window.openLeadForUnit(bb.dataset.book));
  const bs = body.querySelector('[data-similar]'); bs && bs.addEventListener('click', () => window.openLeadForUnit && window.openLeadForUnit(bs.dataset.similar, 'selection'));
  const bp = body.querySelector('[data-plan]'); bp && bp.addEventListener('click', () => goPlan(bp.dataset.plan));
  card.classList.add('is-open'); card.setAttribute('aria-hidden', 'false');
  updateShift();
}
/* как было у старого плана: таб нужного формата в планировках, на телефоне фото сразу под шапкой */
function goPlan(k) {
  const tab = document.querySelector(`.plans-tab[data-plan="${k}"]`);
  if (!tab) return;
  tab.click();
  const viewer = document.getElementById('plansViewer');
  if (viewer && matchMedia('(max-width:860px)').matches) {
    const head = document.getElementById('header');
    // offsetTop, а не getBoundingClientRect: у ещё не проявленного .reveal сдвиг 24px
    let top = 0;
    for (let el = viewer; el; el = el.offsetParent) top += el.offsetTop;
    scrollTo({ top: top - (head ? head.offsetHeight : 0) - 8, behavior: 'smooth' });
  } else (document.querySelector('.plans-cta-row') || document.getElementById('plans')).scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function closeCard() { cardState = null; card.classList.remove('is-open'); card.setAttribute('aria-hidden', 'true'); updateShift(); }

/* ---------- панели ---------- */
function buildUI() {
  invalidate();
  const t = T[lang];
  const types = document.getElementById('m3dTypes');
  types.innerHTML = [`<button class="m3d-chip" type="button" data-t="" aria-pressed="${!fType}">${t.all}</button>`]
    .concat(TYPES.map(x => `<button class="m3d-chip" type="button" data-t="${x.k}" aria-pressed="${fType === x.k}">${x.label || t.studios}</button>`)).join('');
  types.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { fType = b.dataset.t || null; buildUI(); }));
  const av = document.getElementById('m3dAvail');
  av.textContent = t.avail; av.setAttribute('aria-pressed', fAvail);
  av.onclick = () => { fAvail = !fAvail; buildUI(); };
  const counts = { early: 0, prebooked: 0, booked: 0 };
  Object.values(UNITS).forEach(u => counts[u.st] !== undefined && counts[u.st]++);
  const col = { early: 'var(--ok)', prebooked: 'var(--clay)', booked: 'var(--sold)' };
  document.getElementById('m3dLegend').innerHTML = Object.keys(counts).map(k => `<span><i style="background:${col[k]}"></i>${t.stLegend[k]} ${counts[k]}</span>`).join('');
  const rs = document.getElementById('m3dReset');
  rs.innerHTML = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2.5 8a5.5 5.5 0 1 0 1.6-3.9M2.5 2.5v3h3"/></svg><span>${t.reset}</span>`;
  rs.setAttribute('aria-label', t.reset);
  rs.onclick = () => { select(null); homeView(); };
  document.getElementById('m3dClose').innerHTML = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m3 3 10 10M13 3 3 13"/></svg>';
  document.getElementById('m3dClose').setAttribute('aria-label', t.close);
  unitList.forEach(it => { it.el.textContent = it.group ? t.studioTitle : it.n; it.el.setAttribute('aria-label', it.group ? t.studioTitle : `${t.villa(it.n)}, ${t.st[it.u.st]}`); });
  if (cardState) openCard(cardState.it, cardState.unitN);
  if (selected && !passes(selected)) select(null);
}

const origSetLang = window.setLang;
if (typeof origSetLang === 'function') window.setLang = function (l) { origSetLang.apply(this, arguments); lang = pageLang(); if (unitList.length) buildUI(); paintCtrl(); paintPreview(); };

/* ---------- цикл ---------- */
function resize() {
  const w = wrap.clientWidth, h = wrap.clientHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio, coarse ? 1.5 : 2, Math.max(1, Math.sqrt(4e6 / (w * h)))));
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  updateShift();
  if (!window.__homed) { window.__homed = true; homeView(true); }
}
// до загрузки модели общий вид считать не по чему: ждём её
addEventListener('resize', () => { if (unitList.length) resize(); });
if ('ResizeObserver' in window) new ResizeObserver(() => { if (unitList.length) resize(); }).observe(wrap);
const ease = x => 1 - Math.pow(1 - x, 3);
/* рисуем только когда что-то меняется: камера, полёт, сдвиг под карточку, ввод, фильтры.
   Блок вне экрана или вкладка скрыта — цикл стоит, сайт вокруг не тормозит */
let dirty = 2, onScreen = true;
const invalidate = () => { dirty = 2; };
['pointerdown', 'pointermove', 'pointerup', 'wheel', 'click', 'keydown', 'touchstart'].forEach(t => wrap.addEventListener(t, invalidate, { passive: true }));
controls.addEventListener('change', invalidate);
if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; if (onScreen) invalidate(); }).observe(wrap);
renderer.setAnimationLoop((now) => {
  if (!onScreen) return;
  let moving = false;
  if (fly) {
    const k = Math.min(1, (now - fly.s) / 900), e = ease(k);
    controls.target.lerpVectors(fly.t0, fly.t, e); camera.position.lerpVectors(fly.p0, fly.p, e);
    if (fly.arc) camera.position.sub(controls.target).setLength(fly.arc[0] + (fly.arc[1] - fly.arc[0]) * e).add(controls.target);
    if (k === 1) fly = null;
    moving = true;
  }
  if (controls.update()) moving = true;
  if (Math.abs(shiftTo.x - shift.x) > 0.3 || Math.abs(shiftTo.y - shift.y) > 0.3) moving = true;
  if (!moving && !dirty) return;
  if (dirty) dirty--;
  applyShift();
  renderer.render(scene, camera);
  if (unitList.length) layoutPins();
});

/* ---------- кнопки масштаба и поворота, режим на весь экран ---------- */
const VL = {
  en: { zin: 'Zoom in', zout: 'Zoom out', rl: 'Rotate left', rr: 'Rotate right', full: 'Expand to full screen', exit: 'Exit full screen' },
  ru: { zin: 'Приблизить', zout: 'Отдалить', rl: 'Повернуть влево', rr: 'Повернуть вправо', full: 'Развернуть на весь экран', exit: 'Свернуть' },
  id: { zin: 'Perbesar', zout: 'Perkecil', rl: 'Putar ke kiri', rr: 'Putar ke kanan', full: 'Perluas ke layar penuh', exit: 'Keluar dari layar penuh' },
  fr: { zin: 'Zoomer', zout: 'Dézoomer', rl: 'Tourner à gauche', rr: 'Tourner à droite', full: 'Agrandir en plein écran', exit: 'Quitter le plein écran' },
  es: { zin: 'Acercar', zout: 'Alejar', rl: 'Girar a la izquierda', rr: 'Girar a la derecha', full: 'Ampliar a pantalla completa', exit: 'Salir de pantalla completa' },
  uk: { zin: 'Наблизити', zout: 'Віддалити', rl: 'Повернути ліворуч', rr: 'Повернути праворуч', full: 'Розгорнути на весь екран', exit: 'Згорнути' },
  it: { zin: 'Ingrandisci', zout: 'Riduci', rl: 'Ruota a sinistra', rr: 'Ruota a destra', full: 'Espandi a schermo intero', exit: 'Esci dallo schermo intero' },
  tr: { zin: 'Yakınlaştır', zout: 'Uzaklaştır', rl: 'Sola döndür', rr: 'Sağa döndür', full: 'Tam ekrana genişlet', exit: 'Tam ekrandan çık' },
  nl: { zin: 'Inzoomen', zout: 'Uitzoomen', rl: 'Naar links draaien', rr: 'Naar rechts draaien', full: 'Volledig scherm openen', exit: 'Volledig scherm sluiten' },
};
const ICO = {
  zin: 'M8 3v10M3 8h10', zout: 'M3 8h10',
  rl: 'M13 10c0-3-2.2-5-5-5s-5 2-5 5M3 10 1.5 8M3 10l2-1.5', rr: 'M3 10c0-3 2.2-5 5-5s5 2 5 5M13 10l1.5-2M13 10l-2-1.5',
  cube: 'M8 1.8l5.5 3.1v6.2L8 14.2l-5.5-3.1V4.9ZM2.5 4.9 8 8l5.5-3.1M8 8v6.2',
  full: 'M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10', exit: 'M6 2.5V6H2.5M10 2.5V6h3.5M13.5 10H10v3.5M2.5 10H6v3.5',
};
const svg16 = d => `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
function zoomBy(k) {
  invalidate();
  const off = camera.position.clone().sub(controls.target), r0 = off.length();
  const r1 = THREE.MathUtils.clamp(r0 * k, controls.minDistance, controls.maxDistance);
  animateTo(controls.target.clone().add(off.setLength(r1)), controls.target.clone());
  fly.arc = [r0, r1];
}
// поворот по дуге, а не по хорде: иначе посреди поворота камера ныряет к центру
function rotateBy(deg) {
  invalidate();
  const off = camera.position.clone().sub(controls.target), r = off.length();
  off.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(deg));
  animateTo(controls.target.clone().add(off), controls.target.clone());
  fly.arc = [r, r];
}
const ctrl = document.getElementById('m3dCtrl');
const fb = document.createElement('button');
fb.type = 'button'; fb.className = 'm3d-ctrl-full';
let full = false, fullHome = null, fullNext = null;
function paintCtrl() {
  const t = VL[lang] || VL.en, k = full ? 'exit' : 'full';
  ctrl.innerHTML = ['zin', 'zout', 'rl', 'rr'].map(a => `<button type="button" data-act="${a}" aria-label="${t[a]}" title="${t[a]}">${svg16(ICO[a])}</button>`).join('');
  fb.innerHTML = svg16(ICO[k]) + `<span>${t[k]}</span>`; fb.setAttribute('aria-label', t[k]);
  placeFull();
}
// на ПК кнопка в правом верхнем углу, чипы сверху уступают ей место; на телефоне иконкой над столбиком справа
function placeFull() {
  const mob = innerWidth < 761;
  if (mob) ctrl.prepend(fb); else if (fb.parentNode !== wrap) wrap.appendChild(fb);
  wrap.style.setProperty('--fbw', mob ? '0px' : fb.offsetWidth + 8 + 'px');
}
addEventListener('resize', placeFull);
paintCtrl();
ctrl.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  ({ zin: () => zoomBy(0.7), zout: () => zoomBy(1.4), rl: () => rotateBy(90), rr: () => rotateBy(-90) })[b.dataset.act]();
});
function setFull(on) {
  full = on;
  // у предков есть transform от появления блока, fixed внутри них не на весь экран: выносим в body
  if (on) { fullHome = wrap.parentNode; fullNext = wrap.nextSibling; document.body.appendChild(wrap); }
  else if (fullHome) fullHome.insertBefore(wrap, fullNext);
  wrap.classList.toggle('is-full', on);
  document.documentElement.classList.toggle('m3d-lock', on);
  canvas.style.touchAction = on ? 'none' : 'pan-y';
  controls.enableZoom = on || coarse;
  paintCtrl();
  syncPreview();
  if (!on) wrap.scrollIntoView({ block: 'center' });
  // до загрузки модели общий вид считать не по чему: его посчитает сама загрузка
  setTimeout(() => { if (!unitList.length) return; resize(); if (!selected) homeView(); }, 60);
}
fb.addEventListener('click', () => setFull(!full));
// кнопки карточки ведут из макета на страницу (форма, планировки): из полноэкранного режима сперва выходим, иначе всё откроется под ним
card.addEventListener('click', e => { if (full && e.target.closest('[data-book],[data-similar],[data-plan]')) setFull(false); }, { capture: true });
// когда план впервые на экране и модель загружена, кнопка дважды мягко светится: зовёт в полноэкранный режим
if ('IntersectionObserver' in window) {
  const hintIO = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    hintIO.disconnect();
    const go = () => unitList.length ? fb.classList.add('is-hint') : setTimeout(go, 300);
    go();
  }, { threshold: 0.6 });
  hintIO.observe(wrap);
  fb.addEventListener('animationend', () => fb.classList.remove('is-hint'));
}
canvas.addEventListener('pointerleave', () => { if (full) controls.enableZoom = true; });
// колесо над меткой виллы или кнопкой уходило в неё, а не в макет: на весь экран приблизить к виллам было нельзя.
// Передаём его канвасу; карточку и таблицу с прокруткой не трогаем
wrap.addEventListener('wheel', e => {
  if (!controls.enableZoom || e.target === canvas || e.target.closest('.m3d-card, .iplan-table-wrap, .m3d-legend')) return;
  e.preventDefault();
  canvas.dispatchEvent(new WheelEvent('wheel', e));
}, { passive: false });
// в захвате, чтобы увидеть карточку открытой до того, как её закроет общий Escape
addEventListener('keydown', e => { if (e.key === 'Escape' && full && !card.classList.contains('is-open')) setFull(false); }, { capture: true });

/* телефон: в блоке на странице макет только картинка, палец листает страницу; изучать его зовём на весь экран */
const PV = {
  en: 'Explore the masterplan in 3D', ru: 'Изучить мастерплан в 3D', id: 'Jelajahi masterplan 3D', fr: 'Explorer le plan masse en 3D',
  es: 'Explorar el plan maestro en 3D', uk: 'Дослідити майстерплан у 3D', it: 'Esplora il masterplan in 3D', tr: 'Master planı 3D keşfedin', nl: 'Verken het masterplan in 3D',
};
const tableBtn = document.getElementById('iplanTableToggle');
const pv = document.createElement('div');
pv.className = 'm3d-preview';
pv.innerHTML = '<button type="button" class="m3d-pv-open"></button>';
wrap.appendChild(pv);
const pvOpen = pv.firstChild;
function paintPreview() { pvOpen.innerHTML = svg16(ICO.cube) + `<span>${PV[lang] || PV.en}</span>`; }
let mobPrev = null;
function syncPreview() {
  const on = innerWidth < 761 && !full;
  if (on === mobPrev) return;
  mobPrev = on;
  if (on && selected) select(null);
  wrap.classList.toggle('is-preview', on);
  controls.enabled = !on;
  canvas.style.touchAction = on ? 'auto' : full ? 'none' : 'pan-y';
  invalidate();
}
pv.addEventListener('click', () => setFull(true));
// таблица юнитов на странице, под полноэкранным макетом её не видно: сначала сворачиваем
if (tableBtn) tableBtn.addEventListener('click', () => { if (full) setFull(false); }, { capture: true });
addEventListener('resize', () => {
  const was = mobPrev;
  syncPreview();
  if (was !== mobPrev && unitList.length) homeView(true);
});
paintPreview();
syncPreview();
