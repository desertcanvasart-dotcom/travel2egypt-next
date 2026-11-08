import type { BudgetBand, DayBand } from '@/lib/leads/schema';

/**
 * Itinerary form, dialogs and mobile bar copy — EN as built 2026-11-08; ES/JA
 * from the owner's homepage translations (2026-11-08). Strings the owner's
 * files don't cover (thank-you state, errors, arrive/leave, placeholders for
 * ages and pickup) are translated in the same register: tú (ES), です／ます (JA).
 * Field VALUES (day and budget bands) are shared codes, so the team reads one
 * scale whatever the language.
 */
export type LeadLocale = 'en' | 'es' | 'ja';

export function leadLocale(l?: string | null): LeadLocale {
  return l === 'es' || l === 'ja' ? l : 'en';
}

export interface LeadCopy {
  tripTitle: string;
  tripIntro: string;
  dayTitle: string;
  dayIntro: string;
  close: string;
  tourLineTrip: (tour: string) => string;
  tourLineDay: (tour: string) => string;
  when: string;
  month: string;
  notDecided: string;
  exactDates: string;
  arrive: string;
  leave: string;
  howManyDays: string;
  notSure: string;
  dayBand: Record<DayBand, string>;
  budget: string;
  budgetNone: string;
  budgetBand: Record<BudgetBand, string>;
  budgetHint: string;
  date: string;
  adults: string;
  children: string;
  childAges: string;
  childAgesPlaceholder: string;
  estimate: (total: string, adults: number) => string;
  childrenNote: string;
  email: string;
  whatsapp: string;
  optional: string;
  whatsappPlaceholder: string;
  notes: string;
  notesPlaceholderTrip: string;
  notesPlaceholderDay: string;
  submitTrip: string;
  submitDay: string;
  sending: string;
  fine: (full: string) => string;
  monthLabel: (d: Date) => string;
  errEmail: string;
  errWhatsapp: string;
  errDate: string;
  errDates: string;
  errRate: string;
  errGeneric: (full: string) => string;
  errNetwork: (full: string) => string;
  doneTitle: string;
  doneBody: (isDay: boolean, full: string) => string;
  doneRef: string;
  doneUrgent: string;
  doneWhatsapp: string;
  doneQuote: string;
  // Mobile sticky bar
  barLabel: string;
  barCta: string;
  barWaGeneric: string;
  barWaProduct: (tour: string, url: string) => string;
}

