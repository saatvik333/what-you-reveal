/**
 * Font Fingerprinting Module
 * Detects installed fonts to infer OS and calculate entropy
 * 
 * Capability: Checks for 450+ fonts including Nerd Fonts and System Fonts
 */

/**
 * Massive font list for deep fingerprinting
 */
const FONT_LIST = [
  // --- 1. Windows Base System Fonts ---
  'Arial', 'Arial Black', 'Arial Narrow', 'Bahnschrift', 'Calibri', 'Cambria', 'Cambria Math', 'Candara',
  'Comic Sans MS', 'Consolas', 'Constantia', 'Corbel', 'Courier New', 'Ebrima', 'Franklin Gothic Medium',
  'Gabriola', 'Gadugi', 'Georgia', 'HoloLens MDL2 Assets', 'Impact', 'Ink Free', 'Javanese Text',
  'Leelawadee UI', 'Lucida Console', 'Lucida Sans Unicode', 'Malgun Gothic', 'Marlett', 'Microsoft Himalaya',
  'Microsoft JhengHei', 'Microsoft New Tai Lue', 'Microsoft PhagsPa', 'Microsoft Sans Serif', 'Microsoft Tai Le',
  'Microsoft YaHei', 'Microsoft Yi Baiti', 'MingLiU-ExtB', 'Mongolian Baiti', 'MS Gothic', 'MS PGothic',
  'MS UI Gothic', 'MV Boli', 'Myanmar Text', 'Nirmala UI', 'Palatino Linotype', 'Segoe MDL2 Assets',
  'Segoe Print', 'Segoe Script', 'Segoe UI', 'Segoe UI Emoji', 'Segoe UI Historic', 'Segoe UI Symbol',
  'SimSun', 'Sitka', 'Sylfaen', 'Symbol', 'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana',
  'Webdings', 'Wingdings', 'Yu Gothic', 'Yu Gothic UI',

  // --- 2. Windows Extended/Office/Legacy ---
  'Agency FB', 'Algerian', 'Book Antiqua', 'Arial Rounded MT Bold', 'Baskerville Old Face', 'Bauhaus 93',
  'Bell MT', 'Berlin Sans FB', 'Bernard MT Condensed', 'Blackadder ITC', 'Bodoni MT', 'Bookman Old Style',
  'Bradley Hand ITC', 'Britannic Bold', 'Broadway', 'Brush Script MT', 'Californian FB', 'Centaur', 
  'Century Gothic', 'Chiller', 'Colonna MT', 'Cooper Black', 'Copperplate Gothic Bold', 'Curlz MT',
  'Dubai', 'Dubai Medium', 'Edwardian Script ITC', 'Elephant', 'Engravers MT', 'Eras Bold ITC', 
  'Felix Titling', 'Footlight MT Light', 'Forte', 'Franklin Gothic Heavy', 'Freestyle Script', 
  'French Script MT', 'Garamond', 'Gigi', 'Gill Sans MT', 'Gloucester MT Extra Condensed', 'Goudy Old Style',
  'Haettenschweiler', 'Harlow Solid Italic', 'Harrington', 'High Tower Text', 'Imprint MT Shadow', 
  'Informal Roman', 'Jokerman', 'Juice ITC', 'Kristen ITC', 'Kunstler Script', 'Lucida Bright', 
  'Lucida Calligraphy', 'Lucida Fax', 'Lucida Handwriting', 'Magneto', 'Maiandra GD', 'Matura MT Script Capitals',
  'Mistral', 'Modern No. 20', 'Monotype Corsiva', 'Niagara Engraved', 'Niagara Solid', 'OCR A Extended', 
  'Old English Text MT', 'Onyx', 'Palace Script MT', 'Papyrus', 'Parchment', 'Perpetua', 
  'Perpetua Titling MT', 'Playbill', 'Poor Richard', 'Pristina', 'Rage Italic', 'Ravie', 'Rockwell', 
  'Rockwell Condensed', 'Script MT Bold', 'Showcard Gothic', 'Snap ITC', 'Stencil', 'Tempus Sans ITC', 
  'Viner Hand ITC', 'Vivaldi', 'Vladimir Script', 'Wide Latin',

  // --- 3. macOS System Fonts ---
  'SF Pro', 'SF Pro Display', 'SF Pro Text', 'SF Compact', 'SF Mono', 'New York', 'Helvetica',
  'Helvetica Neue', 'Apple Color Emoji', 'Apple SD Gothic Neo', 'Apple Symbols', 'Avenir', 'Avenir Next',
  'Avenir Next Condensed', 'Baskerville', 'Big Caslon', 'Bodoni 72', 'Charter', 'Cochin', 'Copperplate',
  'DIN Alternate', 'DIN Condensed', 'Futura', 'Geneva', 'Gill Sans', 'Hoefler Text', 'Lucida Grande',
  'Marker Felt', 'Menlo', 'Monaco', 'Noteworthy', 'Optima', 'Palatino', 'Papyrus', 'Phosphate',
  'Savoye LET', 'SignPainter', 'Skia', 'Snell Roundhand', 'STHeiti', 'Superclarendon',
  'Thonburi', 'Trattatello', 'Zapfino', 'PingFang SC', 'PingFang TC', 'PingFang HK', 'Hiragino Sans',
  'Hiragino Kaku Gothic ProN', 'Chalkboard', 'Chalkboard SE', 'Apple Chancery', 'Bradley Hand', 
  'Brush Script MT', 'Chalkduster', 'Didot', 'American Typewriter', 'Andale Mono', 'Arial Hebrew', 
  'Ayuthaya', 'Bangla MN', 'Baoli SC', 'BiauKai', 'Corsiva Hebrew', 'Devanagari MT', 'Euphemia UCAS', 
  'Geeza Pro', 'Gujarati MT', 'Gurmukhi MT', 'Heiti SC', 'Heiti TC', 'Kannada MN', 'Kannada MN', 
  'Khmer MN', 'Lao MN', 'Malayalam MN', 'Myanmar MN', 'Oriya MN', 'Sinhala MN', 'Tamil MN', 'Telugu MN',

  // --- 4. Linux / Open Source Fonts ---
  'Ubuntu', 'Ubuntu Mono', 'Ubuntu Condensed', 'Cantarell', 'DejaVu Sans', 'DejaVu Sans Mono',
  'DejaVu Serif', 'Liberation Sans', 'Liberation Serif', 'Liberation Mono', 'Noto Sans', 'Noto Serif',
  'Noto Mono', 'Noto Color Emoji', 'Droid Sans', 'Droid Sans Mono', 'Droid Serif', 'Roboto',
  'Roboto Mono', 'Roboto Condensed', 'Roboto Slab', 'FreeSans', 'FreeSerif', 'FreeMono', 'Nimbus Sans',
  'Nimbus Roman', 'Nimbus Mono', 'URW Gothic', 'URW Bookman', 'Bitstream Vera Sans', 'Bitstream Vera Serif', 
  'Bitstream Vera Sans Mono', 'Luxi Sans', 'Luxi Serif', 'Luxi Mono', 'Gargi', 'Jamrul', 'Lohit Bengali',
  'Lohit Gujarati', 'Lohit Hindi', 'Lohit Punjabi', 'Lohit Tamil', 'Meera', 'Nakula', 'Norasi', 
  'OpenSymbol', 'Padauk', 'Purisa', 'Rasa', 'Saab', 'Samyak Devanagari', 'Sarai', 'Tlwg Typo', 
  'Umpush', 'Vemana2000', 'Waree',

  // --- 5. Nerd Fonts (Developer/Power User) ---
  'Fira Code Nerd Font', 'FiraCode Nerd Font', 'FiraCode NF', // Variations
  'Hack Nerd Font', 'Hack NF',
  'JetBrains Mono Nerd Font', 'JetBrainsMono Nerd Font', 'JetBrainsMono NF',
  'MesloLGS NF', 'Meslo LG M', 'Meslo LG S', 'Meslo LG L',
  'SauceCodePro Nerd Font', 'Source Code Pro Nerd Font',
  'RobotoMono Nerd Font', 'Roboto Mono Nerd Font',
  'UbuntuMono Nerd Font', 'Ubuntu Mono Nerd Font',
  'DejaVuSansMono Nerd Font', 'DejaVu Sans Mono Nerd Font', 
  'DroidSansMono Nerd Font', 'Droid Sans Mono Nerd Font',
  'Inconsolata Nerd Font', 'Inconsolata NF',
  'Iosevka Nerd Font', 'Iosevka NF',
  'Mononoki Nerd Font', 'Mononoki NF',
  'Terminess Nerd Font', 'Terminus Nerd Font',
  'BigBlueTerminal Nerd Font', 'BigBlue_Terminal_437TT Nerd Font',
  'CaskaydiaCove Nerd Font', 'Cascadia Code Nerd Font',
  'CodeNewRoman Nerd Font', 'Code New Roman Nerd Font',
  'Cousine Nerd Font',
  'DaddyTimeMono Nerd Font',
  'FantasqueSansMono Nerd Font',
  'GoMono Nerd Font',
  'GohuFont Nerd Font',
  'Hasklug Nerd Font', 'Hasklig Nerd Font',
  'HeavyData Nerd Font',
  'Hurmit Nerd Font', 'Hermit Nerd Font',
  'Lekton Nerd Font',
  'ProFont Nerd Font',
  'ProggyClean Nerd Font',
  'SpaceMono Nerd Font', 'Space Mono Nerd Font',
  'Symbols Nerd Font',

  // --- 6. Common Web/Designer Fonts ---
  'Open Sans', 'Lato', 'Montserrat', 'Source Sans Pro', 'Source Code Pro', 'Fira Code', 'Fira Sans',
  'Fira Mono', 'JetBrains Mono', 'Cascadia Code', 'IBM Plex Sans', 'IBM Plex Mono', 'Inter', 'Nunito',
  'Poppins', 'Raleway', 'Work Sans', 'PT Sans', 'PT Serif', 'PT Mono', 'Overpass', 
  'Inconsolata', 'Hack', 'Monoid', 'Fantasque Sans Mono',
  'Lobster', 'Pacifico', 'Oswald', 'Roboto Condensed', 'Merriweather', 'Playfair Display', 
  'Lora', 'Muli', 'Titillium Web', 'Varela Round', 'Comfortaa', 'Righteous', 'Fredoka One',

  // --- 7. CJK & International ---
  'Noto Sans CJK SC', 'Noto Sans CJK TC', 'Noto Sans CJK JP', 'Noto Sans CJK KR', 'Noto Serif CJK',
  'Source Han Sans', 'Source Han Serif', 'WenQuanYi Micro Hei', 'WenQuanYi Zen Hei', 'AR PL UMing',
  'Meiryo', 'Meiryo UI', 'Yu Mincho', 'HGGothicE', 'HGMaruGothicMPRO', 'Malgun Gothic Semilight',
  'Batang', 'Dotum', 'Gulim', 'NanumGothic', 'NanumMyeongjo', 'SimHei', 'KaiTi', 'FangSong'
];

