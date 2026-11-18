// Content of the two audit Projects. Greek texts carry accents on purpose; Italian is deliberately sparse.
export const NAMES = { populated: "UX Audit – Populated", empty: "UX Audit – Empty" };

export const PLACES = [
  // key, parent, type, env, en, el, it, lat, lon
  ["athens", null, "DESTINATION", "OUTDOOR", "Athens Historic Centre", "Ιστορικό Κέντρο Αθήνας", "Centro storico di Atene", 37.9715, 23.7257],
  ["museum", "athens", "BUILDING", "INDOOR", "Acropolis Museum", "Μουσείο Ακρόπολης", "Museo dell'Acropoli", 37.9684, 23.7286],
  ["gf", "museum", "FLOOR", "INDOOR", "Ground Floor – Slopes Level", "Ισόγειο – Επίπεδο Πλαγιών", null, 37.9684, 23.7286],
  ["slopes", "gf", "ROOM", "INDOOR", "Excavation Hall of the Slopes", "Αίθουσα Ανασκαφής των Πλαγιών", null, 37.9683, 23.7285],
  ["archaic", "museum", "FLOOR", "INDOOR", "First Floor – Archaic Gallery", "Α΄ Όροφος – Αρχαϊκή Αίθουσα", "Primo piano – Sala arcaica", 37.9684, 23.7287],
  ["korai", "archaic", "ROOM", "INDOOR", "Room of the Korai", "Αίθουσα των Κορών", null, 37.9685, 23.7288],
  ["parthenon", "museum", "FLOOR", "INDOOR", "Parthenon Gallery", "Αίθουσα του Παρθενώνα", "Sala del Partenone", 37.9686, 23.7288],
  ["site", "athens", "SITE", "OUTDOOR", "Acropolis of Athens", "Ακρόπολη των Αθηνών", "Acropoli di Atene", 37.9715, 23.7257],
  ["propylaea", "site", "SITE", "OUTDOOR", "Propylaea and Temple of Athena Nike", "Προπύλαια και Ναός Αθηνάς Νίκης", null, 37.9717, 23.7247],
  ["theatre", "athens", "SITE", "OUTDOOR", "Theatre of Dionysus", "Θέατρο του Διονύσου", "Teatro di Dioniso", 37.9703, 23.7285],
  ["agora", "athens", "SITE", "OUTDOOR", "Ancient Agora of Athens", "Αρχαία Αγορά της Αθήνας", "Agorà antica di Atene", 37.9754, 23.7216],
  ["stoa", "agora", "BUILDING", "INDOOR", "Stoa of Attalos Museum", "Μουσείο Στοάς του Αττάλου", null, 37.9753, 23.7224],
];

export const CATEGORIES = [
  // key, parent, scope, icon, en, el, it
  ["monuments", null, "POI", "monument", "Monuments and Temples", "Μνημεία και Ναοί", "Monumenti e templi"],
  ["sculpture", null, "POI", "statue", "Sculpture", "Γλυπτική", "Scultura"],
  ["pottery", null, "POI", "vase", "Pottery and Everyday Life", "Κεραμική και Καθημερινή Ζωή", null],
  ["services", null, "POI", "info", "Visitor Services", "Υπηρεσίες Επισκεπτών", "Servizi per i visitatori"],
  ["food", "services", "POI", "food", "Food and Drink", "Φαγητό και Ποτό", null],
  ["shops", "services", "POI", "shop", "Shops", "Καταστήματα", null],
  ["views", null, "POI", "view", "Viewpoints", "Σημεία Θέας", null],
  ["walks", null, "ROUTE", "trail", "Guided Walks", "Περίπατοι με Ξενάγηση", "Passeggiate guidate"],
  ["family", "walks", "ROUTE", "family", "Family Trails", "Διαδρομές για Οικογένειες", null],
  ["cycling", "walks", "ROUTE", "bike", "Cycling Itineraries", "Ποδηλατικές Διαδρομές", null],
  ["themes", null, "ROUTE", "building", "Thematic Itineraries", "Θεματικά Δρομολόγια", null],
];

