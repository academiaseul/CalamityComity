#!/usr/bin/env bash
# Assembles pages from src/ + partials/ into their served paths, then
# generates single-file previews for review.
#
# Sources of truth: src/**/*.html and partials/*.html
# Never edit the assembled output — it is overwritten on every build.
set -euo pipefail

# Deploy mode. Skips the dark roster and the review previews entirely, so
# neither can reach a deployment even by accident. Vercel sets $VERCEL=1;
# --deploy forces it locally.
DEPLOY=0
[ "${1:-}" = "--deploy" ] && DEPLOY=1
[ -n "${VERCEL:-}" ] && DEPLOY=1

# Canonical host. Sources are authored against example.com; the build rewrites
# it. Vercel supplies VERCEL_URL for the deployment being built, so a preview
# self-references correctly instead of pointing at a domain that is not ours.
SITE_URL="${SITE_URL:-}"
if [ -z "$SITE_URL" ] && [ -n "${VERCEL_URL:-}" ]; then SITE_URL="https://$VERCEL_URL"; fi
SITE_URL="${SITE_URL:-https://example.com}"
SITE_URL="${SITE_URL%/}"
cd "$(dirname "$0")"

# src path : output path : locale
PAGES="
en/home.html:en/index.html:en
en/insights.html:en/insights/index.html:en
en/article.html:en/insights/delaware-structure/index.html:en
en/desk.html:en/insights/argentina-watch/index.html:en
en/topic.html:en/insights/topics/cross-border/index.html:en
en/search.html:en/search/index.html:en
en/capabilities.html:en/capabilities/index.html:en
en/practice.html:en/capabilities/legal/cross-border-structuring/index.html:en
en/advisory.html:en/capabilities/advisory/market-entry/index.html:en
en/industries.html:en/industries/index.html:en
en/industry.html:en/industries/energy/index.html:en
en/corridor.html:en/argentina-new-york/index.html:en
en/jur-ar.html:en/argentina-new-york/argentina/index.html:en
en/jur-us.html:en/argentina-new-york/united-states/index.html:en
en/j1.html:en/argentina-new-york/investing-in-argentina/index.html:en
en/j2.html:en/argentina-new-york/entering-the-united-states/index.html:en
en/j3.html:en/argentina-new-york/operating-in-argentina/index.html:en
es/home.html:es/index.html:es
es/insights.html:es/perspectivas/index.html:es
es/article.html:es/perspectivas/estructura-delaware/index.html:es
es/capabilities.html:es/servicios/index.html:es
es/practice.html:es/servicios/legal/estructuracion-transfronteriza/index.html:es
es/industries.html:es/industrias/index.html:es
es/industry.html:es/industrias/energia/index.html:es
es/corridor.html:es/argentina-nueva-york/index.html:es
es/jur-ar.html:es/argentina-nueva-york/argentina/index.html:es
es/jur-us.html:es/argentina-nueva-york/estados-unidos/index.html:es
es/j2.html:es/argentina-nueva-york/ingresar-a-estados-unidos/index.html:es
"

assemble () {
  local src="src/$1" out="$2" loc="$3"
  mkdir -p "$(dirname "$out")"
  awk -v mast="partials/masthead-$loc.html" -v foot="partials/footer-$loc.html" '
    /<!--@masthead-->/ { while ((getline line < mast) > 0) print line; close(mast); next }
    /<!--@footer-->/   { while ((getline line < foot) > 0) print line; close(foot); next }
    { print }
  ' "$src" > "$out"
  printf '  %-58s %s bytes\n' "$out" "$(wc -c < "$out")"
}

# Built but NOT published. Assembles outside the served tree: the roster is
# undisclosed by decision, and an unpublished page that is merely unlinked is
# still a published page. _dark/ is never deployed. (Phase 01 §11.2)
DARK_PAGES="
en/people.html:_dark/en/people/index.html:en
en/profile.html:_dark/en/people/record-c/index.html:en
"

