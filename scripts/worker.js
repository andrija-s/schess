importScripts('../rust-chess/pkg/rust_chess.js');

const {game} = wasm_bindgen;

onmessage = async function(event) {

  await wasm_bindgen('../rust-chess/pkg/rust_chess_bg.wasm');
  postMessage(game());

}