export const LEAD_COPY: Record<LeadLocale, LeadCopy> = {
  en: {
    tripTitle: 'Get your free itinerary',
    tripIntro: 'Tell us your dates. We send back a day-by-day plan and a firm price, free and with no obligation.',
    dayTitle: 'Check a date',
    dayIntro:
      'Tell us the day and how many of you. We confirm availability and the price by email, by 8 PM Cairo time the same day or by 10 AM the next morning.',
    close: 'Close',
    tourLineTrip: () => 'Starting from',
    tourLineDay: () => 'Day tour',
    when: 'When are you travelling?',
    month: 'Month',
    notDecided: 'Not decided yet',
    exactDates: 'I have exact dates',
    arrive: 'Arrive',
    leave: 'Leave',
    howManyDays: 'How many days?',
    notSure: 'Not sure',
    dayBand: { '3-5': '3-5 days', '6-9': '6-9 days', '10-14': '10-14 days', '15+': '15+ days' },
    budget: 'Budget per person',
    budgetNone: 'Prefer not to say',
    budgetBand: { lt1500: 'Under $1,500', '1500-2500': '$1,500–2,500', '2500-4000': '$2,500–4,000', '4000+': '$4,000+' },
    budgetHint: 'Excluding international flights',
    date: 'Date',
    adults: 'Adults',
    children: 'Children',
    childAges: 'Their ages',
    childAgesPlaceholder: 'e.g. 6, 11',
    estimate: (total, n) => `Estimated: ${total} for ${n} adult${n === 1 ? '' : 's'}.`,
    childrenNote: "Children's prices are confirmed in our reply.",
    email: 'Email',
    whatsapp: 'WhatsApp',
    optional: '(optional)',
    whatsappPlaceholder: '+44 7700 900123',
    notes: 'Anything we should know?',
    notesPlaceholderTrip: 'Interests, must-sees, mobility',
    notesPlaceholderDay: 'Hotel, pickup time, anything else',
    submitTrip: 'Send me my itinerary',
    submitDay: 'Check this date',
    sending: 'Sending…',
    fine: (full) => `Free, no obligation. ${full} We use your details only to answer this request.`,
    monthLabel: (d) => d.toLocaleString('en-GB', { month: 'long', year: 'numeric' }),
    errEmail: 'Please check your email address.',
    errWhatsapp: 'Please check the WhatsApp number (digits, spaces and + only).',
    errDate: 'Please choose a date.',
    errDates: 'Please check the dates.',
    errRate: 'We have already received several requests from this connection. Please message us on WhatsApp instead.',
    errGeneric: (full) => `Something went wrong sending your request. Please message us on WhatsApp. ${full}`.trim(),
    errNetwork: (full) => `We could not reach our server. Please message us on WhatsApp. ${full}`.trim(),
    doneTitle: 'Thank you, we have your request.',
    doneBody: (isDay, full) =>
      `A member of our Cairo planning team will reply by email${isDay ? ' to confirm the date.' : ' with a day-by-day plan and a firm price.'} ${full}`,
    doneRef: 'Your reference is',
    doneUrgent: 'Anything urgent?',
    doneWhatsapp: 'Message us on WhatsApp',
    doneQuote: 'and quote your reference.',
    barLabel: 'Contact us',
    barCta: 'Get itinerary',
    barWaGeneric: "Hi, I'd like help planning a trip to Egypt.",
    barWaProduct: (tour, url) => `Hi, I'm interested in "${tour}" (${url}).`,
  },
  es: {
    tripTitle: 'Tu itinerario gratis',
    tripIntro: 'Cuéntanos tus fechas. Te enviamos un plan día a día y un precio cerrado, gratis y sin compromiso.',
    dayTitle: 'Consulta una fecha',
    dayIntro:
      'Dinos el día y cuántas personas viajan. Te confirmamos la disponibilidad y el precio por correo electrónico antes de las 20:00 (hora de El Cairo) el mismo día, o antes de las 10:00 de la mañana siguiente.',
    close: 'Cerrar',
    tourLineTrip: () => 'Punto de partida',
    tourLineDay: () => 'Excursión',
    when: '¿Cuándo viajas?',
    month: 'Mes',
    notDecided: 'Aún no lo sé',
    exactDates: 'Tengo fechas exactas',
    arrive: 'Llegada',
    leave: 'Salida',
    howManyDays: '¿Cuántos días?',
    notSure: 'Aún no lo sé',
    dayBand: { '3-5': '3–5 días', '6-9': '6–9 días', '10-14': '10–14 días', '15+': '15 días o más' },
    budget: 'Presupuesto por persona',
    budgetNone: 'Prefiero no decirlo',
    budgetBand: { lt1500: 'Menos de 1500 €', '1500-2500': '1500–2500 €', '2500-4000': '2500–4000 €', '4000+': 'Más de 4000 €' },
    budgetHint: 'Sin vuelos internacionales',
    date: 'Fecha',
    adults: 'Adultos',
    children: 'Niños',
    childAges: 'Edades de los niños',
    childAgesPlaceholder: 'p. ej., 6, 11',
    estimate: (total, n) => `Estimado: ${total} para ${n} ${n === 1 ? 'adulto' : 'adultos'}.`,
    childrenNote: 'Los precios para niños se confirman en nuestra respuesta.',
    email: 'Correo electrónico',
    whatsapp: 'WhatsApp',
    optional: '(opcional)',
    whatsappPlaceholder: '+34 600 000 000',
    notes: '¿Algo que debamos saber?',
    notesPlaceholderTrip: 'Intereses, visitas imprescindibles, movilidad',
    notesPlaceholderDay: 'Hotel, hora de recogida, cualquier otra cosa',
    submitTrip: 'Enviarme mi itinerario',
    submitDay: 'Consultar esta fecha',
    sending: 'Enviando…',
    fine: (full) => `Gratis y sin compromiso. ${full} Solo usamos tus datos para responder a esta solicitud.`,
    monthLabel: (d) => {
      const s = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(d);
      return s.charAt(0).toUpperCase() + s.slice(1);
    },
    errEmail: 'Revisa tu dirección de correo electrónico.',
    errWhatsapp: 'Revisa el número de WhatsApp (solo dígitos, espacios y +).',
    errDate: 'Elige una fecha.',
    errDates: 'Revisa las fechas.',
    errRate: 'Ya hemos recibido varias solicitudes desde esta conexión. Escríbenos por WhatsApp, por favor.',
    errGeneric: (full) => `Algo ha fallado al enviar tu solicitud. Escríbenos por WhatsApp. ${full}`.trim(),
    errNetwork: (full) => `No hemos podido conectar con nuestro servidor. Escríbenos por WhatsApp. ${full}`.trim(),
    doneTitle: 'Gracias, hemos recibido tu solicitud.',
    doneBody: (isDay, full) =>
      `Una persona de nuestro equipo de planificación en El Cairo te responderá por correo electrónico${isDay ? ' para confirmar la fecha.' : ' con un plan día a día y un precio cerrado.'} ${full}`,
    doneRef: 'Tu referencia es',
    doneUrgent: '¿Es urgente?',
    doneWhatsapp: 'Escríbenos por WhatsApp',
    doneQuote: 'e indica tu referencia.',
    barLabel: 'Contacto',
    barCta: 'Mi itinerario',
    barWaGeneric: 'Hola, me gustaría ayuda para planificar un viaje a Egipto.',
    barWaProduct: (tour, url) => `Hola, me interesa «${tour}» (${url}).`,
  },
  ja: {
    tripTitle: '無料で旅程を受け取る',
    tripIntro: '日程をお知らせください。日ごとのプランと確定料金を、無料・義務なしでお送りします。',
    dayTitle: '日付を確認する',
    dayIntro:
      'ご希望の日付と人数をお知らせください。空き状況と料金を、カイロ時間の当日20時まで、または翌朝10時までにメールでご連絡します。',
    close: '閉じる',
    tourLineTrip: () => 'ベースのツアー',
    tourLineDay: () => '日帰りツアー',
    when: 'ご旅行の時期',
    month: '月',
    notDecided: '未定',
    exactDates: '日付が決まっている',
    arrive: '到着日',
    leave: '出発日',
    howManyDays: 'ご旅行の日数',
    notSure: '未定',
    dayBand: { '3-5': '3〜5日', '6-9': '6〜9日', '10-14': '10〜14日', '15+': '15日以上' },
    budget: '1名様あたりのご予算',
    budgetNone: '回答しない',
    budgetBand: { lt1500: '25万円未満', '1500-2500': '25万〜40万円', '2500-4000': '40万〜60万円', '4000+': '60万円以上' },
    budgetHint: '国際線航空券を除く',
    date: '日付',
    adults: '大人',
    children: 'お子さま',
    childAges: 'お子さまの年齢',
    childAgesPlaceholder: '例：6歳、11歳',
    estimate: (total, n) => `概算：大人${n}名で${total}`,
    childrenNote: 'お子さまの料金は、ご返信時にお知らせします。',
    email: 'メールアドレス',
    whatsapp: 'WhatsApp',
    optional: '（任意）',
    whatsappPlaceholder: '+81 90 1234 5678',
    notes: 'ご要望など',
    notesPlaceholderTrip: '興味のあること、必ず訪れたい場所、移動で配慮が必要なことなど',
    notesPlaceholderDay: 'ホテル名、お迎えの時間、その他のご要望など',
    submitTrip: '旅程を受け取る',
    submitDay: 'この日付で確認',
    sending: '送信中…',
    fine: (full) => `無料・義務なし。${full}いただいた情報は、このお問い合わせへの回答にのみ使用します。`,
    monthLabel: (d) => new Intl.DateTimeFormat('ja', { year: 'numeric', month: 'long' }).format(d),
    errEmail: 'メールアドレスをご確認ください。',
    errWhatsapp: 'WhatsAppの番号をご確認ください（数字、スペース、+のみ）。',
    errDate: '日付をお選びください。',
    errDates: '日付をご確認ください。',
    errRate: 'この接続からすでに複数のお問い合わせを受け付けています。お手数ですが、WhatsAppでご連絡ください。',
    errGeneric: (full) => `送信中にエラーが発生しました。WhatsAppでご連絡ください。${full}`.trim(),
    errNetwork: (full) => `サーバーに接続できませんでした。WhatsAppでご連絡ください。${full}`.trim(),
    doneTitle: 'ありがとうございます。お問い合わせを受け付けました。',
    doneBody: (isDay, full) =>
      `カイロの旅行プランニングチームから、${isDay ? '日付の確認をメールでご連絡します。' : '日ごとのプランと確定料金をメールでお送りします。'}${full}`,
    doneRef: '受付番号：',
    doneUrgent: 'お急ぎの場合は',
    doneWhatsapp: 'WhatsAppでご連絡ください',
    doneQuote: '（受付番号をお知らせください）。',
    barLabel: 'お問い合わせ',
    barCta: '旅程を受け取る',
    barWaGeneric: 'こんにちは。エジプト旅行の計画について相談したいです。',
    barWaProduct: (tour, url) => `こんにちは。「${tour}」（${url}）について問い合わせたいです。`,
  },
};