echo "Assembling pages:"
echo "$PAGES" | while IFS=: read -r s o l; do
  [ -z "${s:-}" ] && continue
  assemble "$s" "$o" "$l"
done

if [ $DEPLOY -eq 1 ]; then
  echo "Deploy mode: dark pages and previews skipped."
  rm -rf _dark _preview
else
echo "Assembling dark pages (not deployed):"
echo "$DARK_PAGES" | while IFS=: read -r s o l; do
  [ -z "${s:-}" ] && continue
  assemble "$s" "$o" "$l"
done

fi

# Guard: nothing in the served tree may link to the dark roster. This is the
# build-query enforcement point from Phase 05 §04, made checkable.
echo "Checking served tree for roster leaks:"
LEAKS=$(grep -rl '/people/' en es 2>/dev/null || true)
if [ -n "$LEAKS" ]; then
  echo "  FAIL — served pages link to the dark roster:"; echo "$LEAKS"; exit 1
fi
echo "  ok — no served page references /people/"

# --- single-file previews -------------------------------------------------
if [ $DEPLOY -eq 0 ]; then
OUT=./_preview
mkdir -p "$OUT"
FONTS='<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,500;0,600;1,400&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;0,6..96,600;1,6..96,400&family=IBM+Plex+Mono:wght@400;500&display=swap">'

preview () {
  local src="$1" out="$2" title="$3"
  {
    printf '<title>%s</title>\n' "$title"
    printf '%s\n<style>\n' "$FONTS"
    cat assets/styles.css
    grep -q 'insights.css' "$src" && cat assets/insights.css
    grep -q 'capabilities.css' "$src" && cat assets/capabilities.css
    grep -q 'industries.css' "$src" && cat assets/industries.css
    grep -q 'people.css' "$src" && cat assets/people.css
    grep -q 'corridor.css' "$src" && cat assets/corridor.css
    grep -q 'journeys.css' "$src" && cat assets/journeys.css
    printf '\n</style>\n'
    sed -n '/<body>/,/<\/body>/p' "$src" | sed '1d;$d' | grep -v '<script src='
    printf '<script>\n'; cat assets/main.js; printf '\n</script>\n'
  } > "$out"
  printf '  %-30s %s bytes\n' "$(basename "$out")" "$(wc -c < "$out")"
}

echo "Building previews:"
preview en/index.html                                    "$OUT/homepage-en.html"     "Comity Homepage"
preview es/index.html                                 "$OUT/homepage-es.html"     "Comity Portada"
preview en/insights/index.html                           "$OUT/insights-en.html"     "Comity Insights"
preview es/perspectivas/index.html                    "$OUT/insights-es.html"     "Comity Perspectivas"
preview en/insights/delaware-structure/index.html        "$OUT/article-en.html"      "The Delaware Structure"
preview es/perspectivas/estructura-delaware/index.html "$OUT/article-es.html"     "La Estructura Delaware"
preview en/insights/argentina-watch/index.html           "$OUT/desk-en.html"         "Argentina Watch"
preview en/insights/topics/cross-border/index.html       "$OUT/topic-en.html"        "Cross-Border Insights"
preview en/search/index.html                             "$OUT/search-en.html"       "Comity Search"
preview en/capabilities/index.html                       "$OUT/capabilities-en.html" "Comity Capabilities"
preview en/capabilities/legal/cross-border-structuring/index.html "$OUT/practice-en.html" "Cross-Border Structuring"
preview en/capabilities/advisory/market-entry/index.html "$OUT/advisory-en.html"     "Market Entry Advisory"
preview es/servicios/index.html                       "$OUT/capabilities-es.html" "Comity Servicios"
preview es/servicios/legal/estructuracion-transfronteriza/index.html "$OUT/practice-es.html" "Estructuracion Transfronteriza"
preview en/industries/index.html                          "$OUT/industries-en.html"   "Comity Industries"
preview en/industries/energy/index.html                    "$OUT/industry-en.html"     "Argentine Energy"
preview es/industrias/index.html                        "$OUT/industries-es.html"   "Comity Industrias"
preview es/industrias/energia/index.html                "$OUT/industry-es.html"     "Energia Argentina"