export async function collectFontData() {
  const detected = [];
  const detectedSet = new Set(); // For faster lookups
  const byCategory = {
    windows: [],
    macos: [],
    linux: [],
    android: [], 
    nerd: [],
    web: [],
    cjk: [],
    other: [],
  };

  if (document.fonts && document.fonts.check) {
    for (const font of FONT_LIST) {
      // De-duplicate checks if list implies overlaps
      if (detectedSet.has(font)) continue;
      
      try {
        if (document.fonts.check(`12px "${font}"`)) {
          detected.push(font);
          detectedSet.add(font);
          categorizeFont(font, byCategory);
        }
      } catch (e) { /* ignore */ }
    }
  }

  const data = {};

  data['Detected Fonts Count'] = {
      value: detected.length,
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet/check'
  };

  data['Font Entropy'] = {
      value: detected.length > 80 ? 'High' : detected.length > 30 ? 'Medium' : 'Low',
      warning: detected.length > 80,
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet'
  };

  if (byCategory.nerd.length > 0) {
      data['Nerd Fonts Installed'] = { 
          value: 'Yes (' + byCategory.nerd.length + ' detected)',
          warning: true, // Identifying trait
          url: 'https://www.nerdfonts.com/'
      };
  }

  // Specific Counts
  if (byCategory.windows.length > 0) data['Windows Fonts'] = { value: byCategory.windows.length + ' detected' };
  if (byCategory.macos.length > 0) data['macOS Fonts'] = { value: byCategory.macos.length + ' detected' };
  if (byCategory.linux.length > 0) data['Linux Fonts'] = { value: byCategory.linux.length + ' detected' };
  
  data['Installed Fonts'] = {
      value: detected.length > 0 ? detected.join(', ') : 'None detected (Blocked?)',
      warning: detected.length === 0
  };

  return data;
}