const LONG_EN1 = "Temporary Exhibitions Hall: “The Acropolis Through the Eyes of Travellers, Antiquarians and Photographers from the Seventeenth Century to Today”";
const LONG_EN2 = "Reception and Information Desk, Ticket Collection Point, Audio Guide Rental and Accessibility Assistance Counter (Ground Floor, Main Entrance)";
const LONG_EL = "Αίθουσα Προσωρινών Εκθέσεων: «Η Ακρόπολη μέσα από τα μάτια ταξιδιωτών, αρχαιοδιφών και φωτογράφων από τον δέκατο έβδομο αιώνα έως σήμερα»";
const LONG_EN3 = "Statue Base of Agrippa, the Monumental Pedestal Beside the Propylaea Originally Built for a Chariot Group Honouring Eumenes II of Pergamon";
const LONG_EN4 = "Church of the Holy Apostles of Solaki (c. 1000 AD), an Eleventh-Century Byzantine Cross-in-Square Church Restored by the American School in the 1950s";
const LONG_EN5 = "Choragic Monument of Thrasyllos – Cave Shrine Above the Theatre with the Statue of Dionysus Later Installed Within the Arch";

// key, place, category, en, el, it(title only or null), status, flags
// flags: wc working copy, t trigger kind (qr|geo|beacon), noGeo, media list, code
export const POIS = [
  ["frieze", "parthenon", "sculpture", "Parthenon Frieze – North Side", "Ζωφόρος του Παρθενώνα – Βόρεια Πλευρά", "Fregio del Partenone – lato nord", "ACTIVE", { wc: 1, t: "qr", media: ["hero", "gallery", "audio"] }],
  ["pediment", "parthenon", "sculpture", "East Pediment Fragments", "Αποσπάσματα του Ανατολικού Αετώματος", null, "ACTIVE", { t: "qr", media: ["hero"] }],
  ["metope", "parthenon", "sculpture", "South Metope XXXI: Centaur and Lapith", "Νότια Μετόπη ΧΧΧΙ: Κένταυρος και Λαπίθης", null, "ACTIVE", { wc: 1, media: ["hero", "gallery"] }],
  ["dionysos", "parthenon", "sculpture", "Dionysos, Hestia and Aphrodite", "Διόνυσος, Εστία και Αφροδίτη", "Dioniso, Estia e Afrodite", "ACTIVE", { media: ["hero", "video"] }],
  ["horsemen", "parthenon", "sculpture", "The Horsemen of the Panathenaic Procession", "Οι Ιππείς της Παναθηναϊκής Πομπής", null, "DRAFT", { noGeo: 1 }],
  ["copies", "parthenon", "sculpture", "Plaster Casts Display", "Έκθεση Γύψινων Αντιγράφων", null, "ARCHIVED", {}],
  ["moschophoros", "archaic", "sculpture", "Moschophoros (The Calf-Bearer)", "Μοσχοφόρος", "Moscoforo (il portatore di vitello)", "ACTIVE", { t: "qr", media: ["hero", "audio"] }],
  ["rampin", "archaic", "sculpture", "Rampin Rider", "Ιππέας Rampin", null, "ACTIVE", { wc: 1, media: ["hero"] }],
  ["hydra", "archaic", "sculpture", "Archaic Pediment: Herakles and the Hydra", "Αρχαϊκό Αέτωμα: Ηρακλής και Λερναία Ύδρα", null, "DRAFT", {}],
  ["typhon", "archaic", "sculpture", "Typhon, the Three-Bodied Daemon", "Τυφών, το Τρισώματο Τέρας", "Tifone, il demone dai tre corpi", "ACTIVE", { media: ["hero"] }],
  ["lions", "archaic", "sculpture", "Hekatompedon Pediment Lions", "Λέοντες του Εκατόμπεδου", null, "ACTIVE", { t: "geo" }],
  ["peplos", "korai", "sculpture", "Peplos Kore", "Κόρη του Πέπλου", "Kore con il peplo", "ACTIVE", { wc: 1, t: "qr", media: ["hero", "gallery", "audio"] }],
  ["chian", "korai", "sculpture", "Chian Kore (Kore 675)", "Χιώτισσα Κόρη (Κόρη 675)", null, "ACTIVE", { media: ["hero"] }],
  ["antenor", "korai", "sculpture", "Antenor Kore", "Κόρη του Αντήνορα", null, "DRAFT", { noGeo: 1 }],
  ["euthydikos", "korai", "sculpture", "Kore of Euthydikos", "Κόρη του Ευθυδίκου", null, "ACTIVE", {}],
  ["neighbourhood", "slopes", "pottery", "Excavated Athenian Neighbourhood", "Ανασκαμμένη Αθηναϊκή Γειτονιά", null, "ACTIVE", { t: "beacon", media: ["hero", "video"] }],
  ["household", "slopes", "pottery", "Classical Household Pottery", "Οικιακή Κεραμική της Κλασικής Εποχής", null, "DRAFT", {}],
  ["mosaic", "slopes", "pottery", "Bath Complex Floor Mosaic", "Ψηφιδωτό Δαπέδου Λουτρών", null, "ACTIVE", { wc: 1 }],
  ["reception", "gf", "services", LONG_EN2, "Υποδοχή και Γραφείο Πληροφοριών", null, "ACTIVE", { t: "qr", noGeo: 1 }],
  ["cloak", "gf", "services", "Cloakroom and Lockers", "Γκαρνταρόμπα και Ντουλάπια", null, "ARCHIVED", { noGeo: 1 }],
  ["shop", "gf", "shops", "Museum Shop", "Κατάστημα του Μουσείου", "Negozio del museo", "ACTIVE", { noGeo: 1, media: ["hero"] }],
  ["cafe", "museum", "food", "Museum Café – Terrace Restaurant", "Καφέ του Μουσείου – Εστιατόριο στην Ταράτσα", null, "ACTIVE", { media: ["hero"] }],
  ["terrace", "museum", "views", "Acropolis View Terrace", "Ταράτσα με Θέα στην Ακρόπολη", "Terrazza con vista sull'Acropoli", "ACTIVE", { t: "geo", media: ["hero"] }],
  ["tempexh", "museum", "services", LONG_EN1, LONG_EL, null, "DRAFT", {}],
  ["parthenon_t", "site", "monuments", "Parthenon (Temple of Athena Parthenos)", "Παρθενώνας (Ναός της Αθηνάς Παρθένου)", "Partenone (tempio di Atena Parthenos)", "ACTIVE", { wc: 1, t: "geo", media: ["hero", "gallery", "gallery", "audio"] }],
  ["erechtheion", "site", "monuments", "Erechtheion and the Porch of the Caryatids", "Ερέχθειο και Πρόστασις των Καρυάτιδων", "Eretteo e Loggia delle Cariatidi", "ACTIVE", { wc: 1, t: "qr", media: ["hero", "gallery", "audio"] }],
  ["nike", "propylaea", "monuments", "Temple of Athena Nike", "Ναός της Αθηνάς Νίκης", null, "ACTIVE", { t: "qr", media: ["hero"] }],
  ["propylaea_p", "propylaea", "monuments", "Propylaea Monumental Gateway", "Προπύλαια", "Propilei", "ACTIVE", { media: ["hero"] }],
  ["agrippa", "propylaea", "monuments", LONG_EN3, "Βάση του Αγρίππα", null, "ARCHIVED", {}],
  ["oldtemple", "site", "monuments", "Foundations of the Old Temple of Athena", "Θεμέλια του Αρχαίου Ναού της Αθηνάς", null, "DRAFT", { noGeo: 1 }],
  ["brauronia", "site", "monuments", "Sanctuary of Artemis Brauronia", "Ιερό της Βραυρωνίας Αρτέμιδος", null, "ARCHIVED", {}],
  ["chalkotheke", "site", "monuments", "Chalkotheke", "Χαλκοθήκη", null, "DRAFT", {}],
  ["orchestra", "theatre", "monuments", "Theatre of Dionysus Eleuthereus – Orchestra", "Θέατρο του Διονύσου Ελευθερέως – Ορχήστρα", "Teatro di Dioniso – Orchestra", "ACTIVE", { t: "geo", media: ["hero", "gallery"] }],
  ["bema", "theatre", "monuments", "Bema of Phaedrus", "Βήμα του Φαίδρου", null, "ACTIVE", {}],
  ["thrasyllos", "theatre", "monuments", LONG_EN5, "Χορηγικό Μνημείο του Θρασύλλου", null, "DRAFT", { noGeo: 1 }],
  ["hephaestus", "agora", "monuments", "Temple of Hephaestus", "Ναός του Ηφαίστου", "Tempio di Efesto", "ACTIVE", { wc: 1, t: "geo", media: ["hero", "gallery"] }],
  ["stoa_f", "agora", "monuments", "Stoa of Attalos (Facade)", "Στοά του Αττάλου (Όψη)", null, "ACTIVE", { media: ["hero"] }],
  ["solaki", "agora", "monuments", LONG_EN4, "Ναός των Αγίων Αποστόλων Σολάκη", null, "ACTIVE", { t: "qr" }],
  ["tholos", "agora", "monuments", "Tholos", "Θόλος", null, "ACTIVE", { t: "beacon" }],
  ["altar", "agora", "monuments", "Altar of the Twelve Gods", "Βωμός των Δώδεκα Θεών", null, "DRAFT", {}],
  ["gate", "agora", "services", "Ancient Agora Entrance and Ticket Office", "Είσοδος και Εκδοτήρια Αρχαίας Αγοράς", null, "ACTIVE", { t: "qr" }],
  ["ostraka", "stoa", "pottery", "Ostraka and the Ostracism Vote", "Όστρακα και Οστρακισμός", "Ostraka e ostracismo", "ACTIVE", { media: ["hero", "attachment"] }],
  ["klepsydra", "stoa", "pottery", "Klepsydra Water Clock", "Κλεψύδρα", null, "ACTIVE", { t: "beacon" }],
  ["kleroterion", "stoa", "pottery", "Kleroterion Allotment Machine", "Κληρωτήριο", null, "DRAFT", {}],
];

