importScripts('../rust-chess/pkg/rust_chess.js');

const { init_moves, ai_search } = wasm_bindgen;
const AI_DELAY = .25;
const DO_DELAY = true;

onmessage = async function (event)
{

  await wasm_bindgen('../rust-chess/pkg/rust_chess_bg.wasm');

  /*  let test_time = Date.now();
   let test_result = ai_search(6, "rnb1kbnr/4pppp/8/q1PpP3/p7/P7/1PPBBPPP/RN1QK1NR b KQkq - 0 1");
   console.log(test_result);
   console.log((Date.now() - test_time) / 1000); */

  let result;
  let time = Date.now();

  if (event.data.TYPE === "ai_search")
  {
    result = ai_search(event.data.DEPTH, event.data.FEN);
  }
  else
  {
    result = init_moves(event.data.FEN);
  }

  while (DO_DELAY && (Date.now() - time) / 1000 < AI_DELAY)
  {
    // ai delay
  }
  postMessage([event.data.TYPE, result]);

}