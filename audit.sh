#!/usr/bin/env bash
# Phase 13 — SEO / GEO / performance audit.
# Runs against the assembled served tree. Reports only; fixes nothing.
set -uo pipefail
cd "$(dirname "$0")"

PAGES=$(find en es -name index.html | sort)
FAIL=0
note () { printf '  %-8s %s\n' "$1" "$2"; }

echo "════════ 1 · INVENTORY ════════"
note "" "$(echo "$PAGES" | wc -l) served pages · $(find en -name index.html | wc -l) en · $(find es -name index.html | wc -l) es"
note "" "$(find _dark -name index.html 2>/dev/null | wc -l) dark pages (not deployed)"

echo
echo "════════ 2 · HEAD ELEMENTS ════════"
for p in $PAGES; do
  miss=""
  grep -q '<title>'                 "$p" || miss="$miss title"
  grep -q 'name="description"'      "$p" || miss="$miss description"
  grep -q 'rel="canonical"'         "$p" || miss="$miss canonical"
  grep -q 'hreflang="en"'           "$p" || miss="$miss hreflang-en"
  grep -q 'hreflang="es"'           "$p" || miss="$miss hreflang-es"
  grep -q '<meta charset'           "$p" || miss="$miss charset"
  grep -q 'name="viewport"'         "$p" || miss="$miss viewport"
  if [ -n "$miss" ]; then note "MISS" "$p →$miss"; FAIL=1; fi
done
[ $FAIL -eq 0 ] && note "ok" "all pages carry title, description, canonical, both hreflang, charset, viewport"

echo
echo "════════ 3 · HREFLANG RECIPROCITY ════════"
bad=0
for p in $PAGES; do
  for tgt in $(grep -o 'hreflang="\(en\|es\)" href="https://example.com/[^"]*"' "$p" | sed 's|.*example.com/||; s|"$||'); do
    f="${tgt%/}/index.html"; [ "$tgt" = "/" ] && f="index.html"
    [ -f "$f" ] || { note "DANGL" "$p → /$tgt"; bad=$((bad+1)); }
  done
done
[ $bad -eq 0 ] && note "ok" "every hreflang target exists" || { note "" "$bad dangling hreflang targets"; FAIL=1; }

echo
echo "════════ 4 · CANONICAL ↔ PATH ════════"
bad=0
for p in $PAGES; do
  c=$(grep -o 'rel="canonical" href="https://example.com/[^"]*"' "$p" | sed 's|.*example.com/||; s|"$||')
  exp="${p%index.html}"
  [ "$c" = "$exp" ] || { note "MISM" "$p declares /$c"; bad=$((bad+1)); }
done
[ $bad -eq 0 ] && note "ok" "every canonical matches its served path" || FAIL=1

echo
echo "════════ 5 · HEADINGS ════════"
bad=0
for p in $PAGES; do
  n=$(grep -c '<h1' "$p")
  [ "$n" -eq 1 ] || { note "H1×$n" "$p"; bad=$((bad+1)); }
done
[ $bad -eq 0 ] && note "ok" "exactly one h1 per page" || FAIL=1

echo
echo "════════ 6 · DUPLICATE TITLES / DESCRIPTIONS ════════"
dt=$( { for p in $(find en -name index.html); do grep -o "<title>[^<]*" "$p" | head -1; done | sort | uniq -d; for p in $(find es -name index.html); do grep -o "<title>[^<]*" "$p" | head -1; done | sort | uniq -d; } | wc -l)
dd=$(for p in $PAGES; do grep -o 'name="description" content="[^"]*' "$p" | head -1; done | sort | uniq -d | wc -l)
note "$([ "$dt" -eq 0 ] && echo ok || echo DUP)" "$dt duplicate titles"
note "$([ "$dd" -eq 0 ] && echo ok || echo DUP)" "$dd duplicate descriptions"
[ "$dt" -gt 0 ] || [ "$dd" -gt 0 ] && FAIL=1

echo
echo "════════ 7 · INTERNAL LINK INTEGRITY ════════"
tmp=$(mktemp)
for p in $PAGES; do
  grep -o 'href="/[^"#]*"' "$p" | sed 's|href="||; s|"$||' >> "$tmp"
