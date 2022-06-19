use wasm_bindgen::prelude::*;
use chess::{Board, BoardStatus, Square, Color, Rank, File, MoveGen};
use std::str::FromStr;

#[wasm_bindgen]
pub fn game() -> usize {
    let board = Board::from_str("r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -").expect("Valid FEN");
    let count = MoveGen::movegen_perft_test(&board, 4);
    return count
}

pub fn set_panic_hook() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}