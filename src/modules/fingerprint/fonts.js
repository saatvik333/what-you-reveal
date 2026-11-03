/**
 * Installed-font detection by text metrics.
 *
 * `document.fonts.check()` cannot detect installed fonts: per spec it returns true for any
 * family that has no @font-face in the page, installed or not. Instead each candidate is
 * measured as `"<font>", <generic>`; if the width differs from the bare generic family for
 * any of three generics, the browser found a real face for that name. Like any fingerprinter,
 * this also sees fonts the OS substitutes under another name (e.g. Liberation Sans for Arial).
 */

import { cyrb53 } from '../../utils/crypto.js';

const FONT_GROUPS = {
  windows: [
    'Segoe UI', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Segoe UI Historic', 'Segoe MDL2 Assets', 'Segoe Print',
    'Segoe Script', 'Calibri', 'Cambria', 'Cambria Math', 'Candara', 'Consolas', 'Constantia', 'Corbel',
    'Bahnschrift', 'Ebrima', 'Gadugi', 'Gabriola', 'HoloLens MDL2 Assets', 'Ink Free', 'Javanese Text',
    'Leelawadee UI', 'Lucida Console', 'Lucida Sans Unicode', 'Malgun Gothic', 'Marlett', 'Microsoft Himalaya',
    'Microsoft JhengHei', 'Microsoft New Tai Lue', 'Microsoft PhagsPa', 'Microsoft Sans Serif', 'Microsoft Tai Le',
    'Microsoft YaHei', 'Microsoft Yi Baiti', 'MingLiU-ExtB', 'Mongolian Baiti', 'MS Gothic', 'MS PGothic',
    'MS UI Gothic', 'MV Boli', 'Myanmar Text', 'Nirmala UI', 'SimSun', 'Sitka', 'Sylfaen', 'Yu Gothic',
    'Yu Gothic UI', 'Franklin Gothic Medium', 'Meiryo', 'Meiryo UI', 'Yu Mincho', 'Batang', 'Dotum',
    'Gulim', 'SimHei', 'KaiTi', 'FangSong',
  ],
  office: [
    'Agency FB', 'Algerian', 'Book Antiqua', 'Arial Rounded MT Bold', 'Baskerville Old Face', 'Bauhaus 93',
    'Bell MT', 'Berlin Sans FB', 'Bernard MT Condensed', 'Blackadder ITC', 'Bodoni MT', 'Bookman Old Style',
    'Bradley Hand ITC', 'Britannic Bold', 'Broadway', 'Californian FB', 'Centaur', 'Century Gothic', 'Chiller',
    'Colonna MT', 'Cooper Black', 'Copperplate Gothic Bold', 'Curlz MT', 'Edwardian Script ITC', 'Elephant',
    'Engravers MT', 'Eras Bold ITC', 'Felix Titling', 'Footlight MT Light', 'Forte', 'Franklin Gothic Heavy',
    'Freestyle Script', 'French Script MT', 'Gigi', 'Gill Sans MT', 'Gloucester MT Extra Condensed',
    'Goudy Old Style', 'Haettenschweiler', 'Harlow Solid Italic', 'Harrington', 'High Tower Text',
    'Imprint MT Shadow', 'Informal Roman', 'Jokerman', 'Juice ITC', 'Kristen ITC', 'Kunstler Script',
    'Lucida Bright', 'Lucida Calligraphy', 'Lucida Fax', 'Lucida Handwriting', 'Magneto', 'Maiandra GD',
    'Matura MT Script Capitals', 'Mistral', 'Modern No. 20', 'Monotype Corsiva', 'Niagara Engraved',
    'Niagara Solid', 'OCR A Extended', 'Old English Text MT', 'Onyx', 'Palace Script MT', 'Parchment',
    'Perpetua', 'Perpetua Titling MT', 'Playbill', 'Poor Richard', 'Pristina', 'Rage Italic', 'Ravie',
    'Rockwell', 'Rockwell Condensed', 'Script MT Bold', 'Showcard Gothic', 'Snap ITC', 'Stencil',
    'Tempus Sans ITC', 'Viner Hand ITC', 'Vivaldi', 'Vladimir Script', 'Wide Latin',
  ],
  macos: [
    'Helvetica Neue', 'Apple Color Emoji', 'Apple SD Gothic Neo', 'Apple Symbols', 'Avenir', 'Avenir Next',
    'Avenir Next Condensed', 'Big Caslon', 'Bodoni 72', 'Charter', 'Cochin', 'DIN Alternate', 'DIN Condensed',
    'Futura', 'Geneva', 'Hoefler Text', 'Lucida Grande', 'Marker Felt', 'Menlo', 'Monaco', 'Noteworthy',
    'Optima', 'Phosphate', 'Savoye LET', 'SignPainter', 'Skia', 'Snell Roundhand', 'STHeiti', 'Superclarendon',
    'Thonburi', 'Trattatello', 'Zapfino', 'PingFang SC', 'PingFang TC', 'PingFang HK', 'Hiragino Sans',
    'Hiragino Kaku Gothic ProN', 'Chalkboard', 'Chalkboard SE', 'Apple Chancery', 'Chalkduster', 'Didot',
    'American Typewriter', 'Arial Hebrew', 'Ayuthaya', 'Bangla MN', 'Baoli SC', 'BiauKai', 'Corsiva Hebrew',
    'Devanagari MT', 'Euphemia UCAS', 'Geeza Pro', 'Gujarati MT', 'Gurmukhi MT', 'Heiti SC', 'Heiti TC',
    'Kannada MN', 'Khmer MN', 'Lao MN', 'Malayalam MN', 'Myanmar MN', 'Oriya MN', 'Sinhala MN', 'Tamil MN',
    'Telugu MN', 'New York', 'SF Pro', 'SF Mono',
  ],
  linux: [
    'Ubuntu', 'Ubuntu Mono', 'Ubuntu Condensed', 'Cantarell', 'DejaVu Sans', 'DejaVu Sans Mono', 'DejaVu Serif',
    'Liberation Sans', 'Liberation Serif', 'Liberation Mono', 'Noto Sans', 'Noto Serif', 'Noto Mono',
    'Noto Color Emoji', 'Noto Sans CJK SC', 'Noto Sans CJK TC', 'Noto Sans CJK JP', 'Noto Sans CJK KR',
    'Noto Serif CJK SC', 'Droid Sans', 'Droid Sans Mono', 'Droid Serif', 'FreeSans', 'FreeSerif', 'FreeMono',
    'Nimbus Sans', 'Nimbus Roman', 'Nimbus Mono PS', 'URW Gothic', 'URW Bookman', 'Bitstream Vera Sans',
    'Bitstream Vera Serif', 'Bitstream Vera Sans Mono', 'WenQuanYi Micro Hei', 'WenQuanYi Zen Hei',
    'AR PL UMing CN', 'Lohit Devanagari', 'Lohit Bengali', 'Lohit Tamil', 'Gargi', 'Meera', 'Nakula',
    'Norasi', 'OpenSymbol', 'Padauk', 'Purisa', 'Samyak Devanagari', 'Tlwg Typo', 'Umpush', 'Waree',
  ],
  nerd: [
    'FiraCode Nerd Font', 'Hack Nerd Font', 'JetBrainsMono Nerd Font', 'JetBrainsMono NF', 'MesloLGS NF',
    'MesloLGS Nerd Font', 'SauceCodePro Nerd Font', 'RobotoMono Nerd Font', 'UbuntuMono Nerd Font',
    'DejaVuSansM Nerd Font', 'DroidSansM Nerd Font', 'Inconsolata Nerd Font', 'Iosevka Nerd Font',
    'Iosevka Term Nerd Font', 'Mononoki Nerd Font', 'Terminess Nerd Font', 'CaskaydiaCove Nerd Font',
    'CaskaydiaMono Nerd Font', 'CodeNewRoman Nerd Font', 'Cousine Nerd Font', 'FantasqueSansM Nerd Font',
    'GoMono Nerd Font', 'Hasklug Nerd Font', 'Hurmit Nerd Font', 'Lekton Nerd Font', 'ProFont IIx Nerd Font',
    'SpaceMono Nerd Font', 'Symbols Nerd Font', 'Symbols Nerd Font Mono', 'GeistMono Nerd Font',
    'ZedMono Nerd Font', 'Lilex Nerd Font', 'VictorMono Nerd Font', 'BlexMono Nerd Font',
  ],
  developer: [
    'Fira Code', 'Fira Mono', 'Fira Sans', 'Source Code Pro', 'Source Sans Pro', 'Source Sans 3',
    'Cascadia Code', 'Cascadia Mono', 'IBM Plex Sans', 'IBM Plex Mono', 'Inter', 'Iosevka', 'Hack',
    'Monoid', 'Fantasque Sans Mono', 'Inconsolata', 'Victor Mono', 'Geist', 'Geist Mono', 'Roboto',
    'Roboto Mono', 'Roboto Condensed', 'Roboto Slab', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
    'Raleway', 'Nunito', 'Work Sans', 'PT Sans', 'PT Serif', 'PT Mono', 'Overpass', 'Merriweather',
    'Playfair Display', 'Lora', 'Oswald', 'Titillium Web', 'Source Han Sans', 'Source Han Serif',
    'NanumGothic', 'NanumMyeongjo',
  ],
  // Shipped by several operating systems: present on most machines, so they say little.
  common: [
    'Arial', 'Arial Black', 'Arial Narrow', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
    'Trebuchet MS', 'Comic Sans MS', 'Impact', 'Tahoma', 'Palatino Linotype', 'Palatino', 'Garamond',
    'Helvetica', 'Baskerville', 'Copperplate', 'Gill Sans', 'Papyrus', 'Brush Script MT', 'Andale Mono',
    'Webdings', 'Wingdings', 'Symbol',
  ],
};

