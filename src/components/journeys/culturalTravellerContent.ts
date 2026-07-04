import type { JourneyContent, LocalizedJourney } from './JourneyPage';

/**
 * Locked page copy for /journeys/the-cultural-traveller (traveller-type page #5).
 *
 * VERBATIM from the owner-approved draft (journeys-the-cultural-traveller.md
 * v1) with two owner-side amendments applied verbatim: the slot-1 weave
 * sentence and the slot-3 weave sentence (both marked below). DO NOT rewrite,
 * tighten, or soften — the Ramadan operator note and the guide paragraph stay
 * word-for-word, and the "five civilizations" headline count stays as written
 * (pharaonic, Greco-Roman, Coptic Christian, Islamic, Nubian). Same co-located
 * pattern as the other journeys pages — no Sanity schema, no production writes.
 * No inline essay links on this page.
 *
 * Flagship (weave slot 1): there is no purpose-built "layered/five-
 * civilizations" package in the catalogue (a real product gap). Owner chose
 * the closest genuine fit, verified: 10-day-egypt-travel-journey-through-
 * history has real older-layer Cairo content (Coptic quarter — Hanging Church,
 * Abu Serga, Ben Ezra; Islamic — Citadel of Saladin, Mosque of Muhammad Ali,
 * Al-Muizz Street) and real Nubian content (two days: Aswan + Abu Simbel
 * through Nubian desert), private, own Egyptologist, pyramids reserved for the
 * closing day. Labelled for what it is — a layered-history route — not a
 * "cultural product".
 */