preview _dark/en/people/index.html                      "$OUT/people-en.html"       "Comity People [DARK]"
preview _dark/en/people/record-c/index.html             "$OUT/profile-en.html"      "Comity Profile [DARK]"

preview en/argentina-new-york/index.html                   "$OUT/corridor-en.html"     "The Corridor"
preview en/argentina-new-york/argentina/index.html         "$OUT/jur-ar-en.html"       "Argentina Jurisdiction"
preview en/argentina-new-york/united-states/index.html     "$OUT/jur-us-en.html"       "United States Jurisdiction"
preview es/argentina-nueva-york/index.html              "$OUT/corridor-es.html"     "El Corredor"
preview es/argentina-nueva-york/argentina/index.html    "$OUT/jur-ar-es.html"       "Jurisdiccion Argentina"

preview en/argentina-new-york/investing-in-argentina/index.html      "$OUT/j1-en.html" "Investing in Argentina"
preview en/argentina-new-york/entering-the-united-states/index.html  "$OUT/j2-en.html" "Entering the United States"
preview en/argentina-new-york/operating-in-argentina/index.html      "$OUT/j3-en.html" "Operating in Argentina"
preview es/argentina-nueva-york/ingresar-a-estados-unidos/index.html "$OUT/j2-es.html" "Ingresar a Estados Unidos"

fi

echo "Generating site index:"
node gen-index.js

echo "Cache-busting assets:"
node bust.js

# --- canonical host rewrite ------------------------------------------------
if [ "$SITE_URL" != "https://example.com" ]; then
  find en es -name index.html -exec sed -i "s|https://example\.com|$SITE_URL|g" {} +
  echo "  rewrote canonical host → $SITE_URL"
fi

# --- crawl files ----------------------------------------------------------
cp src/root.html index.html
[ "$SITE_URL" != "https://example.com" ] && sed -i "s|https://example.com|$SITE_URL|g" index.html
printf '  %-58s %s bytes\n' "index.html (root negotiator)" "$(wc -c < index.html)"

TODAY=$(date +%Y-%m-%d)
emit_sitemap () {
  local loc="$1" out="sitemap-$1.xml"
  { echo '<?xml version="1.0" encoding="UTF-8"?>'
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'
    for p in $(find "$loc" -name index.html | sort); do
      u="${SITE_URL}/${p%index.html}"
      grep -q 'name="robots" content="noindex' "$p" && continue
      echo "  <url><loc>$u</loc><lastmod>$TODAY</lastmod>"
      grep -o 'hreflang="\(en\|es\)" href="[^"]*"' "$p" | while read -r h; do
        echo "    <xhtml:link rel=\"alternate\" $h />"
      done
      echo "  </url>"
    done
    echo '</urlset>'
  } > "$out"
  printf '  %-58s %s urls\n' "$out" "$(grep -c '<loc>' "$out")"
}
emit_sitemap en
emit_sitemap es

cat > sitemap.xml <<XML
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>$SITE_URL/sitemap-en.xml</loc><lastmod>$TODAY</lastmod></sitemap>
  <sitemap><loc>$SITE_URL/sitemap-es.xml</loc><lastmod>$TODAY</lastmod></sitemap>
</sitemapindex>
XML

cat > robots.txt <<TXT
# Comity
User-agent: *
Allow: /

# Search results carry no unique content.
Disallow: /en/search/
Disallow: /es/buscar/

Sitemap: $SITE_URL/sitemap.xml
TXT
printf '  %-58s\n' "sitemap.xml, robots.txt"
echo "Done."
