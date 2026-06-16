/**
 * Seed the six Phase-1 deities for /resources/egyptian-gods.
 *
 * Idempotent — uses createOrReplace, so re-running overwrites with the
 * latest content. The deity _ids follow `deity-<slug>` so cross-references
 * (Osiris ↔ Isis ↔ Horus) can be set in one shot without a two-pass.
 *
 * Dry-run by default. Pass `--commit` to write to Sanity. Reads write
 * token from SANITY_API_WRITE_TOKEN (lesson 23: identical auth in
 * dry-run and commit so the dry-run validates the path that will actually
 * be taken).
 *
 *   pnpm tsx scripts/seed-deities-phase-1.ts            # dry-run
 *   pnpm tsx scripts/seed-deities-phase-1.ts --commit   # write
 *
 * EN content only per the Phase-1 spec — ES/JA fall back to EN in the
 * frontend reader. The Sobek reference targets the existing Kom Ombo
 * city doc (wp-page-58875); confirmed via GROQ before this script ran.
 */

import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { createClient, type SanityClient } from '@sanity/client';

loadEnv({ path: path.resolve(process.cwd(), '.env') });

const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ufallvd2';
const KOM_OMBO_ID = 'wp-page-58875';

const commit = process.argv.includes('--commit');

function die(msg: string): never {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

function getClient(): SanityClient {
  // Production has a separate write token from the generic one used by the
  // staging dataset. Prefer the dataset-specific token when present.
  const isProd = DATASET === 'production';
  const token = isProd
    ? process.env.SANITY_PRODUCTION_API_WRITE_TOKEN ||
      process.env.SANITY_API_WRITE_TOKEN
    : process.env.SANITY_STAGING_API_WRITE_TOKEN ||
      process.env.SANITY_API_WRITE_TOKEN;
  if (!token) die(`No write token in env for dataset "${DATASET}"`);
  return createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-12-01',
    token,
    useCdn: false,
  });
}

// ── Shape helpers ────────────────────────────────────────────────────────
const en = (value: string) => [{ _key: 'en', value }];
const enSlug = (current: string) => [
  { _key: 'en', value: { _type: 'slug' as const, current } },
];
const ref = (id: string) => ({ _type: 'reference' as const, _ref: id });
const refList = (ids: string[]) =>
  ids.map((id, i) => ({ _key: `r${i}`, _type: 'reference' as const, _ref: id }));

// ── The six deities ──────────────────────────────────────────────────────
const DEITY_IDS = {
  atum: 'deity-atum',
  osiris: 'deity-osiris',
  isis: 'deity-isis',
  horus: 'deity-horus',
  hathor: 'deity-hathor',
  sobek: 'deity-sobek',
} as const;

