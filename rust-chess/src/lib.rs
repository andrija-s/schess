use wasm_bindgen::prelude::*;
use chess::{Piece, Board, ChessMove, BoardStatus, Square, Color, MoveGen};
use std::str::FromStr;
use std::mem;
use std::cmp;

#[wasm_bindgen]
pub fn perft(depth: usize, fen: &str) -> usize {
  let board = Board::from_str(fen).expect("Valid FEN");
  let count = MoveGen::movegen_perft_test(&board, depth);
  return count
}

#[wasm_bindgen]
pub fn ai_search(depth: usize, fen: &str) -> String {
  let board = Board::from_str(fen).expect("Valid FEN");
  let (value, mov, total) = 
                ai(&board, board.side_to_move(), depth, depth, i32::MIN, i32::MAX, true);
  let mid= match mov {
    Some(t) => [",from:".to_string(), t.get_source().to_int().to_string(),
                           ",to:".to_string(), t.get_dest().to_int().to_string()].join(""),
    None => "".to_string(),
  };
  let bresult= board.make_move_new(mov.unwrap());
  let status = match bresult.status() {
    BoardStatus::Checkmate => "cm".to_string(),
    BoardStatus::Stalemate => "sm".to_string(),
    BoardStatus::Ongoing => "og".to_string()
  };

  return [value.to_string(),mid,",status:".to_string(),status,",total:".to_string(),total.to_string(), " ".to_string(), to_fen(&board)].join("")
}
fn to_fen(board: &Board) -> String {
  let mut fen_arr: [String; 9] = Default::default();
  let mut fen: String = String::with_capacity(1);
  let mut count = 0;
  for i in (0..64).rev() {
    if i!=63 && (i+1)/8!=i/8 {
      if count != 0 {
        fen.insert(0, char::from_digit(count, 10).unwrap());
        count = 0;
      }
      fen_arr[7-((i+1)/8)] = fen.clone();
      fen = String::with_capacity(1);
    }
    let sq: Square = unsafe { Square::new(i as u8 ) };
    let col = board.color_on(sq);
    if col.is_none() { 
      count += 1; 
      continue; 
    };
    if count != 0 {
      fen.insert(0, char::from_digit(count, 10).unwrap());
      count = 0;
    }
    match board.piece_on(sq) {
      Some(Piece::Bishop) => {
        fen.insert(0, if col==Some(Color::White) { 'B' } else { 'b' });
      },
      Some(Piece::Knight) => {
        fen.insert(0, if col==Some(Color::White) { 'N' } else { 'n' });
      },
      Some(Piece::Queen) => {
        fen.insert(0, if col==Some(Color::White) { 'Q' } else { 'q' });
      },
      Some(Piece::Rook) => {
        fen.insert(0, if col==Some(Color::White) { 'R' } else { 'r' });
      },
      Some(Piece::Pawn) => {
        fen.insert(0, if col==Some(Color::White) { 'P' } else { 'p' });
      },
      Some(Piece::King) => {
        fen.insert(0, if col==Some(Color::White) { 'K' } else { 'k' });
      },
      _ => (),
    }
    if i == 0 {
      fen_arr[7] = fen.clone();
    }
  }
  let mut ranks: String = fen_arr.join("/");
  let side = match board.side_to_move() {
    Color::White => 'w',
    Color::Black => 'b',
  };
  ranks.push(' ');
  ranks.push(side);
  return ranks;
}
/* const PAWN_POS: [i32; 64] = 
[ 0,  0,  0,  0,  0,  0,  0,  0,
 50, 50, 50, 50, 50, 50, 50, 50,
 10, 10, 20, 30, 30, 20, 10, 10,
  5,  5, 10, 25, 25, 10,  5,  5,
  0,  0,  0, 20, 20,  0,  0,  0,
  5, -5,-10,  0,  0,-10, -5,  5,
  5, 10, 10,-25,-25, 10, 10,  5,
  0,  0,  0,  0,  0,  0,  0,  0];
const KNIGHT_POS: [i32; 64] = 
[-50,-40,-30,-30,-30,-30,-40,-50,
 -40,-20,  0,  0,  0,  0,-20,-40,
 -30,  0, 10, 15, 15, 10,  0,-30,
 -30,  5, 15, 20, 20, 15,  5,-30,
 -30,  0, 15, 20, 20, 15,  0,-30,
 -30,  5, 10, 15, 15, 10,  5,-30,
 -40,-20,  0,  5,  5,  0,-20,-40,
 -50,-40,-30,-30,-30,-30,-40,-50];
const BISHOP_POS: [i32; 64] = 
[-20,-10,-10,-10,-10,-10,-10,-20,
 -10,  0,  0,  0,  0,  0,  0,-10,
 -10,  0,  5, 10, 10,  5,  0,-10,
 -10,  5,  5, 10, 10,  5,  5,-10,
 -10,  0, 10, 10, 10, 10,  0,-10,
 -10, 10, 10, 10, 10, 10, 10,-10,
 -10,  5,  0,  0,  0,  0,  5,-10,
 -20,-10,-10,-10,-10,-10,-10,-20];
const ROOK_POS: [i32; 64] =
[0,  0,  0,  0,  0,  0,  0, 0,
 5, 10, 10, 10, 10, 10, 10, 5,
-5,  0,  0,  0,  0,  0,  0,-5,
-5,  0,  0,  0,  0,  0,  0,-5,
-5,  0,  0,  0,  0,  0,  0,-5,
-5,  0,  0,  0,  0,  0,  0,-5,
-5,  0,  0,  0,  0,  0,  0,-5,
 0,  0,  5,  5,  5,  0,  0, 0];
const QUEEN_POS: [i32; 64] =
[-20,-10,-10,-5,-5,-10,-10,-20,
 -10,  0,  0, 0, 0,  0,  0,-10,
 -10,  0,  5, 5, 5,  5,  0,-10,
 -5,   0,  5, 5, 5,  5,  0, -5,
  0,   0,  5, 5, 5,  5,  0, -5,
 -10,  5,  5, 5, 5,  5,  0,-10,
 -10,  0,  5, 0, 0,  0,  0,-10,
 -20,-10,-10,-5,-5,-10,-10,-20];
const KINGMID_POS: [i32; 64] =
[-30,-40,-40,-50,-50,-40,-40,-30,
 -30,-40,-40,-50,-50,-40,-40,-30,
 -30,-40,-40,-50,-50,-40,-40,-30,
 -30,-40,-40,-50,-50,-40,-40,-30,
 -20,-30,-30,-40,-40,-30,-30,-20,
 -10,-20,-20,-20,-20,-20,-20,-10,
  20, 20,  0,  0,  0,  0, 20, 20,
  20, 30, 10,  0,  0, 10, 30, 20];
const KINGEND_POS: [i32; 64] =
[-50,-40,-30,-20,-20,-30,-40,-50,
 -30,-20,-10,  0,  0,-10,-20,-30,
 -30,-10, 20, 30, 30, 20,-10,-30,
 -30,-10, 30, 40, 40, 30,-10,-30,
 -30,-10, 30, 40, 40, 30,-10,-30,
 -30,-10, 20, 30, 30, 20,-10,-30,
 -30,-30,  0,  0,  0,  0,-30,-30,
 -50,-30,-30,-30,-30,-30,-30,-50];
 */