const OS_GROUPS = { windows: 'Windows', macos: 'macOS', linux: 'Linux/Android' };
const GENERICS = ['monospace', 'sans-serif', 'serif'];
const SAMPLE = 'mmmmmmmmmmlli WwQq@#0O1 ÆĐŁ 你好 あ';
const SIZE = '72px';

function pageFontFamilies() {
  const families = new Set();
  for (const face of document.fonts ?? []) families.add(face.family.replace(/^["']|["']$/g, ''));
  return families;
}

function detectInstalled(fonts) {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return null;
  const width = (font) => {
    ctx.font = font;
    return ctx.measureText(SAMPLE).width;
  };
  const baseline = GENERICS.map((g) => width(`${SIZE} ${g}`));
  // Faces the page itself loads (@font-face) would look installed; skip them.
  const pageFonts = pageFontFamilies();
  return fonts.filter((font) =>
    !pageFonts.has(font) &&
    GENERICS.some((g, i) => width(`${SIZE} "${font}", ${g}`) !== baseline[i]),
  );
}

export async function collectFontData() {
  const groupOf = new Map();
  for (const [group, fonts] of Object.entries(FONT_GROUPS)) {
    for (const font of fonts) if (!groupOf.has(font)) groupOf.set(font, group);
  }
  const detected = detectInstalled([...groupOf.keys()]);
  const url = 'https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/measureText';

  if (detected === null) return { 'Font Detection': { value: 'Canvas Unavailable', url } };

  const counts = Object.fromEntries(Object.keys(FONT_GROUPS).map((g) => [g, 0]));
  for (const font of detected) counts[groupOf.get(font)]++;

  const [topOS, topCount] = Object.keys(OS_GROUPS)
    .map((g) => [g, counts[g]])
    .sort((a, b) => b[1] - a[1])[0];

  const data = {
    'Fonts Detected': { value: `${detected.length} of ${groupOf.size} tested`, url },
    'Likely OS (from Fonts)': {
      value: topCount >= 3 ? `${OS_GROUPS[topOS]} (${topCount} OS-specific fonts)` : 'Undetermined',
    },
    'Font List Hash': {
      value: cyrb53(detected.join(',')).toString(16).toUpperCase(),
      warning: detected.length > 0,
    },
  };
  if (counts.office > 0) data['Microsoft Office Fonts'] = { value: `${counts.office} detected`, warning: true };
  if (counts.nerd > 0) data['Nerd Fonts'] = { value: `${counts.nerd} detected`, warning: true, url: 'https://www.nerdfonts.com/' };
  if (counts.developer > 0) data['Developer/Designer Fonts'] = { value: `${counts.developer} detected`, warning: true };
  data['Installed Fonts'] = {
    value: detected.length > 0 ? detected.join(', ') : 'None detected (font enumeration blocked or standardized)',
  };
  return data;
}
