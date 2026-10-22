# Plán optimalizací raytraceru

Podklad pro další práci (i pro Clauda). Spuštění: „přečti `PLAN.md` a pokračuj dalším bodem“.

## Pravidla práce

- Komunikace česky.
- **Jeden bod = jeden commit.** Commituje uživatel sám. Po dokončení bodu se zastav, vypiš výsledky
  a navrhni commit zprávu (bez diakritiky, ve stylu `cubemap: pixely obrazku se ctou jednou do pole`).
  Sám necommituj.
- Před začátkem bodu zkontroluj `git status`: předchozí bod musí být commitnutý, aby se změny nemíchaly.
- Styl kódu: taby, `let`, soukromé členy `private _nazev`, komentáře česky **bez diakritiky**,
  hustota komentářů jako v okolním kódu.
- Po každé změně: `npm run typecheck`, `npm run build`, měření (viz níže).
- Optimalizace (body 4–6) **nesmí změnit obraz**. Ověřuj porovnáním pixelů proti stavu před změnou.
  Kde se změní pořadí výpočtů s plovoucí čárkou (bod 5), je přípustná odchylka 1–2 v hodnotě kanálu
  u zlomku pixelů. Větší rozdíl je chyba.
- Výsledky hlas poctivě, i když zrychlení nevyjde (bod 2 nezrychlil nic a bylo to tak řečeno).

## Stav projektu

- Webpack 5, TypeScript 7 (`tsc --noEmit` kontroluje typy, webpack překládá přes `esbuild-loader`).
- Render běží ve Web Workerech:
  - `src/render.ts`: řízení v hlavním vlákně. Spustí workery, rozdělí obraz na pruhy po 8 řádcích a vykresluje hotové pruhy.
  - `src/render.worker.ts`: worker; zprávy jsou popsané v `src/messages.ts`.
  - `src/scene.ts`: popis scény jako obyčejná data a `createRaytracer()`, který si v každém workeru
    sám načte PLY a postaví geometrii a BVH.
  - `src/raytracer.ts`: výpočet paprsků (Phong, sklo podle Fresnela, odrazy okolí, stíny).
  - Scéna je v plochých polích (od bodu 5a): `src/mesh.ts` (`Float64Array` vrcholů a normál vrcholů po 9
    číslech a normál ploch po 3 číslech na trojúhelník), `src/bvh.ts` (`_bounds` 6 čísel na uzel,
    `_items` 2 čísla na uzel: list `(first, count)`, vnitřní uzel `(left, -1)`). `Geometry` postaví `Mesh`
    z PLY, `BVH` ho při stavbě přeřadí tak, aby listy měly souvislé úseky trojúhelníků.
  - Cubemapa (6× 2048², ~96 MB) se dekóduje jednou v hlavním vlákně a sdílí se přes `SharedArrayBuffer`.
    Vyžaduje to hlavičky COOP/COEP. Dev server je posílá, pro produkci viz README.
- URL parametry: `?phong=0` zapne průhledný materiál, `?threads=N` nastaví počet workerů (výchozí min(jádra, 4)).

### Hotové body

| bod | co | Phong | Sklo |
|---|---|---|---|
| výchozí stav | | 2,68 s render + 1,1 s příprava | 10,76 s + 1,1 s |
| 2 | kreslení přes jeden `ImageData` | beze změny | beze změny |
| 3 | cubemapa jako pole pixelů | 1,70 s + 1,1 s | 8,87 s + 1,1 s |
| 1 | Web Workery (4) | **1,96 s celkem** | **3,85 s celkem** |
| 4 | průchod BVH (ořezávání, bližší potomek napřed, anyHit stínů, zásobník) | paprsky −36 % | paprsky −27 % |
| 5a | plochá pole, Möller–Trumbore, méně alokací | 1,05 → 0,57 s celkem | 1,75 → 0,73 s celkem |

Měřeno v 320×240 na 16vláknovém stroji. Doma budou čísla jiná, porovnávej jen relativně
na stejném stroji (nejdřív si změř výchozí stav pro aktuální `HEAD`).

Bod 4 měřen na jiném stroji (20 vláken, 4 workery): Phong 1,13 → 1,06 s celkem (paprsky 0,28 → 0,18 s),
sklo 2,27 → 1,95 s (paprsky 1,42 → 1,04 s). Obraz pixelově shodný. Počty testů (Phong, 320×240):
boxy 7,2 M → 5,3 M, trojúhelníky 2,9 M → 1,9 M. Vlastní zásobník místo rekurze přidal jen ~3–5 %.

Bod 5a (stejný stroj jako bod 4): Phong paprsky 0,18 → 0,05 s, příprava ve workerech 0,8 → 0,43 s;
sklo paprsky 0,86 → 0,22 s. Plochá pole samotná obraz nemění (ověřeno doslovným přepisem starého průsečíku),
Möller–Trumbore mění 0,4–0,5 % pixelů o 1. Přepis stínování (`_shade`, `_lighting`) na skaláry se nedělal,
bere už jen ~5–8 % času. Pozn.: harness v Node (bez cubemapy) ukáže rozdíly menší než prohlížeč, protože
drobné odchylky směru se projeví až s barvou okolí.

Po bodu 1 je úzkým hrdlem **příprava scény ve workerech** (~1,8 s): každý worker parsuje
PLY a staví BVH sám a souběžné stavby se brzdí. Proto víc než 4 workery zpomalují
(16 workerů: Phong 4,45 s). Samotné počítání paprsků je už rychlé (Phong 0,3 s, sklo 1,5 s při 8 workerech).

## Měření

Nástroje jsou v `tools/bench/`. Potřebují Node 22+, Chrome (cestu jde změnit přes `CHROME=...`) a bash.

