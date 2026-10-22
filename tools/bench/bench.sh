#!/bin/bash
# Mereni rychlosti renderu v headless Chrome (Phong i sklo) a ulozeni pixelu pro porovnani.
#
# pouziti: tools/bench/bench.sh <nazev> [git-ref]
#   bez git-ref meri pracovni adresar, jinak dany commit (napr. HEAD)
#   promenne: RUNS (pocet behu, 3), SIZE (rozliseni, "320 240"), OUT (vystupy, /tmp/rt-bench), CHROME,
#   QUERY (dalsi URL parametry, napr. "threads=8")
set -e
NAME=$1; REF=$2
REPO=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
TOOLS=$REPO/tools/bench
OUT=${OUT:-/tmp/rt-bench}
DIR=$OUT/build-$NAME
rm -rf "$DIR" && mkdir -p "$DIR"
if [ -n "$REF" ]; then
	git -C "$REPO" archive "$REF" | tar -x -C "$DIR"
else
	cp -r "$REPO"/{src,less,static,index.html,webpack.config.js,tsconfig.json,package.json} "$DIR"/
fi
ln -s "$REPO/node_modules" "$DIR/node_modules"
node "$TOOLS/instrument.mjs" "$DIR/src/main.ts" ${SIZE:-320 240}
(cd "$DIR" && npx webpack --mode production 2>&1 | grep -E "ERROR|compiled")
PORT=$((8200 + RANDOM % 500))
node "$TOOLS/serve.mjs" "$DIR/dist" $PORT &
SERVER=$!
trap "kill $SERVER" EXIT
sleep 1
echo "== phong"
node "$TOOLS/cdp.mjs" "http://localhost:$PORT/?$QUERY" "$OUT/$NAME-phong.bin" ${RUNS:-3}
echo "== sklo"
node "$TOOLS/cdp.mjs" "http://localhost:$PORT/?phong=0&$QUERY" "$OUT/$NAME-glass.bin" ${RUNS:-3}
