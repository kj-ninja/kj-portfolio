import type { Locale } from "./locales";

const en = {
  "site.name": "Krzysztof Jakubiak",
  "site.title": "Krzysztof Jakubiak — Frontend engineer",
  "site.description":
    "Frontend engineer building the interfaces of products that use AI. Lab: interview concepts taken apart with real code and sandboxes.",
  "skip.toContent": "Skip to content",

  "nav.primary": "Primary",
  "nav.home": "Home",
  "nav.lab": "Lab",
  "nav.notes": "Notes",
  "nav.about": "About",
  "nav.switchLocale": "Polski",
  "nav.switchLocaleShort": "PL",
  "theme.toggle": "Dark theme",

  "home.eyebrow": "Krzysztof Jakubiak · Wrocław",
  "home.headline.before": "Frontend engineer. I build the ",
  "home.headline.accent": "interfaces",
  "home.headline.after": " of products that use AI.",
  "home.lead": "Shipped products with real users, written up with the decisions, the failures and the numbers.",
  "home.cta.lab": "See the Lab",
  "home.cta.work": "Work",
  "home.now.label": "Now",
  "home.now.text":
    "Building Newsletter Stories: an app that turns my newsletter inbox into posts. Training for a half marathon in June 2027.",
  "home.work.label": "Work",
  "home.lab.label": "Lab",
  "home.lab.all": "All entries",
  "home.notes.label": "Notes",
  "home.notes.all": "All notes",

  "work.status.live": "live",
  "work.status.repo": "repo",
  "work.status.in-progress": "in progress",

  "lab.eyebrow": "Lab",
  "lab.title": "Frontend concepts that keep coming up in interviews, taken apart.",
  "lab.intro":
    "One concept per entry, one list. A plain explanation, real code, a sandbox you can click, and my own conclusions. No framework wars, no 40-minute reads.",
  "lab.count.all": "all",
  "lab.count.ready": "ready",
  "lab.count.building": "under construction",
  "lab.count.planned": "planned",
  "lab.status.ready": "ready",
  "lab.status.building": "under construction",
  "lab.status.planned": "planned",
  "lab.englishOnly": "English only for now",
  "lab.revisit.due": "due for review",
  "lab.footer": "Sources for each entry: the code itself, MDN, framework docs, and the newsletters I read.",

  "notes.eyebrow": "Notes",
  "notes.title": "Short write-ups of decisions and failures from building things.",
  "notes.empty": "Nothing here yet.",
  "notes.backToIndex": "All notes",

  "about.eyebrow": "About",
  "about.title": "Frontend engineer in Wrocław.",
  "about.text":
    "I build interfaces for products that use AI, and I write down what I learn while building my own. This site is the record.",
  "about.contact.label": "Reach me",
  "about.colophon.label": "Colophon",
  "about.colophon.text":
    "Astro, Tailwind, Cloudflare Workers. Inter Tight for headings, your system fonts for the rest. Source on GitHub.",

  "notFound.eyebrow": "404",
  "notFound.title": "Page not found",
  "notFound.text": "The page you were looking for does not exist.",
  "notFound.home": "Go to the home page",

  // consumer: Lab entry pages (plan 2)
  "meta.readingMinutes": "{n} min",
  "meta.sandbox": "sandbox",
} as const;

export type UiKey = keyof typeof en;
export type UiStrings = Record<UiKey, string>;

const pl: UiStrings = {
  "site.name": "Krzysztof Jakubiak",
  "site.title": "Krzysztof Jakubiak — Frontend engineer",
  "site.description":
    "Frontend engineer budujący interfejsy produktów opartych na AI. Lab: koncepty z rozmów rekrutacyjnych rozebrane na części, z kodem i sandboxami.",
  "skip.toContent": "Przejdź do treści",

  "nav.primary": "Główna",
  "nav.home": "Start",
  "nav.lab": "Lab",
  "nav.notes": "Notatki",
  "nav.about": "O mnie",
  "nav.switchLocale": "English",
  "nav.switchLocaleShort": "EN",
  "theme.toggle": "Ciemny motyw",

  "home.eyebrow": "Krzysztof Jakubiak · Wrocław",
  "home.headline.before": "Frontend engineer. Buduję ",
  "home.headline.accent": "interfejsy",
  "home.headline.after": " produktów, które używają AI.",
  "home.lead": "Produkty z prawdziwymi użytkownikami, opisane razem z decyzjami, porażkami i liczbami.",
  "home.cta.lab": "Zobacz Lab",
  "home.cta.work": "Projekty",
  "home.now.label": "Teraz",
  "home.now.text":
    "Buduję Newsletter Stories: aplikację, która zamienia skrzynkę z newsletterami w posty. Trenuję do półmaratonu w czerwcu 2027.",
  "home.work.label": "Projekty",
  "home.lab.label": "Lab",
  "home.lab.all": "Wszystkie wpisy",
  "home.notes.label": "Notatki",
  "home.notes.all": "Wszystkie notatki",

  "work.status.live": "działa",
  "work.status.repo": "repo",
  "work.status.in-progress": "w budowie",

  "lab.eyebrow": "Lab",
  "lab.title": "Koncepty frontendowe, które wracają na rozmowach rekrutacyjnych, rozebrane na części.",
  "lab.intro":
    "Jeden koncept na wpis, jedna lista. Proste wyjaśnienie, prawdziwy kod, klikalny sandbox i moje własne wnioski. Bez wojen o frameworki, bez 40-minutowych tekstów.",
  "lab.count.all": "wszystkie",
  "lab.count.ready": "gotowe",
  "lab.count.building": "w budowie",
  "lab.count.planned": "planowane",
  "lab.status.ready": "gotowe",
  "lab.status.building": "w budowie",
  "lab.status.planned": "planowane",
  "lab.englishOnly": "Na razie tylko po angielsku",
  "lab.revisit.due": "do powtórki",
  "lab.footer": "Źródła każdego wpisu: sam kod, MDN, dokumentacja frameworków i newslettery, które czytam.",

  "notes.eyebrow": "Notatki",
  "notes.title": "Krótkie zapisy decyzji i porażek z budowania rzeczy.",
  "notes.empty": "Jeszcze nic tu nie ma.",
  "notes.backToIndex": "Wszystkie notatki",

  "about.eyebrow": "O mnie",
  "about.title": "Frontend engineer z Wrocławia.",
  "about.text":
    "Buduję interfejsy produktów, które używają AI, i zapisuję, czego uczę się, budując własne. Ta strona jest tym zapisem.",
  "about.contact.label": "Kontakt",
  "about.colophon.label": "Kolofon",
  "about.colophon.text":
    "Astro, Tailwind, Cloudflare Workers. Inter Tight w nagłówkach, fonty systemowe w treści. Źródła na GitHubie.",

  "notFound.eyebrow": "404",
  "notFound.title": "Nie ma takiej strony",
  "notFound.text": "Strona, której szukasz, nie istnieje.",
  "notFound.home": "Wróć na stronę główną",

  // consumer: Lab entry pages (plan 2)
  "meta.readingMinutes": "{n} min",
  "meta.sandbox": "sandbox",
};

export const ui: Record<Locale, UiStrings> = { en, pl };

export function t(locale: Locale, key: UiKey, vars?: Record<string, string | number>): string {
  const template = ui[locale][key];
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.hasOwn(vars, name) ? String(vars[name]) : match,
  );
}
