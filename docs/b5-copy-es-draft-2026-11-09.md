# B5 copy draft: Spanish batch (9 Nov 2026)

Phase B5, Spanish (the biggest market). Targets come from `docs/keyword-map-2026-11-09.md` (ES table); impressions are 16-month Search Console figures.

**Status: LOCKED — approved by the owner 9 Nov 2026 ("Yes, apply all").** Locked copy (Canon Gate A): the staging script writes only strings that byte-match this file.

Fields work as in batch 1:
- **Meta title** is the Google link. The site adds " — Travel2Egypt", so each is kept to 45 characters or fewer.
- **Meta description** is 120–155 characters.
- **Intro** is the italic opening line.
- All copy uses *tú*, and prices are left out.

**One change to the keyword map.** The old Spanish cruise page (`/es/vacaciones-en-un-crucero-por-el-nilo/`, Google position 11.6) now redirects to `/es/nile-cruises`. So **"crucero por el Nilo" → `/es/nile-cruises`** (the cruise directory), and **"viaje a Egipto con crucero" → `/es/nile-cruise-holidays`** (trips that include a cruise). Today both pages are titled "Cruceros por el Nilo"; this gives each its own search.

---

### 1. Packages hub (`/es/paquetes-de-viaje-a-egipto`)

Target: *viajes a egipto*, *tour a egipto*, *circuitos por egipto*, *paquete de viaje a egipto* (~5K impressions; position 50–75).

- **Meta title:**
  - *Now:* Paquetes de viaje a Egipto (a label shared with other pages)
  - **New:** Viajes a Egipto: circuitos privados
  - *How:* a new hub-only key, `packagesHub.metaTitle`. EN and JA keep their current text.
- **H1 and meta description:** keep (the description was approved in #188).

### 2. Nile cruises (`/es/nile-cruises`)

Target: *crucero por el nilo*, *cruceros por el nilo*, *crucero egipto* (~2K impressions).

- **Meta title:**
  - *Now:* Cruceros por el Nilo: barcos de crucero, dahabiyas y vapores | Travel2Egypt (75 characters, cut off in Google)
  - **New:** Crucero por el Nilo: barcos y dahabiyas | Travel2Egypt
- **H1 and meta description:** keep.

### 3. Trips with a Nile cruise (`/es/nile-cruise-holidays`)

Target: *viaje a egipto y crucero por el nilo*, *itinerario egipto 7 días con crucero nilo*, *viaje a egipto con crucero nilo y lago nasser*.

- **Meta title:**
  - *Now:* Cruceros por el Nilo
  - **New:** Viaje a Egipto con crucero por el Nilo
- **Meta description:**
  - *Now:* La manera clásica de ver Egipto — por el río. Tipos, rutas y duraciones…
  - **New:** Viajes privados por Egipto con un tramo de crucero por el Nilo entre Asuán y Luxor, combinado con El Cairo y otros destinos. Tú eliges el barco.
- **H1 and intro:** keep.

### 4. Romantic trip (`/es/amor-sobre-el-nilo-viaje-romantico-por-egipto-en-10-dias`)

Target: *viaje romántico por egipto*, *paquetes románticos egipto* (position 20–25).

- **Meta title:**
  - *Now:* the H1 (57 characters + suffix)
  - **New:** Viaje romántico por Egipto: 10 días para dos
- **Meta description** (now empty):
  - **New:** Diez días privados para dos: El Cairo, Luxor, el Nilo, Asuán y Alejandría, con la faluca en Elefantina y el templo de Luxor iluminado de noche.
- **Intro fix:** the English name crept into the Spanish text.
  - *Now:* "…el Luxor Temple iluminado por la noche…"
  - **New:** "…el templo de Luxor iluminado por la noche…"

### 5. Abu Simbel (`/es/abu-simbel-y-el-antiguo-egipto-en-10-dias`)

Target: *viaje a egipto con abu simbel* (434 impressions; position 56–66).

- **Meta title:**
  - *Now:* the H1
  - **New:** Viaje a Egipto con Abu Simbel: 10 días
- **Meta description** (now empty):
  - **New:** Diez días privados en torno a Abu Simbel: Saqqara y Dahshur, Asuán y los templos nubios, Kom Ombo y Edfu hasta Luxor, y un final en Alejandría.

### 6. Egypt and the Red Sea (`/es/egypt-and-the-red-sea`)

Target: *viaje egipto y mar rojo*.

- **Meta title:**
  - *Now:* Egipto y el mar Rojo
  - **New:** Viaje a Egipto y el mar Rojo
- **Meta description:** keep.

### 7. Luxury (`/es/egypt-luxury-holidays`)

Target: *viaje de lujo a egipto* (472), *viajes de lujo a egipto*, *viaje lujo egipto*.

- **Meta title:**
  - *Now:* Vacaciones de lujo en Egipto
  - **New:** Viaje de lujo a Egipto, en privado
- **Meta description:** keep.

### 8. 7 days (`/es/egipto-en-7-dias-el-cairo-crucero-por-el-nilo-luxor-y-asuan`)

Target: *viaje a egipto 7 días* (452), *itinerario egipto 7 días*.

- **Meta title:**
  - *Now:* the H1 (61 characters + suffix)
  - **New:** Viaje a Egipto 7 días: El Cairo y crucero
- **Meta description** (now empty):
  - **New:** Siete días privados: El Cairo, el tren nocturno al sur, tres noches de crucero entre Asuán y Luxor y una jornada final en los templos tebanos.

### 9. 4 days (`/es/el-cairo-en-4-dias-piramides-gran-museo-egipcio-y-el-cairo-antiguo`)

Target: *tour 4 días egipto* (808), *viaje a egipto 4 días* (349).

- **Meta title:**
  - *Now:* the H1 (68 characters + suffix)
  - **New:** Egipto en 4 días: tour privado por El Cairo
- **Meta description** (now empty):
  - **New:** Cuatro días privados en El Cairo: la pirámide escalonada de Saqqara, Guiza, el Gran Museo Egipcio y la ciudad copta e islámica.

### 10. 8 days (`/es/egipto-esencial-en-8-dias-el-cairo-alejandria-asuan-y-luxor`)

Target: *viaje a egipto 8 días* (564), *circuito egipto 8 días* (~600).

- **Meta title:**
  - *Now:* the H1 (62 characters + suffix)
  - **New:** Viaje a Egipto 8 días: Egipto esencial
- **Meta description** (now empty):
  - **New:** Ocho días privados por cuatro ciudades: la meseta de Guiza, Alejandría junto al Mediterráneo, Abu Simbel y Asuán, y los templos y tumbas de Luxor.

---

Not in this batch: the Japanese pages already rank on page 1 for their terms.