export const ROUTES = [
  // key, en, el, it, type, mode, diff, mins, meters, loop, status, cat, stops(poi keys)
  ["acro", "Acropolis Highlights – Classical Walk", "Κορυφαία της Ακρόπολης – Κλασικός Περίπατος", "Acropoli: il percorso classico", "OUTDOOR", "WALKING", "EASY", 90, 1600, false, "ACTIVE", "walks",
    ["propylaea_p", "nike", "parthenon_t", "erechtheion", "lions", "orchestra", "bema"]],
  ["museum", "Museum Masterpieces – One Hour Tour", "Αριστουργήματα του Μουσείου – Ξενάγηση μίας ώρας", null, "INDOOR", "WALKING", "EASY", 60, 700, false, "ACTIVE", "themes",
    ["neighbourhood", "moschophoros", "rampin", "typhon", "peplos", "chian", "frieze", "dionysos"]],
  ["agora", "Ancient Agora Archaeological Loop", "Αρχαιολογικός Κύκλος της Αρχαίας Αγοράς", null, "OUTDOOR", "WALKING", "MODERATE", 120, 2400, true, "DRAFT", "walks",
    ["gate", "hephaestus", "tholos", "stoa_f", "solaki"]],
  ["family", "Family Trail: Myths and Monsters", "Οικογενειακή Διαδρομή: Μύθοι και Τέρατα", "Percorso per famiglie: miti e mostri", "INDOOR", "WALKING", "EASY", 45, 500, false, "ACTIVE", "family",
    ["typhon", "metope", "dionysos", "peplos", "pediment"]],
  ["sunset", "Acropolis Slopes Sunset Stroll", "Βραδινός Περίπατος στις Πλαγιές της Ακρόπολης", null, "OUTDOOR", "WALKING", "EASY", 40, 1100, false, "DRAFT", "walks",
    ["terrace"]],
  ["old", "Old Town Walk (retired 2025)", "Περίπατος στην Παλιά Πόλη (αποσύρθηκε το 2025)", null, "OUTDOOR", "WALKING", "MODERATE", 150, 3800, false, "ARCHIVED", "walks",
    ["orchestra", "bema"]],
];

