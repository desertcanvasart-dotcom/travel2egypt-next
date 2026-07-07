import type { JourneyContent, LocalizedJourney } from './JourneyPage';

/**
 * Locked page copy for /journeys/coming-back (traveller-type page #2).
 *
 * VERBATIM from the owner-approved draft (journeys-coming-back.md v1). DO NOT
 * rewrite, tighten, or expand. Square-bracketed items in the draft were wiring
 * decisions, resolved here (confirmed live slugs; owner picks: Siwa slot-1
 * package, Abydos slot-4, "Egypt Beyond the Pyramids" journal).
 *
 * Same co-located, version-controlled pattern as firstTimeContent — no Sanity
 * schema, no production writes; the route is i18n-wired so localization is
 * later content work.
 *
 * Essay note: the Western Desert paragraph carries an inline cross-reference —
 * "Desert & quiet" links to the live /journeys/desert-and-quiet route (promoted
 * from /#desert-and-quiet when that page shipped), so that paragraph is a
 * segment array rather than a plain string.
 */
export const comingBackContent: LocalizedJourney = {
  en: {
    meta: {
      title: 'Coming Back to Egypt',
      description:
        'Planning a return to Egypt — Middle Egypt, Alexandria, Siwa and the far oases. How we plan a second trip around what the first one did not hold.',
    },

    masthead: {
      eyebrow: 'A STARTING POINT · COMING BACK',
      headlineLead: 'The second trip is when Egypt stops introducing itself.',
      headlineAccent: 'And starts talking.',
      standfirst:
        'Middle Egypt, Alexandria, Siwa and the far oases — the country that waits behind the famous one. If you have already done Cairo and the river, the map opens. This is how we plan a return: what the first trip earned you, and where to spend it.',
    },

    essay: [
      'Somewhere on your first trip — probably on the West Bank at Luxor, possibly on a boat deck at sunset — you noticed that Egypt was larger than your itinerary. Most travellers notice it. Fewer act on it. The ones who do are the travellers we most enjoy planning for, because the second trip is where our work gets interesting.',
      'Here is what the first trip bought you: you have seen the essential story, so you no longer need it. No committee in your head insisting on the Pyramids, no guilt about skipping Karnak. The second trip does not have to survey anything. It can go deep into one region and stay there — and Egypt holds at least three regions worth an entire trip.',
      'The first is Middle Egypt, the stretch of the Nile valley that tour buses pass overhead at 30,000 feet. Beni Hasan, where the Middle Kingdom governors cut their tombs into the cliff and painted them with wrestlers and bird-catchers; Amarna, the capital Akhenaten built in five years and history abandoned in fifteen; Tuna el-Gebel and its underground galleries; and at the southern end, Abydos and Dendera — the finest surviving relief carving in Egypt and a ceiling that still carries its original paint. The reason first trips leave this out is not quality. It is geometry: the sites are scattered across two hundred kilometres of valley with thin hotel choices, so the region rewards exactly what a returning traveller has — patience, and no checklist.',
      'The second is Alexandria and the Mediterranean edge, which is less a different region than a different country. Greco-Roman instead of pharaonic, sea light instead of desert light, a corniche instead of a river bank. The catacombs at Kom el-Shoqafa, where Egyptian gods wear Roman armour; the fortress standing on the footprint of the lighthouse; fish restaurants where the menu is whatever the boats brought in. Alexandria is two and a half hours from Cairo by road and a century away in temperament. It pairs naturally with the Delta and the Wadi El Natrun monasteries if you want a northern trip with some quiet in it.',
      [
        'The third is the one we know from the inside: the Western Desert oases. This company was born in Siwa, and we will tell you plainly that it is not on the way to anything — eight hours from Cairo, close to the Libyan border, Berber-speaking, and organised around date gardens, salt lakes and the ruins of an oracle Alexander the Great crossed the desert to consult. That inconvenience is the point. Siwa is what Egypt is like when nothing is arranged for an audience. Beyond it, Dakhla and Kharga carry the old caravan routes south — mud-brick towns, Roman forts, a pace set by wells rather than flights. (If it is the White Desert’s rock formations and a night under the stars you are after, that is its own kind of trip — we plan it under ',
        { text: 'Desert & quiet', href: '/journeys/desert-and-quiet' },
        '.)',
      ],
      'Which of the three is yours depends on what the first trip left you wanting — more of ancient Egypt but deeper, a different Egypt entirely, or an older and quieter one. That is a better conversation than a comparison table, and it is the first question our concierge will ask.',
    ],

    operatorNote: {
      label: 'Insider tip',
      body: 'Returning travellers over-plan. You have done the logistics of Egypt once and know it takes effort, so the instinct is to build the second trip with the same armour. Resist it. One region, one unhurried route through it, and at least one day with nothing scheduled at all. The second trip is where Egypt starts treating you like a guest instead of an audience — give it the room to.',
    },

    spine: {
      heading: 'The shape of the trip',
      rows: [
        { label: 'Length', value: '7–10 days for one region done properly; combining two is possible and we will say what it costs' },
        { label: 'The arc', value: 'one of three: Middle Egypt · Alexandria and the north · Siwa and the far oases' },
        { label: 'The pace', value: 'slower than the first trip, by design; one anchor a day is often enough' },
        { label: 'The season', value: 'October to April for the valley and the oases; Alexandria is at its best when Cairo is at its warmest' },
        { label: 'Best suited to', value: 'travellers who have done Cairo and the river and want the country behind the famous one' },
        { label: 'How it begins', value: 'tell the concierge what your first trip held; we plan around what it didn’t' },
      ],
    },

    weave: {
      heading: 'Where this usually leads',
      items: [
        {
          label: 'The 3-day private Siwa journey from Alexandria',
          href: '/3-day-siwa-journey-from-alexandria',
          sentence: 'The oasis this company comes from, planned by people who do not need a map of it.',
        },
        {
          label: 'Alexandria destination guide',
          href: '/guide/alexandria',
          sentence: 'The Mediterranean city that answers to a different history, and how to give it more than a day trip.',
        },
        {
          label: 'Siwa destination guide',
          href: '/guide/siwa-oasis',
          sentence: 'Eight hours from Cairo and worth every one of them; what to know before you commit.',
        },
        {
          label: 'The temple of Abydos',
          href: '/guide/sohag/abydos-temple',
          sentence: 'The finest carving in Egypt stands in a temple most itineraries never reach.',
        },
      ],
    },

    journal: {
      heading: 'One journal thread',
      card: {
        title: 'Egypt Beyond the Pyramids',
        deck: 'Fayoum, Siwa, Middle Egypt, and the small pyramid fields outside Giza — places easily missed on a first trip, ordered by why they reward the detour.',
        href: '/blog/hidden-gems-of-egypt',
      },
    },

    close: {
      heading: 'The second trip starts from what the first one taught you.',
      body: "Tell the concierge where you have already been and what stayed with you — the temple you didn't want to leave, the afternoon that felt too short. It will plan the return around what your first trip didn't hold, not repeat what it did.",
      ctaLabel: 'Start the conversation',
      ctaHref: '/plan-your-tour',
    },

    crossRef: {
      lead: 'Not quite you? There are ',
      linkText: 'five other places to start',
      hash: 'where-to-begin',
    },
  },

  // ES — re-authored per the locked register (journeys-es-coming-back.md v1).
  // Essay carries one inline route link to /journeys/desert-and-quiet (renders
  // /es/... via next-intl Link) — reciprocal with desert's link back here.
  es: {
    meta: {
      title: 'Volver a Egipto',
      description:
        'El Egipto Medio, Alejandría, Siwa y los oasis lejanos: cómo planificamos un segundo viaje — una región a fondo, al ritmo que el primero no permitía.',
    },

    masthead: {
      eyebrow: 'UN PUNTO DE PARTIDA · VOLVER A EGIPTO',
      headlineLead: 'El segundo viaje es cuando Egipto deja de presentarse.',
      headlineAccent: 'Y empieza a hablar.',
      standfirst:
        'El Egipto Medio, Alejandría, Siwa y los oasis lejanos — el país que espera detrás del famoso. Si ya hiciste El Cairo y el río, el mapa se abre. Así planificamos un regreso: qué te ganó el primer viaje, y dónde gastarlo.',
    },

    essay: [
      'En algún momento del primer viaje — probablemente en la orilla oeste de Luxor, quizá en la cubierta de un barco al atardecer — notaste que Egipto era más grande que tu itinerario. Casi todos los viajeros lo notan. Menos actúan en consecuencia. Los que lo hacen son los viajeros para los que más nos gusta planificar, porque el segundo viaje es donde nuestro trabajo se pone interesante.',
      'Esto es lo que te compró el primer viaje: ya viste la historia esencial, así que ya no la necesitas. Ningún comité en tu cabeza insistiendo en las pirámides, ninguna culpa por saltarte Karnak. El segundo viaje no tiene que inspeccionar nada. Puede ir a fondo en una sola región y quedarse allí — y Egipto guarda al menos tres regiones que merecen un viaje entero.',
      'La primera es el Egipto Medio, el tramo del valle que los autobuses turísticos sobrevuelan a diez mil metros. Beni Hasan, donde los gobernadores del Imperio Medio tallaron sus tumbas en el acantilado y las pintaron con luchadores y cazadores de aves; Amarna, la capital que Akenatón construyó en cinco años y la historia abandonó en quince; Tuna el-Gebel y sus galerías subterráneas; y en el extremo sur, Abidos y Dendera — el relieve tallado más fino que sobrevive en Egipto y un techo que aún conserva su pintura original. La razón por la que los primeros viajes dejan esto fuera no es la calidad. Es la geometría: los sitios están repartidos a lo largo de doscientos kilómetros de valle con pocos hoteles, así que la región premia exactamente lo que un viajero que vuelve ya tiene — paciencia, y ninguna lista.',
      'La segunda es Alejandría y el borde mediterráneo, que más que otra región es otro país. Grecorromano en vez de faraónico, luz de mar en vez de luz de desierto, una corniche en vez de una ribera. Las catacumbas de Kom el-Shoqafa, donde los dioses egipcios visten armadura romana; la fortaleza plantada sobre la huella del faro; restaurantes de pescado donde el menú es lo que trajeron los barcos. Alejandría está a dos horas y media de El Cairo por carretera y a un siglo de distancia en temperamento. Combina con naturalidad con el Delta y los monasterios de Wadi El Natrun si quieres un viaje del norte con algo de calma dentro.',
      [
        'La tercera es la que conocemos desde dentro: los oasis del Desierto Occidental. Esta casa nació en Siwa, y te diremos sin rodeos que no está de camino a nada — ocho horas desde El Cairo, cerca de la frontera libia, de habla bereber, organizada alrededor de palmerales de dátiles, lagos de sal y las ruinas de un oráculo que Alejandro Magno cruzó el desierto para consultar. Esa incomodidad es el punto. Siwa es cómo es Egipto cuando nada está dispuesto para un público. Más allá, Dajla y Jarga llevan las viejas rutas de caravanas hacia el sur — pueblos de adobe, fuertes romanos, un ritmo marcado por los pozos y no por los vuelos. (Si lo que buscas son las formaciones del Desierto Blanco y una noche bajo las estrellas, ese es su propio tipo de viaje — lo planificamos en ',
        { text: 'Desierto y calma', href: '/journeys/desert-and-quiet' },
        '.)',
      ],
      'Cuál de las tres es la tuya depende de lo que el primer viaje te dejó queriendo — más Egipto antiguo pero más hondo, un Egipto distinto por completo, o uno más viejo y más callado. Esa es una conversación mejor que cualquier tabla comparativa, y es la primera pregunta que hará nuestro concierge.',
    ],

    operatorNote: {
      label: 'Consejo del operador',
      body: 'Los viajeros que vuelven planifican de más. Ya hiciste la logística de Egipto una vez y sabes que cuesta, así que el instinto es armar el segundo viaje con la misma armadura. Resístelo. Una región, una ruta sin prisa a través de ella, y al menos un día sin nada programado. El segundo viaje es cuando Egipto empieza a tratarte como a un invitado y no como a un público — dale el espacio para hacerlo.',
    },

    spine: {
      heading: 'La forma del viaje',
      rows: [
        { label: 'Duración', value: 'de 7 a 10 días para una región bien hecha; combinar dos es posible, y te diremos qué cuesta' },
        { label: 'El arco', value: 'una de tres: el Egipto Medio · Alejandría y el norte · Siwa y los oasis lejanos' },
        { label: 'El ritmo', value: 'más lento que el primer viaje, a propósito; una visita de peso al día suele bastar' },
        { label: 'La temporada', value: 'de octubre a abril para el valle y los oasis; Alejandría está en su mejor momento cuando El Cairo aprieta' },
        { label: 'Para quién', value: 'viajeros que ya hicieron El Cairo y el río y quieren el país detrás del famoso' },
        { label: 'Cómo empieza', value: 'cuéntale al concierge qué contuvo tu primer viaje; planificamos alrededor de lo que no' },
      ],
    },

    weave: {
      heading: 'A dónde suele llevar',
      items: [
        {
          label: 'El viaje privado de 3 días a Siwa desde Alejandría',
          href: '/tres-dias-de-alejandria-a-siwa-costa-guerra-del-desierto-oraculo',
          sentence: 'El oasis del que viene esta casa, planificado por gente que no necesita mapa.',
        },
        {
          label: 'La guía de Alejandría',
          href: '/guide/alejandria',
          sentence: 'La ciudad mediterránea que responde a otra historia, y cómo darle más que una excursión de un día.',
        },
        {
          label: 'La guía de Siwa',
          href: '/guide/siwa',
          sentence: 'A ocho horas de El Cairo, y vale cada una; qué saber antes de comprometerte.',
        },
        {
          label: 'El templo de Abidos',
          href: '/guide/sohag/templo-de-abidos',
          sentence: 'El tallado más fino de Egipto se alza en un templo al que la mayoría de los itinerarios nunca llega.',
        },
      ],
    },

    journal: {
      heading: 'Un hilo del Diario',
      card: {
        title: 'Egipto más allá de las pirámides',
        deck: 'Fayoum, Siwa, Egipto Medio y los campos de pirámides alrededor de Guiza: lugares que suelen quedar fuera del primer itinerario, pero muestran otras capas del país.',
        href: '/blog/joyas-ocultas-de-egipto',
      },
    },

    close: {
      heading: 'El segundo viaje empieza en lo que el primero te enseñó.',
      body: 'Cuéntale al concierge dónde estuviste ya y qué se te quedó — el templo del que no querías irte, la tarde que se hizo corta. Planificará el regreso alrededor de lo que tu primer viaje no contuvo, no repitiendo lo que sí.',
      ctaLabel: 'Empieza la conversación',
      ctaHref: '/plan-your-tour',
    },

    crossRef: {
      lead: '¿No es lo tuyo? Hay ',
      linkText: 'otros cinco lugares donde empezar',
      hash: 'where-to-begin',
    },
  },

  // JA — re-authored per the locked JA register (journeys-ja-coming-back.md v1;
  // locked pending a native-speaker pass — verbatim, incl. —— dashes, 「」 quotes
  // and the half-width colon in the 弧 row). Essay carries one inline route link
  // to /journeys/desert-and-quiet (reciprocal with desert's link back); spaces
  // around the link are as written in the locked file.
  ja: {
    meta: {
      title: 'ふたたびのエジプト',
      description:
        '中部エジプト、アレクサンドリア、シワと遠いオアシス。二度目の旅の組み立て方——ひとつの地域を深く、最初の旅が許さなかった速度で。',
    },

    masthead: {
      eyebrow: '旅の始まり · ふたたびのエジプト',
      headlineLead: '二度目の旅で、エジプトは自己紹介をやめる。',
      headlineAccent: 'そして、話し始める。',
      standfirst:
        '中部エジプト、アレクサンドリア、シワと遠いオアシス——有名なエジプトの背後で待っている国。カイロと川を終えた人に、地図は開かれます。帰ってくる旅を、私たちはこう計画します。最初の旅があなたに何を稼ぎ、それをどこで使うか。',
    },

    essay: [
      '最初の旅のどこかで——おそらくルクソールの西岸で、あるいは夕暮れの船のデッキで——エジプトが旅程より大きいことに気づいたはずです。ほとんどの旅行者が気づきます。行動に移す人は、それより少ない。そして移す人こそ、私たちがいちばん計画したい旅行者です。二度目の旅は、私たちの仕事が面白くなる場所だからです。',
      '最初の旅があなたに買ってくれたものがあります。本質の物語はもう見た。だから、もう要らない。頭の中の委員会がピラミッドを主張することも、カルナックを飛ばす罪悪感もありません。二度目の旅は、何も網羅しなくていい。ひとつの地域に深く入り、そこに留まれます——そしてエジプトには、旅ひとつ分に値する地域が少なくとも三つあります。',
      'ひとつめは中部エジプト。観光バスが高度一万メートルで通過するナイル渓谷の一区間です。中王国の州侯が崖に墓を刻み、レスリングと鳥刺しの絵で埋めたベニ・ハサン。アクエンアテンが5年で建て、歴史が15年で見捨てた都アマルナ。地下回廊のトゥーナ・エル・ゲベル。そして南端に、アビドスとデンデラ——エジプトに現存する最も精緻な浮彫と、当時の顔料をいまも載せた天井。最初の旅がここを外す理由は、質ではありません。幾何学です。遺跡は200キロの渓谷に散らばり、ホテルは薄い。だからこの地域は、帰ってきた旅行者だけが持っているものに報います——忍耐と、リストのなさに。',
      'ふたつめはアレクサンドリアと地中海の縁。別の地域というより、別の国です。ファラオではなくギリシャ・ローマ、砂漠の光ではなく海の光、川岸ではなくコルニーシュ。エジプトの神々がローマの鎧をまとうコム・エル・ショカファのカタコンベ。大灯台の足跡に立つ要塞。その日の船が運んだものがメニューになる魚料理の店。アレクサンドリアはカイロから車で2時間半、気質では一世紀の距離です。北の旅に静けさを足すなら、デルタとワディ・エル・ナトルンの修道院群が自然につながります。',
      [
        '三つめは、私たちが内側から知っている場所——西方砂漠のオアシス群です。この家はシワで生まれました。だから遠回しには言いません。シワは、どこかへ行く途中にはありません。カイロから8時間、リビア国境の近く、ベルベルの言葉が話され、ナツメヤシの園と塩の湖と、アレクサンドロス大王が砂漠を越えてまで訪ねた神託所の遺跡を中心に回っています。その不便さこそが要点です。シワは、観客のために何も整えられていないときのエジプトです。その先では、ダフラとハルガが古い隊商路を南へ運んでいます——日干し煉瓦の町、ローマの砦、飛行機ではなく井戸が刻む速度。（白砂漠の奇岩と星空の一夜をお探しなら、それは別の種類の旅です——',
        { text: '砂漠と静けさ', href: '/journeys/desert-and-quiet' },
        ' で計画しています。）',
      ],
      '三つのどれがあなたのものかは、最初の旅が何を残していったかで決まります。古代エジプトをもっと深く、なのか。まったく別のエジプト、なのか。もっと古く、もっと静かなエジプト、なのか。それは比較表より良い会話であり、私たちのコンシェルジュが最初にする質問です。',
    ],

    operatorNote: {
      label: '内部情報',
      body: '帰ってくる旅行者は、計画しすぎます。エジプトの段取りを一度やり、手間を知っているから、二度目も同じ鎧で組みたくなる。こらえてください。地域はひとつ、そこを急がずに通る道筋ひとつ、そして何も入れない日を少なくとも一日。二度目の旅は、エジプトがあなたを観客ではなく客人として扱い始めるときです——そのための余白を渡してください。',
    },

    spine: {
      heading: '旅のかたち',
      rows: [
        { label: '日数', value: 'ひとつの地域をきちんと巡るなら7〜10日。ふたつの組み合わせも可能ですが、何を犠牲にするかはお伝えします' },
        { label: '弧', value: '三つにひとつ:中部エジプト · アレクサンドリアと北 · シワと遠いオアシス' },
        { label: '速度', value: '最初の旅より遅く、意図して。要となる訪問は一日ひとつで足りることが多いのです' },
        { label: '季節', value: '渓谷とオアシスは10月から4月。アレクサンドリアは、カイロが厳しい季節にこそ最良です' },
        { label: '向いている人', value: 'カイロと川を終え、有名なエジプトの背後にある国を求める旅行者' },
        { label: '始まり方', value: '最初の旅に何が入っていたかをコンシェルジュへ。入っていなかったもののまわりに計画します' },
      ],
    },

    weave: {
      heading: 'この旅が導く先',
      items: [
        {
          label: 'アレクサンドリア発シワ3日間のプライベートの旅',
          href: '/arekusandoria-kara-shiwa-e-san-nichikan-umi-sabaku-no',
          sentence: 'この家の出身地であるオアシスを、地図の要らない人間が計画します。',
        },
        {
          label: 'アレクサンドリアのガイド',
          href: '/guide/arekusandoria',
          sentence: '別の歴史に属する地中海の街と、日帰りより長い時間の与え方。',
        },
        {
          label: 'シワのガイド',
          href: '/guide/shiwa-oashisu',
          sentence: 'カイロから8時間。その一時間ずつに値します。決める前に知っておくべきこと。',
        },
        {
          label: 'アビドス神殿',
          href: '/guide/sohagu/abidosu-shinden',
          sentence: 'エジプト最良の彫りは、ほとんどの旅程が届かない神殿に立っています。',
        },
      ],
    },

    journal: {
      heading: 'ジャーナルから一篇',
      card: {
        title: 'ピラミッドの向こうにあるエジプト',
        deck: 'ファイユーム、シワ、中エジプト、ギザ周辺の小さなピラミッド群。初めての旅行では見落とされやすい場所を、なぜ行く価値があるのかという視点で整理します。',
        href: '/blog/piramiddo-no-muko-ni-aru-ejiputo',
      },
    },

    close: {
      heading: '二度目の旅は、最初の旅が教えたことから始まります。',
      body: 'どこへ行ったか、何が残ったかをコンシェルジュへ——離れがたかった神殿、短すぎた午後。最初の旅に入っていたものを繰り返すのではなく、入っていなかったもののまわりに、帰ってくる旅を組み立てます。',
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