```bash
# vychozi stav (commit) a pracovni adresar
tools/bench/bench.sh pred HEAD
tools/bench/bench.sh po

# porovnani pixelu (vystupy jsou v /tmp/rt-bench, zmena pres OUT=...)
node tools/bench/compare.mjs /tmp/rt-bench/pred-phong.bin /tmp/rt-bench/po-phong.bin
node tools/bench/compare.mjs /tmp/rt-bench/pred-glass.bin /tmp/rt-bench/po-glass.bin
```

- `bench.sh` udělá kopii projektu a v ní přes `instrument.mjs` zvětší obraz na 320×240 (`SIZE="640 480"`
  pro jiné rozlišení) a doplní měření. Pak postaví produkční build, pustí ho přes `serve.mjs`
  (s COOP/COEP) a spustí Chrome přes DevTools protokol (`cdp.mjs`), 3 běhy (`RUNS=N`).
- Výstup: `render` (čas `render.render()`, od bodu 1 včetně přípravy scény ve workerech),
  `priprava` (čas do zavolání renderu) a `celkem`. Porovnávej `celkem`.
- `QUERY="threads=8"` přidá URL parametry (např. pro porovnání počtu workerů).
- `LOGS=1` vypíše i časy z konzole stránky („Pre render time“, „Render time“), užitečné pro rozpad času.
- `node tools/bench/devcheck.mjs http://localhost:8004/` ověří běžící `npm start` (projde render, `crossOriginIsolated`).
- `instrument.mjs` hledá v `src/main.ts` řádky `width: 320 * 0.5,`, `height: 240 * 0.5,`
  a `await render.render();`. Když se `main.ts` změní, uprav i ji.

## Zbývající body

### Bod 5: méně alokací, ploché pole dat, sdílená scéna

Bod 5a je hotový (viz výše), zbývá 5b.

**5b: scéna se postaví jednou a sdílí**
- S plochými poli jde PLY parse + geometrii + BVH udělat **jednou** (v hlavním vlákně nebo v prvním workeru)
  a pole předat ostatním workerům přes `SharedArrayBuffer` (stejně jako cubemapu v `src/cubemap.ts`).
  Sdílí se pole `Mesh` (`vertices`, `normals`, `faceNormals`) a BVH (`_bounds`, `_items`). BVH potřebuje
  druhý způsob vzniku z hotových polí (bez stavby), zásobník pro průchod (`_stack`) si každý worker alokuje sám.
- Tím zmizí ~1,8 s přípravy v každém workeru i ~60 MB paměti na worker. Pak zvedni výchozí
  `threadsCount` v `src/render.ts` (dnes min(jádra, 4), komentář vysvětluje proč) a změř 4/8/16 workerů
  (`QUERY="threads=8" tools/bench/bench.sh ...`).
- Bez COOP/COEP (`crossOriginIsolated == false`) se pole zkopírují. Zachovej stejné chování jako u cubemapy (varování v konzoli).

### Bod 6: stavba BVH

Soubory: `src/bvh.ts`, `src/math.ts` (`sortTriangles`).
- `sortTriangles` (quicksort s prvním prvkem jako pivotem) řadí pole indexů a při **každém porovnání**
  počítá těžiště přes `triangleCentroid` (bez alokace od bodu 5a, ale 4× min/max). Těžiště spočítat jednou předem do pole.
- Každý uzel se celý řadí, přitom stačí rozdělit podle mediánu (quickselect / nth_element): O(n log n) místo O(n log² n).
- Pozor: quicksort s prvním pivotem je na už seřazeném vstupu kvadratický.
- Volitelně SAH (surface area heuristic) místo dělení v půlce: lepší strom, rychlejší průchod.
  Obraz by měl zůstat stejný, změní se jen strom.
- Měř hlavně přípravu (`LOGS=1` → „Pre render time“). Ta bude po bodu 5b jen jednou, takže zrychlení
  bodu 6 je pak vidět přímo na celkovém čase.

### Bod 7: antialiasing

Není to optimalizace, ale kvalita: při 160×120 odrazy okolí jiskří (jeden vzorek na pixel).
- Supersampling N×N vzorků na pixel s jitterem, jako v C++ originálu (`src/cpp/render.cpp`, parametr `aa`).
  Ten navíc pro pixely, kde pomocný paprsek trefí jen pozadí, další vzorky přeskakuje.
- Generování paprsků už bere spojité souřadnice: `Camera.generateRay(x + 0.5, y + 0.5)` v `Raytracer.renderTile`.
- Přidat volbu do `RaytracerOptions` a URL parametr `?aa=N`.
- **Obraz se tady mění záměrně**, porovnání pixelů neplatí. Výsledek zkontroluj vizuálně (screenshot,
  viz `devcheck.mjs` nebo `google-chrome --headless=new --screenshot`).

## Další nápady mimo optimalizace (neprobrané s uživatelem, jen navrhnout)

- **Materiál skla:** výchozí `Material` má difuzní složku 0.5 a odrazivost 0.8 se násobí i do propuštěného
  světla, takže sklo vychází tmavé a lom moc není vidět. Chtělo by to samostatný materiál pro sklo
  (malá difuze, bez útlumu na průchodu, případně absorpce podle vzdálenosti).
- Ambientní složka světel je nulová (`Light._ambiente`), stíny jsou úplně černé.
- `less/main.less`: canvas má `min-width: 1280px`, takže se malý obraz rozmaže. Zvážit `image-rendering: pixelated`.
- PLY parser umí jen ASCII (binární formát hlásí chybou).
- `npm audit` hlásí `braces` uvnitř `webpack-dev-server` (jen vývojová závislost, oprava zatím jen downgradem).
- npm blokuje `postinstall` balíku `esbuild`. Nevadí to, binárka přichází jako volitelná závislost.
