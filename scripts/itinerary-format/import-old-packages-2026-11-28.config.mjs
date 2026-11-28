/**
 * Owner, 28 Nov: remove every old price except the two Lake Nasser cruises he set on 10 Nov (€750, €1,390).
 * Per-package config for import-old-packages-2026-11-28.mjs.
 *   cities: city ids, set only where the tour has none
 *   key: short _key prefix · price: 'unset' (default, Autoura later) | 'keep'
 *   jaSites: { day: [JA site names that contain 「・」] } · sameMeaning: { es|ja: [flat keys checked by hand] }
 */
export const PKGS = {
  'cairo-weekend-city-break-2-nights-3-days': { key: 'op01', cities: ['wp-page-83284', 'wp-page-58854'], price: 'unset', jaSites: {3: ['サラディンのシタデル','ムハンマド・アリー・モスク','ハーン・ハリーリ']}, sameMeaning: {} },
  '3-day-siwa-journey-from-alexandria': { key: 'op02', price: 'unset', jaSites: {1: ['エル・アラメイン戦争博物館','英連邦戦没者墓地','ドイツ軍記念碑','イタリア軍記念碑'], 2: ['アモンのオラクル神殿','ウンム・ウバイダ','クレオパトラの泉','塩湖','大砂海'], 3: ['シャーリー砦','死者の山','シ・アモンの墓']}, sameMeaning: { es: ['d3.b0', 'd2.g0'], ja: ['fit1'] } },
  '4-days-white-desert-wadi-al-hittan-exploration': { key: 'op03', cities: ['wp-page-58769'], price: 'unset', jaSites: {1: ['コム・アウシーム博物館','カラニス','ワディ・アル・ラヤン','ワディ・アル・ヒタン'], 2: ['ピラミッド・マウンテン','イングリッシュ・マウンテン','民俗博物館','温泉'], 3: ['黒砂漠','エル・ハイズ','クリスタル・マウンテン','アガバト','白砂漠国立公園']}, sameMeaning: { ja: ['opt1'] } },
  'the-great-pharaohs-and-white-desert': { key: 'op04', price: 'unset', jaSites: {3: ['黄金のミイラ','バンネンティウとジェド・アメン・エフ・アンクの墓','アレクサンドロス大王の神殿','温泉'], 4: ['黒砂漠','クリスタル・マウンテン','アガバト','白砂漠国立公園']}, sameMeaning: { es: ['closing'], ja: ['opt0'] } },
  '10-day-nile-and-western-desert-tour': { key: 'op05', price: 'unset', jaSites: {3: ['黄金のミイラ','バンネンティウとジェド・アメン・エフ・アンクの墓','アレクサンドロス大王の神殿'], 4: ['黒砂漠','クリスタル・マウンテン','アガバト','白砂漠国立公園'], 5: ['ファラフラ','デイル・エル・ハガル','カスル・ダフラ'], 9: ['大エジプト博物館','ハーン・ハリーリ']}, sameMeaning: { ja: ['d5.b0', 'opt1'] } },
  '8-days-egypt-panorama-tour': { key: 'op06', price: 'unset', jaSites: {2: ['大エジプト博物館','吊り下げ教会','サラディンのシタデル','ムハンマド・アリー・モスク','ハーン・ハリーリ']}, sameMeaning: {} },
  'marriott-mena-house-4-days-stay': { key: 'op07', cities: ['wp-page-83284', 'wp-page-58854', 'wp-page-58750'], price: 'unset', jaSites: {3: ['コム・エル・シュカーファのカタコンベ','ポンペイの柱','グレコ・ローマン博物館','コム・エル・ディッカのローマ劇場']}, sameMeaning: {} },
  '4-day-ultimate-lake-nasser-experience': { key: 'op08', price: 'unset', jaSites: {}, sameMeaning: {} },
  '4-days-lake-nasser-cruise-from-abu-simbel': { key: 'op09', price: 'keep', jaSites: {1:['アブ・シンベル大神殿','ネフェルタリ神殿'], 2:['カスル・イブリム（デッキから）','アマダ神殿','デル神殿','ペンヌトの墓'], 3:['ワディ・エス・セブア神殿','ダッカ神殿','マハラッカ'], 4:['カラブシャ神殿','ベイト・エル・ワリ','ケルタシのキオスク']}, sameMeaning: { es: ['d2.b0'] } },
  '5-day-lake-nasser-cruise-from-aswan': { key: 'op10', price: 'keep', jaSites: {2:['カラブシャ神殿','ベイト・エル・ワリ','ケルタシのキオスク'], 3:['ワディ・エス・セブア神殿','ダッカ神殿','マハラッカ','アマダ神殿','デル神殿','ペンヌトの墓'], 4:['カスル・イブリム（デッキから）','アブ・シンベル大神殿','ネフェルタリ神殿']}, sameMeaning: { es: ['d3.b0'] } },
  '5-day-river-cruise-from-luxor': { key: 'op11', price: 'unset', jaSites: {3:['エドフのホルス神殿','コム・オンボ神殿','ワニ博物館'], 4:['フィラエ神殿','アスワン・ハイ・ダム','切りかけのオベリスク','ファルーカでキッチナー島を周遊']}, sameMeaning: {} },
  '7-days-dahabiya-nile-cruise-from-aswan-to-luxor': { key: 'op12', cities: ['wp-page-58758', 'wp-page-58877'], price: 'unset', jaSites: {1:['フィラエ神殿','アスワン・ハイ・ダム'], 2:['アスワンからの航行','コム・オンボ神殿','ワニ博物館'], 4:['エル・カブ','岩窟墓','ネクベト神殿']}, sameMeaning: { es: ['d4.b0'] } },
  '9-days-egypt-prestigious-vacation': { key: 'op13', price: 'unset', jaSites: {4:['エドフのホルス神殿','コム・オンボ神殿','ワニ博物館'], 5:['アスワン・ハイ・ダム','切りかけのオベリスク','フィラエ神殿','ファルーカ'], 7:['アブ・シンベル','ラムセス2世の大神殿','ネフェルタリ神殿'], 8:['ギザのピラミッド','カフラー王またはメンカウラー王のピラミッドの内部','パノラマ・ポイント','大スフィンクス','河岸神殿','大エジプト博物館','ナイル川のディナークルーズ']}, sameMeaning: { ja: ['opt0'] } },
  '10-days-the-splendid-minya-tour': { key: 'op14', price: 'unset', jaSites: {2:['ギザのピラミッド','カフラー王またはメンカウラー王のピラミッドの内部','パノラマ・ポイント','大スフィンクス','河岸神殿'], 3:['ベニ・ハサン','ヘルモポリス（アシュムネイン）','トゥナ・エル・ゲベル','ペトシリスの墓','テル・エル・アマルナ'], 6:['エドフのホルス神殿','コム・オンボ神殿','ワニ博物館','ファルーカ'], 7:['フィラエ神殿','アスワン・ハイ・ダム','切りかけのオベリスク'], 8:['アブ・シンベル','ラムセス2世の大神殿','ネフェルタリ神殿'], 9:['大エジプト博物館','サラディンのシタデル','ムハンマド・アリー・モスク','ハーン・ハリーリ','ナイル川のディナークルーズ']}, sameMeaning: { ja: ['d3.g0', 'opt0'] } },
  'the-holy-family-trip-in-egypt': { key: 'op15', price: 'unset', jaSites: {3:['ファルマ（ペルシウム）','テル・バスタ（ブバスティス）','ビルベイス'], 5:['ワディ・ナトルーン','アンバ・ビショイ修道院','シリア人修道院（デイル・エル・スリヤーニ）'], 6:['アブ・セルガ教会','吊り下げ教会','聖母マリアの木（マタリヤ）','聖母マリア教会（モストロド）'], 7:['聖母マリア教会（マアディ）','ガバル・アル・テイル','聖母マリア修道院'], 8:['デイル・エル・ムハラク','聖母マリア教会'], 12:['エドフのホルス神殿','コム・オンボ神殿','ワニ博物館'], 13:['アスワン・ハイ・ダム','未完成のオベリスク','フィラエ神殿','ファルーカ'], 14:['アブ・シンベル']}, sameMeaning: {} },
  'overnight-sataya-dolphin-reef-safari': { key: 'op16', price: 'unset', jaSites: {1:['ハマタへのドライブ','シャアブ・サタヤへの航海','ガイド付きシュノーケリング2回']}, sameMeaning: { es: ['wk3'], ja: ['wk3'] } },
  'the-pearl-of-red-sea-hurghada': { key: 'op17', cities: ['wp-page-58859', 'wp-page-83284'], price: 'unset', jaSites: {6:['サラディンのシタデル','ムハンマド・アリー・モスク','ハーン・ハリーリ','ナイル川のファルーカ']}, sameMeaning: {} },
  '8-days-ultimate-trip-to-sharm-el-sheikh': { key: 'op18', price: 'unset', jaSites: {}, sameMeaning: {} },
  '8-day-egypt-golf-tour': { key: 'op19', price: 'unset', jaSites: {2:['ギザのピラミッド','カフラー王またはメンカウラー王のピラミッド内部','大スフィンクス','河岸神殿','大エジプト博物館','サラディンのシタデル','ムハンマド・アリー・モスク'], 3:['カタメヤ・ハイツでのラウンド'], 5:['シャルム・エル・シェイクでのラウンド'], 6:['シャルム・エル・シェイクでのラウンド'], 7:['ハーン・ハリーリ','ナイル川のディナークルーズ']}, sameMeaning: {} },
  '9-day-egypt-bird-watching-adventure': { key: 'op20', price: 'unset', jaSites: {2:['ギザのピラミッド','カフラー王またはメンカウラー王のピラミッド内部','大スフィンクス','河岸神殿','大エジプト博物館','ハーン・ハリーリ'], 4:['夜明けのカルーン湖','ワディ・エル・ナトルーンの塩水の池','聖マカリオス修道院'], 5:['アブ・シンベル','アスワン・ハイ・ダム','未完成のオベリスク','第1急流でのファルーカ'], 6:['第1急流での夜明けのボート','コム・オンボ神殿','ワニ博物館','エドフのホルス神殿']}, sameMeaning: { es: ['panel0', 'wk0'], ja: ['panel0', 'wk0'] } },
  '10-days-felucca-journey-through-egypt': { key: 'op21', price: 'unset', jaSites: {3:['アスワン・ハイ・ダム','未完成のオベリスク','エレファンティネ島を巡るファルーカ'], 5:['ハルベヤブ島','バロリー島','コム・オンボ神殿','ワニ博物館'], 7:['ゲベル・エル・シルシラ','ホルエムヘブの岩窟神殿','岩窟の祠堂'], 10:['メンフィス','サッカラ','イムホテプ博物館','貴族の墓','ジェセル王の階段ピラミッド','屈折ピラミッド','赤のピラミッド','ハーン・ハリーリ']}, sameMeaning: { es: ['wk2'], ja: ['wk2'] } },
};
