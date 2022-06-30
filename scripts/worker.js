importScripts('../rust-chess/pkg/rust_chess.js');

const { init_moves, ai_search } = wasm_bindgen;
const AI_DELAY = .5;
const DO_DELAY = true;


async function worker_init()
{

  await wasm_bindgen('../rust-chess/pkg/rust_chess_bg.wasm');

  onmessage = async function (event)
  {

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
  postMessage("READY");
}


worker_init();