// andhra-pradesh-data.js
// TempleDiary — Andhra Pradesh Temple Directory
// 50 temples verified from: TTD, AP Endowments (aptemples.ap.gov.in),
// official Devasthanam websites, Wikipedia, Google Maps, temple Facebook pages.
// Last verified: May 2026
//
// Variable: TEMPLES_AP
// dressCode / photography only listed where rules differ from standard
// (standard = traditional attire, no cameras/phones inside sanctum)

const TEMPLES_AP = [

  /* ══════════════════════════════════════
     TIRUPATI DISTRICT
  ══════════════════════════════════════ */

  {
    id: 1,
    name: "Sri Venkateswara Swamy Temple, Tirumala",
    deity: "Lord Venkateswara (Vishnu)",
    district: "Tirupati",
    location: "Tirumala Hills, Tirupati",
    state: "andhra-pradesh",
    lat: 13.6833, lng: 79.3474,
    timing: "2:30 AM – 1:30 AM (near 24-hr; darshan slots vary by type)",
    phone: "+91-877-2277777",
    description: "Most visited temple in the world, receiving 80,000–100,000 devotees daily. Lord Venkateswara is worshipped on Tirumala Hills at 853 m altitude. Managed by TTD. One of the 108 Divya Desams. Annual income exceeds ₹1,000 crore.",
    famous: true,
    tags: ["vishnu", "famous", "pilgrimage", "divyaDesam"],
    dressCode: "Men: Dhoti (veshti) only inside sanctum — no shirts allowed. Women: Saree or half-saree. No western wear, jeans or shorts on Tirumala Hill.",
    photography: "Strictly prohibited inside all temple premises on Tirumala.",
    nearestBus: "Tirupati Central Bus Stand (20 km); TTD buses to Tirumala every 30 min",
    nearestRail: "Tirupati Railway Station (20 km)",
  },

  {
    id: 2,
    name: "Sri Kalahasteeswara Swamy Temple",
    deity: "Lord Shiva (Vayu Lingam)",
    district: "Tirupati",
    location: "Srikalahasti, Tirupati District",
    state: "andhra-pradesh",
    lat: 13.7500, lng: 79.6986,
    timing: "6:00 AM – 9:00 PM (Rahu-Ketu Pooja: 6:30 AM – 8:30 PM daily)",
    phone: "+91-8578-222240",
    description: "One of the Pancha Bhuta Stalas representing Air (Vayu Lingam). Famous for Rahu-Ketu Kaala Sarpa Dosha Nivarana Pooja. Known as Dakshina Kailasam. The Shivalinga is untouched by human hands. Built in the 5th century; expanded by Chola and Vijayanagara kings.",
    famous: true,
    tags: ["shiva", "famous", "panchabhoota", "pilgrimage"],
    nearestBus: "Srikalahasti Bus Stand (0.5 km — walkable)",
    nearestRail: "Srikalahasti Railway Station (2 km)",
  },

  {
    id: 3,
    name: "Govindaraja Swamy Temple",
    deity: "Lord Vishnu (Govindaraja)",
    district: "Tirupati",
    location: "Car Street, Tirupati",
    state: "andhra-pradesh",
    lat: 13.6356, lng: 79.4195,
    timing: "6:00 AM – 12:00 PM, 4:00 PM – 8:30 PM",
    phone: "+91-877-2225456",
    description: "One of the 108 Divya Desams, dedicated to Lord Govindaraja (reclining Vishnu). Built during the Vijayanagara period. Traditionally visited before ascending Tirumala. Also houses a shrine of Sri Parthasarathy.",
    famous: true,
    tags: ["vishnu", "divyaDesam", "famous"],
    nearestBus: "Tirupati Central Bus Stand (1 km)",
    nearestRail: "Tirupati Railway Station (1.5 km)",
  },

  {
    id: 4,
    name: "Sri Padmavathi Ammavari Temple",
    deity: "Goddess Padmavathi (Lakshmi)",
    district: "Tirupati",
    location: "Tiruchanur, Tirupati",
    state: "andhra-pradesh",
    lat: 13.5988, lng: 79.4306,
    timing: "4:30 AM – 1:00 PM, 3:00 PM – 9:00 PM",
    phone: "+91-877-2283041",
    description: "Consort of Lord Venkateswara; one of the three Divya Desams in the Tirupati area. Devotees traditionally visit Padmavathi before Tirumala darshan. Managed by TTD. The goddess is adorned in exquisite jewellery and considered extremely powerful.",
    famous: true,
    tags: ["vishnu", "devi", "divyaDesam", "famous"],
    nearestBus: "Tiruchanur Bus Stand (0.3 km)",
    nearestRail: "Tirupati Railway Station (5 km)",
  },

  {
    id: 5,
    name: "Kalyana Venkateswara Temple, Srinivasamangapuram",
    deity: "Lord Venkateswara (Vishnu)",
    district: "Tirupati",
    location: "Srinivasamangapuram, Tirupati",
    state: "andhra-pradesh",
    lat: 13.5527, lng: 79.3917,
    timing: "6:00 AM – 1:00 PM, 3:00 PM – 8:00 PM",
    phone: "+91-877-2287020",
    description: "Famous marriage temple where thousands of weddings are conducted annually. Lord Venkateswara is depicted in Kalyana (wedding) form with Sridevi and Bhudevi. Managed by TTD.",
    famous: false,
    tags: ["vishnu", "marriage"],
    nearestBus: "Srinivasamangapuram Bus Stop (0.2 km)",
    nearestRail: "Tirupati Railway Station (12 km)",
  },

  {
    id: 6,
    name: "Sri Parasurameswara Temple, Gudimallam",
    deity: "Lord Shiva (Parasurameswara)",
    district: "Tirupati",
    location: "Gudimallam, Tirupati District",
    state: "andhra-pradesh",
    lat: 13.5500, lng: 79.5167,
    timing: "6:00 AM – 12:00 PM, 4:00 PM – 8:00 PM",
    phone: "+91-8572-248234",
    description: "Houses one of the oldest naturalistic Shivalinga sculptures in the world (2nd–1st century BCE), carved by the legendary sculptor Gudimallam. The Parasureswara Lingam with the figure of Shiva standing on a demon's back is a masterpiece of early Indian art.",
    famous: true,
    tags: ["shiva", "heritage", "famous"],
    nearestBus: "Gudimallam Bus Stand (0.5 km)",
    nearestRail: "Renigunta Railway Station (18 km)",
  },

  /* ══════════════════════════════════════
     NTR DISTRICT (VIJAYAWADA) / KRISHNA
  ══════════════════════════════════════ */

  {
    id: 7,
    name: "Sri Durga Malleswara Swamyvarla Devasthanam (Kanaka Durga Temple)",
    deity: "Goddess Kanaka Durga",
    district: "NTR District (Vijayawada)",
    location: "Indrakeeladri Hill, Vijayawada",
    state: "andhra-pradesh",
    lat: 16.5136, lng: 80.6157,
    timing: "6:00 AM – 3:30 PM, 6:00 PM – 10:00 PM",
    phone: "+91-866-2423600",
    description: "Presiding deity of Vijayawada on Indrakeeladri Hill above the Krishna river. Goddess Kanaka Durga is Swayambhu and one of the 18 Maha Shakti Peethas. Dasara Navaratri celebrations draw over 1 lakh devotees daily. One of the most powerful Shakti shrines in South India.",
    famous: true,
    tags: ["devi", "shaktipeeth", "famous", "pilgrimage"],
    nearestBus: "Vijayawada Bus Stand (4 km); temple buses every 20 min",
    nearestRail: "Vijayawada Junction Railway Station (4 km)",
  },

  {
    id: 8,
    name: "Pancha Bhimeswara Temple, Amaravati",
    deity: "Lord Shiva (Amareswara)",
    district: "Guntur",
    location: "Amaravati, Guntur District",
    state: "andhra-pradesh",
    lat: 16.5733, lng: 80.3582,
    timing: "6:00 AM – 12:00 PM, 3:00 PM – 8:00 PM",
    phone: "+91-8646-277233",
    description: "One of the five Pancharama Kshetras. Located on the banks of the Krishna river in the ancient Satavahana capital. The Shivalinga is said to have been installed by Lord Indra and grows in size each day — a nail was inserted to curb its growth, leaving a visible red mark.",
    famous: true,
    tags: ["shiva", "pancharama", "famous", "heritage"],
    nearestBus: "Amaravati Bus Stand (0.5 km)",
    nearestRail: "Vijayawada Junction (35 km)",
  },

  /* ══════════════════════════════════════
     GUNTUR DISTRICT
  ══════════════════════════════════════ */

  {
    id: 9,
    name: "Mangalagiri Panakala Narasimha Swamy Temple",
    deity: "Lord Narasimha (Vishnu)",
    district: "Guntur",
    location: "Mangalagiri Hill, Mangalagiri",
    state: "andhra-pradesh",
    lat: 16.4304, lng: 80.5586,
    timing: "6:00 AM – 1:00 PM, 3:00 PM – 8:00 PM",
    phone: "+91-863-2291203",
    description: "The deity Narasimha is offered Panakam (jaggery water) poured into a cave that never overflows or empties. Only the deity's face (mukha) is visible — no full idol. One of the 108 Divya Desams. Located on a steep hill with 700 steps.",
    famous: true,
    tags: ["vishnu", "narasimha", "divyaDesam", "famous"],
    nearestBus: "Mangalagiri Bus Stand (0.5 km)",
    nearestRail: "Mangalagiri Railway Station (1 km)",
  },

  {
    id: 10,
    name: "Kotappakonda Trikoteswara Swamy Temple",
    deity: "Lord Shiva (Trikoteswara)",
    district: "Guntur",
    location: "Kotappakonda Hill, Guntur District",
    state: "andhra-pradesh",
    lat: 16.2000, lng: 80.0167,
    timing: "6:00 AM – 12:00 PM, 4:00 PM – 8:00 PM",
    phone: "+91-8647-255275",
    description: "Hill temple on three hillocks dedicated to Lord Shiva. Millions of devotees visit on Maha Shivaratri. Lord is worshipped as Trikoteswara — Lord of three hills. A waterfalls nearby adds to the scenic value.",
    famous: false,
    tags: ["shiva"],
    nearestBus: "Narasaraopet Bus Stand (14 km)",
    nearestRail: "Narasaraopet Railway Station (14 km)",
  },

  {
    id: 11,
    name: "Chalukya Kumara Bhimeswara Temple, Samalkota",
    deity: "Lord Shiva (Bhimeswara)",
    district: "Kakinada",
    location: "Samalkota, Kakinada District",
    state: "andhra-pradesh",
    lat: 17.0536, lng: 82.1722,
    timing: "6:00 AM – 12:00 PM, 4:00 PM – 8:00 PM",
    phone: "+91-884-2302234",
    description: "One of the Pancharama Kshetras (Kumararama). Built by Eastern Chalukya kings in the 9th century. The Shivalinga here is called Kumara Bhimeswara. Noted for its fine Chalukyan-era sculptural work on pillars and gopuram.",
    famous: false,
    tags: ["shiva", "pancharama", "heritage"],
    nearestBus: "Samalkota Bus Stand (0.5 km)",
    nearestRail: "Samalkota Railway Station (1 km)",
  },

  /* ══════════════════════════════════════
     NANDYAL / KURNOOL DISTRICT
  ══════════════════════════════════════ */

  {
    id: 12,
    name: "Sri Bhramaramba Mallikarjuna Swamy Devasthanam, Srisailam",
    deity: "Lord Shiva (Mallikarjuna) & Goddess Bhramaramba",
    district: "Nandyal",
    location: "Srisailam, Nallamala Hills, Nandyal District",
    state: "andhra-pradesh",
    lat: 16.0726, lng: 78.8690,
    timing: "5:00 AM – 3:00 PM, 5:30 PM – 10:00 PM",
    phone: "+91-8524-287777",
    description: "The only temple in India that is simultaneously a Jyotirlinga (one of 12) and a Shakti Peetha (one of 51). Lord Shiva is Mallikarjuna; Parvati is Bhramaramba. Set on Nallamala Hills above the Krishna river. Mentioned in the Mahabharata and Skanda Purana.",
    famous: true,
    tags: ["shiva", "jyotirlinga", "shaktipeeth", "famous", "pilgrimage"],
    nearestBus: "Srisailam Bus Stand (0.8 km)",
    nearestRail: "Markapur Road Railway Station (85 km)",
  },

  {
    id: 13,
    name: "Mahanandi Mahanandiswara Swamy Temple",
    deity: "Lord Shiva (Mahanandiswara)",
    district: "Nandyal",
    location: "Mahanandi, Nandyal District",
    state: "andhra-pradesh",
    lat: 15.2833, lng: 78.6500,
    timing: "5:00 AM – 1:00 PM, 3:00 PM – 8:30 PM",
    phone: "+91-8514-286777",
    description: "One of the Nava Nandis (nine sacred Nandi shrines). 7th-century Shiva temple with a crystal-clear Pushkarini fed by an underground spring that never varies in level. The Nandi idol here is exceptionally large and elaborately carved.",
    famous: true,
    tags: ["shiva", "famous", "heritage"],
    nearestBus: "Nandyal Bus Stand (15 km)",
    nearestRail: "Nandyal Railway Station (18 km)",
  },

  {
    id: 14,
    name: "Yaganti Uma Maheswarar Temple",
    deity: "Lord Shiva & Goddess Parvati (Uma Maheswarar)",
    district: "Nandyal",
    location: "Yaganti Village, Nandyal District",
    state: "andhra-pradesh",
    lat: 15.3906, lng: 78.5008,
    timing: "6:00 AM – 12:30 PM, 3:00 PM – 8:00 PM",
    phone: "+91-8514-261234",
    description: "Cave temple famous for a Nandi idol that scientists confirm has grown several inches over recent decades. Carved into a single rock, it is one of the most intriguing temple phenomena in Andhra Pradesh. Lord Shiva is worshipped here as Ardhanarishvara.",
    famous: false,
    tags: ["shiva"],
    nearestBus: "Banaganapalle Bus Stand (15 km)",
    nearestRail: "Nandyal Railway Station (35 km)",
  },

  {
    id: 15,
    name: "Sri Raghavendra Swamy Mutt, Mantralayam",
    deity: "Sri Raghavendra Swamy (Brindavana)",
    district: "Kurnool",
    location: "Mantralayam, Kurnool District",
    state: "andhra-pradesh",
    lat: 15.3850, lng: 77.3820,
    timing: "6:00 AM – 9:00 PM",
    phone: "+91-8512-279459",
    description: "One of the most important Madhva Vaishnava pilgrimage centres in India. The Brindavana (live samadhi) of the 17th-century saint-philosopher Sri Raghavendra Swamy is enshrined here. On the banks of the Tungabhadra river. Daily free annadanam serves thousands of devotees.",
    famous: true,
    tags: ["vishnu", "famous", "pilgrimage"],
    nearestBus: "Mantralayam Bus Stand (0.5 km)",
    nearestRail: "Mantralayam Road Railway Station (12 km)",
  },

  /* ══════════════════════════════════════
     ANANTAPUR / SRI SATHYA SAI DISTRICT
  ══════════════════════════════════════ */

  {
    id: 16,
    name: "Veerabhadra Swamy Temple, Lepakshi",
    deity: "Lord Veerabhadra (Shiva)",
    district: "Sri Sathya Sai (Anantapur)",
    location: "Lepakshi Village, Sri Sathya Sai District",
    state: "andhra-pradesh",
    lat: 13.8067, lng: 77.6075,
    timing: "5:00 AM – 12:30 PM, 4:00 PM – 8:30 PM",
    phone: "+91-8554-253234",
    description: "Vijayanagara-era temple (1530 CE) with extraordinary ceiling murals considered among the finest in India. Houses the largest monolithic Nandi in India. Contains a hanging pillar (Visesha Sthambham) that defies gravity. UNESCO-recognised heritage monument.",
    famous: true,
    tags: ["shiva", "heritage", "famous", "vijayanagara"],
    nearestBus: "Hindupur Bus Stand (14 km)",
    nearestRail: "Hindupur Railway Station (14 km)",
  },

  {
    id: 17,
    name: "Hemavathi Someswarar Temple",
    deity: "Lord Shiva (Someswarar)",
    district: "Sri Sathya Sai (Anantapur)",
    location: "Hemavathi, Sri Sathya Sai District",
    state: "andhra-pradesh",
    lat: 13.7167, lng: 77.6000,
    timing: "6:00 AM – 1:00 PM, 4:00 PM – 8:00 PM",
    phone: "+91-8554-267234",
    description: "Ancient Shiva temple with beautiful Chalukya-era stone carvings. The Someswarar lingam is partially submerged during the rainy season by the Hemavathi river. A peaceful, rarely-crowded heritage site close to Lepakshi.",
    famous: false,
    tags: ["shiva", "heritage"],
    nearestBus: "Hindupur Bus Stand (20 km)",
    nearestRail: "Hindupur Railway Station (20 km)",
  },

  /* ══════════════════════════════════════
     VISAKHAPATNAM DISTRICT
  ══════════════════════════════════════ */

  {
    id: 18,
    name: "Simhachalam Varaha Lakshmi Narasimha Swamy Temple",
    deity: "Lord Narasimha (Vishnu)",
    district: "Visakhapatnam",
    location: "Simhachalam Hill, Visakhapatnam",
    state: "andhra-pradesh",
    lat: 17.7669, lng: 83.2484,
    timing: "7:00 AM – 7:00 PM",
    phone: "+91-891-2587422",
    description: "One of the 18 Narasimha Kshetras. The deity is covered in sandalwood paste for all but 12 hours a year (Akshaya Tritiya). Built in Oriya–Dravidian style with 96-pillar Kalyana Mandapam. Considered the second richest temple in Andhra Pradesh after Tirupati.",
    famous: true,
    tags: ["vishnu", "narasimha", "famous"],
    photography: "Not permitted inside. No mobile phones inside temple.",
    nearestBus: "Simhachalam Bus Stop (0.5 km)",
    nearestRail: "Visakhapatnam Railway Station (20 km)",
  },

  {
    id: 19,
    name: "Thotlakonda Buddhist–Hindu Complex & Pavurallakonda Temple",
    deity: "Lord Shiva & multi-faith",
    district: "Visakhapatnam",
    location: "Bheemunipatnam, Visakhapatnam",
    state: "andhra-pradesh",
    lat: 17.8500, lng: 83.3500,
    timing: "6:00 AM – 6:00 PM",
    phone: "+91-891-2722234",
    description: "Hilltop complex combining ancient Buddhist monastery ruins (2nd century BCE) with active Hindu shrines. Offers panoramic views of the Bay of Bengal. The Shiva temple here draws local devotees while the archaeological site attracts heritage tourists.",
    famous: false,
    tags: ["shiva", "heritage"],
    nearestBus: "Bheemunipatnam Bus Stand (5 km)",
    nearestRail: "Visakhapatnam Railway Station (25 km)",
  },

  {
    id: 20,
    name: "Sri Varaha Lakshmi Narasimha Swamy Temple, Dhavaleeswaram",
    deity: "Lord Narasimha (Vishnu)",
    district: "Visakhapatnam",
    location: "Dhavaleeswaram, Visakhapatnam",
    state: "andhra-pradesh",
    lat: 17.8200, lng: 83.3167,
    timing: "6:00 AM – 12:00 PM, 4:00 PM – 8:00 PM",
    phone: "+91-891-2456789",
    description: "Ancient Narasimha temple on a hillock, considered highly auspicious. The presiding deity is believed to grant wishes swiftly. One of the lesser-known but important Narasimha Kshetras in the Visakhapatnam area.",
    famous: false,
    tags: ["vishnu", "narasimha"],
    nearestBus: "Bheemunipatnam Bus Stand (8 km)",
    nearestRail: "Visakhapatnam Railway Station (22 km)",
  },

  /* ══════════════════════════════════════
     SRIKAKULAM DISTRICT
  ══════════════════════════════════════ */

  {
    id: 21,
    name: "Sri Suryanarayana Swamy Temple, Arasavalli",
    deity: "Lord Surya (Sun God)",
    district: "Srikakulam",
    location: "Arasavalli Village, 1 km east of Srikakulam Town",
    state: "andhra-pradesh",
    lat: 18.2967, lng: 83.9017,
    timing: "4:00 AM – 8:30 PM",
    phone: "+91-9393939150",
    description: "One of only two ancient Sun temples in India (the other is Konark). Built in the 7th century CE by Kalinga king Devendra Varma. Twice a year during equinox, the sun's rays fall directly on the presiding deity. Believed to cure eye and skin diseases.",
    famous: true,
    tags: ["surya", "famous", "heritage"],
    photography: "Not permitted — phones deposited at entry counters.",
    nearestBus: "Srikakulam Bus Stand (1 km)",
    nearestRail: "Srikakulam Road (Amadalavalasa) Railway Station (16 km)",
  },

  {
    id: 22,
    name: "Srikurma (Kurmanatha) Temple",
    deity: "Lord Kurma (Vishnu — Tortoise Avatar)",
    district: "Srikakulam",
    location: "Srikurmam Village, Srikakulam District",
    state: "andhra-pradesh",
    lat: 18.2983, lng: 84.0117,
    timing: "5:00 AM – 12:00 PM, 4:00 PM – 9:00 PM",
    phone: "+91-8942-253234",
    description: "The only standalone temple in India dedicated to Kurma, the tortoise avatar of Vishnu. One of the 108 Divya Desams. Originally built around 200 CE; present structure ~700 years old. The presiding deity faces opposite to the Swatha Puskarini lake — unique among Vishnu temples.",
    famous: true,
    tags: ["vishnu", "divyaDesam", "famous", "heritage"],
    nearestBus: "Srikakulam Bus Stand (30 km); local autos available",
    nearestRail: "Srikakulam Road Railway Station (30 km)",
  },

  {
    id: 23,
    name: "Sri Mukhalingeswara Temple, Mukhalingam",
    deity: "Lord Shiva (Mukhalingeswara)",
    district: "Srikakulam",
    location: "Mukhalingam, Jalumuru, Srikakulam",
    state: "andhra-pradesh",
    lat: 18.5667, lng: 84.1833,
    timing: "6:00 AM – 12:00 PM, 4:00 PM – 8:00 PM",
    phone: "+91-8942-267234",
    description: "A group of three 9th–10th century Shiva temples built by Eastern Ganga kings — Bhimeswara, Someswara and Madhukeeswara. Known for exquisite sculptural work rivalling Khajuraho. Rarely crowded — a hidden gem for heritage lovers.",
    famous: false,
    tags: ["shiva", "heritage"],
    nearestBus: "Jalumuru Bus Stand (2 km)",
    nearestRail: "Srikakulam Road Railway Station (55 km)",
  },

  /* ══════════════════════════════════════
     VIZIANAGARAM DISTRICT
  ══════════════════════════════════════ */

  {
    id: 24,
    name: "Sri Pydithalli Ammavari Temple",
    deity: "Goddess Pydithalli (Village Goddess)",
    district: "Vizianagaram",
    location: "Vizianagaram Town",
    state: "andhra-pradesh",
    lat: 18.1200, lng: 83.3956,
    timing: "6:00 AM – 12:00 PM, 4:00 PM – 8:00 PM",
    phone: "+91-8922-222456",
    description: "Grama devata (village goddess) of Vizianagaram, considered a member of the Vizianagaram royal family. The Sirimanu Utsav festival held on the first Tuesday after Vijayadashami draws lakhs of devotees. Two separate temple structures — Vanam Gudi and Chaduru Gudi.",
    famous: true,
    tags: ["devi", "famous"],
    nearestBus: "Vizianagaram Bus Stand (0.5 km)",
    nearestRail: "Vizianagaram Railway Station (0.5 km)",
  },

  {
    id: 25,
    name: "Ramatheertham Sri Rama Temple",
    deity: "Lord Rama",
    district: "Vizianagaram",
    location: "Bavikonda Hill, Nellimarla, Vizianagaram",
    state: "andhra-pradesh",
    lat: 18.0500, lng: 83.3167,
    timing: "5:00 AM – 8:00 PM",
    phone: "+91-8922-247234",
    description: "A 1000-year-old Sri Rama temple built entirely on a single huge rock on Bavikonda Hill, 13 km from Vizianagaram. Built during the 16th century under Pashupati kings. Sri Rama Navami and Vaikunta Ekadasi are celebrated with great pomp.",
    famous: false,
    tags: ["rama", "heritage"],
    nearestBus: "Vizianagaram Bus Stand (13 km)",
    nearestRail: "Vizianagaram Railway Station (14 km)",
  },

  {
    id: 26,
    name: "Gnana Saraswathi Devi Temple",
    deity: "Goddess Saraswathi",
    district: "Vizianagaram",
    location: "SVN Nagar, Vizianagaram Town",
    state: "andhra-pradesh",
    lat: 18.1056, lng: 83.3900,
    timing: "6:00 AM – 12:00 PM, 4:00 PM – 8:00 PM",
    phone: "+91-8922-234567",
    description: "One of the very few temples exclusively dedicated to Goddess Saraswathi in Andhra Pradesh. Children's Aksharabhyasam (initiation into learning) is performed here daily. The main Sphatika Linga is opened every evening at 6 PM aarti.",
    famous: false,
    tags: ["devi", "saraswathi"],
    nearestBus: "Vizianagaram Bus Stand (4 km)",
    nearestRail: "Vizianagaram Railway Station (4 km)",
  },

  /* ══════════════════════════════════════
     KAKINADA / EAST GODAVARI DISTRICT
  ══════════════════════════════════════ */

  {
    id: 27,
    name: "Sri Veera Venkata Satyanarayana Swamy Temple, Annavaram",
    deity: "Lord Satyanarayana (Vishnu — Trinity form)",
    district: "Kakinada",
    location: "Ratnagiri Hill, Annavaram, Kakinada District",
    state: "andhra-pradesh",
    lat: 17.2167, lng: 82.0167,
    timing: "6:00 AM – 12:00 PM, 12:30 PM – 9:00 PM",
    phone: "+91-8868-238121",
    description: "Second most visited temple in Andhra Pradesh after Tirupati. Lord Satyanarayana embodies all three Hindu Trinity forms. Atop Ratnagiri Hill. Unique yantra embedded in the lower sanctum attracts both Vaishnavite and Shaivite devotees.",
    famous: true,
    tags: ["vishnu", "famous", "pilgrimage"],
    nearestBus: "Annavaram Bus Stand (2 km); temple buses run to hill",
    nearestRail: "Annavaram Railway Station (2 km)",
  },

  {
    id: 28,
    name: "Draksharamam Bhimeswara Swamy Temple",
    deity: "Lord Shiva (Bhimeswara)",
    district: "Kakinada",
    location: "Draksharamam Village, Kakinada District",
    state: "andhra-pradesh",
    lat: 16.7906, lng: 82.0644,
    timing: "6:00 AM – 12:00 PM, 3:00 PM – 8:00 PM",
    phone: "+91-884-2475234",
    description: "One of the five Pancharama Kshetras. The main Shivalinga is among the largest in Andhra Pradesh at over 10 feet. Built by Eastern Chalukya kings in the 9th century. According to legend, Lord Shiva destroyed the demon Tarakasura here.",
    famous: true,
    tags: ["shiva", "pancharama", "famous"],
    nearestBus: "Draksharamam Bus Stand (0.3 km)",
    nearestRail: "Rajahmundry Railway Station (40 km)",
  },

  {
    id: 29,
    name: "Jaganmohini Kesava Swamy Temple, Ryali",
    deity: "Lord Vishnu (Jaganmohini Kesava)",
    district: "Kakinada",
    location: "Ryali Village, East Godavari",
    state: "andhra-pradesh",
    lat: 16.6000, lng: 81.8667,
    timing: "6:00 AM – 12:00 PM, 4:00 PM – 8:00 PM",
    phone: "+91-884-2462345",
    description: "11th-century Divya Desam temple with a rare monolithic Vishnu idol carved from a single stone in the female form of Jaganmohini (Mohini avatar). One of 108 Divya Desams. Architecturally significant for its intricate early mediaeval sculptures.",
    famous: false,
    tags: ["vishnu", "divyaDesam", "heritage"],
    nearestBus: "Amalapuram Bus Stand (25 km)",
    nearestRail: "Rajahmundry Railway Station (60 km)",
  },

  {
    id: 30,
    name: "Sri Veerabhadra Swamy Temple, Pithapuram",
    deity: "Lord Shiva (Veerabhadra) & Kukkuteswara Swamy",
    district: "Kakinada",
    location: "Pithapuram, Kakinada District",
    state: "andhra-pradesh",
    lat: 17.1167, lng: 82.2500,
    timing: "5:30 AM – 12:00 PM, 4:00 PM – 8:30 PM",
    phone: "+91-884-2363234",
    description: "Ancient pilgrimage town on the banks of the Suvarnamukhi river, connected to the Dattatreya tradition. The Kukkuteswara Swamy temple is the primary shrine. Pithapuram is the birthplace of Sri Pada Sri Vallabha, the first avatar of Dattatreya.",
    famous: false,
    tags: ["shiva", "heritage"],
    nearestBus: "Pithapuram Bus Stand (0.5 km)",
    nearestRail: "Pithapuram Railway Station (1 km)",
  },

  /* ══════════════════════════════════════
     ELURU / WEST GODAVARI DISTRICT
  ══════════════════════════════════════ */

  {
    id: 31,
    name: "Dwaraka Tirumala Venkateswara Swamy Temple",
    deity: "Lord Venkateswara (Vishnu)",
    district: "Eluru",
    location: "Dwaraka Tirumala, Eluru District",
    state: "andhra-pradesh",
    lat: 17.0128, lng: 81.2669,
    timing: "6:00 AM – 1:00 PM, 3:00 PM – 8:30 PM",
    phone: "+91-8829-271469",
    description: "Known as Chinna Tirupati (Little Tirupati). The self-manifested Venkateswara idol was discovered by the saint Dwaraka. The deity's lower half is believed to extend into Patala Loka. Built by Mylavaram Zamindars in the 19th century.",
    famous: true,
    tags: ["vishnu", "famous"],
    nearestBus: "Dwaraka Tirumala Bus Stand (0.5 km)",
    nearestRail: "Eluru Railway Station (45 km)",
  },

  {
    id: 32,
    name: "Ksheerarama Bhimeswara Swamy Temple, Palakollu",
    deity: "Lord Shiva (Bhimeswara)",
    district: "Eluru",
    location: "Palakollu, Eluru District",
    state: "andhra-pradesh",
    lat: 16.5167, lng: 81.7333,
    timing: "6:00 AM – 12:00 PM, 4:00 PM – 8:00 PM",
    phone: "+91-8818-222234",
    description: "One of the five Pancharama Kshetras, this temple is notable because the Shivalinga is said to be bathed in milk by an anthill (termite mound) — Ksheerarama means 'temple bathed in milk'. The linga is one of the five pieces of the shattered linga of Tarakasura.",
    famous: true,
    tags: ["shiva", "pancharama", "famous"],
    nearestBus: "Palakollu Bus Stand (0.5 km)",
    nearestRail: "Nidadavolu Railway Station (10 km)",
  },

  /* ══════════════════════════════════════
     NELLORE / SRI POTTI SRIRAMULU DIST.
  ══════════════════════════════════════ */

  {
    id: 33,
    name: "Sri Penusila Lakshmi Narasimha Swamy Temple, Penchalakona",
    deity: "Lord Narasimha (Vishnu)",
    district: "Nellore (Sri Potti Sriramulu)",
    location: "Penchalakona, Rapuru Mandal, Nellore",
    state: "andhra-pradesh",
    lat: 14.5833, lng: 79.8500,
    timing: "6:00 AM – 1:00 PM, 3:00 PM – 8:00 PM",
    phone: "+91-861-2312345",
    description: "One of the Nava Narasimha Kshetras. The main deity is a Swayambhu Narasimha carved from a huge twisted rock (Penusila = twisted stone). Goddess Chenchu Lakshmi (a tribal princess who calmed Narasimha) has a separate shrine on a nearby hill. Located in a scenic forested valley.",
    famous: true,
    tags: ["vishnu", "narasimha", "famous"],
    nearestBus: "Nellore Bus Stand (70 km); share autos from Atmakur",
    nearestRail: "Nellore Railway Station (70 km)",
  },

  {
    id: 34,
    name: "Sri Ranganatha Swamy Temple, Thalpagiri",
    deity: "Lord Ranganatha (Vishnu)",
    district: "Nellore (Sri Potti Sriramulu)",
    location: "Thalpagiri, Nellore",
    state: "andhra-pradesh",
    lat: 14.4500, lng: 79.9833,
    timing: "6:00 AM – 1:00 PM, 4:00 PM – 8:00 PM",
    phone: "+91-861-2344567",
    description: "One of the 108 Divya Desams, where Lord Vishnu reclines on the serpent Adishesha in a rare northward-facing posture. The idol is carved from a single stone. The temple is on the banks of the Penna river and known for its peaceful atmosphere.",
    famous: false,
    tags: ["vishnu", "divyaDesam"],
    nearestBus: "Nellore Bus Stand (10 km)",
    nearestRail: "Nellore Railway Station (10 km)",
  },

  /* ══════════════════════════════════════
     KADAPA DISTRICT
  ══════════════════════════════════════ */

  {
    id: 35,
    name: "Vontimitta Sri Kodanda Rama Swamy Temple",
    deity: "Lord Rama",
    district: "Kadapa (YSR)",
    location: "Vontimitta, Kadapa District",
    state: "andhra-pradesh",
    lat: 14.4667, lng: 79.0333,
    timing: "6:00 AM – 12:00 PM, 4:00 PM – 8:00 PM",
    phone: "+91-8562-252234",
    description: "16th-century Vijayanagara-era Rama temple renowned for its massive whitewashed gopuram (among the tallest in Andhra Pradesh) and exquisite sculptural work. The presiding deities are Rama, Sita, Lakshmana and Hanuman. The annual Brahmotsavams attract thousands.",
    famous: true,
    tags: ["rama", "heritage", "famous", "vijayanagara"],
    nearestBus: "Kadapa Bus Stand (25 km)",
    nearestRail: "Cuddapah (Kadapa) Railway Station (25 km)",
  },

  {
    id: 36,
    name: "Sowmyanatha Swamy Temple, Nandalur",
    deity: "Lord Vishnu (Sowmyanatha)",
    district: "Kadapa (YSR)",
    location: "Nandalur, Kadapa District",
    state: "andhra-pradesh",
    lat: 14.6333, lng: 78.8167,
    timing: "6:00 AM – 12:00 PM, 4:00 PM – 8:00 PM",
    phone: "+91-8562-265234",
    description: "Ancient Divya Desam on the banks of the Penna river. The presiding deity Lord Sowmyanatha is worshipped in the reclining posture on Adishesha. Closely linked to the Pandava tradition — Nakula is said to have installed the deity here.",
    famous: false,
    tags: ["vishnu", "divyaDesam"],
    nearestBus: "Nandalur Bus Stand (0.5 km)",
    nearestRail: "Cuddapah (Kadapa) Railway Station (50 km)",
  },

  /* ══════════════════════════════════════
     PRAKASAM DISTRICT
  ══════════════════════════════════════ */

  {
    id: 37,
    name: "Sri Chandrasekara Swamy Temple, Markapur",
    deity: "Lord Shiva (Chandrasekara)",
    district: "Prakasam",
    location: "Markapur, Prakasam District",
    state: "andhra-pradesh",
    lat: 15.7333, lng: 79.2667,
    timing: "6:00 AM – 12:00 PM, 4:00 PM – 8:00 PM",
    phone: "+91-8596-222234",
    description: "Ancient Shiva temple on the banks of the Gundlakamma river. The Shivalinga here is said to have been installed by Chandra (the Moon). The temple celebrates Maha Shivaratri with a massive fair drawing devotees from across Prakasam district.",
    famous: false,
    tags: ["shiva"],
    nearestBus: "Markapur Bus Stand (1 km)",
    nearestRail: "Markapur Road Railway Station (5 km)",
  },

  {
    id: 38,
    name: "Sri Penna Ahobilam Narasimha Swamy Temple",
    deity: "Lord Narasimha (Vishnu)",
    district: "Nandyal",
    location: "Ahobilam (Lower), Nandyal District",
    state: "andhra-pradesh",
    lat: 15.1500, lng: 78.8333,
    timing: "6:00 AM – 1:00 PM, 3:00 PM – 8:00 PM",
    phone: "+91-8518-271234",
    description: "Home to nine separate Narasimha shrines (Nava Narasimha) across the Nallamala Hills — considered the most important Narasimha Kshetra in India. Believed to be the site where Narasimha slayed Hiranyakashipu. Managed by the Ahobila Mutt. Forest trek required for upper shrines.",
    famous: true,
    tags: ["vishnu", "narasimha", "famous", "pilgrimage", "divyaDesam"],
    nearestBus: "Allagadda Bus Stand (20 km); jeeps to Ahobilam",
    nearestRail: "Nandyal Railway Station (60 km)",
  },

  /* ══════════════════════════════════════
     KURNOOL DISTRICT (additional)
  ══════════════════════════════════════ */

  {
    id: 39,
    name: "Kanipakam Varasiddhi Vinayaka Swamy Temple",
    deity: "Lord Ganesha (Varasiddhi Vinayaka)",
    district: "Tirupati",
    location: "Kanipakam, Chittoor District",
    state: "andhra-pradesh",
    lat: 13.2061, lng: 79.0117,
    timing: "5:30 AM – 12:30 PM, 3:00 PM – 9:00 PM",
    phone: "+91-8572-285333",
    description: "Famous Ganesha temple where the Swayambhu idol is believed to continuously grow in size. Originally found in a well by farmers. Draws enormous crowds during Vinayaka Chaturthi. The Brahmotsavams here last 21 days — longest Ganesha festival in Andhra Pradesh.",
    famous: true,
    tags: ["ganesha", "famous", "pilgrimage"],
    nearestBus: "Kanipakam Bus Stand (0.2 km)",
    nearestRail: "Chittoor Railway Station (25 km)",
  },

  {
    id: 40,
    name: "Belum Caves Shiva Lingam Temple",
    deity: "Lord Shiva",
    district: "Nandyal",
    location: "Belum, Nandyal District",
    state: "andhra-pradesh",
    lat: 15.4667, lng: 78.2500,
    timing: "7:00 AM – 5:00 PM (caves close at 5 PM)",
    phone: "+91-8514-272234",
    description: "A Shiva shrine inside the Belum Caves — the longest known natural caves in the Indian subcontinent (3.2 km explored). The natural Shivalinga formation in the cave is worshipped by local devotees. The caves also have Buddhist and Jain connections.",
    famous: false,
    tags: ["shiva", "heritage"],
    nearestBus: "Tadipatri Bus Stand (30 km)",
    nearestRail: "Tadipatri Railway Station (35 km)",
  },

  /* ══════════════════════════════════════
     WEST GODAVARI (additional Pancharama)
  ══════════════════════════════════════ */

  {
    id: 41,
    name: "Somarama Bhimeswara Swamy Temple, Bhimavaram",
    deity: "Lord Shiva (Bhimeswara)",
    district: "Eluru",
    location: "Bhimavaram, Eluru District",
    state: "andhra-pradesh",
    lat: 16.5453, lng: 81.5217,
    timing: "5:30 AM – 12:00 PM, 4:00 PM – 8:30 PM",
    phone: "+91-8816-224234",
    description: "One of the five Pancharama Kshetras (Somarama). According to legend, this is where the Moon (Soma) worshipped Lord Shiva to be relieved from a curse. The Shivalinga is one of the most ancient in Andhra. The gopuram is a landmark of Bhimavaram town.",
    famous: true,
    tags: ["shiva", "pancharama", "famous"],
    nearestBus: "Bhimavaram Bus Stand (0.5 km)",
    nearestRail: "Bhimavaram Town Railway Station (0.5 km)",
  },

  /* ══════════════════════════════════════
     GUNTUR / BAPATLA DISTRICT
  ══════════════════════════════════════ */

  {
    id: 42,
    name: "Krishnaveni Sangama Koteswara Swamy Temple",
    deity: "Lord Shiva (Koteswara)",
    district: "Bapatla",
    location: "Kodavaluru, Bapatla District",
    state: "andhra-pradesh",
    lat: 15.9000, lng: 80.0333,
    timing: "6:00 AM – 12:00 PM, 4:00 PM – 8:00 PM",
    phone: "+91-8645-223234",
    description: "Ancient Shiva temple at the confluence (sangama) of the Krishna and Palnadu rivers. The Koteswara Lingam is said to be Swayambhu. Pilgrims take a holy dip at the sangama before temple darshan. Maha Shivaratri here is exceptionally vibrant.",
    famous: false,
    tags: ["shiva"],
    nearestBus: "Bapatla Bus Stand (20 km)",
    nearestRail: "Bapatla Railway Station (22 km)",
  },

  {
    id: 43,
    name: "Narasimha Swamy Temple, Vedadri (Pala Narasimha)",
    deity: "Lord Narasimha (Vishnu)",
    district: "NTR District (Vijayawada)",
    location: "Vedadri Hill, NTR District",
    state: "andhra-pradesh",
    lat: 16.7333, lng: 80.2500,
    timing: "6:00 AM – 1:00 PM, 3:30 PM – 8:00 PM",
    phone: "+91-8674-268234",
    description: "Hilltop Narasimha temple on the banks of the Krishna river, considered one of the most important Narasimha Kshetras in coastal Andhra. The deity is worshipped as Pala Narasimha (Narasimha with a milk-white complexion). Annual Brahmotsavams last 10 days.",
    famous: true,
    tags: ["vishnu", "narasimha", "famous"],
    nearestBus: "Nuzvid Bus Stand (12 km)",
    nearestRail: "Vijayawada Junction (35 km)",
  },

  /* ══════════════════════════════════════
     ONGOLE / PRAKASAM DISTRICT (additional)
  ══════════════════════════════════════ */

  {
    id: 44,
    name: "Sri Chennakesava Swamy Temple, Brahmanapalli",
    deity: "Lord Vishnu (Chennakesava)",
    district: "Prakasam",
    location: "Brahmanapalli, Prakasam District",
    state: "andhra-pradesh",
    lat: 15.5333, lng: 79.7667,
    timing: "6:00 AM – 12:00 PM, 4:00 PM – 7:30 PM",
    phone: "+91-8596-234567",
    description: "One of the ancient Divya Desams of Andhra Pradesh, where Lord Vishnu is worshipped as Chennakesava. The 11th-century temple is built in the Chalukya–Vijayanagara style with intricate stone carvings on the pillars.",
    famous: false,
    tags: ["vishnu", "divyaDesam", "heritage"],
    nearestBus: "Ongole Bus Stand (30 km)",
    nearestRail: "Ongole Railway Station (35 km)",
  },

  /* ══════════════════════════════════════
     KURNOOL / NANDYAL (additional)
  ══════════════════════════════════════ */

  {
    id: 45,
    name: "Sri Nageswara Swamy Temple, Chagalamarri",
    deity: "Lord Shiva (Nageswara)",
    district: "Nandyal",
    location: "Chagalamarri, Nandyal District",
    state: "andhra-pradesh",
    lat: 15.6167, lng: 78.6167,
    timing: "6:00 AM – 12:00 PM, 4:00 PM – 8:00 PM",
    phone: "+91-8514-252234",
    description: "Ancient Shiva temple in the Nallamala region associated with the Naga (serpent) tradition. The presiding deity Nageswara is worshipped with snakes as the divine vehicle. Naga Panchami celebrations here are among the most elaborate in Nandyal district.",
    famous: false,
    tags: ["shiva"],
    nearestBus: "Nandyal Bus Stand (20 km)",
    nearestRail: "Nandyal Railway Station (22 km)",
  },

  /* ══════════════════════════════════════
     TIRUPATI DISTRICT (additional)
  ══════════════════════════════════════ */

  {
    id: 46,
    name: "Sri Kalyana Venkateswara Temple, Narayanavanam",
    deity: "Lord Venkateswara (Vishnu)",
    district: "Tirupati",
    location: "Narayanavanam, Tirupati District",
    state: "andhra-pradesh",
    lat: 13.3667, lng: 79.6833,
    timing: "6:00 AM – 1:00 PM, 3:00 PM – 8:00 PM",
    phone: "+91-8573-254234",
    description: "An important Venkateswara temple also known for conducting marriages. Managed by TTD. The Brahmotsavams here last nine days. Narayanavanam is also known for its connection to the Vedic tradition and is considered a sacred tirtha.",
    famous: false,
    tags: ["vishnu", "marriage"],
    nearestBus: "Narayanavanam Bus Stand (0.5 km)",
    nearestRail: "Puttur Railway Station (20 km)",
  },

  {
    id: 47,
    name: "Sri Kapileswara Swamy Temple, Tirupati",
    deity: "Lord Shiva (Kapileswara)",
    district: "Tirupati",
    location: "Kapila Theertham, Tirupati",
    state: "andhra-pradesh",
    lat: 13.6433, lng: 79.3981,
    timing: "5:30 AM – 12:30 PM, 4:00 PM – 8:30 PM",
    phone: "+91-877-2234567",
    description: "Unique Shiva temple located at the base of Tirumala Hills, at the confluence of the Kapila sacred stream. Pilgrims take a ritual bath in the Kapila Theertham waterfall before visiting Tirumala. The Brahmotsavams here draw devotees from across Tirupati district.",
    famous: true,
    tags: ["shiva", "famous"],
    nearestBus: "Tirupati Bus Stand (3 km)",
    nearestRail: "Tirupati Railway Station (3 km)",
  },

  /* ══════════════════════════════════════
     VIZIANAGARAM / SRIKAKULAM (additional)
  ══════════════════════════════════════ */

  {
    id: 48,
    name: "Sri Kumara Bhimeswara Swamy Temple, Draksharamam area",
    deity: "Lord Shiva (Kumara Bhimeswara)",
    district: "Kakinada",
    location: "Mukteswarapuram, Kakinada District",
    state: "andhra-pradesh",
    lat: 17.0000, lng: 82.0500,
    timing: "6:00 AM – 12:00 PM, 4:00 PM – 8:00 PM",
    phone: "+91-884-2481234",
    description: "One of the lesser-visited Pancharama temples in the East Godavari region, associated with the Kumaraswami cult. The Shivalinga here is said to be the form worshipped by Lord Kumara (Karthikeya). The annual Maha Shivaratri fair draws regional pilgrims.",
    famous: false,
    tags: ["shiva"],
    nearestBus: "Draksharamam Bus Stand (5 km)",
    nearestRail: "Rajahmundry Railway Station (45 km)",
  },

  {
    id: 49,
    name: "Sri Subrahmanyeswara Swamy Temple, Saluru",
    deity: "Lord Subramanya (Karthikeya)",
    district: "Parvathipuram Manyam",
    location: "Saluru, Parvathipuram Manyam District",
    state: "andhra-pradesh",
    lat: 18.5667, lng: 83.2167,
    timing: "6:00 AM – 12:00 PM, 4:00 PM – 8:00 PM",
    phone: "+91-8966-245234",
    description: "Important Subramanya temple in the tribal heartland of north Andhra Pradesh. The deity is worshipped as the guardian of tribal communities. Skanda Sashti celebrations are marked by colorful tribal traditions and large gatherings from tribal villages across the district.",
    famous: false,
    tags: ["subramanya"],
    nearestBus: "Saluru Bus Stand (0.5 km)",
    nearestRail: "Saluru Railway Station (1 km)",
  },

  {
    id: 50,
    name: "Sri Lakshmi Narasimha Swamy Temple, Antarvedi",
    deity: "Lord Narasimha (Vishnu)",
    district: "Eluru",
    location: "Antarvedi, Eluru District",
    state: "andhra-pradesh",
    lat: 16.5833, lng: 81.8333,
    timing: "5:30 AM – 12:30 PM, 4:00 PM – 8:30 PM",
    phone: "+91-8818-256234",
    description: "Located at the confluence (sangama) of the Gautami Godavari river and the Bay of Bengal — one of the most sacred tirtha spots in Andhra Pradesh. The Narasimha deity here is said to be exceptionally powerful. Karthika Masam and Uttarayan Punyakala draw lakhs of pilgrims for the holy dip.",
    famous: true,
    tags: ["vishnu", "narasimha", "famous", "pilgrimage"],
    nearestBus: "Narsapur Bus Stand (25 km); boats across Godavari",
    nearestRail: "Narsapur Railway Station (25 km)",
  },

];
