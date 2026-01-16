/**
 * Font detection module
 * Enhanced with 100+ fonts including OS-specific fonts
 * Uses document.fonts API (fast) or canvas text measurement (fallback)
 */

/**
 * Comprehensive font list including OS-specific and popular fonts
 */
const FONT_LIST = [
  // Windows System Fonts
  'Arial',
  'Arial Black',
  'Arial Narrow',
  'Bahnschrift',
  'Calibri',
  'Cambria',
  'Cambria Math',
  'Candara',
  'Comic Sans MS',
  'Consolas',
  'Constantia',
  'Corbel',
  'Courier New',
  'Ebrima',
  'Franklin Gothic Medium',
  'Gabriola',
  'Gadugi',
  'Georgia',
  'HoloLens MDL2 Assets',
  'Impact',
  'Ink Free',
  'Javanese Text',
  'Leelawadee UI',
  'Lucida Console',
  'Lucida Sans Unicode',
  'Malgun Gothic',
  'Marlett',
  'Microsoft Himalaya',
  'Microsoft JhengHei',
  'Microsoft New Tai Lue',
  'Microsoft PhagsPa',
  'Microsoft Sans Serif',
  'Microsoft Tai Le',
  'Microsoft YaHei',
  'Microsoft Yi Baiti',
  'MingLiU-ExtB',
  'Mongolian Baiti',
  'MS Gothic',
  'MS PGothic',
  'MS UI Gothic',
  'MV Boli',
  'Myanmar Text',
  'Nirmala UI',
  'Palatino Linotype',
  'Segoe MDL2 Assets',
  'Segoe Print',
  'Segoe Script',
  'Segoe UI',
  'Segoe UI Emoji',
  'Segoe UI Historic',
  'Segoe UI Symbol',
  'SimSun',
  'Sitka',
  'Sylfaen',
  'Symbol',
  'Tahoma',
  'Times New Roman',
  'Trebuchet MS',
  'Verdana',
  'Webdings',
  'Wingdings',
  'Yu Gothic',
  'Yu Gothic UI',

  // macOS System Fonts
  'SF Pro',
  'SF Pro Display',
  'SF Pro Text',
  'SF Compact',
  'SF Mono',
  'New York',
  'Helvetica',
  'Helvetica Neue',
  'Apple Color Emoji',
  'Apple SD Gothic Neo',
  'Apple Symbols',
  'Avenir',
  'Avenir Next',
  'Avenir Next Condensed',
  'Baskerville',
  'Big Caslon',
  'Bodoni 72',
  'Charter',
  'Cochin',
  'Copperplate',
  'DIN Alternate',
  'DIN Condensed',
  'Futura',
  'Geneva',
  'Gill Sans',
  'Hoefler Text',
  'Lucida Grande',
  'Marker Felt',
  'Menlo',
  'Monaco',
  'Noteworthy',
  'Optima',
  'Palatino',
  'Papyrus',
  'Phosphate',
  'Rockwell',
  'Savoye LET',
  'SignPainter',
  'Skia',
  'Snell Roundhand',
  'STHeiti',
  'Superclarendon',
  'Thonburi',
  'Trattatello',
  'Zapfino',
  'PingFang SC',
  'PingFang TC',
  'PingFang HK',
  'Hiragino Sans',
  'Hiragino Kaku Gothic ProN',

  // Linux System Fonts
  'Ubuntu',
  'Ubuntu Mono',
  'Ubuntu Condensed',
  'Cantarell',
  'DejaVu Sans',
  'DejaVu Sans Mono',
  'DejaVu Serif',
  'Liberation Sans',
  'Liberation Serif',
  'Liberation Mono',
  'Noto Sans',
  'Noto Serif',
  'Noto Mono',
  'Noto Color Emoji',
  'Droid Sans',
  'Droid Sans Mono',
  'Droid Serif',
  'Roboto',
  'Roboto Mono',
  'Roboto Condensed',
  'Roboto Slab',
  'FreeSans',
  'FreeSerif',
  'FreeMono',
  'Nimbus Sans',
  'Nimbus Roman',
  'Nimbus Mono',
  'URW Gothic',
  'URW Bookman',

  // Common Web/Developer Fonts
  'Open Sans',
  'Lato',
  'Montserrat',
  'Source Sans Pro',
  'Source Code Pro',
  'Fira Code',
  'Fira Sans',
  'Fira Mono',
  'JetBrains Mono',
  'Cascadia Code',
  'IBM Plex Sans',
  'IBM Plex Mono',
  'Inter',
  'Nunito',
  'Poppins',
  'Raleway',
  'Work Sans',
  'PT Sans',
  'PT Serif',
  'PT Mono',
  'Oxygen',
  'Overpass',

  // CJK Fonts (Chinese, Japanese, Korean)
  'Noto Sans CJK SC',
  'Noto Sans CJK TC',
  'Noto Sans CJK JP',
  'Noto Sans CJK KR',
  'Noto Serif CJK',
  'Source Han Sans',
  'Source Han Serif',
  'WenQuanYi Micro Hei',
  'WenQuanYi Zen Hei',
  'AR PL UMing',
  'Meiryo',
  'Meiryo UI',
  'Yu Mincho',
  'HGGothicE',
  'HGMaruGothicMPRO',
  'Malgun Gothic Semilight',
  'Batang',
  'Dotum',
  'Gulim',
  'NanumGothic',
  'NanumMyeongjo',

  // Arabic/Hebrew/Indic Fonts
  'Noto Sans Arabic',
  'Noto Sans Hebrew',
  'Noto Sans Devanagari',
  'Noto Sans Tamil',
  'Tahoma',
  'Scheherazade',
  'Amiri',
  'Lateef',
  'David',
  'Miriam',
  'Lohit Devanagari',
  'Lohit Tamil',
  'Mangal',
  'Aparajita',
  'Kokila',
  'Utsaah',
];

