/**
 * Where the land is, as a grid of dots for `moul-world-map`.
 *
 * Source: Natural Earth 1:110m land (public domain), via the `world-atlas`
 * 2.0.2 TopoJSON. The map is equirectangular, from 84°N to 58°S
 * (Antarctica is left out) and from 180°W eastward. Each cell is 2° square,
 * centred on its longitude and on its row's latitude, and counts as land
 * when at least 35% of it is land. Rows run north to south and cells west
 * to east, packed eight to a byte, most significant bit first, and the
 * bytes are base64 encoded: 1620 bytes for 4075 land cells.
 */
export const LAND_MASK = {
  columns: 180,
  rows: 72,
  /** Degrees per cell, both ways. */
  step: 2,
  /** Latitude of the first row. */
  north: 84,
  bits:
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/////mAAAAAAAAAAAAAAAAAAAAAAA//v///4AA' +
    '/gAAAADwAAAAAAAAAAACNP8////wAA5AAAAAAOAAAAAAAAAAB/m/wf///wAAAAAB8AD/4AHAAAAA' +
    'AADwC/4AP//wAAAAAGAB//4AAAAAAAAAH/3n+AP//gAAAAAMDf///+H4AAAH/w8f5z/wH//AAAH8' +
    'AAH///////wcwf/////9j8H/4AAAf/y///////////+///////B+H/A+AA//////////////AP//' +
    '///9l8D8AcAD//////////////Af/////wHAB4AAAH5////////////8AP9////gHkAQAAAP5///' +
    '////////PAABwD///wH+AAAAGF4/////////+AYAACAA///+H/AAAAGCz/////////4A4AAAAAf/' +
    '//v/wAAAbD//////////8AwAAAAAP/////wAAATv///////////AgAAAAAP/////QAAAB///////' +
    '////9AAAAAAAD////88AAAD///////////9AAAAAAAD/////AAAAB//7fv//////4AAAAAAAD///' +
    '/0AAAAB/vwff//////zgAAAAAAD////gAAAAfw3zHP/////+CAAAAAAAD///+AAAAAfCbf/v////' +
    '/8CAAAAAAAD///8AAAAAfATf/n////+GGAAAAAAAB///8AAAAAF/AC///////GMAAAAAAAA///4A' +
    'AAAAP/AA///////BwAAAAAAAAf//wAAAAAf/zh///////hAAAAAAAAAP/9wAAAAAf//////////g' +
    'AAAAAAAAAH/AwAAAAA/////v/////gAAAAAAAAAB/AQAAAAB///+/j/////AAAAAAAAAAC+AAAAA' +
    'AD////f+D///+gAAAAAAAAAAeAYAAAAH//////B/7/4AAAAAAAAAAAfEEgAAAD////v+A/j+AAAA' +
    'AAAAAAAAP8AgAAAD////n8A/B+AgAAAAAAAAAAB/AAAAAD////3wAeB/AgAAAAAAAAAAAPAAAAAH' +
    '/////AAcAfgwAAAAAAAAAAADAAAAAD////8AAcAXgIAAAAAAAAAAABj/AAAB/////wAMATAQAAAA' +
    'AAAAAAAAX/gAAB/////gACAQAYAAAAAAAAAAAAH/4AAAf////gAAAICIAAAAAAAAAAAAH/8AAAAD' +
    '///AAAA8GAAAAAAAAAAAAAH/+AAAAB//+AAAAceAAAAAAAAAAAAAP/+AAAAD//8AAAAM+wAAAAAA' +
    'AAAAAAP//wAAAB//4AAAAOdgsAAAAAAAAAAAf//+AAAB//wAAAAGEgfgAAAAAAAAAAf///gAAA//' +
    'wAAAADAAH0AAAAAAAAAAP///gAAA//wAAAAA4AHwAAAAAAAAAAH///AAAA//wAAAAAAAAIAAAAAA' +
    'AAAAH//+AAAAf/wAAAAAAAxAAAAAAAAAAAD//+AAAA//wgAAAAAFxAAAAAAAAAAAB//+AAAA//zg' +
    'AAAAAP5gAAAAAAAAAAA//8AAAA//jgAAAAAf/gAAAAAAAAAAAf/8AAAA//DgAAAAB//wAAAAAAAA' +
    'AAAf/8AAAAf/DAAAAAH//4AAAAAAAAAAAf/gAAAAf/DAAAAAH//8AAAAAAAAAAA//AAAAAf+AAAA' +
    'AAH//+AAAAAAAAAAA//AAAAAP8AAAAAAH//+AAAAAAAAAAA/+AAAAAP8AAAAAAH//+AAAAAAAAAA' +
    'A/8AAAAAH4AAAAAAD+/8AAAAAAAAAAA/4AAAAAHgAAAAAADwf8AAAAAAAAAAB/wAAAAAAAAAAAAA' +
    'AAH4AAAAAAAAAAB/gAAAAAAAAAAAAAAAD4AGAAAAAAAAB+AAAAAAAAAAAAAAAAAAAGAAAAAAAAB8' +
    'AAAAAAAAAAAAAAAAAwAIAAAAAAAAB8AAAAAAAAAAAAAAAAAAAwAAAAAAAAD4AAAAAAAAAAAAAAAA' +
    'AABgAAAAAAAAD4AAAAAAAAAAAAAAAAAAAAAAAAAAAADwAAAAAAAAAAAAAAAAAAAAAAAAAAAADwgA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAB4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
} as const
