use wasm_bindgen::prelude::*;
use chess::{Piece, Board, ChessMove, BoardStatus, Color, MoveGen, ALL_SQUARES};
use std::{mem, cmp, str::FromStr};

#[wasm_bindgen]
extern "C" {

    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_u32(a: u32);

    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_many(a: &str, b: &str);
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
      BoardStatus::Ongoing   => String::from("og")
    };
    let prom = match m.get_promotion() {
      Some(Piece::Bishop) => String::from("B"),
      Some(Piece::Queen)  => String::from("Q"),
      Some(Piece::Knight) => String::from("N"),
      Some(Piece::Rook)   => String::from("R"),
      _                   => String::from("0"),
    };
    let check = match copy.checkers().popcnt() {
      0 => " n",
      _ => " y"
    };
    let mut fen = copy.to_string();
    fen.push_str(check);
    player_moves.push([from, to, prom, fen, status].join("?"));
  }
  
  return player_moves.join(";");

}

#[wasm_bindgen]
pub fn ai_search(depth: isize, fen: &str) -> String {

  let board = Board::from_str(fen).expect("Valid FEN");

  let (value, mov, total, _) = 
                ai(&board, board.side_to_move(), depth, i32::MIN, i32::MAX, true);

  let ai_move= match mov {
    Some(t) => [t.get_source().to_int().to_string(),
                           t.get_dest().to_int().to_string()].join("?"),
    None => { log("No Move"); "No Move".to_string() },
  };
  let response= board.make_move_new(mov.unwrap());
  let status = match response.status() {
    BoardStatus::Checkmate => String::from("cm"),
    BoardStatus::Stalemate => String::from("sm"),
    BoardStatus::Ongoing   => String::from("og")
  };
  let mut player_moves = Vec::new();
  let move_it = MoveGen::new_legal(&response);
  for m in move_it {
    let copy = response.make_move_new(m);
    let from = m.get_source().to_int().to_string();
    let to = m.get_dest().to_int().to_string();
    let prom = match m.get_promotion() {
      Some(Piece::Bishop) => String::from("B"),
      Some(Piece::Queen)  => String::from("Q"),
      Some(Piece::Knight) => String::from("N"),
      Some(Piece::Rook)   => String::from("R"),
      _                   => String::from("0"),
    };
    let check = match copy.checkers().popcnt() {
      0 => " n",
      _ => " y"
    };
    let mut fen = copy.to_string();
    fen.push_str(check);

    let status = match copy.status() {
      BoardStatus::Checkmate => String::from("cm"),
      BoardStatus::Stalemate => String::from("sm"),
      BoardStatus::Ongoing   => String::from("og")
    };
    player_moves.push([from, to, prom, fen, status].join("?"));
  }
  let mut response_fen = response.to_string();
  let response_check = match response.checkers().popcnt() {
    0 => " n",
    _ => " y"
  };

  response_fen.push_str(response_check);

  // status,eval,ai move,ai move fen,total nodes computed,all player moves in from?to?prom?fen format,termination depth of move
  return [status,value.to_string(),ai_move,response_fen,total.to_string(),player_moves.join(";")].join(",")
}


fn eval_board(board: &Board, player: Color) -> i32 {
  let mut value = 0;
  //let w_queen_alive = false;
  //let b_queen_alive = false;
  for sq in ALL_SQUARES.iter() {
    let col = board.color_on(*sq);
    if board.piece_on(*sq).is_none() || col.is_none() { continue; };
    let c = if col==Some(player) { 1 } else { -1 };
    //let pos_eval = if col==Some(Color::Black) { 63 - i } else { i };
    match board.piece_on(*sq) {
      Some(Piece::Bishop) => {
        value += (330/* +BISHOP_POS[pos_eval] */) * c;
      },
      Some(Piece::Knight) => {
        value += (320/* +KNIGHT_POS[pos_eval] */) * c;
      },
      Some(Piece::Queen) => {
        value += (900/* +QUEEN_POS[pos_eval] */) * c;
        /* if col==Some(Color::White) { w_queen_alive = true; }
        else { b_queen_alive = true; } */
      },
      Some(Piece::Rook) => {
        value += (500/* +KNIGHT_POS[pos_eval] */) * c;
      },
      Some(Piece::Pawn) => {
        value += (100/* +KNIGHT_POS[pos_eval] */) * c;
      },
      _ => (),
    }
  }
  /* if (w_queen_alive) {
    value += KINGMID_POS[63 - board.king_pos(BLACK)] * ((BLACK===player) ? 1 : -1);
  } else {
    value += KINGEND_POS[63 - board.king_pos(BLACK)] * ((BLACK===player) ? 1 : -1);
  }
  if (b_queen_alive) {
    value += KINGMID_POS[board.king_pos(WHITE)] * ((WHITE===player) ? 1 : -1);
  } else {
    value += KINGEND_POS[board.king_pos(WHITE)] * ((WHITE===player) ? 1 : -1);
  } */
  return value;
}

fn ai(board: &Board, player: Color, depth: isize, alpha: i32, beta: i32, max_player: bool) -> (i32, Option<ChessMove>, usize, isize) {
  
  let mut best_val:i32 = if max_player { i32::MIN } else { i32::MAX };
  let mut best_move = None;
  let mut sum: usize = 1;
  let mut shallowest = isize::MIN;

  match board.status() {
    BoardStatus::Checkmate => return (best_val, best_move, sum, depth),
    BoardStatus::Stalemate => return (0, best_move, sum, depth),
    _ => ()
  }

  if depth < 1 {
    let value = eval_board(board, player);
    return (value, best_move, sum, depth);
  }

  let move_it = MoveGen::new_legal(board);
  let size = move_it.len();
  if max_player {
    let mut curr_alpha = alpha;
    for m in move_it {
      match m.get_promotion() {
        Some(Piece::Bishop) | Some(Piece::Rook) | Some(Piece::Knight) => continue,
        _ => ()
      }
      let mut bresult = mem::MaybeUninit::<Board>::uninit();
      unsafe {
        board.make_move(m, &mut *bresult.as_mut_ptr());
        let (value, _, ret_sum, mov_depth) = ai(&*bresult.as_ptr(), player, depth - 1, curr_alpha, beta, !max_player);
        sum += ret_sum;
        if value > best_val || (value == best_val && mov_depth > shallowest) {
          best_val = value;
          best_move = Some(m);
          shallowest = mov_depth;
        }
        if best_val >= beta { break; }
        curr_alpha = cmp::max(curr_alpha, best_val);
      }
    }
  }
  else {
    let mut curr_beta = beta;
    for m in move_it {
      match m.get_promotion() {
        Some(Piece::Bishop) | Some(Piece::Rook) | Some(Piece::Knight) => continue,
        _ => ()
      }
      let mut bresult = mem::MaybeUninit::<Board>::uninit();
      unsafe {
        board.make_move(m, &mut *bresult.as_mut_ptr());
        let (value, _, ret_sum, mov_depth) = ai(&*bresult.as_ptr(), player, depth - 1, alpha, curr_beta, !max_player);
        sum += ret_sum;
        if value < best_val || (value == best_val && mov_depth > shallowest) {
          best_val = value;
          best_move = Some(m);
          shallowest = mov_depth;
        }
        if best_val <= alpha { break; }
        curr_beta = cmp::min(curr_beta, best_val);
      }
    }
  }
  // hotfix until minimax logic is worked out
  if best_move.is_none() && size > 0 {
    best_move = MoveGen::new_legal(board).next();
  }
  return (best_val, best_move, sum, shallowest);

}






pub fn set_panic_hook() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}