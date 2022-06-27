use chess::{Board, BoardStatus, MoveGen, Piece, EMPTY};
use std::str::FromStr;
use wasm_bindgen::prelude::*;

mod ai_mtdf;
mod ai_vanilla;

#[wasm_bindgen]
extern "C" {
  #[wasm_bindgen(js_namespace = console)]
  fn log(s: &str);

  #[wasm_bindgen(js_namespace = console, js_name = log)]
  fn log_u32(a: u32);

  #[wasm_bindgen(js_namespace = console, js_name = log)]
  fn log_many(a: &str, b: &str);

  #[wasm_bindgen(js_namespace = Date, js_name = now)]
  pub fn now() -> f64;
}

#[wasm_bindgen]
pub fn init_moves(fen: &str) -> String {
  let board = Board::from_str(fen).expect("Valid FEN");

  let mut player_moves = Vec::new();
  let move_it = MoveGen::new_legal(&board);

  for m in move_it {
    let copy = board.make_move_new(m);
    let from = m.get_source().to_int().to_string();
    let to = m.get_dest().to_int().to_string();
    let status = match copy.status() {
      BoardStatus::Checkmate => String::from("cm"),
      BoardStatus::Stalemate => String::from("sm"),
      BoardStatus::Ongoing => String::from("og"),
    };
    let prom = match m.get_promotion() {
      Some(Piece::Bishop) => String::from("B"),
      Some(Piece::Queen) => String::from("Q"),
      Some(Piece::Knight) => String::from("N"),
      Some(Piece::Rook) => String::from("R"),
      _ => String::from("0"),
    };
    let check = match *copy.checkers() {
      EMPTY => " n",
      _ => " y",
    };
    let mut fen = copy.to_string();
    fen.push_str(check);
    player_moves.push([from, to, prom, fen, status].join("?"));
  }

  return player_moves.join(";");
}

#[wasm_bindgen]
pub fn ai_search(depth: i32, fen: &str) -> String {
  set_panic_hook();
  let board = Board::from_str(fen).expect("Valid FEN");
  // value, flag, depth
  let (value, mov) = if depth == 0 {
    ai_mtdf::ai(&board)
  } else {
    ai_vanilla::ai(&board, board.side_to_move(), depth)
  };

  let ai_move = match mov {
    Some(t) => [t.get_source().to_int().to_string(), t.get_dest().to_int().to_string()].join("?"),
    None => {
      log("No Move");
      "No Move".to_string()
    }
  };

  let response = board.make_move_new(mov.unwrap());
  let status = match response.status() {
    BoardStatus::Checkmate => String::from("cm"),
    BoardStatus::Stalemate => String::from("sm"),
    BoardStatus::Ongoing => String::from("og"),
  };

  let mut player_moves = Vec::new();
  let move_it = MoveGen::new_legal(&response);
  for m in move_it {
    let copy = response.make_move_new(m);
    let from = m.get_source().to_int().to_string();
    let to = m.get_dest().to_int().to_string();
    let prom = match m.get_promotion() {
      Some(Piece::Bishop) => String::from("B"),
      Some(Piece::Queen) => String::from("Q"),
      Some(Piece::Knight) => String::from("N"),
      Some(Piece::Rook) => String::from("R"),
      _ => String::from("0"),
    };
    let check = match copy.checkers().popcnt() {
      0 => " n",
      _ => " y",
    };
    let mut fen = copy.to_string();
    fen.push_str(check);

    let status = match copy.status() {
      BoardStatus::Checkmate => String::from("cm"),
      BoardStatus::Stalemate => String::from("sm"),
      BoardStatus::Ongoing => String::from("og"),
    };
    player_moves.push([from, to, prom, fen, status].join("?"));
  }

  let mut response_fen = response.to_string();
  let response_check = match *response.checkers() {
    EMPTY => " n",
    _ => " y",
  };
  response_fen.push_str(response_check);

  // status,eval,ai move,ai move fen,total nodes computed,all player moves in from?to?prom?fen format,termination depth of move
  return [status, value.to_string(), ai_move, response_fen, player_moves.join(";")].join(",");
}

pub fn set_panic_hook() {
  #[cfg(feature = "console_error_panic_hook")]
  console_error_panic_hook::set_once();
}
