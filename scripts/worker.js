importScripts('../rust-chess/pkg/rust_chess.js');

const {init_moves, ai_search} = wasm_bindgen;

onmessage = async function(event) {

  await wasm_bindgen('../rust-chess/pkg/rust_chess_bg.wasm');

  let result;

  if (event.data.TYPE==="ai_search") {
    result = await ai_search(event.data.DEPTH, event.data.FEN);
  }
  else {
    result = await init_moves(event.data.FEN);
  }
  
  postMessage([event.data.TYPE, result]);

}