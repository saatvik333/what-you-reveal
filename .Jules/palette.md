## 2026-01-11 - Retro CRT Reduced Motion
**Learning:** CRT interfaces often rely on JS-driven delays (boot sequences, typing) that CSS media queries alone cannot disable.
**Action:** Always pair `prefers-reduced-motion` CSS overrides with a JS check to bypass artificial delays and typing animations.
