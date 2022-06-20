use wasm_bindgen::prelude::*;
use chess::{Piece, Board, File, ChessMove, Rank, CastleRights, BoardStatus, Square, Color, MoveGen, ALL_FILES, ALL_RANKS, ALL_SQUARES};
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
  let board2 = Board::from_str("1nbqkbnr/1ppppppp/8/8/2PP4/B4N2/P3PPPP/RN1QKB1R b KQkq -").expect("Valid FEN");
  log(&board2.is_sane().to_string());
  MoveGen::movegen_perft_test(&board2, 4);

  let mut player_moves = Vec::new();
  let move_it = MoveGen::new_legal(&board);
  for m in move_it {
    let copy = board.make_move_new(m);
    let from = m.get_source().to_int().to_string();
    let to = m.get_dest().to_int().to_string();
    let prom = match m.get_promotion() {
      Some(Piece::Bishop) => String::from("B"),
      Some(Piece::Queen)  => String::from("Q"),
      Some(Piece::Knight) => String::from("N"),
      Some(Piece::Rook)   => String::from("R"),
      _                   => String::from("0"),
    };

    player_moves.push([from, to, prom, to_fen(&copy)].join("?"));
  }
  return player_moves.join(";");
}

#[wasm_bindgen]
pub fn ai_search(depth: usize, fen: &str) -> String {
  set_panic_hook();
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
    player_moves.push([from, to, prom, to_fen(&copy)].join("?"));
  }
  // status,eval,ai move,fen on move,total nodes computed,all player moves in from?to?prom?fen format
  return [status,value.to_string(),ai_move,to_fen(&response),total.to_string(),player_moves.join(";")].join(",")
}

fn to_fen(board: &Board) -> String {

  let mut fen: String = String::with_capacity(90);

  let mut count = 0;
  for rnk in ALL_RANKS.iter().rev() {
    for file in ALL_FILES.iter() {

      let sq: Square = Square::make_square(*rnk, *file);
      let col = board.color_on(sq);
      if col.is_none() || board.piece_on(sq).is_none() { 
        count += 1; 
        continue; 
      }
      else if count != 0 {
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
        _ =>  fen.push('X'),
      }
    }
    if count > 0 { fen.push(char::from_digit(count, 10).unwrap()); };
    count = 0;
    if *rnk != Rank::First { fen.push('/'); }
  }
  let side = match board.side_to_move() {
    Color::White => 'w',
    Color::Black => 'b',
  };
  fen.push(' ');
  fen.push(side);
  fen.push(' ');
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
    fen.push('-');
  }
  else {
    fen.push_str(&white_castle);
    fen.push_str(&black_castle);
  }
  fen.push(' ');
  let enp = board.en_passant();
  if enp.is_none() {
    fen.push('-');
  }
  else {
    let enpunw = enp.unwrap();
    let file = enpunw.get_file();
    let rank = enpunw.get_rank();
    match file {
      File::A => fen.push('a'),
      File::B => fen.push('b'),
      File::C => fen.push('c'),
      File::D => fen.push('d'),
      File::E => fen.push('e'),
      File::F => fen.push('f'),
      File::G => fen.push('g'),
      File::H => fen.push('h'),
    }
    fen.push(char::from_digit(((rank.to_index()+1)).try_into().unwrap(), 10).unwrap());
  }
  fen.push(' ');
  match board.checkers().popcnt() {
    0 => fen.push('n'),
    _ => fen.push('y'),
  }
  fen.shrink_to_fit();
  return fen;
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