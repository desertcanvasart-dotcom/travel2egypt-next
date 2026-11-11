# Copy fixes draft: Spanish 9-day body + dahabiya "no engine" (10 Nov 2026)

**Status: LOCKED — approved by the owner 10 Nov 2026 ("Yes, apply all").** Locked copy (Canon Gate A): the staging script writes only strings that byte-match this file.

---

## 1. The Spanish body of the 9-day tour is in Portuguese

Page: `/es/maravillas-de-egipto-tour-clasico-de-9-dias` (Sanity `wp-page-156421`, body `es`).

**What's wrong**
- The whole Spanish body is Portuguese: 3 paragraphs and 5 tips ("Descubra os tesouros atemporais do Egito…", "Calçados Confortáveis…").
- I searched the rest of Sanity, and no other Spanish content is affected.
- The Spanish intro was already fixed in #198.

**The fix**
- A Spanish version of the English body, using *tú*.
- The route stays the same. Every stop comes from the English body.
- The marketing words go ("timeless treasures", "immersive", "luxurious", "perfect blend"), per Canon II.3.
- The existing links are dropped. They are broken: "explorar" points to the Minya guide, and "para as aventuras" to a Lake Nasser post.

**New Spanish body**

> **Nueve días privados por el Egipto clásico.** Empiezas en El Cairo con las pirámides de Guiza y la colección del Museo Egipcio, y paseas por el bazar de Jan el-Jalili y la calle Al-Muizz.

> Vuelas a Luxor para recorrer sus dos orillas: el Valle de los Reyes en la occidental y los templos de Karnak y Luxor en la oriental. Después embarcas en un crucero por el Nilo rumbo sur hacia Asuán, con paradas en los templos de Edfu y Kom Ombo.

> En Asuán visitas el templo de Philae y tomas el tren nocturno de vuelta a El Cairo. El viaje termina en Menfis y Saqqara, con la pirámide escalonada, y en El Cairo copto, con la Iglesia Colgante y la sinagoga Ben Ezra.

Tips (a bulleted list, label in bold):

> **Calzado cómodo:** caminarás mucho, sobre todo en los yacimientos arqueológicos.

> **Protección solar:** lleva gafas de sol, crema solar y sombrero.

> **Respeto cultural:** viste con recato al visitar lugares religiosos y prepárate para descalzarte cuando te lo pidan.

> **Conexión:** el wifi puede ser limitado en algunos lugares; descarga antes las aplicaciones y la información que necesites.

> **Recogida en el hotel:** espera en el vestíbulo 15 minutos antes de la salida prevista cada día.

---

## 2. Dahabiya description: "no engine"

Page: `/authentic-dahabiya-nile-cruise`. This is the Google description (`seo.metaDescription`) in all three languages.

**What's wrong:** the description says the boats have no engine. The FAQ you approved, based on your own dahabiya guide, says a tugboat or an engine takes over when the wind, the schedule or safety requires it. The new wording keeps everything else and drops the contradiction.

**English**
- *Now:* The Nile under sail — a handful of cabins, no engine, and the moorings the big boats can't reach. The traditional sailing form of the Nile, restored for the modern voyage.
- **New:** The Nile under sail where the wind allows — a handful of cabins and the moorings the big boats can’t reach. The traditional sailing form of the Nile, restored for the modern voyage.

**Spanish**
- *Now:* El Nilo a vela — un puñado de camarotes, ningún motor, y los fondeos a los que los grandes barcos no pueden llegar. La forma tradicional de navegar el Nilo, restaurada para el viaje moderno.
- **New:** El Nilo a vela cuando el viento lo permite — un puñado de camarotes y los fondeos a los que los grandes barcos no pueden llegar. La forma tradicional de navegar el Nilo, restaurada para el viaje moderno.

**Japanese**
- *Now:* ナイル川を帆で進む——ごく限られたキャビン、エンジンなし、そして大型船がたどり着けない停泊地。ナイル川を航行してきた伝統的な帆船の形が、現代の航海のために蘇りました。
- **New:** 風があれば帆で進むナイル川——ごく限られたキャビンと、大型船がたどり着けない停泊地。ナイル川を航行してきた伝統的な帆船の形が、現代の航海のために蘇りました。
