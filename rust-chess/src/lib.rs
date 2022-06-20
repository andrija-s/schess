use wasm_bindgen::prelude::*;
use chess::{Piece, Board, File, ChessMove, CastleRights, BoardStatus, Square, Color, MoveGen};
use std::{mem, cmp, str::FromStr};

#[wasm_bindgen]
pub fn init_moves(fen: &str) -> String {
  let board = Board::from_str(fen).expect("Valid FEN");

  let mut player_moves = Vec::new();
  let move_it = MoveGen::new_legal(&board);
  for m in move_it {
    let mut bresult = mem::MaybeUninit::<Board>::uninit();
    unsafe {
      board.make_move(m, &mut *bresult.as_mut_ptr());
      let from = m.get_source().to_int().to_string();
      let to = m.get_dest().to_int().to_string();
      let prom = match m.get_promotion() {
        Some(Piece::Bishop) => String::from("B"),
        Some(Piece::Queen)  => String::from("Q"),
        Some(Piece::Knight) => String::from("N"),
        Some(Piece::Rook)   => String::from("R"),
        _                   => String::from("0"),
      };
      player_moves.push([from, to, prom, to_fen(&*bresult.as_ptr())].join("?"));
    }
  }

  return player_moves.join(";");
}

#[wasm_bindgen]
pub fn ai_search(depth: usize, fen: &str) -> String {
  let board = Board::from_str(fen).expect("Valid FEN");
  match board.status() {
    BoardStatus::Checkmate => return String::from("you-cm"),
    BoardStatus::Stalemate => return String::from("you-sm"),
    BoardStatus::Ongoing => ()
  };
  let (value, mov, total) = 
                ai(&board, board.side_to_move(), depth, depth, i32::MIN, i32::MAX, true);
  
  let ai_move= match mov {
    Some(t) => [t.get_source().to_int().to_string(),
                           t.get_dest().to_int().to_string()].join("?"),
    None => "".to_string(),
  };
  let response= board.make_move_new(mov.unwrap());
  let status = match response.status() {
    BoardStatus::Checkmate => String::from("ai-cm"),
    BoardStatus::Stalemate => String::from("ai-sm"),
    BoardStatus::Ongoing   => String::from("ai-og")
  };
  let mut player_moves = Vec::new();
  let move_it = MoveGen::new_legal(&response);
  for m in move_it {
    let mut bresult = mem::MaybeUninit::<Board>::uninit();
    unsafe {
      response.make_move(m, &mut *bresult.as_mut_ptr());
      let from = m.get_source().to_int().to_string();
      let to = m.get_dest().to_int().to_string();
      let prom = match m.get_promotion() {
        Some(Piece::Bishop) => String::from("B"),
        Some(Piece::Queen)  => String::from("Q"),
        Some(Piece::Knight) => String::from("N"),
        Some(Piece::Rook)   => String::from("R"),
        _                   => String::from("0"),
      };
      player_moves.push([from, to, prom, to_fen(&*bresult.as_ptr())].join("?"));
    }
  }
  // status,eval,ai move,fen on move,total nodes computed,all player moves in from?to?prom?fen format
  return [status,value.to_string(),ai_move,to_fen(&response),total.to_string(),player_moves.join(";")].join(",")
}

fn to_fen(board: &Board) -> String {
  let mut fen_arr: [String; 8] = Default::default();
  let mut fen: String = String::with_capacity(1);
  let mut count = 0;
  for i in 0..64 {
    if i!=0 && (i-1)/8!=i/8 {
      if count != 0 {
        fen.push(char::from_digit(count, 10).unwrap());
        count = 0;
      }
      fen_arr[7-((i-1)/8)] = fen.clone();
      fen = String::with_capacity(1);
    }
    let sq: Square = unsafe { Square::new(i as u8 ) };
    let col = board.color_on(sq);
    if col.is_none() { 
      count += 1; 
      continue; 
    };
    if count != 0 {
      fen.push(char::from_digit(count, 10).unwrap());
      count = 0;
    }
    match board.piece_on(sq) {
      Some(Piece::Bishop) => {
        fen.push(if col==Some(Color::White) { 'B' } else { 'b' });
      },
      Some(Piece::Knight) => {
        fen.push(if col==Some(Color::White) { 'N' } else { 'n' });
      },
      Some(Piece::Queen) => {
        fen.push(if col==Some(Color::White) { 'Q' } else { 'q' });
      },
      Some(Piece::Rook) => {
        fen.push(if col==Some(Color::White) { 'R' } else { 'r' });
      },
      Some(Piece::Pawn) => {
        fen.push(if col==Some(Color::White) { 'P' } else { 'p' });
      },
      Some(Piece::King) => {
        fen.push(if col==Some(Color::White) { 'K' } else { 'k' });
      },
      _ => (),
    }
    if i == 63 {
      fen_arr[0] = fen.clone();
    }
  }
  let mut ranks: String = fen_arr.join("/");
  let side = match board.side_to_move() {
    Color::White => 'w',
    Color::Black => 'b',
  };
  ranks.push(' ');
  ranks.push(side);
  ranks.push(' ');
  let white_castle = match board.castle_rights(Color::White) {
    CastleRights::Both      => String::from("KQ"),
    CastleRights::KingSide  => String::from("K"),
    CastleRights::QueenSide => String::from("Q"),
    CastleRights::NoRights  => String::from(""),
  };
  let black_castle = match board.castle_rights(Color::White) {
    CastleRights::Both      => String::from("kq"),
    CastleRights::KingSide  => String::from("k"),
    CastleRights::QueenSide => String::from("q"),
    CastleRights::NoRights  => String::from(""),
  };
  if black_castle == white_castle {
    ranks.push('-');
  }
  else {
    ranks.push_str(&white_castle);
    ranks.push_str(&black_castle);
  }
  ranks.push(' ');
  let enp = board.en_passant();
  if enp.is_none() {
    ranks.push('-');
  }
  else {
    let enpunw = enp.unwrap();
    let file = enpunw.get_file();
    let rank = enpunw.get_rank();
    match file {
      File::A => ranks.push('a'),
      File::B => ranks.push('b'),
      File::C => ranks.push('c'),
      File::D => ranks.push('d'),
      File::E => ranks.push('e'),
      File::F => ranks.push('f'),
      File::G => ranks.push('g'),
      File::H => ranks.push('h'),
    }
    ranks.push(char::from_digit(((rank.to_index()+1)).try_into().unwrap(), 10).unwrap());
  }
  ranks.push(' ');
  match board.checkers().popcnt() {
    0 => ranks.push('n'),
    _ => ranks.push('y'),
  }
  return ranks;
}

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
  
  let mut best_val:i32 = if max_player { i32::MIN } else { i32::MAX };
  let mut sum: usize = 1;
  let mut best_move = None;

  match board.status() {
    BoardStatus::Checkmate => return (best_val, best_move, sum),
    BoardStatus::Stalemate => return (0, best_move, sum),
    _ => ()
  }

  if depth < 1 {
    let value = eval_board(board, player);
    return (value, None, 1);
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






pub fn set_panic_hook() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}