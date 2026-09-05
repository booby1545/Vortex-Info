interface Localized {
  ru: string;
  en: string;
}

export interface Project {
  slug: string;
  title: string;
  description: Localized;
  stack: string[];
  githubUrl: string;
  liveUrl?: string;
  /** A desktop app has nothing to open in a tab — it has something to fetch.
   *  Separate from `liveUrl` so the button can say which one it is. */
  downloadUrl?: string;
  gif: string;
}

export const PROJECTS: Project[] = [
  {
    slug: "lumen",
    title: "Lumen",
    description: {
      ru: "Стеклянная музыкальная капсула для Windows 11 в духе Dynamic Island: висит поверх всего, показывает трек из любого источника с системными медиа-контролами и разворачивается по наведению. Синхронные тексты песен, громкость колёсиком прямо по кнопке на панели задач, буст выше 100% и бас-буст через перехват звука самого приложения, статус в Discord с обложкой, файлы для оверлея в OBS. Интерфейс на русском и английском. Один портативный exe на 4,4 МБ: без установщика, без телеметрии и без опроса системы в простое.",
      en: "A Dynamic Island-style glass music capsule for Windows 11: floats above everything, shows whatever is playing through the system media controls, and expands on hover. Time-synced lyrics, per-app volume by scrolling its taskbar button, boost past 100% and bass boost through a loopback tap on the app's own audio, Discord presence with cover art, and file output for an OBS overlay. English and Russian throughout. One portable 4.4 MB exe — no installer, no telemetry, nothing polled at idle.",
    },
    stack: ["Rust", "Tauri 2", "Svelte 5", "Windows API"],
    githubUrl: "https://github.com/flexeykinDev/lumen",
    downloadUrl: "https://github.com/flexeykinDev/lumen/releases/latest",
    gif: "/projects/lumen.gif",
  },
  {
    slug: "dota-counter-web",
    title: "The Counter Web",
    description: {
      ru: "Интерактивный force-directed граф контрпиков Dota 2 — 127 героев и 253 связи между ними. Клик по герою показывает, кто его контрит (саппорт-контра — синим, кор-контра — красным) и какой предмет для этого нужен. Живой фаззи-поиск по всей странице, зум, перетаскивание узлов. Полностью статический сайт — ни бэкенда, ни сборки, один index.html.",
      en: "An interactive force-directed graph of Dota 2 hero counter-picks — 127 heroes and 253 relationships between them. Click any hero to see who counters it (support counter in blue, core counter in red) and the item needed. Live fuzzy search across the whole page, pan/zoom, draggable nodes. Fully static — no backend, no build step, a single index.html.",
    },
    stack: ["D3.js", "Vanilla JS/CSS", "no build step"],
    githubUrl: "https://github.com/flexeykinDev/dota-counter-web",
    liveUrl: "https://flexeykindev.github.io/dota-counter-web/",
    gif: "/projects/dota-counter-web.gif",
  },
  {
    slug: "dbd-perk-randomizer",
    title: "DBD Perk Randomizer",
    description: {
      ru: "Рандомайзер билдов Dead by Daylight с полной русской локализацией (перки, персонажи, описания — синхронизируются с официальной wiki скриптами, а не забиты руками). Детерминированный Daily Challenge и свои сиды, режим Battle Royale (использованные перки выбывают из пула навсегда), локальная статистика роллов, экспорт билда картинкой и оверлей для трансляций с прямой синхронизацией из основной вкладки.",
      en: "A Dead by Daylight build randomizer with full Russian localization (perk names, characters, descriptions — synced from the official wiki via scripts, not hand-typed). Deterministic Daily Challenge and custom seeds, a Battle Royale mode (used perks permanently leave the pool), local roll statistics, build image export, and a stream overlay that mirrors the main tab in real time.",
    },
    stack: ["Next.js", "TypeScript", "Tailwind CSS", "Framer Motion"],
    githubUrl: "https://github.com/flexeykinDev/dbd-perk-randomizer",
    liveUrl: "https://flexeykindev.github.io/dbd-perk-randomizer/",
    gif: "/projects/dbd-perk-randomizer.gif",
  },
  {
    slug: "roflo-pinterest",
    title: "Roflo Pinterest Wallpaper",
    description: {
      ru: "Трей-приложение для Windows, которое тихо ставит на рабочий стол случайную ещё не показанную картинку из ленты или досок Pinterest — без повторов, пока пул не исчерпается. Есть готовый .exe без Python, авторизация через браузер прямо из трея и регистрация задач в Планировщике Windows для автообновления пула по расписанию.",
      en: "A Windows tray app that quietly sets a random, not-yet-shown picture from your Pinterest feed or boards as your desktop wallpaper — no repeats until the pool runs out. Ships as a standalone .exe (no Python needed), with browser login right from the tray icon and Windows Task Scheduler registration for automatic pool refreshes.",
    },
    stack: ["Python", "Playwright", "pystray", "PyInstaller"],
    githubUrl: "https://github.com/flexeykinDev/roflo-pinterest",
    gif: "/projects/roflo-pinterest.gif",
  },
];
