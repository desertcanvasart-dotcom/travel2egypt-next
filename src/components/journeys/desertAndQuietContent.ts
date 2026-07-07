import type { JourneyContent, LocalizedJourney } from './JourneyPage';

/**
 * Locked page copy for /journeys/desert-and-quiet (traveller-type page #3).
 *
 * VERBATIM from the owner-approved draft (journeys-desert-and-quiet.md v1). DO
 * NOT rewrite, tighten, or soften — the caution operator note especially stays
 * word-for-word. Square-bracketed draft items were wiring decisions, resolved
 * here (confirmed live slugs; owner picks: 3-day White Desert camp package,
 * "Egypt's Western Desert" journal). Same co-located pattern as the other two
 * journeys pages — no Sanity schema, no production writes.
 *
 * Flagship (weave slot 1): the 2-day Bahariya package overnights at an oasis
 * lodge, not camped in the chalk ("does not overnight in the White Desert"),
 * so per the owner's rule the featured package is the 3-day tour, which camps
 * one night under the stars in the White Desert — matching the locked sentence.
 *
 * Essay note: the "Coming back" cross-reference is an inline link to the live
 * /journeys/coming-back route, so that paragraph is a segment array.
 */
export const desertAndQuietContent: LocalizedJourney = {
  en: {
    meta: {
      title: 'Desert & Quiet in Egypt',
      description:
        "Bahariya, the White Desert and Fayoum — Egypt's western silence. How we plan a night camped in the chalk, and the gentler desert for those who want a roof.",
    },

    masthead: {
      eyebrow: 'A STARTING POINT · DESERT & QUIET',
      headlineLead: 'Not everything in Egypt was built.',
      headlineAccent: 'Some of it was left alone.',
      standfirst:
        "Bahariya, the White Desert and Fayoum — the country's western silence, four hours from Cairo's noise. Two days out there change how the rest of Egypt sounds. This is how we plan them: what a night in the chalk actually involves, and the gentler desert for those who want a roof.",
    },

    essay: [
      'Every itinerary we build is, in the end, a sequence of loud places. The temples have crowds, the crowds have guides, the guides have microphones, and Cairo underneath it all runs its permanent engine. None of this is a complaint — the noise is part of what Egypt is. But when travellers tell us, months later, which part of the trip they find themselves returning to at odd moments, a surprising number name the same thing: the night the itinerary went silent.',
      "That night usually happens in the White Desert. The trip is simple to describe. You leave Cairo in the morning and drive southwest — four hours to Bahariya, an oasis of date palms and hot springs where lunch happens and the road ends. From there it is 4x4s: through the Black Desert's dark-capped hills, past Crystal Mountain's ridge of quartz, and into the White Desert by late afternoon, when the low sun starts doing things to the chalk. What the wind has carved there — mushrooms, spires, shapes the guides have named and shapes they haven't — photographs like another planet and behaves like one too. Camp goes up among the formations. Dinner is cooked over fire. A fennec fox will very likely visit, because they have learned what camps mean. And then the main event, which is nothing at all: no light on any horizon, the Milky Way at full strength, and a silence so complete most people realise they have never actually heard one before.",
      'Dawn in the chalk is the other half of the argument. The formations turn from grey to white to gold in about twenty minutes, and you have them to yourself, because there is no gate, no queue, and no one to share them with beyond your own camp.',
      'Then there is the gentler desert. Fayoum is barely two hours from Cairo and holds an astonishing amount in a small compass: Wadi El Rayan’s waterfalls, the lake at Qarun that has been attracting Cairenes since the pharaohs, the pottery village of Tunis, and — the reason we send almost everyone — Wadi El Hitan, the Valley of the Whales, where forty-million-year-old skeletons lie in the open sand, whales with the last traces of the legs they were in the process of losing. Evolution, written where you can walk up and read it. Fayoum works as a long day from Cairo or, better, as a soft overnight in Tunis with a hotel bed, which makes it the desert for travellers who want the silence without the sleeping bag.',
      [
        'How much of a trip should this be? There are two honest answers. For most first visits, the desert is the counterweight: two days folded into the classic itinerary, placed where the temple fatigue would otherwise set in, doing for the trip what a rest note does for music. But for some travellers the desert turns out to be the point — in which case the White Desert is the beginning of a longer road, and Siwa and the far oases continue it. We plan those under ',
        { text: 'Coming back', href: '/journeys/coming-back' },
        '; the two trips are cousins.',
      ],
    ],

    operatorNote: {
      label: 'Caution',
      body: 'Comfortable camping is still camping. Dinner is cooked, the mattresses are thick, the blankets are heavy — and the nearest wall is forty kilometres away. December and January nights touch zero, and the facilities are the desert itself. If that paragraph excites you, this trip is yours. If it gives you pause, take Fayoum and the Tunis overnight instead — the silence is nearly as good, and it comes with a shower.',
    },

    spine: {
      heading: 'The shape of the trip',
      rows: [
        { label: 'Length', value: 'two days and a night for the White Desert; one long day or a soft overnight for Fayoum; four to five days if the desert is the trip' },
        { label: 'The arc', value: 'Cairo · Bahariya · the White Desert — or Cairo · Fayoum for the version with a roof' },
        { label: 'The pace', value: 'one long drive out, then almost nothing scheduled; that is the product' },
        { label: 'The season', value: 'October to April; winter nights near zero, so pack for a hot noon and a cold midnight in the same bag' },
        { label: 'Best suited to', value: 'travellers who want the counterweight to the temples, and sleep better under stars than deadlines' },
        { label: 'How it begins', value: 'tell the concierge one thing first: stars overhead, or a roof' },
      ],
    },

    weave: {
      heading: 'Where this usually leads',
      items: [
        {
          label: 'The 3-day private White Desert camp from Cairo',
          href: '/3-day-bahariya-white-desert-tour',
          sentence: 'The two days and the night this page has been describing, planned by people who know which campsite catches the dawn.',
        },
        {
          label: 'Bahariya destination guide',
          href: '/guide/bahariya-oasis',
          sentence: 'The oasis where the road ends and the 4x4s begin — springs, palms, and the last hot lunch before the chalk.',
        },
        {
          label: 'Fayoum destination guide',
          href: '/guide/al-fayoum',
          sentence: 'The gentler desert two hours from Cairo, and how to give it more than the standard day trip.',
        },
        {
          label: 'The Valley of the Whales',
          href: '/guide/al-fayoum/wadi-al-hittan',
          sentence: 'Whales that still remember having legs, lying in open sand you are allowed to walk.',
        },
      ],
    },

    journal: {
      heading: 'One journal thread',
      card: {
        title: "Egypt's Western Desert",
        deck: 'Egypt’s Western Desert holds oases, the White Desert, Black Desert, ancient caravan routes, Roman temples, and landscapes near Nubia and Libya. Sights and cautions for travellers.',
        href: '/blog/the-western-desert-in-egypt',
      },
    },

    close: {
      heading: 'The desert asks one question before any itinerary does.',
      body: "Stars overhead, or a roof — everything else follows from that. Tell the concierge which traveller you are, and whether the desert is your trip's counterweight or its whole point. The plan will be shaped around the answer.",
      ctaLabel: 'Start the conversation',
      ctaHref: '/plan-your-tour',
    },

    crossRef: {
      lead: 'Not quite you? There are ',
      linkText: 'five other places to start',
      hash: 'where-to-begin',
    },
  },

  // ES — re-authored per the locked register (journeys-es-desert-and-quiet.md v1).
  // Essay carries one inline route link to /journeys/coming-back — reciprocal
  // with coming-back's link here.
  es: {
    meta: {
      title: 'Desierto y calma',
      description:
        'Bahariya, el Desierto Blanco y Fayum: una noche entre la caliza, el desierto amable con cama de hotel, y cómo dos días de silencio cambian el resto de Egipto.',
    },

    masthead: {
      eyebrow: 'UN PUNTO DE PARTIDA · DESIERTO Y CALMA',
      headlineLead: 'No todo en Egipto se construyó.',
      headlineAccent: 'Una parte se dejó en paz.',
      standfirst:
        'Bahariya, el Desierto Blanco y Fayum — el silencio occidental del país, a cuatro horas del ruido de El Cairo. Dos días allí cambian cómo suena el resto de Egipto. Así los planificamos: qué implica de verdad una noche entre la caliza, y el desierto más amable para quien quiere un techo.',
    },

    essay: [
      'Todo itinerario que armamos es, al final, una secuencia de lugares ruidosos. Los templos tienen multitudes, las multitudes tienen guías, los guías tienen micrófonos, y El Cairo debajo de todo hace girar su motor permanente. Nada de esto es una queja — el ruido es parte de lo que Egipto es. Pero cuando los viajeros nos cuentan, meses después, a qué parte del viaje vuelven en los momentos sueltos, un número sorprendente nombra lo mismo: la noche en que el itinerario se quedó en silencio.',
      'Esa noche suele ocurrir en el Desierto Blanco. El viaje es sencillo de describir. Sales de El Cairo por la mañana y conduces al suroeste — cuatro horas hasta Bahariya, un oasis de palmeras datileras y aguas termales donde ocurre el almuerzo y se acaba la carretera. Desde allí, todoterrenos: por las colinas de cima oscura del Desierto Negro, junto a la cresta de cuarzo de la Montaña de Cristal, y hasta el Desierto Blanco a media tarde, cuando el sol bajo empieza a hacerle cosas a la caliza. Lo que el viento ha tallado allí — setas, agujas, formas que los guías han bautizado y formas que no — se fotografía como otro planeta y se comporta como tal. El campamento se monta entre las formaciones. La cena se cocina al fuego. Un zorro fénec muy probablemente hará su visita, porque han aprendido lo que significan los campamentos. Y luego el plato fuerte, que es nada en absoluto: ninguna luz en ningún horizonte, la Vía Láctea a plena potencia, y un silencio tan completo que la mayoría descubre que nunca había oído uno de verdad.',
      'El amanecer en la caliza es la otra mitad del argumento. Las formaciones pasan del gris al blanco al dorado en unos veinte minutos, y las tienes para ti, porque no hay puerta, no hay cola y no hay con quién compartirlas más allá de tu propio campamento.',
      'Luego está el desierto amable. Fayum queda a apenas dos horas de El Cairo y guarda una cantidad asombrosa en poco espacio: las cascadas de Wadi El Rayan, el lago Qarun que atrae a los cairotas desde los faraones, el pueblo alfarero de Tunis y — la razón por la que mandamos allí a casi todo el mundo — Wadi El Hitan, el Valle de las Ballenas, donde esqueletos de cuarenta millones de años yacen a cielo abierto: ballenas con los últimos rastros de las patas que estaban en proceso de perder. La evolución, escrita donde puedes acercarte a leerla. Fayum funciona como un día largo desde El Cairo o, mejor, como una noche suave en Tunis con cama de hotel, lo que lo convierte en el desierto para quien quiere el silencio sin el saco de dormir.',
      [
        '¿Cuánto viaje debería ser esto? Hay dos respuestas honestas. Para la mayoría de las primeras visitas, el desierto es el contrapeso: dos días plegados dentro del itinerario clásico, puestos donde el cansancio de templos empezaría a asomar, haciendo por el viaje lo que un silencio hace por la música. Pero para algunos viajeros el desierto resulta ser el punto — y entonces el Desierto Blanco es el principio de una carretera más larga, y Siwa y los oasis lejanos la continúan. Esos los planificamos en ',
        { text: 'Volver a Egipto', href: '/journeys/coming-back' },
        '; los dos viajes son primos.',
      ],
    ],

    operatorNote: {
      label: 'Cuidado',
      body: 'Acampar con comodidad sigue siendo acampar. La cena se cocina, los colchones son gruesos, las mantas pesan — y la pared más cercana está a cuarenta kilómetros. Las noches de diciembre y enero rozan el cero, y las instalaciones son el propio desierto. Si este párrafo te ilusiona, este viaje es tuyo. Si te hace dudar, toma Fayum y la noche en Tunis — el silencio es casi igual de bueno, y viene con ducha.',
    },

    spine: {
      heading: 'La forma del viaje',
      rows: [
        { label: 'Duración', value: 'dos días y una noche para el Desierto Blanco; un día largo o una noche suave para Fayum; de 4 a 5 días si el desierto es el viaje' },
        { label: 'El arco', value: 'El Cairo · Bahariya · el Desierto Blanco — o El Cairo · Fayum para la versión con techo' },
        { label: 'El ritmo', value: 'un trayecto largo de ida y, después, casi nada programado; ese es el producto' },
        { label: 'La temporada', value: 'de octubre a abril; las noches de invierno rozan el cero: prepárate para un mediodía caliente y una medianoche fría en la misma bolsa' },
        { label: 'Para quién', value: 'viajeros que quieren el contrapeso de los templos, y duermen mejor bajo estrellas que bajo plazos' },
        { label: 'Cómo empieza', value: 'dile una cosa primero al concierge: estrellas encima, o techo' },
      ],
    },

    weave: {
      heading: 'A dónde suele llevar',
      items: [
        {
          label: 'El campamento privado de 3 días en el Desierto Blanco',
          href: '/3-day-bahariya-white-desert-tour',
          sentence: 'Los dos días y la noche que esta página describe, planificados por gente que sabe qué campamento atrapa el amanecer.',
        },
        {
          label: 'La guía de Bahariya',
          href: '/guide/bahariya',
          sentence: 'El oasis donde se acaba la carretera y empiezan los todoterrenos — manantiales, palmeras y el último almuerzo caliente antes de la caliza.',
        },
        {
          label: 'La guía de Fayum',
          href: '/guide/al-fayoum',
          sentence: 'El desierto amable a dos horas de El Cairo, y cómo darle más que la excursión estándar.',
        },
        {
          label: 'El Valle de las Ballenas',
          href: '/guide/al-fayoum/wadi-al-hitan',
          sentence: 'Ballenas que aún recuerdan haber tenido patas, tendidas en una arena abierta que se puede pisar.',
        },
      ],
    },

    journal: {
      heading: 'Un hilo del Diario',
      card: {
        title: 'El Desierto Occidental de Egipto',
        deck: 'Oasis, Desierto Blanco, Desierto Negro, rutas caravaneras, templos romanos y pueblos de adobe. Qué ver en el Desierto Occidental y qué revisar antes de viajar.',
        href: '/blog/el-desierto-occidental-en-egipto',
      },
    },

    close: {
      heading: 'El desierto hace una pregunta antes que cualquier itinerario.',
      body: 'Estrellas encima, o techo — todo lo demás se deriva de eso. Dile al concierge qué viajero eres, y si el desierto es el contrapeso de tu viaje o su punto entero. El plan tomará forma alrededor de la respuesta.',
      ctaLabel: 'Empieza la conversación',
      ctaHref: '/plan-your-tour',
    },

    crossRef: {
      lead: '¿No es lo tuyo? Hay ',
      linkText: 'otros cinco lugares donde empezar',
      hash: 'where-to-begin',
    },
  },

  // JA — re-authored per the locked JA register (journeys-ja-desert-and-quiet.md
  // v1; locked pending a native-speaker pass — verbatim, incl. the half-width
  // colon in the 始まり方 row). Essay carries one inline route link to
  // /journeys/coming-back (reciprocal). Flagship wired to the defined-but-
  // unlocalized JA slug (same string as EN — direct resolve, no redirect; owner-
  // confirmed, mirrors ES). Journal card title uses the live article's 西部砂漠
  // against the essay's 西方砂漠 — known variance, logged for the native pass.
  ja: {
    meta: {
      title: '砂漠と静けさ',
      description:
        'バハレイヤ、白砂漠、ファイユーム。白亜の中の一夜が実際に何を意味するか、屋根のある穏やかな砂漠、そして2日間の沈黙が残りのエジプトの聞こえ方を変える理由。',
    },

    masthead: {
      eyebrow: '旅の始まり · 砂漠と静けさ',
      headlineLead: 'エジプトのすべてが、建てられたわけではない。',
      headlineAccent: 'そのままにされたものもある。',
      standfirst:
        'バハレイヤ、白砂漠、ファイユーム——カイロの喧騒から4時間の、この国の西の静けさ。そこでの2日間は、残りのエジプトの聞こえ方を変えます。私たちはこう計画します。白亜の中の一夜が実際に何を意味するか。そして、屋根がほしい人のための、もっと穏やかな砂漠。',
    },

    essay: [
      '私たちが組む旅程はどれも、結局のところ、騒がしい場所の連なりです。神殿には人混みがあり、人混みにはガイドがいて、ガイドはマイクを持ち、その下でカイロが永久機関を回しています。不満ではありません——騒がしさも、エジプトの一部です。けれど数ヶ月後、ふとした瞬間に旅のどこへ戻るかを旅行者に尋ねると、驚くほど多くの人が同じものを挙げます。旅程が沈黙した、あの夜です。',
      'その夜はたいてい、白砂漠で起こります。旅の説明は簡単です。朝カイロを出て南西へ——4時間でバハレイヤ。ナツメヤシと温泉のオアシスで昼食があり、舗装路が終わります。そこからは四輪駆動。黒砂漠の暗い頂の丘を抜け、水晶山の石英の稜線をかすめ、夕方前に白砂漠へ——低い太陽が白亜に何かをし始める時間に。風がそこに刻んだもの——キノコ、尖塔、ガイドが名づけた形と、まだ名のない形——は、別の惑星のように写り、別の惑星のように振る舞います。キャンプは奇岩のあいだに張られます。夕食は火で作られます。フェネックギツネはかなりの確率で現れます。キャンプが何を意味するか、彼らは学んでいるからです。そして主役は、何もないこと。どの地平線にも光がなく、天の川が全力で、ほとんどの人が、本物の静寂を聞いたことがなかったと気づくほどの静けさです。',
      '白亜の夜明けが、議論の残り半分です。奇岩は20分ほどで灰色から白、白から金に変わり、それはあなたのものです。門も、行列もなく、自分のキャンプの外に分かち合う相手もいないからです。',
      'そして、穏やかな砂漠があります。ファイユームはカイロからわずか2時間。小さな範囲に驚くほどを収めています。ワディ・エル・ラヤンの滝、ファラオの時代からカイロの人々を惹きつけてきたカールーン湖、陶芸の村トゥニス、そして——ほぼ全員をここへ送る理由——ワディ・エル・ヒタン、クジラの谷。4000万年前の骨格が、開けた砂の上にそのまま横たわっています。失いかけていた脚の、最後の痕跡を残したクジラたち。進化が、歩いて読める場所に書かれているのです。ファイユームはカイロからの長い日帰りでも、より良くはトゥニスでのやわらかな一泊でも成り立ちます。寝袋なしで静けさがほしい人のための砂漠です。',
      [
        'これはどれほどの旅であるべきか。正直な答えはふたつあります。多くの初回の旅にとって、砂漠は釣り合いのおもりです。定番の旅程に折り込む2日間。神殿疲れが顔を出しそうな場所に置かれ、音楽における休符の仕事を、旅に対してします。けれど一部の旅行者にとって、砂漠こそが要点だと判明します——そのとき白砂漠はより長い道の始まりで、シワと遠いオアシスがその先を続けます。それらは ',
        { text: 'ふたたびのエジプト', href: '/journeys/coming-back' },
        ' で計画しています。ふたつの旅は、いとこ同士です。',
      ],
    ],

    operatorNote: {
      label: '注意',
      body: '快適なキャンプも、キャンプです。夕食は作られ、マットレスは厚く、毛布は重い——そして最も近い壁は40キロ先です。12月と1月の夜は零度に触れ、設備は砂漠そのものです。この段落に心が躍るなら、この旅はあなたのものです。ためらいが先に立つなら、ファイユームとトゥニスの一泊を——静けさはほとんど同じで、シャワーがついてきます。',
    },

    spine: {
      heading: '旅のかたち',
      rows: [
        { label: '日数', value: '白砂漠は2日と一夜。ファイユームは長い日帰りか、やわらかな一泊。砂漠が旅そのものなら4〜5日' },
        { label: '弧', value: 'カイロ · バハレイヤ · 白砂漠——屋根のある版なら、カイロ · ファイユーム' },
        { label: '速度', value: '長い移動が一度。その後は、ほとんど何も予定しません。それが商品です' },
        { label: '季節', value: '10月から4月。冬の夜は零度近くまで下がります。暑い正午と冷たい真夜中を、同じ荷物で' },
        { label: '向いている人', value: '神殿の釣り合いのおもりを求め、締め切りの下より星の下でよく眠れる旅行者' },
        { label: '始まり方', value: 'まずひとつだけコンシェルジュへ:頭上に星か、屋根か' },
      ],
    },

    weave: {
      heading: 'この旅が導く先',
      items: [
        {
          label: '白砂漠キャンプ、3日間のプライベート・ツアー',
          href: '/3-day-bahariya-white-desert-tour',
          sentence: 'このページが描いてきた2日と一夜を、どのキャンプ地が夜明けを捕まえるか知っている人間が計画します。',
        },
        {
          label: 'バハレイヤのガイド',
          href: '/guide/bahariya-oashisu',
          sentence: '舗装路が終わり、四輪駆動が始まるオアシス——泉、ヤシ、そして白亜の前の最後の温かい昼食。',
        },
        {
          label: 'ファイユームのガイド',
          href: '/guide/aru-faiyumu',
          sentence: 'カイロから2時間の穏やかな砂漠と、定番の日帰りより長い時間の与え方。',
        },
        {
          label: 'クジラの谷',
          href: '/guide/aru-faiyumu/wadiaruhitan',
          sentence: '脚があったことをまだ覚えているクジラたちが、歩いて入れる砂の上に横たわっています。',
        },
      ],
    },

    journal: {
      heading: 'ジャーナルから一篇',
      card: {
        title: 'エジプトの西部砂漠',
        deck: 'エジプトの西部砂漠は、オアシス、白砂漠、黒砂漠、古代の隊商路、ローマ神殿、ヌビアやリビア国境に近い風景を含む広大な地域です。旅行者が知っておきたい見どころと注意点を整理します。',
        href: '/blog/ejiputo-no-seibu-sabaku',
      },
    },

    close: {
      heading: '砂漠は、どんな旅程よりも先にひとつ尋ねます。',
      body: '頭上に星か、屋根か——ほかのすべては、そこから導かれます。あなたがどちらの旅行者か、砂漠は旅のおもりか、それとも要点そのものか。コンシェルジュへ。答えのまわりに、計画がかたちを取ります。',
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
