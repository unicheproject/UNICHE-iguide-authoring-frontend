/*
 * The stand-in visitor app's own labels in the previewed language (D-082). Navigation and Pages do not exist yet (M6),
 * so the menu is a default one; its labels follow the language as a visitor app would. Greek, Italian, French, German,
 * and Spanish are written out; any other language shows English, which is what the runtime falls back to as well.
 * `words` translates the headings and fact labels the model builders write in English (`workspace/previewModels.ts`
 * and the editors), so a Greek preview shows "Επίσκεψη 5 λεπτά" and not "Visit 5 min". The notes for the author
 * ("Missing in Greek; shows English") are not visitor words and stay English.
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
  open: string;
  dismiss: string;
  /** "Opened by QR code {code}" as the note over a screen a QR scan opened. */
  openedByQr: (code: string) => string;
  /** "Nearby: {title}" as the suggestion a beacon or area gives. */
  nearby: (title: string) => string;
  notShownInMode: string;
  minutes: string;
  kilometres: string;
  noTitle: string;
  unavailableImage: string;
  /** English heading or label to its visitor-facing word. */
  words: Record<string, string>;
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
  open: "Open",
  dismiss: "Dismiss",
  openedByQr: (code) => `Opened by QR code ${code}`,
  nearby: (title) => `Nearby: ${title}`,
  notShownInMode: "What this trigger opens is not shown in this mode.",
  minutes: "min",
  kilometres: "km",
  noTitle: "No title",
  unavailableImage: "Unavailable image",
  words: {},
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
  open: "Άνοιγμα",
  dismiss: "Κλείσιμο",
  openedByQr: (code) => `Άνοιξε με κωδικό QR ${code}`,
  nearby: (title) => `Κοντά σας: ${title}`,
  notShownInMode: "Αυτό που ανοίγει ο ενεργοποιητής δεν εμφανίζεται σε αυτή τη λειτουργία.",
  minutes: "λεπτά",
  kilometres: "χλμ",
  noTitle: "Χωρίς τίτλο",
  unavailableImage: "Μη διαθέσιμη εικόνα",
  words: {
    Visit: "Επίσκεψη",
    Duration: "Διάρκεια",
    Reading: "Ανάγνωση",
    "No.": "Αρ.",
    Distance: "Απόσταση",
    Difficulty: "Δυσκολία",
    Accessibility: "Προσβασιμότητα",
    "When you are there": "Όταν βρίσκεστε εκεί",
    "Before you start": "Πριν ξεκινήσετε",
    Stops: "Στάσεις",
    "Part of": "Μέρος του",
    "Places inside": "Τόποι μέσα",
    "Points of interest here": "Σημεία ενδιαφέροντος εδώ",
    Events: "Εκδηλώσεις",
    Where: "Πού",
    "On these routes": "Σε αυτές τις διαδρομές",
    Dates: "Ημερομηνίες",
    "See also": "Δείτε επίσης",
    Book: "Κράτηση",
    Loop: "Κυκλική",
    Cancelled: "Ακυρώθηκε",
    Place: "Τόπος",
    "Point of interest": "Σημείο ενδιαφέροντος",
    Route: "Διαδρομή",
    Guide: "Οδηγός",
    Event: "Εκδήλωση",
    Video: "Βίντεο",
    Audio: "Ήχος",
  },
};

