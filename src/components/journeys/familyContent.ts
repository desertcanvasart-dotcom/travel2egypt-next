import type { JourneyContent, LocalizedJourney } from './JourneyPage';

/**
 * Locked page copy for /journeys/travelling-as-a-family (traveller-type page #4).
 *
 * VERBATIM from the owner-approved draft (journeys-travelling-as-a-family.md
 * v1). DO NOT rewrite, tighten, or soften — the toddler honesty and the
 * Christmas/Easter booking note stay word-for-word. Square-bracketed draft
 * items were wiring decisions, resolved here (confirmed live slugs; owner
 * picks). Same co-located pattern as the other journeys pages — no Sanity
 * schema, no production writes. No inline essay links on this page.
 *
 * Flagship (weave slot 1): the essay's middle movement is a Nile CRUISE
 * ("unpacking once", "the pool thirty metres from the temple gangway"). The
 * 11-day candidate's Nile leg is a drive Aswan→Luxor with hotel stays (its
 * own body: "The drive from Aswan to Luxor… pauses twice"; character line
 * "five-star hotels and a Red Sea resort"; cruise offered only as an upsell),
 * so per the owner's rule the featured package is the 14-day, whose Nile leg
 * is an actual cruise ("A Nile cruise carries you north past Kom Ombo and
 * Edfu to Luxor… the cruise ship luxury-grade"), with the Red Sea after the
 * sites.
 */