const docs = [
  {
    _id: DEITY_IDS.atum,
    _type: 'deity',
    name: en('Atum'),
    slug: enSlug('atum'),
    transliteration: 'Jtm',
    domain: en(
      'The Heliopolitan creator. Self-emerged, primordial, the unified totality from whom every other Heliopolitan deity descends. Later fused with Ra as Atum-Ra — the evening form of the sun returning to the waters.'
    ),
    iconography: en(
      'A bearded man in royal regalia wearing the double crown of Upper and Lower Egypt, carrying the crook and flail. The marker is the crown without a sun disk; once a disk appears on the head, you are looking at Ra or the syncretic Atum-Ra, not Atum alone. Occasionally depicted as a serpent or scarab in cosmogonic scenes — both forms referencing self-emergence from the primordial waters.'
    ),
    whereYoullSeeThem: en(
      'Rare in standing temples — his cult was already old by the New Kingdom and Heliopolis itself was dismantled in antiquity. The Pyramid Texts at Saqqara (the earliest Egyptian funerary writings) are the cleanest source: they name him as creator and address the dead king through him. He also appears in the night-journey sequences in royal tombs in the Valley of the Kings, and at Medinet Habu, where Ramesses III stages himself in conversation with him.'
    ),
    keyMyth: en(
      'He emerged from the primordial waters of Nun, stood on the first mound, and brought forth Shu and Tefnut — air and moisture — from whom every other Heliopolitan deity descends.'
    ),
    commonConfusions: en(
      'Mixed up with Ra, constantly. In Heliopolitan theology they fused into Atum-Ra, but they began separate: Ra is the day-sun (falcon-headed, sun disk on the head); Atum is the evening sun returning to the waters (bearded man, double crown, no disk). If the disk is on top, you are looking at Ra or Atum-Ra; if it is not, you are looking at Atum on his own.'
    ),
    treeRole: 'primordial',
    isOnSpine: true,
  },
  {
    _id: DEITY_IDS.osiris,
    _type: 'deity',
    name: en('Osiris'),
    slug: enSlug('osiris'),
    transliteration: 'Wsjr',
    domain: en(
      'God of the afterlife, resurrection, and agricultural renewal. Ruler of the underworld after his death and resurrection — the prototype of every dead king, and eventually every dead Egyptian, in their passage through judgement.'
    ),
    iconography: en(
      "Always shown mummified — green or black-skinned, wrapped in white linen, arms crossed across the chest holding the crook and flail, wearing the tall white atef crown flanked by ostrich plumes. Green for vegetation's renewal; black for the fertile silt left by the Nile flood. The colour plus the crook-and-flail is the signature — nothing else in the pantheon combines them."
    ),
    whereYoullSeeThem: en(
      'The chapels at Abydos are his — the temple of Seti I is the deepest one to see, and the Osireion sunk behind it was built to evoke his tomb. He sits as judge of the dead in nearly every royal tomb in the Valley of the Kings, and appears as Osiris-Onnophris ("the perfect being") in funerary chapels at Dendera and Philae. Wherever Egyptian art shows a mummy on a throne with a feather being weighed against a heart, you are looking at his court.'
    ),
    keyMyth: en(
      'Murdered by his brother Set, dismembered, and reassembled by his sister-wife Isis — became ruler of the afterlife while Horus, his posthumous son, took the throne of Egypt.'
    ),
    commonConfusions: en(
      'Often confused with Ptah, who is also shown mummiform. Distinguished by colour and crown: Ptah is white-skinned in a tight skullcap, holding a was sceptre; Osiris is green or black, in the atef crown, with crook and flail. If a mummy is presiding over a hall of weighing, it is always Osiris.'
    ),
    treeRole: 'thirdGeneration',
    isOnSpine: true,
    spouse: ref(DEITY_IDS.isis),
    children: refList([DEITY_IDS.horus]),
  },
  {
    _id: DEITY_IDS.isis,
    _type: 'deity',
    name: en('Isis'),
    slug: enSlug('isis'),
    transliteration: 'Ꜣst',
    domain: en(
      'Goddess of magic, motherhood, and devotion. Wife and sister of Osiris, mother of Horus. Through the late-period spread of her cult she became the most widely worshipped Egyptian deity outside Egypt — by Roman times her temples ran from Britain to Mesopotamia.'
    ),
    iconography: en(
      "A woman wearing a throne-shaped crown — the throne is literally the hieroglyph for her name (Aset, \"throne\"). Later iconography adds the sun disk between cow's horns (borrowed from Hathor, post-syncretism). Often shown winged, her arms feathered, protecting Osiris or the dead. The throne crown is the safest identifier; if you can read it, you have her."
    ),
    whereYoullSeeThem: en(
      'Philae is hers — the entire island temple complex south of Aswan, now relocated to nearby Agilkia, was her last major cult centre in Egypt and one of the longest-running temples in the ancient world (active into the 6th century AD). She also dominates the funerary chapels at Dendera and appears as the mourner-protector at the foot of nearly every royal mummy in the Valley of the Kings.'
    ),
    keyMyth: en(
      'Reassembled the dismembered body of her husband Osiris, conceived their son Horus by magic over his corpse, and hid the boy in the marshes of the Delta until he was old enough to challenge Set for the throne.'
    ),
    commonConfusions: en(
      "Often confused with Hathor, who shares cow iconography after their late-period merger. Isis's marker is the throne-shaped crown (the hieroglyph for her name); Hathor's is the sun disk between two cow's horns. After their syncretism Isis is sometimes shown with the disk-and-horns too — at that point the throne underneath the disk is the only reliable distinction."
    ),
    treeRole: 'thirdGeneration',
    isOnSpine: true,
    spouse: ref(DEITY_IDS.osiris),
    children: refList([DEITY_IDS.horus]),
  },
  {
    _id: DEITY_IDS.horus,
    _type: 'deity',
    name: en('Horus'),
    slug: enSlug('horus'),
    transliteration: 'Ḥr',
    domain: en(
      'Sky god, divine kingship, and the living pharaoh. The reigning king of Egypt was, in theological terms, Horus on earth — every coronation a re-enactment of his accession to the throne his father Osiris had lost. After the Osiris myth was fixed in late-Old-Kingdom theology, Horus became the figure of the living, victorious king.'
    ),
    iconography: en(
      "A man with a falcon's head, almost always wearing the double crown of Upper and Lower Egypt. In reliefs of pharaohs being protected, the falcon hovering above or behind the king's head is Horus extending his protection over the king-as-himself. Also depicted as a full falcon, often perched on the royal serekh (palace facade). If a man has a falcon head and the double crown, he is Horus the Younger — the son of Osiris."
    ),
    whereYoullSeeThem: en(
      'The entire temple at Edfu is dedicated to him — one of the best-preserved temples in Egypt and the cleanest case study in Ptolemaic theological architecture. The inner sanctuary still holds the granite shrine that housed his cult statue. He also dominates Kom Ombo (sharing the temple with Sobek on a strict north-south axis) and appears as the falcon protector behind the king in pharaonic reliefs from Karnak to Abu Simbel.'
    ),
    keyMyth: en(
      'Conceived posthumously by his mother Isis from his murdered father Osiris, raised in hiding, and in adulthood defeated his uncle Set in a long contest before the divine tribunal — winning back the throne of Egypt and becoming the divine pattern of every living pharaoh.'
    ),
    commonConfusions: en(
      'Two distinct Horuses get fused in popular accounts. Horus the Elder (Horwer) is a sky god from the earliest Egyptian theology — independent, no parents, often shown as a complete falcon. Horus the Younger — this entry — is the son of Isis and Osiris in the Heliopolitan myth and the deity of the living pharaoh. Most temple references in Upper Egypt are to the Younger; Behdet/Edfu sometimes references the Elder. They share iconography and a name, but not a story.'
    ),
    treeRole: 'fourthGeneration',
    isOnSpine: true,
    parents: refList([DEITY_IDS.isis, DEITY_IDS.osiris]),
  },
  {
    _id: DEITY_IDS.hathor,
    _type: 'deity',
    name: en('Hathor'),
    slug: enSlug('hathor'),
    transliteration: 'Ḥwt-Ḥr',
    domain: en(
      'Goddess of love, music, dance, joy, and motherhood. Also a sky goddess — her name means "house of Horus," framing her as the cosmic mother who contains him. By the Middle Kingdom she was patron of female sexuality, the dead in the afterlife, and the foreign mines (turquoise at Sinai, gold at Nubia).'
    ),
    iconography: en(
      "A woman with cow's ears, or with cow's horns flanking a sun disk on her head. Sometimes shown fully as a cow (especially in funerary scenes welcoming the dead). The horns-and-disk crown is her signature, but it was borrowed by Isis in late antiquity. In music-and-dance reliefs at Dendera she carries a sistrum, her sacred metal rattle."
    ),
    whereYoullSeeThem: en(
      'Dendera is hers, end-to-end — one of the most complete temples in Egypt, late Ptolemaic but built on much older foundations, and almost entirely about her cult. The Hathor capitals (carved Hathor-head columns) are her recognisable signature; you will also see them at Philae, on the second pylon at Karnak, and in Hatshepsut\'s temple at Deir el-Bahri. Whenever a column shows a frontal female face with cow\'s ears on every side, it is hers.'
    ),
    keyMyth: en(
      'Ra sent her as the Eye of Ra to punish disobedient humanity. As Sekhmet she slaughtered until Ra, fearing humanity\'s extinction, had the fields flooded with red-dyed beer — she drank it, fell asleep drunk, and woke as the merciful Hathor. The myth folds Hathor and Sekhmet into two faces of the same goddess.'
    ),
    commonConfusions: en(
      "Three overlapping confusions. (1) Isis — both wear horns and a sun disk in late iconography; Isis's underlying crown is a throne, Hathor's underlying head is a cow. (2) Sekhmet — theologically the same goddess in two moods; Sekhmet has a lion's head, Hathor has cow ears or cow horns. (3) Nut, the sky goddess, who is sometimes also shown as a cow — but Nut is stretched as the vault of the sky, never as a woman with the disk-and-horns crown."
    ),
    treeRole: 'solarChild',
    isOnSpine: false,
  },
  {
    _id: DEITY_IDS.sobek,
    _type: 'deity',
    name: en('Sobek'),
    slug: enSlug('sobek'),
    transliteration: 'Sbk',
    domain: en(
      'Crocodile god of the Nile, fertility, and military prowess. Less a unified national figure than a regional one — Egyptians venerated him strongly where the Nile widened and crocodiles were thick, and largely ignored him elsewhere. Where he was worshipped, he was big.'
    ),
    iconography: en(
      "A man with a crocodile's head, often wearing a sun disk between tall plumes (the hemhem crown). Also shown as a full crocodile, sometimes mummified, lying on a shrine. At Kom Ombo, crocodile mummies were donated by pilgrims and stored by the thousand — many are still on view in the small museum beside the temple."
    ),
    whereYoullSeeThem: en(
      'Kom Ombo is the headline — the double temple is laid out symmetrically on a strict north-south axis, the southern half for Sobek and the northern half for Horus. Faiyum, the lake-region southwest of Cairo, was the other major centre; the now-vanished city of Shedet was so dominated by his cult that the Greeks called it Crocodilopolis. He also appears throughout Upper Egyptian reliefs as a protector deity, often alongside Horus.'
    ),
    keyMyth: en(
      'Less a mythological figure than a regional power — his stories vary city by city, and the canonical Heliopolitan myth-cycle largely passes him by.'
    ),
    commonConfusions: en(
      "Often confused with Set, the other 'frightening' animal-headed god — but Set has a peculiar invented animal head (long muzzle, square ears, distinctly not a known species). Sobek's head is unambiguously crocodile. Also sometimes confused with Khnum (ram-headed creator at Elephantine) by visitors skimming reliefs in low light; crocodile vs ram is straightforward once you look."
    ),
    regionalVariants: en(
      "At Kom Ombo (Upper Egypt) Sobek is paired with Horus in a dualistic theology — the temple's symmetric double-axis is the architectural expression of that pairing. At Faiyum (Middle Egypt) he is the standalone creator, sometimes as Sobek-Ra, with the sun disk-and-plumes crown emphasised. The two cult centres present subtly different deities under the same name."
    ),
    treeRole: 'independent',
    isOnSpine: false,
    primaryCultCenter: ref(KOM_OMBO_ID),
  },
];