/**
 * Detects available fonts from the comprehensive list
 * @returns {Promise<Object>} Detected fonts data
 */
export async function collectFontData() {
  const detected = [];
  const byCategory = {
    windows: [],
    macos: [],
    linux: [],
    web: [],
    cjk: [],
    other: [],
  };

  // METHOD 1: Modern CSS Font Loading API (No layout thrashing)
  if (document.fonts && document.fonts.check) {
    for (const font of FONT_LIST) {
      try {
        if (document.fonts.check(`12px "${font}"`)) {
          detected.push(font);
          categorizeFont(font, byCategory);
        }
      } catch (e) {
        /* ignore */
      }
    }
  }

  // Determine likely OS based on fonts
  const osGuess = guessOS(byCategory);

  return {
    'Detected Fonts Count': detected.length,
    'Font Entropy': detected.length > 50 ? 'High' : detected.length > 20 ? 'Medium' : 'Low',
    'Likely OS (from fonts)': osGuess,
    'Windows Fonts': byCategory.windows.length,
    'macOS Fonts': byCategory.macos.length,
    'Linux Fonts': byCategory.linux.length,
    'CJK Fonts': byCategory.cjk.length,
    'Web Fonts': byCategory.web.length,
    'Installed Fonts':
      detected.length > 0 ? detected.join(', ') : 'None detected (Fingerprinting protection?)',
  };
}



/**
 * Categorizes a font by its typical platform
 */
function categorizeFont(font, categories) {
  const winFonts = ['Segoe', 'Calibri', 'Consolas', 'Cambria', 'Tahoma', 'Bahnschrift', 'Candara'];
  const macFonts = [
    'SF ',
    'Helvetica',
    'Menlo',
    'Monaco',
    'Apple',
    'PingFang',
    'Hiragino',
    'Lucida Grande',
  ];
  const linuxFonts = ['Ubuntu', 'Cantarell', 'DejaVu', 'Liberation', 'Noto', 'Droid', 'FreeSans'];
  const cjkFonts = ['CJK', 'Hei', 'Ming', 'Gothic', 'Song', 'Nanum', 'Meiryo', 'PingFang'];
  const webFonts = [
    'Open Sans',
    'Lato',
    'Roboto',
    'Montserrat',
    'Source',
    'Fira',
    'Inter',
    'Poppins',
  ];

  if (winFonts.some((w) => font.includes(w))) {
    categories.windows.push(font);
  } else if (macFonts.some((m) => font.includes(m))) {
    categories.macos.push(font);
  } else if (linuxFonts.some((l) => font.includes(l))) {
    categories.linux.push(font);
  } else if (cjkFonts.some((c) => font.includes(c))) {
    categories.cjk.push(font);
  } else if (webFonts.some((w) => font.includes(w))) {
    categories.web.push(font);
  } else {
    categories.other.push(font);
  }
}

/**
 * Guesses the OS based on detected font patterns
 */
function guessOS(categories) {
  const { windows, macos, linux } = categories;

  if (windows.length > macos.length && windows.length > linux.length) {
    return windows.length > 10 ? 'Windows (High Confidence)' : 'Windows (Likely)';
  }
  if (macos.length > windows.length && macos.length > linux.length) {
    return macos.length > 10 ? 'macOS (High Confidence)' : 'macOS (Likely)';
  }
  if (linux.length > windows.length && linux.length > macos.length) {
    return linux.length > 5 ? 'Linux (High Confidence)' : 'Linux (Likely)';
  }

  return 'Unknown';
}