export const familyContent: LocalizedJourney = {
  en: {
    meta: {
      title: 'Travelling as a Family in Egypt',
      description:
        'Egypt with children — Cairo in short morning strikes, the Nile by boat, a Red Sea close. How we pace a family trip: one anchor a morning, afternoons for the pool.',
    },

    masthead: {
      eyebrow: 'A STARTING POINT · TRAVELLING AS A FAMILY',
      headlineLead: 'Egypt was practically designed for children.',
      headlineAccent: 'Itineraries rarely are.',
      standfirst:
        "Mummies, pyramids you can go inside, a hotel that sails — no destination we know holds a child's attention like this one. The craft is in the pacing: short mornings at the sites, afternoons that belong to the pool, and a trip that ends at the Red Sea instead of in an airport queue. This is how we build Egypt for families.",
    },

    essay: [
      'Families arrive at us carrying one of two worries, and they are opposites. The first: that Egypt will be too much for the children — the heat, the crowds, the distances. The second: that travelling with children means a diluted Egypt, the real trip postponed until they are older. Two decades of family departures have convinced us both worries are wrong, and for the same reason. Egypt is extraordinary with children. It just cannot be the adult itinerary with children attached.',
      'Consider what this country offers an eight-year-old: a real mummy, not a picture of one. A pyramid with a passage you are allowed to climb down. Tombs painted with snakes and crocodile gods. A boat that is also the hotel. Children do not need Egypt explained to them; they need it paced for them. The attention that evaporates in the third museum hall is bottomless at the rail of a boat watching the riverbank go by.',
      'So the family trip we build has three movements. Cairo first, taken in short, vivid strikes: the Giza plateau early, one pyramid interior while it is still cool, the Tutankhamun galleries taken at a child’s speed — which is fast through some rooms and transfixed in others — and the afternoon at the hotel pool, on purpose. Two anchors a day is our rule for adults; with children it is one, and it happens in the morning.',
      'Then the Nile, which is where Egypt solves family travel almost by itself. A cruise means unpacking once. It means the pool is thirty metres from the temple gangway, the kitchen already knows what your children eat, and the distances between sites cross themselves while everyone sleeps. Temples come one per morning — Kom Ombo’s crocodiles and Edfu’s falcon are reliable hits — and the deck does the rest. We choose the boat deliberately for families: pool size, cabin configuration, and whether the crew are the kind who remember names. They are not all alike, and we know which are which.',
      'Last, the Red Sea — and the order matters. Ending there, rather than starting, gives the trip somewhere to exhale. Three or four nights of reef and pool after the sites are done, when the early mornings have been earned and nobody has to set an alarm. Children remember Egypt as the place with the mummies and the fish, which is a better souvenir than any itinerary can print.',
      'Two practical truths, stated plainly. Ages matter: the trip above is built for school-age children, roughly six and up, who can walk a site in the morning heat and be bribed through the last twenty minutes. It can be built for toddlers, but it becomes a different trip — shorter mornings, more Cairo, less desert — and we will say so rather than sell you the standard one. And seasons matter twice over for families: October to April is Egypt at its kindest, but Christmas and Easter weeks are when every family in Europe has the same idea, so those departures are the ones to settle earliest.',
    ],

    operatorNote: {
      label: 'Honest take',
      body: "A child who spent the morning inside a pyramid does not need the afternoon in a museum. The families who enjoy Egypt most are the ones who accept, on day one, that the pool at four o'clock is part of the itinerary and not a failure of it. Plan one anchor a day for the adults' Egypt. The children's Egypt — the boat rail, the hotel cats, the mango juice — takes care of itself.",
    },

    spine: {
      heading: 'The shape of the trip',
      rows: [
        { label: 'Length', value: '10–12 days with the Red Sea close; 8 without it, and we will tell you which nights to protect' },
        { label: 'The arc', value: 'Cairo · the Nile by boat · the Red Sea' },
        { label: 'The pace', value: 'one anchor a morning; afternoons belong to the pool' },
        { label: 'The season', value: 'October to April; Christmas and Easter weeks book out first, so those plans start earliest' },
        { label: 'Best suited to', value: 'families with school-age children; travelling with toddlers changes the trip, and we will say how' },
        { label: 'How it begins', value: 'tell the concierge the ages; everything else follows from them' },
      ],
    },

    weave: {
      heading: 'Where this usually leads',
      items: [
        {
          label: 'The 14-day private family journey: Cairo, a Nile cruise and the Red Sea',
          href: '/14-day-egypt-luxury-family-holiday',
          sentence: 'The three movements this page describes, built privately and paced for the youngest person on it.',
        },
        {
          label: 'Hurghada destination guide',
          href: '/guide/hurghada',
          sentence: 'Where the trip exhales — the reef, the pool, and which stretch of coast suits families best.',
        },
        {
          label: 'Nile cruises',
          href: '/nile-cruises',
          sentence: 'Not all boats are equal with children aboard; pool size, cabins and crew temperament, and how we choose among them.',
        },
        {
          label: 'The Great Pyramid of Khufu',
          href: '/guide/giza/the-great-pyramid-of-khufu',
          sentence: 'The morning strike that starts the whole trip, and how to time it.',
        },
      ],
    },

    journal: {
      heading: 'One journal thread',
      card: {
        title: 'Egypt with Children',
        deck: 'How to build an Egypt family trip — age, heat, how to show the sites, Nile cruises, the Red Sea, and the desert handled practically.',
        href: '/blog/family-adventures-in-egypt',
      },
    },

    close: {
      heading: 'Every family trip we build starts with the same question.',
      body: 'The ages. Tell the concierge who is coming — six and nine travel differently from thirteen and fifteen — and the pacing, the boat, the hotels and the things worth skipping all follow from the answer.',
      ctaLabel: 'Start the conversation',
      ctaHref: '/plan-your-tour',
    },

    crossRef: {
      lead: 'Not quite you? There are ',
      linkText: 'five other places to start',
      hash: 'where-to-begin',
    },
  },

  // ES — re-authored per the locked register (journeys-es-travelling-as-a-family.md v1).
  es: {
    meta: {
      title: 'Viajar en familia',
      description:
        'El Cairo en golpes breves, un crucero por el Nilo donde la maleta se deshace una vez y el mar Rojo para exhalar: cómo armamos Egipto al ritmo de los niños.',
    },

    masthead: {
      eyebrow: 'UN PUNTO DE PARTIDA · VIAJAR EN FAMILIA',
      headlineLead: 'Egipto se diseñó prácticamente para niños.',
      headlineAccent: 'Los itinerarios, rara vez.',
      standfirst:
        'Momias, pirámides por dentro, un hotel que navega — ningún destino que conozcamos sostiene la atención de un niño como este. El oficio está en el ritmo: mañanas cortas en los sitios, tardes que son de la piscina, y un viaje que termina en el mar Rojo y no en la cola de un aeropuerto. Así construimos Egipto para familias.',
    },

    essay: [
      'Las familias llegan a nosotros cargando una de dos preocupaciones, y son opuestas. La primera: que Egipto sea demasiado para los niños — el calor, las multitudes, las distancias. La segunda: que viajar con niños signifique un Egipto diluido, el viaje de verdad aplazado hasta que crezcan. Dos décadas de salidas familiares nos han convencido de que ambas están equivocadas, y por la misma razón. Egipto es extraordinario con niños. Solo que no puede ser el itinerario de adultos con niños adjuntos.',
      'Piensa en lo que este país le ofrece a un niño de ocho años: una momia de verdad, no una foto de una. Una pirámide con un pasadizo por el que está permitido bajar. Tumbas pintadas con serpientes y dioses cocodrilo. Un barco que además es el hotel. Los niños no necesitan que les expliquen Egipto; necesitan que se lo pongan a su ritmo. La atención que se evapora en la tercera sala de museo es infinita en la barandilla de un barco viendo pasar la orilla.',
      'Así que el viaje familiar que armamos tiene tres movimientos. Primero El Cairo, tomado en golpes breves y vívidos: la meseta de Guiza temprano, el interior de una pirámide mientras aún refresca, las galerías de Tutankamón al paso de un niño — que es rápido en unas salas y absorto en otras — y la tarde en la piscina del hotel, a propósito. Dos visitas de peso al día es nuestra regla con adultos; con niños es una, y ocurre por la mañana.',
      'Después el Nilo, que es donde Egipto resuelve el viaje familiar casi por sí solo. Un crucero significa deshacer la maleta una vez. Significa que la piscina está a treinta metros de la pasarela del templo, que la cocina ya sabe qué comen tus hijos y que las distancias entre sitios se cruzan solas mientras todos duermen. Los templos llegan de uno en uno por la mañana — los cocodrilos de Kom Ombo y el halcón de Edfu son éxitos fiables — y la cubierta hace el resto. Elegimos el barco deliberadamente para familias: tamaño de la piscina, configuración de los camarotes y si la tripulación es de la que recuerda nombres. No todos son iguales, y sabemos cuál es cuál.',
      'Al final, el mar Rojo — y el orden importa. Terminar allí, en lugar de empezar, le da al viaje un sitio donde exhalar. Tres o cuatro noches de arrecife y piscina cuando los sitios ya están hechos, los madrugones ya se ganaron y nadie tiene que poner alarma. Los niños recuerdan Egipto como el lugar de las momias y los peces, que es mejor recuerdo del que cualquier itinerario puede imprimir.',
      'Dos verdades prácticas, dichas claras. La edad importa: el viaje de arriba está hecho para niños en edad escolar, de unos seis en adelante, capaces de caminar un sitio con el calor de la mañana y de dejarse sobornar los últimos veinte minutos. Puede armarse con niños más pequeños, pero se vuelve otro viaje — mañanas más cortas, más Cairo, menos desierto — y te lo diremos en vez de venderte el estándar. Y la temporada importa dos veces para las familias: de octubre a abril es Egipto en su versión más amable, pero las semanas de Navidad y Semana Santa son cuando media Europa tiene la misma idea, así que esas salidas son las que se cierran antes.',
    ],

    operatorNote: {
      label: 'Opinión honesta',
      body: 'Un niño que pasó la mañana dentro de una pirámide no necesita la tarde en un museo. Las familias que más disfrutan Egipto son las que aceptan, desde el primer día, que la piscina a las cuatro es parte del itinerario y no un fracaso del plan. Planifica una visita de peso al día para el Egipto de los adultos. El Egipto de los niños — la barandilla del barco, los gatos del hotel, el zumo de mango — se cuida solo.',
    },

    spine: {
      heading: 'La forma del viaje',
      rows: [
        { label: 'Duración', value: 'de 10 a 12 días con el cierre en el mar Rojo; 8 sin él, y te diremos qué noches proteger' },
        { label: 'El arco', value: 'El Cairo · el Nilo en barco · el mar Rojo' },
        { label: 'El ritmo', value: 'una visita de peso por mañana; las tardes son de la piscina' },
        { label: 'La temporada', value: 'de octubre a abril; las semanas de Navidad y Semana Santa se agotan primero: esos planes empiezan antes' },
        { label: 'Para quién', value: 'familias con niños en edad escolar; viajar con niños pequeños cambia el viaje, y te diremos cómo' },
        { label: 'Cómo empieza', value: 'dile al concierge las edades; todo lo demás se deriva de ellas' },
      ],
    },

    weave: {
      heading: 'A dónde suele llevar',
      items: [
        {
          label: 'El viaje familiar privado de 11 días: El Cairo, el Nilo y el mar Rojo',
          href: '/el-esplendor-de-egipto-en-11-dias',
          sentence: 'Los tres movimientos que esta página describe, construidos en privado y al ritmo del más pequeño a bordo.',
        },
        {
          label: 'La guía de Hurgada',
          href: '/guide/hurghada',
          sentence: 'Donde el viaje exhala — el arrecife, la piscina y qué tramo de costa conviene más a las familias.',
        },
        {
          label: 'Cruceros por el Nilo',
          href: '/nile-cruises',
          sentence: 'No todos los barcos son iguales con niños a bordo; piscina, camarotes y el carácter de la tripulación, y cómo elegimos entre ellos.',
        },
        {
          label: 'La Gran Pirámide de Keops',
          href: '/guide/guiza/la-gran-piramide-de-keops',
          sentence: 'El golpe de la primera mañana que arranca todo el viaje, y cómo elegir su hora.',
        },
      ],
    },

    journal: {
      heading: 'Un hilo del Diario',
      card: {
        title: 'Egipto con niños',
        deck: 'Guía práctica para organizar un viaje familiar por Egipto: edades, calor, monumentos, crucero por el Nilo, mar Rojo, desierto, salud y ritmo realista.',
        href: '/blog/aventuras-familiares-en-egipto',
      },
    },

    close: {
      heading: 'Cada viaje familiar que construimos empieza con la misma pregunta.',
      body: 'Las edades. Dile al concierge quién viene — seis y nueve viajan distinto que trece y quince — y el ritmo, el barco, los hoteles y lo que conviene saltarse se derivan de la respuesta.',
      ctaLabel: 'Empieza la conversación',
      ctaHref: '/plan-your-tour',
    },

    crossRef: {
      lead: '¿No es lo tuyo? Hay ',
      linkText: 'otros cinco lugares donde empezar',
      hash: 'where-to-begin',
    },
  },

  // JA — re-authored per the locked JA register (journeys-ja-travelling-as-a-
  // family.md v1; locked pending a native-speaker pass — verbatim). Carries the
  // corrected claim 二十年 (two decades), matching the fixed EN and the ES.
  // No inline essay links on this page.
  ja: {
    meta: {
      title: '家族で旅する',
      description:
        '短い午前のカイロ、荷ほどきが一度で済むナイル川クルーズ、息を吐くための紅海。子どもの速度で組み立てるエジプトのかたち。',
    },

    masthead: {
      eyebrow: '旅の始まり · 家族で旅する',
      headlineLead: 'エジプトは、ほとんど子どものために設計されている。',
      headlineAccent: '旅程は、めったにそうではない。',
      standfirst:
        'ミイラ、中に入れるピラミッド、航行するホテル——子どもの注意をこれほど掴んで離さない旅先を、私たちは知りません。技術は速度にあります。遺跡は短い午前に、午後はプールのものに、そして旅は空港の列ではなく紅海で終わるように。家族のためのエジプトを、私たちはこう組み立てます。',
    },

    essay: [
      'ご家族は、ふたつの正反対の心配のどちらかを抱えて訪ねてこられます。ひとつは、エジプトが子どもには過酷ではないか——暑さ、人混み、距離。もうひとつは、子ども連れの旅は薄められたエジプトになり、本当の旅は大きくなるまでお預けではないか。二十年の家族の旅が、どちらも間違いだと私たちに教えました。しかも、同じ理由で。エジプトは、子どもと一緒だと格別です。ただし、大人の旅程に子どもを付け足したものでは、あり得ません。',
      'この国が8歳の子に差し出すものを考えてみてください。写真ではない、本物のミイラ。降りることが許された通路のあるピラミッド。蛇とワニの神々が描かれた墓。ホテルでもある船。子どもにエジプトの説明は要りません。子どもの速度に合わせることが要るのです。博物館の三つめの展示室で蒸発する集中力は、岸辺が流れていく船の手すりでは無尽蔵です。',
      'だから私たちの家族の旅は、三楽章です。まずカイロを、短く鮮やかな一撃で。ギザの台地は朝早く、まだ涼しいうちにピラミッド内部をひとつ、ツタンカーメンの展示室は子どもの速度で——いくつかの部屋は駆け足で、いくつかの部屋では釘付けになる速度で——そして午後はホテルのプールへ。意図的にです。大人なら要となる訪問は一日ふたつが私たちの規則。子ども連れならひとつで、午前に置きます。',
      '次にナイル。エジプトが家族旅行をほぼ独力で解決してくれる場所です。クルーズは、荷ほどきが一度で済むということ。プールが神殿の桟橋から30メートルにあり、厨房はもうお子さんの食べるものを知っていて、遺跡間の距離はみなが眠っているあいだに勝手に越えられていくということです。神殿は午前にひとつずつ——コム・オンボのワニとエドフの隼は確実な当たりです——残りはデッキが引き受けます。船は家族のために意図して選びます。プールの大きさ、キャビンの間取り、そして名前を覚えるたぐいの乗組員かどうか。船はどれも同じではなく、どれがどれかを私たちは知っています。',
      '最後に紅海——そして順序が大事です。始まりではなく終わりに置くことで、旅は息を吐く場所を持ちます。遺跡が済み、早起きの元は取れ、誰も目覚ましをかけなくていい3〜4泊のリーフとプール。子どもはエジプトを「ミイラと魚の場所」として覚えます。どんな旅程が印刷できるものより、良い土産です。',
      '実際的な真実をふたつ、はっきりと。年齢は重要です。上の旅は学齢期——おおよそ6歳から——の子ども向けに組まれています。朝の暑さの中で遺跡をひとつ歩き切り、最後の20分は買収に応じてくれる年齢です。もっと小さなお子さんとも組めますが、別の旅になります——午前は短く、カイロは多く、砂漠は少なく——そして標準版を売る代わりに、そうお伝えします。そして季節は、家族には二重に重要です。10月から4月がエジプトのいちばん優しい季節。ただしクリスマスとイースターの週は、ヨーロッパ中の家族が同じことを考えるときです。あの出発日から埋まっていきます。',
    ],

    operatorNote: {
      label: '正直な所見',
      body: '午前をピラミッドの中で過ごした子どもに、午後の博物館は要りません。エジプトをいちばん楽しむご家族は、初日から受け入れたご家族です——4時のプールは旅程の一部であって、計画の失敗ではないと。大人のエジプトのために、要となる訪問を一日ひとつ。子どものエジプト——船の手すり、ホテルの猫、マンゴージュース——は、勝手に育ちます。',
    },

    spine: {
      heading: '旅のかたち',
      rows: [
        { label: '日数', value: '紅海で締めるなら10〜12日。なしなら8日。守るべき夜はどれか、お伝えします' },
        { label: '弧', value: 'カイロ · 船のナイル · 紅海' },
        { label: '速度', value: '要となる訪問は午前にひとつ。午後はプールのものです' },
        { label: '季節', value: '10月から4月。クリスマスとイースターの週が最初に埋まります。その計画が、いちばん早く始まります' },
        { label: '向いている人', value: '学齢期の子どもがいるご家族。幼児連れは別の旅になります。どう変わるかはお伝えします' },
        { label: '始まり方', value: 'コンシェルジュへ、年齢を。ほかのすべては、そこから導かれます' },
      ],
    },

    weave: {
      heading: 'この旅が導く先',
      items: [
        {
          label: 'カイロ、ナイル、紅海——11日間の家族のプライベート・パッケージ',
          href: '/ejiputo-no-hana-piramiddo-kara-kokai-e-no-11-nichikan',
          sentence: 'このページが描いた三楽章を、船上の一番小さい人の速度で、プライベートに。',
        },
        {
          label: 'ハルガダのガイド',
          href: '/guide/harugada',
          sentence: '旅が息を吐く場所——リーフ、プール、そして家族にはどの海岸が向いているか。',
        },
        {
          label: 'ナイル川クルーズ',
          href: '/nile-cruises',
          sentence: '子どもが乗るなら、船はどれも同じではありません。プール、キャビン、乗組員の気質。私たちの選び方。',
        },
        {
          label: 'クフ王の大ピラミッド',
          href: '/guide/giza/kufuo-no-dai-piramiddo',
          sentence: '旅全体を始動させる最初の朝の一撃と、その時刻の選び方。',
        },
      ],
    },

    journal: {
      heading: 'ジャーナルから一篇',
      card: {
        title: '子どもと行くエジプト',
        deck: '家族旅行でエジプトをどう組むべきか。年齢、暑さ、遺跡の見せ方、ナイルクルーズ、紅海、砂漠を現実的に整理するガイド。',
        href: '/blog/kodomo-to-iku-ejiputo',
      },
    },

    close: {
      heading: '私たちが組む家族の旅は、みな同じ質問から始まります。',
      body: '年齢です。誰が来るのかをコンシェルジュへ——6歳と9歳は、13歳と15歳とは違う旅をします。速度も、船も、ホテルも、飛ばしてよいものも、答えから導かれます。',
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