const IT: PreviewStrings = {
  home: "Home",
  places: "Luoghi",
  pois: "Punti di interesse",
  routes: "Percorsi",
  guides: "Guide",
  events: "Eventi",
  search: "Cerca",
  searchPlaceholder: "Cerca in titoli, riassunti e numeri delle opere",
  highlights: "In evidenza",
  seeAll: "Vedi tutto",
  menu: "Menu",
  back: "Indietro",
  noResults: "Nessun risultato.",
  nothingYet: "Ancora niente.",
  nothingInMode: "Ancora niente da mostrare in questa modalità.",
  language: "Lingua",
  play: "Riproduci",
  playVideo: "Riproduci video",
  open: "Apri",
  dismiss: "Chiudi",
  openedByQr: (code) => `Aperto dal codice QR ${code}`,
  nearby: (title) => `Nelle vicinanze: ${title}`,
  notShownInMode: "Ciò che questo innesco apre non è mostrato in questa modalità.",
  minutes: "min",
  kilometres: "km",
  noTitle: "Senza titolo",
  unavailableImage: "Immagine non disponibile",
  words: {
    Visit: "Visita",
    Duration: "Durata",
    Reading: "Lettura",
    "No.": "N.",
    Distance: "Distanza",
    Difficulty: "Difficoltà",
    Accessibility: "Accessibilità",
    "When you are there": "Quando sei lì",
    "Before you start": "Prima di iniziare",
    Stops: "Tappe",
    "Part of": "Parte di",
    "Places inside": "Luoghi all'interno",
    "Points of interest here": "Punti di interesse qui",
    Events: "Eventi",
    Where: "Dove",
    "On these routes": "In questi percorsi",
    Dates: "Date",
    "See also": "Vedi anche",
    Book: "Prenota",
    Loop: "Ad anello",
    Cancelled: "Annullato",
    Place: "Luogo",
    "Point of interest": "Punto di interesse",
    Route: "Percorso",
    Guide: "Guida",
    Event: "Evento",
    Video: "Video",
    Audio: "Audio",
  },
};

const FR: PreviewStrings = {
  home: "Accueil",
  places: "Lieux",
  pois: "Points d'intérêt",
  routes: "Parcours",
  guides: "Guides",
  events: "Événements",
  search: "Rechercher",
  searchPlaceholder: "Rechercher dans les titres, résumés et numéros d'œuvres",
  highlights: "À la une",
  seeAll: "Tout voir",
  menu: "Menu",
  back: "Retour",
  noResults: "Aucun résultat.",
  nothingYet: "Rien pour l'instant.",
  nothingInMode: "Rien à afficher pour l'instant dans ce mode.",
  language: "Langue",
  play: "Lecture",
  playVideo: "Lire la vidéo",
  open: "Ouvrir",
  dismiss: "Fermer",
  openedByQr: (code) => `Ouvert par le code QR ${code}`,
  nearby: (title) => `À proximité : ${title}`,
  notShownInMode: "Ce que ce déclencheur ouvre n'est pas affiché dans ce mode.",
  minutes: "min",
  kilometres: "km",
  noTitle: "Sans titre",
  unavailableImage: "Image indisponible",
  words: {
    Visit: "Visite",
    Duration: "Durée",
    Reading: "Lecture",
    "No.": "N°",
    Distance: "Distance",
    Difficulty: "Difficulté",
    Accessibility: "Accessibilité",
    "When you are there": "Une fois sur place",
    "Before you start": "Avant de commencer",
    Stops: "Étapes",
    "Part of": "Fait partie de",
    "Places inside": "Lieux à l'intérieur",
    "Points of interest here": "Points d'intérêt ici",
    Events: "Événements",
    Where: "Où",
    "On these routes": "Sur ces parcours",
    Dates: "Dates",
    "See also": "Voir aussi",
    Book: "Réserver",
    Loop: "Boucle",
    Cancelled: "Annulé",
    Place: "Lieu",
    "Point of interest": "Point d'intérêt",
    Route: "Parcours",
    Guide: "Guide",
    Event: "Événement",
    Video: "Vidéo",
    Audio: "Audio",
  },
};

const DE: PreviewStrings = {
  home: "Start",
  places: "Orte",
  pois: "Sehenswürdigkeiten",
  routes: "Routen",
  guides: "Führer",
  events: "Veranstaltungen",
  search: "Suche",
  searchPlaceholder: "Titel, Zusammenfassungen und Exponatnummern durchsuchen",
  highlights: "Highlights",
  seeAll: "Alle anzeigen",
  menu: "Menü",
  back: "Zurück",
  noResults: "Keine Ergebnisse.",
  nothingYet: "Noch nichts vorhanden.",
  nothingInMode: "In diesem Modus gibt es noch nichts zu zeigen.",
  language: "Sprache",
  play: "Abspielen",
  playVideo: "Video abspielen",
  open: "Öffnen",
  dismiss: "Schließen",
  openedByQr: (code) => `Mit QR-Code ${code} geöffnet`,
  nearby: (title) => `In der Nähe: ${title}`,
  notShownInMode: "Was dieser Auslöser öffnet, wird in diesem Modus nicht gezeigt.",
  minutes: "Min.",
  kilometres: "km",
  noTitle: "Ohne Titel",
  unavailableImage: "Bild nicht verfügbar",
  words: {
    Visit: "Besuch",
    Duration: "Dauer",
    Reading: "Lesezeit",
    "No.": "Nr.",
    Distance: "Entfernung",
    Difficulty: "Schwierigkeit",
    Accessibility: "Barrierefreiheit",
    "When you are there": "Wenn Sie dort sind",
    "Before you start": "Bevor Sie starten",
    Stops: "Stationen",
    "Part of": "Teil von",
    "Places inside": "Orte darin",
    "Points of interest here": "Sehenswürdigkeiten hier",
    Events: "Veranstaltungen",
    Where: "Wo",
    "On these routes": "Auf diesen Routen",
    Dates: "Termine",
    "See also": "Siehe auch",
    Book: "Buchen",
    Loop: "Rundweg",
    Cancelled: "Abgesagt",
    Place: "Ort",
    "Point of interest": "Sehenswürdigkeit",
    Route: "Route",
    Guide: "Führer",
    Event: "Veranstaltung",
    Video: "Video",
    Audio: "Audio",
  },
};

