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
  - `src/scene.ts`: popis scény jako obyčejná data, `buildScene()` (načte PLY, postaví geometrii a BVH,
    běží jednou v prvním workeru, zpráva `build`) a `createRaytracer()` nad hotovými daty (`BVHData`, zpráva `init`).
    Pole scény jsou při cross-origin isolation ve `SharedArrayBuffer` (`src/shared.ts`), jinak se kopírují.
  - `src/raytracer.ts`: výpočet paprsků (Phong, sklo podle Fresnela, odrazy okolí, stíny).
  - Scéna je v plochých polích (od bodu 5a): `src/mesh.ts` (`Float64Array` vrcholů a normál vrcholů po 9
    číslech a normál ploch po 3 číslech na trojúhelník), `src/bvh.ts` (`_bounds` 6 čísel na uzel,
    `_items` 2 čísla na uzel: list `(first, count)`, vnitřní uzel `(left, -1)`). `Geometry` postaví `Mesh`
    z PLY, `BVH` ho při stavbě přeřadí tak, aby listy měly souvislé úseky trojúhelníků.
    Stavba (`BVHBuilder`) dělí uzly podle binned SAH v ose s největším rozsahem těžišť (od bodu 6).
  - Cubemapa (6× 2048², ~96 MB) se dekóduje jednou v hlavním vlákně a sdílí se přes `SharedArrayBuffer`.
    Vyžaduje to hlavičky COOP/COEP. Dev server je posílá, pro produkci viz README.
- URL parametry: `?phong=0` zapne průhledný materiál, `?threads=N` nastaví počet workerů (výchozí min(jádra, 8)),
  `?aa=N` antialiasing N×N vzorků na pixel (výchozí 1, `RaytracerOptions.aa`).

### Hotové body

| bod | co | Phong | Sklo |
|---|---|---|---|
| výchozí stav | | 2,68 s render + 1,1 s příprava | 10,76 s + 1,1 s |
| 2 | kreslení přes jeden `ImageData` | beze změny | beze změny |
| 3 | cubemapa jako pole pixelů | 1,70 s + 1,1 s | 8,87 s + 1,1 s |
| 1 | Web Workery (4) | **1,96 s celkem** | **3,85 s celkem** |
| 4 | průchod BVH (ořezávání, bližší potomek napřed, anyHit stínů, zásobník) | paprsky −36 % | paprsky −27 % |
| 5a | plochá pole, Möller–Trumbore, méně alokací | 1,05 → 0,57 s celkem | 1,75 → 0,73 s celkem |
| 5b | scéna se staví jednou a sdílí | 0,53 → 0,47 s (4 workery) | 0,67 → 0,60 s (4 workery) |
| 6 | stavba BVH (těžiště předem, SAH) | 0,55 → 0,35 s (8 workerů) | 0,60 → 0,43 s (8 workerů) |
| 7 | antialiasing `?aa=N` (kvalita, ne rychlost) | 160×120: aa=2 0,35 s, aa=4 0,44 s | 160×120: aa=2 0,44 s, aa=4 0,72 s |

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

Bod 5b (stejný stroj, 320×240): souběžné stavby se tu brzdily méně, než se čekalo (příprava ve workeru
0,43 s při 4 workerech, jedna stavba 0,35 s), takže při 4 workerech je zisk malý. Velký je při víc workerech:

| workery | Phong před → po | Sklo před → po |
|---|---|---|
| 4 | 0,53 → 0,47 s | 0,67 → 0,60 s |
| 8 | 0,73 → 0,49 s | 0,83 → 0,58 s |
| 16 | 1,27 → 0,55 s | 1,22 → 0,61 s |

V 640×480 (po): 4 workery Phong 0,56 s / sklo 1,10 s, 8 workerů 0,54 / 0,88 s, 16 workerů 0,62 / 0,86 s.
Každý worker musí zahřát JIT a malý obraz má málo pruhů, proto výchozí počet min(jádra, 8).
Bez COOP/COEP render funguje (varování v konzoli, obraz shodný), jen je pomalejší kvůli kopiím.

Bod 6 (stejný stroj, 8 workerů, obraz pixelově shodný): rozpad přípravy v Node byl PLY ~60 ms,
geometrie ~20 ms, BVH ~200 ms. Postupně: těžiště a boxy trojúhelníků předem do pole (BVH ~85 ms, strom beze změny),
quickselect místo quicksortu (~37 ms), nakonec binned SAH (16 košů, jen osa s největším rozsahem těžišť) místo
dělení v půlce (~60 ms, se studeným JIT ~80 ms). SAH zrychlí render v Node o ~15–20 %, v prohlížeči:

| | HEAD | medián (quickselect) | SAH |
|---|---|---|---|
| 160×120 Phong / sklo | | 0,33 / 0,37 s | 0,33 / 0,36 s |
| 320×240 Phong / sklo | 0,55 / 0,60 s | 0,33–0,34 / 0,43–0,44 s | 0,35–0,38 / 0,42–0,44 s |
| 640×480 Phong / sklo | 0,59 / 0,88 s | 0,41–0,42 / 0,74–0,78 s | 0,43–0,46 / 0,70–0,72 s |

V malém rozlišení je to v šumu (±30 ms), delší stavba SAH se vrací až při víc paprscích (sklo, větší obraz,
antialiasing z bodu 7). SAH přes všechny tři osy dává skoro stejný strom a stavba je o třetinu pomalejší.
Když SAH nejde (všechna těžiště v jednom bodě), uzel se rozdělí v půlce.

Příprava je teď ~0,2 s (z toho start workeru, načtení PLY, parsování a stavba). Další zrychlení by chtělo
binární PLY nebo předpočítanou scénu, to už je mimo optimalizace výpočtu.

Bod 7: stratifikovaný jitter (pixel rozdělený na N×N dílků, v každém vzorek na náhodném místě), náhoda
z hashe souřadnic pixelu (`math.hashRandom`), takže obraz je deterministický i při jiném rozdělení mezi workery.
Vzorky se průměrují po převodu na 0–255. `aa=1` je pixelově shodný s předchozím stavem. Přeskakování vzorků,
když pomocný paprsek středem pixelu trefí pozadí (jako C++ originál), šetřilo jen 12–16 % a nechávalo zubatý
obrys králíka zvenku, takže se nepoužívá. C++ originál navíc místo jitteru bere pravidelnou mřížku od rohu pixelu.
Při 160×120 bez AA (dnešní výchozí stav, 0,33 s) stojí aa=2 jen ~0,02–0,08 s navíc, šlo by zvážit jako výchozí.

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

Všechny body plánu jsou hotové.

## Další nápady mimo optimalizace (neprobrané s uživatelem, jen navrhnout)

- **Materiál skla:** výchozí `Material` má difuzní složku 0.5 a odrazivost 0.8 se násobí i do propuštěného
  světla, takže sklo vychází tmavé a lom moc není vidět. Chtělo by to samostatný materiál pro sklo
  (malá difuze, bez útlumu na průchodu, případně absorpce podle vzdálenosti).
- Ambientní složka světel je nulová (`Light._ambiente`), stíny jsou úplně černé.
- `less/main.less`: canvas má `min-width: 1280px`, takže se malý obraz rozmaže. Zvážit `image-rendering: pixelated`.
- PLY parser umí jen ASCII (binární formát hlásí chybou).
- `npm audit` hlásí `braces` uvnitř `webpack-dev-server` (jen vývojová závislost, oprava zatím jen downgradem).
- npm blokuje `postinstall` balíku `esbuild`. Nevadí to, binárka přichází jako volitelná závislost.