const S = {
  en: [
    "The visitor enters a hall where the light falls directly on the marble, bringing out the carved detail.",
    "Archaeologists date the piece to the middle of the fifth century BC, on the evidence of the style of its drapery.",
    "Traces of the original pigment survive in the folds, hinting at a vividly painted surface.",
    "A short walk from here, the monument can be seen in its original setting.",
    "The sculptor worked in Pentelic marble, quarried on the slopes of Mount Pentelikon north of the city.",
    "Restoration work in the twentieth century replaced several fragments with carefully matched stone.",
    "Ancient writers describe the processions that passed this spot on the way to the sanctuary.",
    "Look closely at the edge of the base, where a faint inscription records the dedicator.",
  ],
  el: [
    "Ο επισκέπτης εισέρχεται σε μια αίθουσα όπου το φως πέφτει απευθείας στο μάρμαρο και αναδεικνύει τις λεπτομέρειες της γλυπτικής.",
    "Οι αρχαιολόγοι χρονολογούν το έργο στα μέσα του 5ου αιώνα π.Χ., με βάση το ύφος της πτυχολογίας.",
    "Στις πτυχές σώζονται ίχνη του αρχικού χρώματος, που υποδηλώνουν μια έντονα ζωγραφισμένη επιφάνεια.",
    "Λίγα βήματα πιο πέρα, το μνημείο φαίνεται στο αρχικό του περιβάλλον.",
    "Ο γλύπτης εργάστηκε σε πεντελικό μάρμαρο, που εξορυσσόταν στις πλαγιές του Πεντελικού βόρεια της πόλης.",
    "Εργασίες αποκατάστασης τον 20ό αιώνα αντικατέστησαν αρκετά θραύσματα με προσεκτικά επιλεγμένη πέτρα.",
    "Αρχαίοι συγγραφείς περιγράφουν τις πομπές που περνούσαν από το σημείο αυτό προς το ιερό.",
    "Παρατηρήστε την άκρη της βάσης, όπου μια αχνή επιγραφή αναφέρει τον αναθέτη.",
  ],
};
export const SENT = S;
export function paras(lang, seed, n) {
  const a = S[lang]; return Array.from({ length: n }, (_, i) => a[(seed + i * 3) % a.length]);
}