// ── Execute ──────────────────────────────────────────────────────────────
async function run() {
  const mode = commit ? 'COMMIT' : 'DRY-RUN';
  console.log(`\n— Phase-1 deity seed (${mode}) —`);
  console.log(`  dataset:  ${DATASET}`);
  console.log(`  projectId:${PROJECT_ID}\n`);

  for (const doc of docs) {
    const nameEn = (doc as any).name?.[0]?.value;
    console.log(`  ${doc._id.padEnd(16)} ${nameEn?.padEnd(10)} ${(doc as any).treeRole}`);
  }
  console.log('');

  if (!commit) {
    console.log(`(dry-run — re-run with --commit to write)`);
    return;
  }

  const client = getClient();

  // Verify Kom Ombo exists before referencing it.
  const komOmbo = await client.fetch<{ _id: string } | null>(
    '*[_id == $id][0]{_id}',
    { id: KOM_OMBO_ID }
  );
  if (!komOmbo) die(`Kom Ombo city doc ${KOM_OMBO_ID} not found in ${DATASET}`);

  // Commit all six in a single transaction so the circular Osiris ↔ Isis ↔
  // Horus references resolve atomically — Sanity validates references at
  // transaction commit, not per-mutation.
  const tx = client.transaction();
  for (const doc of docs) tx.createOrReplace(doc as any);
  await tx.commit();
  for (const doc of docs) console.log(`  ✓ ${doc._id}`);
  console.log(`\nDone. Six deities written to ${DATASET}.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
