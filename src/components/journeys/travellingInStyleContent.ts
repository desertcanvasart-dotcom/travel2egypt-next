import type { JourneyContent, LocalizedJourney } from './JourneyPage';

/**
 * Locked page copy for /journeys/travelling-in-style (traveller-type page #6, the
 * final one). VERBATIM from the owner-approved draft (journeys-travelling-in-style.md
 * v1) with three owner-side amendments applied verbatim:
 *
 *   1. Slot-1 weave sentence — amended to drop "under sail" (no catalogue product is
 *      dahabiya-built; the flagship is the 9-day Prestigious itinerary, which stays at
 *      the Old Cataract but cruises rather than sails). Descriptor label names the hotel.
 *   2. Essay hotels paragraph — Winter Palace clause amended to note it is "under
 *      restoration as this is written" (closed to July 2027; the page must not imply
 *      present bookability).
 *   3. Weave dropped from four slots to THREE (within the 3–5 skeleton spec): there is
 *      no genuine private-access/site-timing guide article, and the exclusive-access
 *      Giza journal piece is reserved by first-time. No placeholder, no substitute.
 *
 * WORLD B strategy (implementation note 1): the essay acknowledges the sister brand
 * Sillage exactly ONCE — a single inline external link in the final essay paragraph,
 * carrying https://sillage-egypte.com/ with target="_blank" rel="noopener noreferrer"
 * to match the sister-brand strip in Footer.tsx. There is no second Sillage reference
 * anywhere (no logo, no banner, not in the weave or the close). The paragraph's closing
 * line deliberately reclaims the page for Travel2Egypt. This is the first and only
 * journey page to use JourneyPage's external-link segment branch.
 *
 * The operator-note thesis line ("The suite is where you sleep; the hour is what you
 * remember") is protected, word-for-word. Same co-located pattern as the other journeys
 * pages — no Sanity schema, no production writes.
 */