export const GUIDES = [
  ["parthenon", "The Story of the Parthenon: From Temple to Monument", "Η Ιστορία του Παρθενώνα: Από Ναός σε Μνημείο", "La storia del Partenone", "ACTIVE", 18, 14],
  ["caryatids", "The Erechtheion and the Caryatids – A Visitor’s Companion", "Το Ερέχθειο και οι Καρυάτιδες – Ένας Οδηγός για τον Επισκέπτη", null, "ACTIVE", 16, 11],
  ["agora", "Everyday Life in the Ancient Agora", "Η Καθημερινή Ζωή στην Αρχαία Αγορά", null, "DRAFT", 14, 9],
  ["korai", "Reading the Archaic Korai: Colour, Gesture and Craft", "Διαβάζοντας τις Αρχαϊκές Κόρες: Χρώμα, Κίνηση και Τεχνική", "Leggere le korai arcaiche", "ACTIVE", 20, 15],
  ["museum", "A Short History of the Museum Building", "Σύντομη Ιστορία του Κτιρίου του Μουσείου", null, "ARCHIVED", 8, 5],
];

export const EVENTS = [
  // key, en, el, it, status, place, poi, route, occurrences [[start,end,status]]
  ["fullmoon", "Full Moon Night at the Acropolis", "Βράδυ Πανσελήνου στην Ακρόπολη", "Notte di luna piena all'Acropoli", "ACTIVE", "site", "parthenon_t", null,
    [["2026-12-04T17:00:00Z", "2026-12-04T20:00:00Z"], ["2027-01-03T17:30:00Z", "2027-01-03T20:30:00Z"], ["2027-02-01T18:00:00Z", "2027-02-01T21:00:00Z", "CANCELLED"], ["2027-03-03T18:00:00Z", "2027-03-03T21:00:00Z"]]],
  ["panathenaic", "Panathenaic Procession Reenactment", "Αναπαράσταση της Παναθηναϊκής Πομπής", null, "ACTIVE", "site", null, "acro",
    [["2027-05-15T08:00:00Z", "2027-05-15T12:00:00Z"]]],
  ["lateopening", "Late Opening: Friday Nights at the Museum", "Βραδινό Άνοιγμα: Παρασκευές στο Μουσείο", "Aperture serali: i venerdì al museo", "ACTIVE", "museum", null, "museum",
    Array.from({ length: 8 }, (_, i) => { const d = new Date(Date.UTC(2026, 10, 20 + i * 7)); const s = d.toISOString().slice(0, 10); return [`${s}T17:00:00Z`, `${s}T22:00:00Z`]; })],
  ["lamp", "Family Workshop: Make Your Own Clay Lamp", "Εργαστήριο για Οικογένειες: Φτιάξε το Δικό σου Πήλινο Λυχνάρι", null, "ACTIVE", "slopes", null, null,
    [["2026-11-28T09:30:00Z", "2026-11-28T11:30:00Z"], ["2026-12-12T09:30:00Z", "2026-12-12T11:30:00Z"]]],
  ["lectures", "Agora Archaeology Lecture Series", "Κύκλος Διαλέξεων Αρχαιολογίας στην Αρχαία Αγορά", null, "DRAFT", "stoa", null, null, []],
  ["concerts", "Summer Evening Concerts at the Theatre of Dionysus", "Καλοκαιρινές Βραδινές Συναυλίες στο Θέατρο του Διονύσου", null, "ACTIVE", "theatre", "orchestra", null,
    [["2027-07-10T18:00:00Z", "2027-07-10T20:30:00Z"], ["2027-07-24T18:00:00Z", "2027-07-24T20:30:00Z"], ["2027-08-07T18:00:00Z", "2027-08-07T20:30:00Z"]]],
  ["closed", "Gallery Closed for Conservation Works (ended)", "Κλειστή Αίθουσα λόγω Εργασιών Συντήρησης (ολοκληρώθηκε)", null, "ARCHIVED", "korai", null, null,
    [["2026-09-01T07:00:00Z", "2026-10-15T15:00:00Z"]]],
];