const ES: PreviewStrings = {
  home: "Inicio",
  places: "Lugares",
  pois: "Puntos de interés",
  routes: "Rutas",
  guides: "Guías",
  events: "Eventos",
  search: "Buscar",
  searchPlaceholder: "Buscar en títulos, resúmenes y números de piezas",
  highlights: "Destacados",
  seeAll: "Ver todo",
  menu: "Menú",
  back: "Atrás",
  noResults: "Sin resultados.",
  nothingYet: "Aún no hay nada.",
  nothingInMode: "Aún no hay nada que mostrar en este modo.",
  language: "Idioma",
  play: "Reproducir",
  playVideo: "Reproducir vídeo",
  open: "Abrir",
  dismiss: "Cerrar",
  openedByQr: (code) => `Abierto con el código QR ${code}`,
  nearby: (title) => `Cerca: ${title}`,
  notShownInMode: "Lo que abre este activador no se muestra en este modo.",
  minutes: "min",
  kilometres: "km",
  noTitle: "Sin título",
  unavailableImage: "Imagen no disponible",
  words: {
    Visit: "Visita",
    Duration: "Duración",
    Reading: "Lectura",
    "No.": "N.º",
    Distance: "Distancia",
    Difficulty: "Dificultad",
    Accessibility: "Accesibilidad",
    "When you are there": "Cuando estés allí",
    "Before you start": "Antes de empezar",
    Stops: "Paradas",
    "Part of": "Parte de",
    "Places inside": "Lugares en el interior",
    "Points of interest here": "Puntos de interés aquí",
    Events: "Eventos",
    Where: "Dónde",
    "On these routes": "En estas rutas",
    Dates: "Fechas",
    "See also": "Ver también",
    Book: "Reservar",
    Loop: "Circular",
    Cancelled: "Cancelado",
    Place: "Lugar",
    "Point of interest": "Punto de interés",
    Route: "Ruta",
    Guide: "Guía",
    Event: "Evento",
    Video: "Vídeo",
    Audio: "Audio",
  },
};

const BY_LANGUAGE: Record<string, PreviewStrings> = { el: EL, it: IT, fr: FR, de: DE, es: ES };

/** The labels for a language code (`el`, `el-GR`), English when none is written out. */
export function previewStrings(languageCode: string | null | undefined): PreviewStrings {
  const base = languageCode?.toLowerCase().split("-")[0] ?? "";
  return BY_LANGUAGE[base] ?? EN;
}

/** Whether the preview's own words exist in this language (otherwise the chrome shows English). */
export function hasPreviewStrings(languageCode: string | null | undefined): boolean {
  return (languageCode?.toLowerCase().split("-")[0] ?? "") in BY_LANGUAGE;
}

/** A heading or fact label in the previewed language; text it does not know (an author's own) is kept. */
export function word(t: PreviewStrings, text: string): string {
  return t.words[text] ?? text;
}

/** "5 min" or "1.2 km" with the unit in the previewed language. */
export function localizeUnits(t: PreviewStrings, text: string): string {
  return text.replace(/(\d)\s*min$/, `$1 ${t.minutes}`).replace(/(\d)\s*km$/, `$1 ${t.kilometres}`);
}