done
sort -u "$tmp" -o "$tmp"
tot=0; broke=0
while read -r u; do
  tot=$((tot+1))
  f="${u#/}"; f="${f%/}/index.html"
  case "$u" in */assets/*) continue;; esac
  [ -f "$f" ] || { echo "$u" >> /tmp/broken.txt; broke=$((broke+1)); }
done < "$tmp"
note "" "$tot unique internal targets · $broke not yet built"
if [ -s /tmp/broken.txt ]; then
  echo "  ── top unbuilt sections ──"
  cut -d/ -f2-4 /tmp/broken.txt | sort | uniq -c | sort -rn | head -14 | sed "s|^|      |"
fi

echo
echo "════════ 8 · STRUCTURED DATA ════════"
note "" "pages with JSON-LD: $(grep -l 'application/ld+json' $PAGES | wc -l) / $(echo "$PAGES" | wc -l)"
note "" "LegalService on: $(grep -l '"LegalService"' $PAGES | tr '\n' ' ')"
note "" "Service (advisory) on: $(grep -l '"@type": "Service"' $PAGES | tr '\n' ' ')"
lv=$(grep -l '"LegalService"' $PAGES | grep -c advisory || true)
note "$([ "$lv" -eq 0 ] && echo ok || echo FAIL)" "LegalService absent from advisory pages"
pv=$(grep -l '"Person"' $PAGES 2>/dev/null | wc -l)
note "$([ "$pv" -eq 0 ] && echo ok || echo FAIL)" "no Person schema emitted while roster is dark"

echo
echo "════════ 9 · WEIGHT ════════"
css=$(cat assets/*.css | wc -c)
js=$(wc -c < assets/main.js)
avg=$(( $(cat $PAGES | wc -c) / $(echo "$PAGES" | wc -l) ))
biggest=$(ls -S $PAGES | head -1)
note "" "avg page HTML: $((avg/1024)) KB · largest: $biggest ($(( $(wc -c < "$biggest") /1024 )) KB)"
note "" "all CSS: $((css/1024)) KB uncompressed · JS: $js bytes"
note "" "images: $(grep -ho '<img' $PAGES | wc -l) · render-blocking scripts: $(grep -ho '<script src=[^d]*>' $PAGES | wc -l)"

echo
echo "════════ 10 · ACCESSIBILITY ════════"
bad=0
for p in $PAGES; do
  grep -q 'class="skip"' "$p" || { note "MISS" "$p no skip link"; bad=$((bad+1)); }
  grep -q '<main' "$p"        || { note "MISS" "$p no main landmark"; bad=$((bad+1)); }
  grep -q '<html lang='       "$p" || { note "MISS" "$p no lang"; bad=$((bad+1)); }
done
[ $bad -eq 0 ] && note "ok" "skip link, main landmark and lang on every page"
note "" "aria-expanded on nav triggers: $(grep -ho 'aria-expanded' en/index.html | wc -l) per page"
note "" "prefers-reduced-motion honoured: $(grep -c 'prefers-reduced-motion' assets/styles.css)"

echo
echo "════════ 11 · UNVERIFIED CONTENT ════════"
note "" "[VERIFY] markers across served pages: $(grep -ho 'class="verify"' $PAGES | wc -l)"
note "" "draft articles linked: $(grep -ho 'data-state="draft"' $PAGES | wc -l)"
note "" "pages carrying draft content: $(grep -l 'data-state="draft"' $PAGES | wc -l)"

echo
echo "════════ 12 · CRAWL FILES ════════"
for f in robots.txt sitemap.xml sitemap-en.xml sitemap-es.xml; do
  [ -f "$f" ] && note "ok" "$f" || { note "MISS" "$f"; FAIL=1; }
done

echo
echo "════════ 13 · ASSET REFERENCES ════════"
bad=0
for p in $PAGES; do
  if grep -qE '(href|src)="(\.\./)*assets/' "$p"; then
    note "REL" "$p uses a relative asset path"
    bad=$((bad+1)); FAIL=1
  fi
done
[ $bad -eq 0 ] && note "ok" "all asset references are root-absolute"

missing=0
for u in $(grep -hoE '(href|src)="/assets/[^"]*"' $PAGES | sed -E 's/.*="//; s/"$//' | sort -u); do
  if [ ! -f ".$u" ]; then note "404" "$u referenced but absent"; missing=1; FAIL=1; fi
done
[ $missing -eq 0 ] && note "ok" "every referenced asset exists on disk"

echo
echo "════════════════════════════════════"
[ $FAIL -eq 0 ] && echo "  AUDIT PASSED" || echo "  AUDIT: findings above"
rm -f "$tmp" /tmp/broken.txt