export const MAPS = [
  // internalName, placeKey, center, zoom, bounds [minLat,minLon,maxLat,maxLon], placements
  ["Acropolis and South Slope – visitor map", "site", [37.9715, 23.7262], 16, [37.9650, 23.7195, 37.9785, 23.7345], ["parthenon_t", "erechtheion", "nike", "propylaea_p", "lions", "orchestra", "bema", "terrace", "museum", "site"]],
  ["Ancient Agora – site map", "agora", [37.9754, 23.7216], 17, [37.9730, 23.7170, 37.9780, 23.7250], ["hephaestus", "stoa_f", "solaki", "tholos", "gate", "agora", "stoa"]],
];

export const FLOORPLANS = [
  ["Acropolis Museum – Parthenon Gallery plan", "parthenon", 1600, 1100, ["frieze", "pediment", "metope", "dionysos", "parthenon"]],
  ["Acropolis Museum – Archaic Gallery plan", "archaic", 1400, 1000, ["moschophoros", "rampin", "typhon", "lions", "korai", "peplos"]],
];

export const ASSETS = [
  // key, kind, name, w, h, mime, hue, en title, el title, en alt, el alt, it alt, status, extra
  ["a_parthenon_dawn", "image", "parthenon-west-dawn", 1920, 1080, "image/jpeg", 20, "Parthenon, west facade at dawn", "Παρθενώνας, δυτική όψη την αυγή", "The west facade of the Parthenon lit by early morning sun", "Η δυτική όψη του Παρθενώνα φωτισμένη από τον πρωινό ήλιο", "La facciata occidentale del Partenone all'alba", "ACTIVE"],
  ["a_frieze", "image", "frieze-detail", 1600, 900, "image/png", 35, "Frieze detail: horsemen", "Λεπτομέρεια ζωφόρου: ιππείς", "Marble relief of horsemen riding in procession", "Μαρμάρινο ανάγλυφο με ιππείς σε πομπή", null, "ACTIVE"],
  ["a_peplos", "image", "peplos-kore", 900, 1600, "image/jpeg", 330, "Peplos Kore", "Κόρη του Πέπλου", "A standing statue of a young woman in a woollen peplos", "Όρθιο άγαλμα νεαρής γυναίκας με μάλλινο πέπλο", "Statua di giovane donna con peplo", "ACTIVE"],
  ["a_erechtheion", "image", "erechtheion-caryatids", 1200, 1200, "image/png", 160, "The Porch of the Caryatids", "Η Πρόστασις των Καρυάτιδων", "Six maidens serving as columns on the south porch", "Έξι κόρες που λειτουργούν ως κίονες στη νότια πρόστασις", null, "ACTIVE"],
  ["a_agora", "image", "agora-hephaestus", 2400, 1600, "image/jpeg", 95, "Temple of Hephaestus from the Agora", "Ναός του Ηφαίστου από την Αγορά", "A well-preserved Doric temple above the Agora", "Καλοδιατηρημένος δωρικός ναός πάνω από την Αγορά", "Un tempio dorico ben conservato sopra l'Agorà", "ACTIVE"],
  ["a_theatre", "image", "theatre-dionysus", 1280, 720, "image/jpeg", 275, "Theatre of Dionysus, seating tiers", "Θέατρο του Διονύσου, κερκίδες", "Stone seating tiers curving around the orchestra", null, null, "ACTIVE"],
  ["a_nike", "image", "nike-temple", 800, 800, "image/png", 200, "Temple of Athena Nike", "Ναός της Αθηνάς Νίκης", "The small Ionic temple on the bastion", "Ο μικρός ιωνικός ναός στο προπύργιο", null, "ACTIVE"],
  ["a_rampin", "image", "rampin-rider", 700, 1000, "image/jpeg", 50, "Rampin Rider", "Ιππέας Rampin", "Head of a horseman with a wreath and carefully braided beard", null, null, "ACTIVE"],
  ["a_typhon", "image", "typhon", 1500, 1000, "image/png", 120, "Typhon pediment group", "Σύμπλεγμα Τυφώνα από αέτωμα", "A three-bodied serpent-tailed creature with painted beards", "Τρισώματο τέρας με φιδίσια ουρά και βαμμένα γένια", null, "DRAFT"],
  ["a_slopes", "image", "slopes-excavation", 1920, 1280, "image/jpeg", 70, "Excavation hall beneath the museum", "Αίθουσα ανασκαφής κάτω από το μουσείο", "Glass floor over the excavated ancient neighbourhood", "Γυάλινο δάπεδο πάνω από την ανασκαμμένη αρχαία γειτονιά", "Pavimento di vetro sopra il quartiere antico scavato", "ACTIVE"],
  ["a_ostrakon", "image", "ostrakon-themistocles", 640, 480, "image/jpeg", 15, "Ostrakon naming Themistocles", "Όστρακο με το όνομα του Θεμιστοκλή", "A pottery shard scratched with the name Themistokles", null, null, "ACTIVE"],
  ["a_klepsydra", "image", "klepsydra", 480, 640, "image/png", 190, "Klepsydra water clock", "Κλεψύδρα", "Terracotta vessel with a small spout near the base", "Πήλινο αγγείο με μικρό στόμιο κοντά στη βάση", null, "ACTIVE"],
  ["a_cafe", "image", "terrace-cafe", 1600, 1067, "image/jpeg", 10, "Terrace café with Acropolis view", "Καφέ στην ταράτσα με θέα στην Ακρόπολη", "Tables on a terrace facing the rock of the Acropolis", null, null, "DRAFT"],
  ["a_shop", "image", "museum-shop", 1024, 768, "image/jpeg", 300, "Museum shop interior", "Εσωτερικό του καταστήματος", null, null, null, "ACTIVE"],
  ["a_map_thumb", "image", "tiny-thumbnail", 120, 90, "image/png", 240, "Tiny thumbnail", "Μικρογραφία", "Very small thumbnail image", null, null, "ACTIVE"],
  ["a_panorama", "image", "acropolis-panorama", 4200, 1000, "image/jpeg", 40, "Panorama of the Acropolis from Filopappou Hill", "Πανόραμα της Ακρόπολης από τον λόφο Φιλοπάππου", "Wide view of the Acropolis rock at sunset", "Πανοραμική θέα του βράχου της Ακρόπολης το ηλιοβασίλεμα", null, "ACTIVE"],
  ["a_border", "image", "meander-border", 1200, 120, "image/png", 210, "Decorative meander border", "Διακοσμητικό μαίανδρο", null, null, null, "ACTIVE", { decorative: true }],
  ["a_noalt", "image", "storeroom-shelves", 1100, 700, "image/jpeg", 260, "Conservation storeroom shelves", null, null, null, null, "ACTIVE"],
  ["fp_parthenon", "plan", "plan-parthenon-gallery", 1600, 1100, "image/png", 0, "Parthenon Gallery floor plan", "Κάτοψη της Αίθουσας του Παρθενώνα", "Schematic floor plan of the Parthenon Gallery", "Σχηματική κάτοψη της Αίθουσας του Παρθενώνα", null, "ACTIVE"],
  ["fp_archaic", "plan", "plan-archaic-gallery", 1400, 1000, "image/png", 0, "Archaic Gallery floor plan", "Κάτοψη της Αρχαϊκής Αίθουσας", "Schematic floor plan of the Archaic Gallery", null, null, "ACTIVE"],
  ["au_frieze", "audio", "audio-frieze-en", 6, 330, "audio/wav", 0, "Audio: reading the Parthenon frieze", "Ήχος: ανάγνωση της ζωφόρου του Παρθενώνα", null, null, null, "ACTIVE", { transcript: "The Panathenaic procession winds along all four sides of the temple. Follow the horsemen from the west end towards the gods seated above the entrance." }],
  ["au_peplos", "audio", "audio-peplos-kore", 5, 392, "audio/wav", 0, "Audio: the Peplos Kore", "Ήχος: η Κόρη του Πέπλου", null, null, null, "ACTIVE", { transcript: "Once called the Peplos Kore, this statue is now thought to represent a goddess. Notice the traces of red on the dress." }],
  ["au_parthenon", "audio", "audio-parthenon-overview", 8, 262, "audio/wav", 0, "Audio: Parthenon overview", "Ήχος: επισκόπηση του Παρθενώνα", null, null, null, "ACTIVE"],
  ["au_erechtheion", "audio", "audio-erechtheion", 4, 440, "audio/wav", 0, "Audio: the Erechtheion", "Ήχος: το Ερέχθειο", null, null, null, "DRAFT", { transcript: "A complex temple built on uneven ground to shelter several ancient cults." }],
  ["au_moschophoros", "audio", "audio-moschophoros", 3, 294, "audio/wav", 0, "Audio: the Calf-Bearer", "Ήχος: ο Μοσχοφόρος", null, null, null, "ACTIVE"],
  ["au_ambient", "audio", "ambient-agora", 10, 220, "audio/wav", 0, "Ambient sound of the Agora", "Ατμοσφαιρικός ήχος της Αγοράς", null, null, null, "ACTIVE"],
  ["v_dionysos", "video", "video-dionysos-restoration", 3, 120, "video/webm", 0, "Video: restoring the east pediment", "Βίντεο: αποκατάσταση του ανατολικού αετώματος", null, null, null, "ACTIVE"],
  ["v_slopes", "video", "video-slopes-tour", 4, 200, "video/webm", 0, "Video: walking through the excavation hall", "Βίντεο: περιήγηση στην αίθουσα ανασκαφής", null, null, null, "ACTIVE"],
  ["v_clip", "video", "video-conservation-clip", 2, 300, "video/webm", 0, "Video: conservation studio clip", "Βίντεο: στιγμιότυπο από το εργαστήριο συντήρησης", null, null, null, "DRAFT"],
  ["d_map", "pdf", "visitor-map-printable.pdf", 0, 0, "application/pdf", 0, "Printable visitor map (A4)", "Εκτυπώσιμος χάρτης επισκεπτών (A4)", null, null, null, "ACTIVE"],
  ["d_access", "pdf", "accessibility-guide.pdf", 0, 0, "application/pdf", 0, "Accessibility guide for visitors", "Οδηγός προσβασιμότητας για επισκέπτες", null, null, null, "ACTIVE"],
  ["d_press", "pdf", "press-kit-2026.pdf", 0, 0, "application/pdf", 0, "Press kit 2026", "Φάκελος τύπου 2026", null, null, null, "ARCHIVED"],
  ["d_notes", "text", "curatorial-notes.txt", 0, 0, "text/plain", 0, "Curatorial notes (plain text)", "Επιμελητικές σημειώσεις (απλό κείμενο)", null, null, null, "DRAFT"],
];