export const culturalTravellerContent: LocalizedJourney = {
  en: {
    meta: {
      title: 'The Cultural Traveller in Egypt',
      description:
        'Egypt in layers — Islamic and Coptic Cairo, the desert monasteries, Nubian Aswan, and the ancient sites read not toured. The cultural trip, built around the guide.',
    },

    masthead: {
      eyebrow: 'A STARTING POINT · THE CULTURAL TRAVELLER',
      headlineLead: 'Egypt is five civilizations deep.',
      headlineAccent: 'Most trips visit one.',
      standfirst:
        'Islamic and Coptic Cairo, the desert monasteries where monasticism was invented, Nubian Aswan, and the ancient sites read rather than photographed. This is the trip for the traveller who wants the layers — and it is built, more than any other we plan, around who is standing next to you explaining them.',
    },

    essay: [
      'Egypt has a strange problem for a country so rich: its most famous civilization eclipses the other four. The pharaohs are the reason most people come, and fair enough — but they are the first chapter of a book that kept being written. Greco-Roman Alexandria, Christian Egypt inventing monasticism in its deserts, a thousand years of Islamic Cairo, and Nubia running through all of it like a second river. The cultural traveller is the one who wants the whole book. This page is for you, and we should say at the outset that these are the trips our best guides ask to be assigned to.',
      'Start where the layers are thickest. In one Cairo city block — Coptic Cairo, inside the walls of a Roman fortress — stands a synagogue that was once a church, churches built over the fortress gates, and beneath one of them a crypt where tradition holds the Holy Family sheltered. That block is the whole argument for this trip in miniature: nothing in Egypt replaced what came before it; everything moved in upstairs. A twenty-minute drive away, Islamic Cairo runs it forward another millennium — Ibn Tulun’s ninth-century calm, the engineered audacity of Sultan Hassan, al-Muizz street running past six hundred years of facades that are not exhibits but addresses. We walk it with guides who read the inscriptions over the doors, because in this city the buildings are still talking.',
      'Then the desert, for the chapter most itineraries skip entirely. Monasticism — the whole idea of it — began in the Egyptian desert, and the communities that began it are still there. Wadi El Natrun’s monasteries between Cairo and Alexandria; St. Anthony’s by the Red Sea hills, arguably the oldest working monastery on earth. These are not museums with opening hours. They are living houses that receive visitors, which changes how you should arrive: with time, with a little patience for the rhythm of the place, and ideally with our guide who knows which monk likes to talk history.',
      'The ancient sites are still on this trip — but read, not toured. Abydos for Seti I’s reliefs, carved shallow and fine enough that the painters barely needed to help; Karnak taken as an archive rather than a backdrop; the Valley of the Kings with a guide who can stand in front of a wall of text and tell you what it says, which turns out to be the difference between visiting ancient Egypt and meeting it. If you have been to Luxor before, this is the trip on which it becomes a different place.',
      'And Aswan for the living culture the itineraries flatten into a photo stop: Nubia. A Nubian village visited properly — with time, over tea, through someone who belongs there — plus Elephantine’s layered ruins and the Nubian Museum, which is the best-told story in any Egyptian museum and criminally under-visited. Nubian Aswan is also simply the gentlest place on this itinerary, and we place it last for that reason.',
      'A trip like this stands or falls on one thing, and it is not the hotel. It is the guide. Everything this page promises — inscriptions read, monks drawn out, layers separated — happens through a person, and Egyptology-trained guides who can move from hieroglyphs to Mamluk architecture to Coptic liturgy are not interchangeable. We assign them to these trips by name. It is the single most important line in this trip’s plan, and the one we protect first.',
    ],

    operatorNote: {
      label: 'Insider tip',
      body: 'If your trip touches Ramadan, do not route around Islamic Cairo — reroute your days. Site hours shorten, but the evenings become the event: the streets around al-Muizz fill after sunset in a way no other month can show you, and an iftar taken seriously is worth any monument. We shift these itineraries to late mornings and long evenings, and travellers who trusted us on this rank those nights with the tombs.',
    },

    spine: {
      heading: 'The shape of the trip',
      rows: [
        { label: 'Length', value: '9–12 days; the layers do not compress well, and we will say which chapter to cut if you must' },
        { label: 'The arc', value: 'Cairo in layers · the desert monasteries · Luxor and Abydos, read closely · Nubian Aswan' },
        { label: 'The pace', value: 'fewer sites, longer at each; the guide sets the depth' },
        { label: 'The season', value: "October to April; Ramadan reshapes Islamic Cairo's rhythm rather than closing it — see the note above" },
        { label: 'Best suited to', value: 'travellers who read before they travel and want a guide who goes off-script' },
        { label: 'How it begins', value: 'tell the concierge which centuries pull at you; the itinerary follows from the answer' },
      ],
    },

    weave: {
      heading: 'Where this usually leads',
      items: [
        {
          // Owner-amended slot-1 sentence (replaces the draft's original).
          label: 'The 10-day private layered-history route',
          href: '/10-day-egypt-travel-journey-through-history',
          sentence: 'The closest route in the catalogue to the trip this page describes — layered, unhurried, and finished where most trips begin.',
        },
        {
          label: 'Walking Islamic Cairo',
          href: '/guide/cairo/from-al-azhar-to-the-citadel-walking-islamic-cairo',
          sentence: 'A thousand years of architecture that still has addresses, and how to walk it in the right order.',
        },
        {
          // Owner-amended slot-3 sentence + target (Wadi El Natrun monastery,
          // this page's most distinctive territory).
          label: 'The Monastery of St. Macarius the Great',
          href: '/guide/wadi-el-natrun/monastery-of-saint-macarius-the-great',
          sentence: 'The desert houses where monasticism began — still living, still receiving visitors, and this is the one we usually start with.',
        },
        {
          label: 'The Nubian Museum',
          href: '/guide/aswan/the-nubian-museum',
          sentence: "The living culture at the itinerary's gentle end, and how to visit it with the time it deserves.",
        },
      ],
    },

    journal: {
      heading: 'One journal thread',
      card: {
        title: 'A History Reader’s Cairo',
        deck: 'Cairo is a city where the ancient, Coptic, Islamic, medieval, and modern periods all sit on top of each other. A guide for readers of history on how to walk it.',
        href: '/blog/a-history-buffs-guide-to-cairo',
      },
    },

    close: {
      heading: 'This trip starts from a different first question.',
      body: 'Not where you want to go — which Egypt you want. Tell the concierge the centuries that pull at you, the last thing you read about this country, the site you would trade three others to see properly. The itinerary, and more importantly the guide, follow from that.',
      ctaLabel: 'Start the conversation',
      ctaHref: '/plan-your-tour',
    },

    crossRef: {
      lead: 'Not quite you? There are ',
      linkText: 'five other places to start',
      hash: 'where-to-begin',
    },
  },

  // ES — re-authored per the locked register (journeys-es-the-cultural-traveller.md v1).
  es: {
    meta: {
      title: 'El viajero cultural',
      description:
        'El Cairo islámico y copto, los monasterios donde empezó el monacato, la Asuán nubia y los sitios antiguos leídos de cerca: el Egipto de cinco civilizaciones, con el guía como pieza central.',
    },

    masthead: {
      eyebrow: 'UN PUNTO DE PARTIDA · EL VIAJERO CULTURAL',
      headlineLead: 'Egipto tiene cinco civilizaciones de fondo.',
      headlineAccent: 'La mayoría de los viajes visita una.',
      standfirst:
        'El Cairo islámico y copto, los monasterios del desierto donde se inventó el monacato, la Asuán nubia, y los sitios antiguos leídos en vez de fotografiados. Este es el viaje para quien quiere las capas — y se construye, más que ningún otro que planifiquemos, alrededor de quién está a tu lado explicándolas.',
    },

    essay: [
      'Egipto tiene un problema extraño para un país tan rico: su civilización más famosa eclipsa a las otras cuatro. Los faraones son la razón por la que viene casi todo el mundo, y es comprensible — pero son el primer capítulo de un libro que siguió escribiéndose. La Alejandría grecorromana, el Egipto cristiano inventando el monacato en sus desiertos, mil años de Cairo islámico, y Nubia corriendo por debajo de todo como un segundo río. El viajero cultural es el que quiere el libro entero. Esta página es para ti, y conviene decirlo desde el principio: estos son los viajes que nuestros mejores guías piden que les asignen.',
      'Empieza donde las capas son más gruesas. En una sola manzana de El Cairo — el Cairo copto, dentro de los muros de una fortaleza romana — hay una sinagoga que fue iglesia, iglesias construidas sobre las puertas de la fortaleza, y bajo una de ellas una cripta donde la tradición sitúa el refugio de la Sagrada Familia. Esa manzana es el argumento entero de este viaje en miniatura: en Egipto nada reemplazó lo que había antes; todo se mudó al piso de arriba. A veinte minutos en coche, el Cairo islámico lo prolonga otro milenio — la calma del siglo nueve de Ibn Tulun, la audacia de ingeniería de Sultán Hasán, la calle al-Muizz corriendo entre seiscientos años de fachadas que no son piezas de museo sino direcciones. La caminamos con guías que leen las inscripciones sobre las puertas, porque en esta ciudad los edificios siguen hablando.',
      'Después el desierto, para el capítulo que casi todos los itinerarios se saltan entero. El monacato — la idea misma — empezó en el desierto egipcio, y las comunidades que lo empezaron siguen allí. Los monasterios de Wadi El Natrun entre El Cairo y Alejandría; San Antonio junto a las colinas del mar Rojo, posiblemente el monasterio en activo más antiguo de la tierra. No son museos con horario. Son casas vivas que reciben visitantes, lo que cambia cómo conviene llegar: con tiempo, con algo de paciencia por el ritmo del lugar, e idealmente con nuestro guía, que sabe a qué monje le gusta hablar de historia.',
      'Los sitios antiguos siguen en este viaje — pero leídos, no recorridos. Abidos por los relieves de Seti I, tallados tan finos y tan someros que los pintores apenas tuvieron que ayudar; Karnak tomado como archivo y no como decorado; el Valle de los Reyes con un guía capaz de pararse frente a una pared de texto y decirte qué dice, que resulta ser la diferencia entre visitar el Egipto antiguo y conocerlo. Si ya estuviste en Luxor, este es el viaje en el que se convierte en otro lugar.',
      'Y Asuán por la cultura viva que los itinerarios aplanan en una parada de fotos: Nubia. Una aldea nubia visitada como es debido — con tiempo, con té de por medio, a través de alguien que pertenece allí — más las ruinas estratificadas de Elefantina y el Museo Nubio, que es la historia mejor contada de cualquier museo egipcio y está criminalmente poco visitado. La Asuán nubia es además, sencillamente, el lugar más amable de este itinerario, y por eso lo dejamos para el final.',
      'Un viaje así se sostiene o se cae por una sola cosa, y no es el hotel. Es el guía. Todo lo que promete esta página — inscripciones leídas, monjes que se animan a contar, capas separadas — ocurre a través de una persona, y los guías formados en egiptología capaces de pasar de los jeroglíficos a la arquitectura mameluca y a la liturgia copta no son intercambiables. Los asignamos a estos viajes por nombre. Es la línea más importante del plan de este viaje, y la primera que protegemos.',
    ],

    operatorNote: {
      label: 'Consejo del operador',
      body: 'Si tu viaje toca Ramadán, no esquives el Cairo islámico — reordena tus días. Los horarios de los sitios se acortan, pero las noches se convierten en el acontecimiento: las calles alrededor de al-Muizz se llenan después del atardecer como ningún otro mes puede enseñarte, y un iftar tomado en serio vale cualquier monumento. Movemos estos itinerarios hacia mañanas tardías y noches largas, y los viajeros que nos hicieron caso ponen esas noches a la altura de las tumbas.',
    },

    spine: {
      heading: 'La forma del viaje',
      rows: [
        { label: 'Duración', value: 'de 9 a 12 días; las capas no se comprimen bien, y te diremos qué capítulo cortar si no hay más remedio' },
        { label: 'El arco', value: 'El Cairo en capas · los monasterios del desierto · Luxor y Abidos, leídos de cerca · la Asuán nubia' },
        { label: 'El ritmo', value: 'menos sitios, más tiempo en cada uno; el guía marca la profundidad' },
        { label: 'La temporada', value: 'de octubre a abril; Ramadán reordena el ritmo del Cairo islámico en vez de cerrarlo — ver la nota' },
        { label: 'Para quién', value: 'viajeros que leen antes de viajar y quieren un guía que se salga del guion' },
        { label: 'Cómo empieza', value: 'dile al concierge qué siglos te tiran; el itinerario se deriva de la respuesta' },
      ],
    },

    weave: {
      heading: 'A dónde suele llevar',
      items: [
        {
          label: 'La ruta privada de 10 días por las capas de la historia',
          href: '/patrimonio-egipcio-descubrimiento-cultural-de-10-dias',
          sentence: 'La ruta del catálogo más cercana al viaje que esta página describe — estratificada, sin prisa, y terminada donde la mayoría empieza.',
        },
        {
          label: 'El Cairo islámico, a pie',
          href: '/guide/el-cairo/de-al-azhar-a-la-ciudadela-recorrido-a-pie-por-el-cairo-islamico',
          sentence: 'Mil años de arquitectura que todavía tiene direcciones, y cómo caminarla en el orden correcto.',
        },
        {
          label: 'El monasterio de San Macario',
          href: '/guide/wadi-al-natron/monasterio-de-san-macario-el-grande',
          sentence: 'Las casas del desierto donde empezó el monacato — aún vivas, aún recibiendo, y esta es por la que solemos empezar.',
        },
        {
          label: 'El Museo Nubio',
          href: '/guide/asuan/el-museo-nubio',
          sentence: 'La cultura viva en el final amable del itinerario, y cómo visitarla con el tiempo que merece.',
        },
      ],
    },

    journal: {
      heading: 'Un hilo del Diario',
      card: {
        title: 'El Cairo para amantes de la historia',
        deck: 'El Cairo no pertenece a una sola época: Guiza, el barrio copto, la ciudad islámica, la Ciudadela y el Cairo moderno se superponen en una misma capital.',
        href: '/blog/guia-de-el-cairo-para-aficionados-a-la-historia',
      },
    },

    close: {
      heading: 'Este viaje empieza por una pregunta distinta.',
      body: 'No a dónde quieres ir — qué Egipto quieres. Dile al concierge los siglos que te tiran, lo último que leíste sobre este país, el sitio que cambiarías por otros tres con tal de verlo bien. El itinerario, y sobre todo el guía, se derivan de eso.',
      ctaLabel: 'Empieza la conversación',
      ctaHref: '/plan-your-tour',
    },

    crossRef: {
      lead: '¿No es lo tuyo? Hay ',
      linkText: 'otros cinco lugares donde empezar',
      hash: 'where-to-begin',
    },
  },

  // JA — re-authored per the locked JA register (journeys-ja-the-cultural-
  // traveller.md v1; locked pending a native-speaker pass — verbatim, incl.
  // the ——上の所見を row ending). No inline essay links on this page.
  ja: {
    meta: {
      title: '文化を旅する人へ',
      description:
        'イスラームとコプトのカイロ、修道院制度が始まった砂漠の修道院、ヌビアのアスワン、近くで読む古代遺跡。五つの文明のエジプトを、ガイドを中心に組み立てる旅。',
    },

    masthead: {
      eyebrow: '旅の始まり · 文化を旅する人へ',
      headlineLead: 'エジプトには、五つの文明の深さがある。',
      headlineAccent: 'ほとんどの旅は、ひとつしか訪ねない。',
      standfirst:
        'イスラームのカイロとコプトのカイロ、修道院制度が発明された砂漠の修道院、ヌビアのアスワン、そして撮るのではなく読む古代遺跡。これは層を求める人のための旅です——そして私たちが計画するどの旅よりも、隣に立って層を説く人間を中心に組み立てられます。',
    },

    essay: [
      'エジプトには、これほど豊かな国としては奇妙な問題があります。最も有名な文明が、残りの四つを覆い隠してしまうのです。ほとんどの人はファラオを目当てに来ます。無理もありません——けれどファラオは、書き継がれていった本の第一章です。ギリシャ・ローマのアレクサンドリア、砂漠で修道院制度を発明したキリスト教のエジプト、千年のイスラームのカイロ、そしてそのすべての下を第二の川のように流れるヌビア。文化を旅する人とは、本を丸ごと求める人のことです。このページはあなたのためのもので、最初に言っておくべきことがあります。これらは、私たちの最良のガイドたちが担当を志願する旅です。',
      '層がいちばん厚い場所から始めましょう。カイロの一区画——ローマ要塞の壁の内側のコプト・カイロ——に、教会だったシナゴーグが立ち、要塞の門の上に教会が建ち、そのひとつの地下には、聖家族が身を寄せたと伝わるクリプトがあります。あの一区画は、この旅の議論全体の縮図です。エジプトでは、何も前のものに取って代わりませんでした。すべてが、上の階に引っ越したのです。車で20分、イスラームのカイロがそれをもう千年先へ延ばします——イブン・トゥールーンの9世紀の静けさ、スルタン・ハサンの工学の大胆、そして展示品ではなく現住所である600年分のファサードが並ぶムイッズ通り。私たちは扉の上の銘文を読むガイドと歩きます。この街では、建物がまだ話しているからです。',
      '次に砂漠へ。ほとんどの旅程が丸ごと飛ばす章のためにです。修道院制度は——その発想そのものは——エジプトの砂漠で始まり、始めた共同体はいまもそこにいます。カイロとアレクサンドリアのあいだのワディ・エル・ナトルンの修道院群。紅海の丘のそばの聖アントニオス修道院は、おそらく地上で最も古い現役の修道院です。開館時間のある博物館ではありません。訪問者を迎える、生きている家です。だから、着き方が変わります。時間を持って、その場の律動への少しの辛抱を持って、そして理想的には、どの修道士が歴史を話したがるか知っている私たちのガイドと。',
      '古代遺跡もこの旅にあります——ただし、巡るのではなく、読むために。セティ1世の浮彫のためのアビドス。彫りが浅く精緻で、画家の出る幕がほとんどなかったほどです。背景ではなく古文書として読むカルナック。そして、文字の壁の前に立って何が書いてあるか言えるガイドと行く王家の谷——それが、古代エジプトを訪ねることと、出会うことの違いだと分かります。ルクソールに行ったことがあるなら、これはルクソールが別の場所に変わる旅です。',
      'そしてアスワンは、旅程が写真休憩に平たくしてしまう生きた文化のために。ヌビアです。きちんと訪ねるヌビアの村——時間を持って、お茶を挟んで、そこに属する人を通して——それにエレファンティネ島の積層した遺構と、ヌビア博物館。エジプトのどの博物館より語りが良く、罪深いほど訪問者が少ない場所です。ヌビアのアスワンはまた、単純に、この旅程でいちばん穏やかな場所です。だから、最後に置きます。',
      'この旅は、たったひとつのもので立ちもすれば倒れもします。ホテルではありません。ガイドです。このページが約束するすべて——読まれる銘文、口を開く修道士、解きほぐされる層——は、ひとりの人間を通して起こります。そしてヒエログリフからマムルーク建築、コプトの典礼まで動けるエジプト学のガイドは、交換可能ではありません。私たちはこれらの旅に、名前で担当を付けます。この旅の計画でいちばん重要な一行であり、私たちが最初に守る一行です。',
    ],

    operatorNote: {
      label: '内部情報',
      body: '旅がラマダーンに触れるなら、イスラームのカイロを避けて通らないでください——日々を組み替えてください。遺跡の時間は短くなりますが、夜が主役になります。ムイッズ通りの界隈は日没後、ほかのどの月も見せられない姿で満ちてきます。真剣に迎えるイフタールは、どんな記念碑にも値します。私たちはこの旅程を遅い午前と長い夜へ寄せます。従ってくださった旅行者は、あの夜々を墓と同列に挙げます。',
    },

    spine: {
      heading: '旅のかたち',
      rows: [
        { label: '日数', value: '9〜12日。層はうまく圧縮できません。やむを得ないなら、どの章を切るかお伝えします' },
        { label: '弧', value: '層のカイロ · 砂漠の修道院 · 近くで読むルクソールとアビドス · ヌビアのアスワン' },
        { label: '速度', value: '場所は少なく、一箇所は長く。深さはガイドが決めます' },
        { label: '季節', value: '10月から4月。ラマダーンはイスラームのカイロを閉じるのではなく、律動を組み替えます——上の所見を' },
        { label: '向いている人', value: '旅の前に読む旅行者。台本から出られるガイドを求める人' },
        { label: '始まり方', value: 'どの世紀に引かれるかをコンシェルジュへ。旅程は、答えから導かれます' },
      ],
    },

    weave: {
      heading: 'この旅が導く先',
      items: [
        {
          label: '歴史の層をたどる10日間のプライベート・ルート',
          href: '/10-nichikan-no-rekishi-o-meguru-ejiputo-ryoko-jani',
          sentence: 'このページが描く旅にカタログでいちばん近いルート——積層して、急がず、ほとんどの旅が始める場所で終わります。',
        },
        {
          label: 'イスラームのカイロを歩く',
          href: '/guide/kairo/aruazuharu-kara-josai-e-aruku-isuramu-kairo',
          sentence: 'いまも現住所である千年分の建築と、正しい順序での歩き方。',
        },
        {
          label: '聖マカリオス修道院',
          href: '/guide/wadi-aru-natoron/sei-makariosu-dai-shudoin',
          sentence: '修道院制度が始まった砂漠の家々——いまも生き、いまも迎え、私たちがたいてい最初に訪ねるのがここです。',
        },
        {
          label: 'ヌビア博物館',
          href: '/guide/asuwan/nubia-hakubutsukan',
          sentence: '旅程の穏やかな終点にある生きた文化と、それに値する時間での訪ね方。',
        },
      ],
    },

    journal: {
      heading: 'ジャーナルから一篇',
      card: {
        title: '歴史好きのためのカイロ',
        deck: 'カイロは、古代、コプト、イスラーム、中世、近代が同じ都市の中に重なる場所です。歴史好きがこの街をどう読むべきかを案内します。',
        href: '/blog/rekishi-suki-no-tame-no-kairo',
      },
    },

    close: {
      heading: 'この旅は、違う最初の質問から始まります。',
      body: 'どこへ行きたいかではなく——どのエジプトがほしいか。引かれる世紀を、この国について最後に読んだものを、きちんと見るためなら他の三つと引き換えにしてもいい場所を、コンシェルジュへ。旅程は、そして何よりガイドは、そこから導かれます。',
      ctaLabel: '会話から始める',
      ctaHref: '/plan-your-tour',
    },

    crossRef: {
      lead: 'しっくりこなければ、',
      linkText: '始まりの場所はほかに五つあります',
      hash: 'where-to-begin',
    },
  },
};