function categorizeFont(font, categories) {
  const lower = font.toLowerCase();
  
  if (lower.includes('nerd') || lower.includes(' nf') || lower.includes('powerline')) {
      categories.nerd.push(font);
      // Nerd fonts usually imply developer/linux/mac, but we count them separately
      return; 
  }

  const winFonts = ['segoe', 'calibri', 'consolas', 'cambria', 'tahoma', 'bahnschrift', 'candara', 'ms ', 'microsoft', 'palatino linotype', 'agency', 'algerian', 'bauhaus', 'bodoni', 'bookman', 'bradley', 'britannic', 'broadway', 'brush script', 'californian', 'centaur', 'chiller', 'colonna', 'cooper', 'copperplate', 'curlz', 'dubai', 'edwardian', 'elephant', 'engravers', 'eras', 'felix', 'footlight', 'forte', 'franklin', 'freestyle', 'french', 'garamond', 'gigi', 'gill', 'gloucester', 'goudy', 'haettenschweiler', 'harlow', 'harrington', 'high tower', 'imprint', 'informal', 'jokerman', 'juice', 'kristen', 'kunstler', 'lucida', 'magneto', 'maiandra', 'matura', 'mistral', 'modern', 'monotype', 'niagara', 'ocr', 'old english', 'onyx', 'palace', 'papyrus', 'parchment', 'perpetua', 'playbill', 'poor', 'pristina', 'rage', 'ravie', 'rockwell', 'script', 'showcard', 'snap', 'stencil', 'tempus', 'viner', 'vivaldi', 'vladimir', 'wide latin'];
  const macFonts = ['sf ', 'helvetica', 'menlo', 'monaco', 'apple', 'pingfang', 'hiragino', 'geneva', 'chalkboard', 'didot', 'american typewriter', 'andale', 'ayuthaya', 'bangla', 'baoli', 'biaukai', 'corsiva', 'devanagari', 'euphemia', 'geeza', 'gujarati', 'gurmukhi', 'heiti', 'kannada', 'khmer', 'lao', 'malayalam', 'myanmar', 'oriya', 'sinhala', 'tamil', 'telugu'];
  const linuxFonts = ['ubuntu', 'cantarell', 'dejavu', 'liberation', 'noto', 'droid', 'freesans', 'nimbus', 'urw', 'bitstream', 'luxi', 'gargi', 'jamrul', 'lohit', 'meera', 'nakula', 'norasi', 'opensymbol', 'padauk', 'purisa', 'rasa', 'saab', 'samyak', 'sarai', 'tlwg', 'umpush', 'vemana', 'waree'];
  const androidFonts = ['roboto', 'droid sans', 'noto sans']; 
  const webFonts = ['open sans', 'lato', 'montserrat', 'source', 'fira', 'inter', 'poppins', 'raleway', 'merriweather', 'playfair', 'lora', 'muli', 'titillium', 'varela', 'comfortaa', 'righteous', 'fredoka'];

  if (winFonts.some(w => lower.includes(w))) categories.windows.push(font);
  else if (macFonts.some(m => lower.includes(m))) categories.macos.push(font);
  else if (linuxFonts.some(l => lower.includes(l))) categories.linux.push(font);
  else if (androidFonts.some(a => lower.includes(a))) categories.android.push(font);
  else if (webFonts.some(w => lower.includes(w))) categories.web.push(font);
  else categories.other.push(font);
}
