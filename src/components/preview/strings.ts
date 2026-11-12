/*
 * The stand-in visitor app's own labels in the previewed language. Navigation and Pages do not exist yet (M6), so
 * the menu is a default one; its labels follow the language as a visitor app would. Greek and English, English
 * otherwise.
 */

export interface PreviewStrings {
  home: string;
  places: string;
  pois: string;
  routes: string;
  guides: string;
  events: string;
  search: string;
  searchPlaceholder: string;
  highlights: string;
  seeAll: string;
  menu: string;
  back: string;
  noResults: string;
  nothingYet: string;
  nothingInMode: string;
  language: string;
  play: string;
  playVideo: string;
}

const EN: PreviewStrings = {
  home: "Home",
  places: "Places",
  pois: "Points of interest",
  routes: "Routes",
  guides: "Guides",
  events: "Events",
  search: "Search",
  searchPlaceholder: "Search titles, summaries, and exhibit numbers",
  highlights: "Highlights",
  seeAll: "See all",
  menu: "Menu",
  back: "Back",
  noResults: "No results.",
  nothingYet: "Nothing here yet.",
  nothingInMode: "Nothing to show yet in this mode.",
  language: "Language",
  play: "Play",
  playVideo: "Play video",
};

const EL: PreviewStrings = {
  home: "Αρχική",
  places: "Τόποι",
  pois: "Σημεία",
  routes: "Διαδρομές",
  guides: "Οδηγοί",
  events: "Εκδηλώσεις",
  search: "Αναζήτηση",
  searchPlaceholder: "Αναζήτηση σε τίτλους, περιλήψεις και αριθμούς εκθεμάτων",
  highlights: "Ξεχωριστά",
  seeAll: "Όλα",
  menu: "Μενού",
  back: "Πίσω",
  noResults: "Κανένα αποτέλεσμα.",
  nothingYet: "Τίποτα ακόμη.",
  nothingInMode: "Τίποτα για προβολή ακόμη.",
  language: "Γλώσσα",
  play: "Αναπαραγωγή",
  playVideo: "Αναπαραγωγή βίντεο",
};

export function previewStrings(languageCode: string | null | undefined): PreviewStrings {
  return languageCode === "el" ? EL : EN;
}
