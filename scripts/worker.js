importScripts('../rust-chess/pkg/rust_chess.js');

const {perft, ai_search} = wasm_bindgen;

onmessage = async function(event) {

  await wasm_bindgen('../rust-chess/pkg/rust_chess_bg.wasm');
  if (event.data.type==="PERFT") {
    postMessage(["PERFT", perft(event.data.depth, event.data.fen), event.data.time]);
  }
  else if (event.data.type==="AI") {
    postMessage(["AI", ai_search(event.data.depth, event.data.fen), event.data.time]);
  }

}