fn eval_board(board: &Board, player: Color) -> i32 {
  let mut value = 0;
  //let w_queen_alive = false;
  //let b_queen_alive = false;
  for i in 0..64u8 {
    let sq: Square = unsafe { Square::new(i ) };
    let col = board.color_on(sq);
    if col.is_none() { continue; };
    let c = if col==Some(player) { 1 } else { -1 };
    //let pos_eval = if col==Some(Color::Black) { 63 - i } else { i };
    match board.piece_on(sq) {
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

fn ai(board: &Board, player: Color, depth: usize, core_depth: usize, alpha: i32, beta: i32, max_player: bool) -> (i32, Option<ChessMove>, usize) {

  if depth < 1 {
    let value = eval_board(board, player);
    return (value, None, 1);
  }

  let mut best_val:i32 = if max_player { i32::MIN } else { i32::MAX };
  let mut sum: usize = 0;
  let mut best_move = None;

  match board.status() {
    BoardStatus::Checkmate => return (best_val, best_move, sum),
    BoardStatus::Stalemate => return (0, best_move, sum),
    _ => ()
  }
  let move_it = MoveGen::new_legal(board);

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
        let (value, _, ret_sum) = ai(&*bresult.as_ptr(), player, depth - 1, core_depth, curr_alpha, beta, !max_player);
        sum += ret_sum;
        if value > best_val {
          best_val = value;
          best_move = Some(m);
        }
        if best_val >= beta && depth != core_depth { break; }
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
        let (value, _, ret_sum) = ai(&*bresult.as_ptr(), player, depth - 1, core_depth, alpha, curr_beta, !max_player);
        sum += ret_sum;
        if value < best_val {
          best_val = value;
          best_move = Some(m);
        }
        if best_val <= alpha { break; }
        curr_beta = cmp::min(curr_beta, best_val);
      }
    }
  }

  return (best_val, best_move, sum);

}






/* pub fn set_panic_hook() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
} */