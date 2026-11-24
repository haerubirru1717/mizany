import { SURAH_ROWS, PAGE_STARTS, JUZ_STARTS } from './quranMeta.generated'

export const TOTAL_MUSHAF_PAGES = 604
export const TOTAL_JUZ = 30

export interface SurahMeta {
  number: number
  name: string
  meaning: string
  ayahCount: number
  place: 'Mekah' | 'Madinah'
}

export const SURAHS: SurahMeta[] = SURAH_ROWS.map(([number, name, meaning, ayahCount, place]) => ({
  number,
  name,
  meaning,
  ayahCount,
  place,
}))

export function getSurah(number: number): SurahMeta | undefined {
  return SURAHS[number - 1]
}

const compare = (a: readonly [number, number], s: number, ay: number) =>
  a[0] !== s ? a[0] - s : a[1] - ay

/** Last index i where starts[i] <= (surah, ayah). */
function lastStartIndex(starts: ReadonlyArray<readonly [number, number]>, surah: number, ayah: number) {
  let lo = 0
  let hi = starts.length - 1
  let ans = 0
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (compare(starts[mid], surah, ayah) <= 0) {
      ans = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return ans
}

/** Mushaf page (1..604) & Juz (1..30) of an ayah. */
export function locateAyah(surah: number, ayah: number): { page: number; juz: number } {
  return {
    page: lastStartIndex(PAGE_STARTS, surah, ayah) + 1,
    juz: lastStartIndex(JUZ_STARTS, surah, ayah) + 1,
  }
}

/** First Mushaf page of each Juz (index 0 = Juz 1). */
export const JUZ_START_PAGES: number[] = JUZ_STARTS.map(([s, a]) => locateAyah(s, a).page)

/** Juz (1..30) that contains a Mushaf page. */
export function juzOfPage(page: number): number {
  const p = Math.min(TOTAL_MUSHAF_PAGES, Math.max(1, page))
  let juz = 1
  for (let i = 0; i < JUZ_START_PAGES.length; i++) {
    if (JUZ_START_PAGES[i] <= p) juz = i + 1
  }
  return juz
}

/** Last Mushaf page of a Juz (1..30). */
export function juzEndPage(juz: number): number {
  return juz >= TOTAL_JUZ ? TOTAL_MUSHAF_PAGES : JUZ_START_PAGES[juz] - 1
}

/** Official Qur'an Kemenag reader, opened at the given ayah onwards. */
export function kemenagReaderUrl(surah: number, ayah: number): string {
  const meta = getSurah(surah)
  const to = meta ? meta.ayahCount : ayah
  return `https://quran.kemenag.go.id/quran/per-ayat/surah/${surah}?from=${ayah}&to=${to}`
}
