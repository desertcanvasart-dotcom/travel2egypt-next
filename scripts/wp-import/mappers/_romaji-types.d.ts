// Minimal ambient declarations for kuroshiro v1.2 + analyzer (no @types/* published).
// Used by scripts/wp-import/mappers/_romaji.ts. Surface area limited to what the
// helper consumes.
declare module 'kuroshiro' {
  export default class Kuroshiro {
    init(analyzer: unknown): Promise<void>;
    convert(
      text: string,
      opts: { to: string; mode: string; romajiSystem: string }
    ): Promise<string>;
  }
}
declare module 'kuroshiro-analyzer-kuromoji' {
  export default class KuromojiAnalyzer {
    constructor(opts?: { dictPath?: string });
  }
}
