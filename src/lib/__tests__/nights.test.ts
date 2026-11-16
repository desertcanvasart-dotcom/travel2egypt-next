import assert from 'node:assert/strict';
import { countNights, nightParts } from '../products/nights';

// 7-Day tour (wp-page-136519): 2 hotel · 1 sleeper train · 3 on the river.
const en = countNights(['Cairo hotel', 'Sleeper train', 'Nile cruise ship', 'Nile cruise ship', 'Nile cruise ship', 'Cairo hotel', null]);
assert.deepEqual(nightParts(en), [{ kind: 'hotel', n: 2 }, { kind: 'train', n: 1 }, { kind: 'river', n: 3 }]);
assert.equal(en.total, 6);
// The same product's current ES / JA overnight strings.
const es = countNights(['El Cairo', 'Tren con literas', 'Barco de crucero', 'Barco de crucero', 'Barco de crucero', 'El Cairo', null]);
assert.deepEqual(nightParts(es), nightParts(en));
const ja = countNights(['カイロ', '寝台列車', 'ナイル・クルーズ船', 'ナイル・クルーズ船', 'ナイル・クルーズ船', 'カイロ', null]);
assert.deepEqual(nightParts(ja), nightParts(en));
// Camp and the departure-day dash.
assert.deepEqual(nightParts(countNights(['Bahariya camp', 'White Desert camp', 'Cairo', '—'])), [{ kind: 'hotel', n: 1 }, { kind: 'camp', n: 2 }]);
console.log('nights: ok');