export const travellingInStyleContent: LocalizedJourney = {
  en: {
    meta: {
      title: 'Travelling in Style in Egypt',
      description:
        'Dahabiyas under sail, the landmark hotels, a private Egyptologist, and the invisible choreography that makes Egypt effortless. Travel2Egypt at its fullest register — in practice, not adjectives.',
    },

    masthead: {
      eyebrow: 'A STARTING POINT · TRAVELLING IN STYLE',
      headlineLead: 'The rarest luxury in Egypt is not a suite.',
      headlineAccent: 'It is the right hour.',
      standfirst:
        'Dahabiyas under sail, the landmark hotels, a private Egyptologist, and the invisible choreography that makes a complicated country feel effortless. This is Travel2Egypt at its fullest register — and here is what that means in practice, rather than in adjectives.',
    },

    essay: [
      'Egypt is a country where logistics show. Most places can absorb a mediocre plan; here, the difference between a trip that glides and a trip that grinds is decided by a hundred small arrangements you should never have to see. So when we say travelling in style, we do not primarily mean marble. We mean the version of Egypt where nothing is your problem — and where the one resource money genuinely buys in this country, which is timing, has been spent lavishly.',
      "Start with the river, because this is where the choice matters most. The five-star ships are comfortable and we use the best of them, but the fullest version of the Nile is a dahabiya: a shallow-draught sailing boat of eight or ten cabins, or chartered whole, moving under canvas at the river's own speed. A dahabiya moors where the big ships cannot — at islands, at small temples with no queue because there is no dock, at a sandbank for dinner ashore — and it crosses the water in something the ships never offer: quiet. The boats are not interchangeable, their crews less so, and knowing which is which is precisely the kind of thing we are for.",
      'Then the hotels, which in Egypt include a category most countries do not have: hotels that are themselves sites. Mena House with the Pyramids filling its garden windows; the Old Cataract above the First Cataract at Aswan, still trading on the afternoon light that Agatha Christie wrote by; the Winter Palace at Luxor — under restoration as this is written — with a century of arrivals in its corridors. Staying in them is not a room upgrade, it is an extra monument on the itinerary — and they hold few rooms facing the things you came for, which is why these trips are the ones we plan earliest of all.',
      'Guiding, at this register, means one Egyptologist who is yours for the duration — the same person at Giza and at Philae, building on what you saw yesterday instead of restarting the introduction. And it means access spent where it counts: the site at opening when the light is low and the coaches have not arrived, the tomb visited at the quiet hour, the occasional door that opens early or stays open late. Egypt sells no shortage of private-access moments; the craft is knowing which are worth it and which are theatre.',
      "Underneath all of it runs the choreography you should never notice: met at the aircraft door, luggage that migrates on its own, a car already cool, our own people in every city rather than a subcontractor's promise. Thirty years of running this country's ground is the unglamorous asset this entire page rests on, and it is the part no photograph can show.",
      [
        'One more thing, said plainly because the architecture of this house should be visible. There is a register above even this — trips built around a handful of places and almost nothing else, at a cost that stops being a consideration. For those, our family has a dedicated house: ',
        { text: 'Sillage', url: 'https://sillage-egypte.com/' },
        ', rooted in Aswan, smaller and slower than we are. When a plan belongs there, we say so and hand you across personally. Everything below that line — which is nearly everything — is ours, and we are very good at it.',
      ],
    ],

    operatorNote: {
      label: 'Honest take',
      body: 'What money cannot buy in Egypt: a cooler August, a private Valley of the Kings at ten in the morning, or a Giza plateau without the city beside it. What it buys, superbly, is the hour — the temple at first light, the dahabiya mooring the ships cannot reach, the table on the terrace where the sunset actually happens. When budgets are genuinely open, we put the money on the guide and the timing before the suite. The suite is where you sleep; the hour is what you remember.',
    },

    spine: {
      heading: 'The shape of the trip',
      rows: [
        { label: 'Length', value: '10–14 days, unhurried by design' },
        { label: 'The arc', value: 'bespoke, but its spine is usually Cairo · the Nile under sail · Aswan, with the desert or the coast added as the trip asks' },
        { label: 'The pace', value: 'the sites at their best hour, and as empty as timing can make them' },
        { label: 'The season', value: "October to April; the dahabiyas and the landmark hotels' best rooms book out first, so these plans start earliest of all" },
        { label: 'Best suited to', value: 'travellers who measure a trip by how little they had to think about it' },
        { label: 'How it begins', value: 'describe a perfect day to the concierge; we build the trip backwards from it' },
      ],
    },

    weave: {
      heading: 'Where this usually leads',
      items: [
        {
          // Flagship (owner pick): the 9-day Prestigious itinerary — the only route that
          // puts you inside a named landmark hotel (Old Cataract) and on the river.
          // Sentence amended by owner to drop "under sail" (the itinerary cruises).
          label: 'The 9-day private itinerary: Cairo, the river and the Old Cataract',
          href: '/9-days-egypt-prestigious-vacation',
          sentence: 'The fullest single itinerary in the catalogue today — the river, and nights in a hotel that is itself a site.',
        },
        {
          // Slot 2 (dahabiya): the overview article, not a single boat or the general
          // /nile-cruises archive. Locked sentence, unchanged.
          label: 'Dahabiyas — the Nile under sail',
          href: '/blog/dahabiya-nile-cruises-wind-powered-journey',
          sentence: 'Why the smallest boats on the river are the best ones, and how the handful we trust differ.',
        },
        {
          // Slot 3 (landmark hotels): the /hotels archive. Locked sentence, unchanged.
          label: 'The landmark hotels',
          href: '/hotels',
          sentence: 'The hotels that count as monuments, and which rooms face the reason you came.',
        },
      ],
    },

    journal: {
      heading: 'One journal thread',
      card: {
        title: 'Historical Hotels in Egypt',
        deck: 'Mena House, Old Cataract, Winter Palace, Le Metropole, the Windsor — a guide to choosing hotels in Egypt where history shapes the stay itself, not the décor.',
        href: '/blog/historical-hotels-in-egypt',
      },
    },

    close: {
      heading: 'The conversation is the same one. The answers get longer.',
      body: 'Describe the perfect day to the concierge — the hour you like to wake, the point at which a site is yours, what dinner should look like when it goes right — and the trip is built backwards from the answer. Dates, boats and rooms follow; the day comes first.',
      ctaLabel: 'Start the conversation',
      ctaHref: '/plan-your-tour',
    },

    crossRef: {
      lead: 'Not quite you? There are ',
      linkText: 'five other places to start',
      hash: 'where-to-begin',
    },
  },

  // ES — re-authored per the locked register (journeys-es-travelling-in-style.md v1).
  // Essay carries ONE inline external link (Sillage) with the footer's exact
  // rel/target, per the World B rule. Three weave slots, matching the EN page.
  es: {
    meta: {
      title: 'Viajar con estilo',
      description:
        'Dahabiyas a vela, hoteles que son monumentos, un egiptólogo propio y la hora justa en cada sitio: el registro más pleno de Travel2Egypt, explicado en la práctica.',
    },

    masthead: {
      eyebrow: 'UN PUNTO DE PARTIDA · VIAJAR CON ESTILO',
      headlineLead: 'El lujo más raro de Egipto no es una suite.',
      headlineAccent: 'Es la hora justa.',
      standfirst:
        'Dahabiyas a vela, los hoteles legendarios, un egiptólogo privado y la coreografía invisible que hace que un país complicado parezca sin esfuerzo. Este es Travel2Egypt en su registro más pleno — y esto es lo que significa en la práctica, no en adjetivos.',
    },

    essay: [
      'Egipto es un país donde la logística se nota. Casi cualquier lugar absorbe un plan mediocre; aquí, la diferencia entre un viaje que se desliza y uno que rechina se decide en cien pequeños arreglos que no deberías ver nunca. Así que cuando decimos viajar con estilo no hablamos ante todo de mármol. Hablamos de la versión de Egipto donde nada es tu problema — y donde el único recurso que el dinero compra de verdad en este país, que es la hora, se ha gastado a manos llenas.',
      'Empieza por el río, porque aquí es donde más importa la elección. Los cruceros de cinco estrellas son cómodos y usamos los mejores, pero la versión más plena del Nilo es una dahabiya: un velero de poco calado, de ocho o diez camarotes o fletado entero, que avanza a vela al ritmo del propio río. Una dahabiya amarra donde los grandes barcos no pueden — en islas, en templos pequeños sin cola porque no hay muelle, en un banco de arena para cenar en tierra — y cruza el agua con algo que los cruceros no ofrecen nunca: silencio. Los barcos no son intercambiables, sus tripulaciones menos, y saber cuál es cuál es exactamente el tipo de cosa para la que servimos.',
      'Después los hoteles, que en Egipto incluyen una categoría que casi ningún país tiene: hoteles que son en sí mismos monumentos. Mena House con las pirámides llenando las ventanas del jardín; el Old Cataract sobre la primera catarata de Asuán, viviendo aún de la luz de tarde con la que escribía Agatha Christie; el Winter Palace de Luxor — en restauración mientras esto se escribe — con un siglo de llegadas en los pasillos. Alojarse en ellos no es una mejora de habitación: es un monumento más en el itinerario — y guardan pocas habitaciones frente a aquello a lo que viniste, razón por la que estos viajes son los que planificamos antes que ningún otro.',
      'El guiado, en este registro, significa un egiptólogo que es tuyo todo el viaje — la misma persona en Guiza y en Filae, construyendo sobre lo que viste ayer en vez de reiniciar la presentación. Y significa acceso gastado donde cuenta: el sitio a la apertura, cuando la luz va baja y los autobuses no han llegado; la tumba a la hora tranquila; la puerta ocasional que abre antes o cierra después. Egipto no anda corto de momentos de acceso privado en venta; el oficio está en saber cuáles valen y cuáles son teatro.',
      'Debajo de todo corre la coreografía que no deberías notar: recibido en la puerta del avión, un equipaje que migra solo, un coche ya fresco, gente nuestra en cada ciudad en vez de la promesa de un subcontratista. Veinte años operando el terreno de este país son el activo sin glamur sobre el que descansa toda esta página, y la parte que ninguna fotografía puede enseñar.',
      [
        'Una cosa más, dicha con claridad porque la arquitectura de esta casa debe estar a la vista. Existe un registro por encima incluso de esto — viajes construidos alrededor de un puñado de lugares y casi nada más, a un coste que deja de ser una consideración. Para esos, nuestra familia tiene una casa dedicada: ',
        { text: 'Sillage', url: 'https://sillage-egypte.com/' },
        ', arraigada en Asuán, más pequeña y más lenta que nosotros. Cuando un plan pertenece allí, lo decimos y te entregamos en mano. Todo lo que queda por debajo de esa línea — que es casi todo — es nuestro, y lo hacemos muy bien.',
      ],
    ],

    operatorNote: {
      label: 'Opinión honesta',
      body: 'Lo que el dinero no puede comprar en Egipto: un agosto más fresco, un Valle de los Reyes privado a las diez de la mañana o una meseta de Guiza sin la ciudad al lado. Lo que sí compra, soberbiamente, es la hora — el templo con la primera luz, el amarre de la dahabiya al que los cruceros no llegan, la mesa de la terraza donde de verdad ocurre el atardecer. Cuando el presupuesto está de verdad abierto, ponemos el dinero en el guía y en la hora antes que en la suite. La suite es donde duermes; la hora es lo que recuerdas.',
    },

    spine: {
      heading: 'La forma del viaje',
      rows: [
        { label: 'Duración', value: 'de 10 a 14 días, sin prisa por diseño' },
        { label: 'El arco', value: 'a medida, pero su columna suele ser El Cairo · el Nilo a vela · Asuán, con el desierto o la costa según pida el viaje' },
        { label: 'El ritmo', value: 'los sitios a su mejor hora, y tan vacíos como el reloj lo permita' },
        { label: 'La temporada', value: 'de octubre a abril; las dahabiyas y las mejores habitaciones de los hoteles legendarios se agotan primero: estos planes empiezan antes que ninguno' },
        { label: 'Para quién', value: 'viajeros que miden un viaje por lo poco que tuvieron que pensar en él' },
        { label: 'Cómo empieza', value: 'descríbele al concierge un día perfecto; construimos el viaje hacia atrás desde ahí' },
      ],
    },

    weave: {
      heading: 'A dónde suele llevar',
      items: [
        {
          label: 'El itinerario privado de 9 días: El Cairo, el río y el Old Cataract',
          href: '/egipto-prestigioso-en-9-dias-luxor-el-nilo-asuan-y-el-cairo',
          sentence: 'El itinerario más pleno del catálogo hoy — el río, y noches en un hotel que es en sí mismo un monumento.',
        },
        {
          label: 'Dahabiyas: el Nilo a vela',
          href: '/blog/dahabiya-nile-cruises-wind-powered-journey',
          sentence: 'Por qué los barcos más pequeños del río son los mejores, y en qué se diferencian los pocos en los que confiamos.',
        },
        {
          // Owner amendment: label changed to "Los hoteles legendarios" for parity
          // with EN "The landmark hotels" and the page's own standfirst/spine.
          label: 'Los hoteles legendarios',
          href: '/hotels',
          sentence: 'Los hoteles que cuentan como monumentos, y qué habitaciones miran a aquello a lo que viniste.',
        },
      ],
    },

    journal: {
      heading: 'Un hilo del Diario',
      card: {
        title: 'Hoteles históricos en Egipto',
        deck: 'Mena House, Old Cataract, Winter Palace, Le Metropole y Windsor: cómo elegir hoteles históricos en Egipto cuando la historia forma parte real de la estancia.',
        href: '/blog/hoteles-historicos-en-egipto-donde-la-historia-se-encuentra-con-el-lujo',
      },
    },

    close: {
      heading: 'La conversación es la misma. Las respuestas se alargan.',
      body: 'Descríbele al concierge el día perfecto — la hora a la que te gusta despertar, el punto en el que un sitio es tuyo, cómo es la cena cuando sale bien — y el viaje se construye hacia atrás desde la respuesta. Las fechas, los barcos y las habitaciones vienen después; el día va primero.',
      ctaLabel: 'Empieza la conversación',
      ctaHref: '/plan-your-tour',
    },

    crossRef: {
      lead: '¿No es lo tuyo? Hay ',
      linkText: 'otros cinco lugares donde empezar',
      hash: 'where-to-begin',
    },
  },

  // JA — re-authored per the locked JA register (journeys-ja-travelling-in-
  // style.md v1; locked pending a native-speaker pass — verbatim, incl. the
  // space before —— after the Sillage link). ONE Sillage mention, external link
  // with the exact footer rel/target (World B). Winter Palace clause carries
  // the "under restoration" parity with EN/ES (calendar: revisit July 2027).
  // THREE weave slots, per the shipped EN/ES pages.
  ja: {
    meta: {
      title: '上質に旅する',
      description:
        '帆走のダハビーヤ、史跡でもあるホテル、専属のエジプト学ガイド、そして遺跡ごとの正しい時刻。Travel2Egyptの最も充実した音域を、実務でお伝えします。',
    },

    masthead: {
      eyebrow: '旅の始まり · 上質に旅する',
      headlineLead: 'エジプトで最も稀な贅沢は、スイートではない。',
      headlineAccent: '正しい時刻だ。',
      standfirst:
        '帆走のダハビーヤ、伝説のホテルたち、専属のエジプト学ガイド、そして複雑な国を努力の見えない旅に変える、不可視の振り付け。これはTravel2Egyptの最も充実した音域です——形容詞ではなく、実務でその意味をお伝えします。',
    },

    essay: [
      'エジプトは、段取りが表に出る国です。たいていの国は平凡な計画を吸収してくれますが、ここでは、滑る旅と軋む旅の違いが、あなたの目に触れるべきでない百の小さな手配で決まります。ですから、上質に旅すると言うとき、私たちは第一に大理石の話をしていません。何ひとつあなたの問題にならないエジプトの話をしています——そして、この国でお金が本当に買えるただひとつの資源、すなわち時刻が、惜しみなく使われている旅の話です。',
      '川から始めましょう。選択がいちばん物を言う場所だからです。五つ星のクルーズ船は快適で、私たちも最良のものを使います。けれどナイルの最も充実した姿はダハビーヤです。喫水の浅い帆船。キャビンは8室か10室、あるいは一隻の貸し切り。帆の下、川そのものの速度で進みます。ダハビーヤは大型船が寄れない場所に舫います——島に、桟橋がないゆえに行列もない小さな神殿に、夕食のための砂洲に——そして、クルーズ船が決して差し出さないものと共に水面を渡ります。静けさです。船は交換可能ではなく、乗組員はなおさらで、どれがどれかを知っていることこそ、私たちの存在理由のたぐいです。',
      '次にホテル。エジプトには、ほとんどの国にはない部類があります。それ自体が史跡であるホテルです。庭の窓いっぱいにピラミッドが立つメナ・ハウス。アガサ・クリスティが書いた午後の光でいまも暮らす、アスワン第一急湍の上のオールド・カタラクト。そして廊下に一世紀分の到着を持つルクソールのウィンター・パレス——これを書いている現在は修復中です。ここに泊まることは、部屋のアップグレードではありません。旅程に記念碑がもうひとつ増えることです——そして、あなたの目当てに面した部屋は多くありません。この旅の計画を、どの旅よりも早く始める理由です。',
      'この音域でのガイドとは、旅の全行程を通してあなたのものであるエジプト学者がひとり、ということです——ギザでもフィラエでも同じ人間が、紹介をやり直す代わりに、昨日見たものの上に積んでいく。そして、効く場所に使われるアクセスということです。バスの来ていない、光の低い開門時刻の遺跡。静かな時間帯の墓。ときおり、早く開くか遅くまで開いている扉。エジプトに売り物のプライベート・アクセスは事欠きません。技術は、どれが本物でどれが芝居かを知っていることにあります。',
      'そのすべての下を、気づかれるべきでない振り付けが流れています。航空機の扉での出迎え、ひとりでに移動する荷物、すでに涼しい車、下請けの約束ではなく各都市にいる私たち自身の人間。この国の地上を20年動かしてきたことが、このページ全体が載っている飾り気のない資産であり、どんな写真にも写らない部分です。',
      [
        'もうひとつだけ、はっきりと。この家の設計図は、見える場所にあるべきだからです。これのさらに上の音域が存在します——ほんのひと握りの場所と、ほとんどそれ以外の何もないことを中心に組まれ、費用が考慮であることをやめる旅です。そのために、私たちの一族には専用の家があります。',
        { text: 'Sillage', url: 'https://sillage-egypte.com/' },
        ' ——アスワンに根ざし、私たちより小さく、私たちより遅い家です。計画がそこに属するときは、そう申し上げて、直接お引き渡しします。その線から下のすべて——ほとんどすべてです——は私たちのものであり、私たちはそれが非常に得意です。',
      ],
    ],

    operatorNote: {
      label: '正直な所見',
      body: 'エジプトでお金が買えないもの。より涼しい8月、午前10時に貸し切りの王家の谷、街を隣に持たないギザの台地。お金が見事に買えるもの。時刻です——最初の光の中の神殿、クルーズ船の届かないダハビーヤの舫い、夕陽が本当に起こるテラスの席。予算が本当に開いているとき、私たちはスイートより先に、ガイドと時刻にお金を置きます。スイートは眠る場所。時刻は、覚えている場所です。',
    },

    spine: {
      heading: '旅のかたち',
      rows: [
        { label: '日数', value: '10〜14日。意図して、急ぎません' },
        { label: '弧', value: '誂えですが、背骨はたいていカイロ · 帆のナイル · アスワン。砂漠か海岸を、旅が求めるままに' },
        { label: '速度', value: '遺跡は最良の時刻に、時計が許すかぎり無人で' },
        { label: '季節', value: '10月から4月。ダハビーヤと伝説のホテルの最良の部屋が最初に埋まります。この計画は、どの旅よりも早く始まります' },
        { label: '向いている人', value: '考えずに済んだことの少なさで旅を測る旅行者' },
        { label: '始まり方', value: '完璧な一日をコンシェルジュへ。そこから逆向きに旅を組み立てます' },
      ],
    },

    weave: {
      heading: 'この旅が導く先',
      items: [
        {
          label: 'カイロ、川、オールド・カタラクト——9日間のプライベート旅程',
          href: '/9-nichikan-pure-suteji-ejiputo-no-kyujitsu-rukusoru-nairu',
          sentence: 'いまのカタログで最も充実したひとつの旅程——川と、それ自体が史跡であるホテルでの夜。',
        },
        {
          label: 'ダハビーヤ——帆のナイル',
          href: '/blog/dahabiya-no-nairu-kuruzu',
          sentence: '川でいちばん小さな船がいちばん良い理由と、私たちが信を置く数隻の違い。',
        },
        {
          label: '伝説のホテルたち',
          href: '/hotels',
          sentence: '記念碑に数えられるホテルたちと、あなたの目当てに面した部屋はどれか。',
        },
      ],
    },

    journal: {
      heading: 'ジャーナルから一篇',
      card: {
        title: 'エジプトの歴史あるホテル',
        deck: 'メナハウス、オールド・カタラクト、ウィンター・パレス、ル・メトロポール、ウィンザー。エジプトで歴史が装飾ではなく、滞在そのものを形づくるホテルを選ぶためのガイド。',
        href: '/blog/ejiputo-no-rekishi-aru-hoteru',
      },
    },

    close: {
      heading: '会話は同じもの。答えが長くなるだけです。',
      body: '完璧な一日をコンシェルジュに描写してください——起きたい時刻、遺跡が自分のものになる瞬間、うまくいった夜の夕食のかたち——旅は、答えから逆向きに組み立てられます。日付も、船も、部屋も後から。一日が先です。',
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
