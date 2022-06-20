importScripts('../rust-chess/pkg/rust_chess.js');

const {init_moves, ai_search} = wasm_bindgen;
onmessage = async function(event) {

  await wasm_bindgen('../rust-chess/pkg/rust_chess_bg.wasm');
  let result;
  if (event.data.type==="ai_search") {
    result = await ai_search(event.data.depth, event.data.fen);
  }
  else {
    result = await init_moves(event.data.fen);
  }
  postMessage([event.data.type, result]);

}