use chess::{Board, BitBoard, Color, Piece, ALL_PIECES};

const BAD_SQ_PAWN_BLACK: chess::BitBoard = BitBoard(39582418599936);
const BAD_SQ_PAWN_WHITE: chess::BitBoard = BitBoard(2359296);
const SIDE_H: chess::BitBoard = BitBoard(9259542123273814144);
const SIDE_A: chess::BitBoard = BitBoard(72340172838076673);
const MID: chess::BitBoard = BitBoard(103481868288);

const RANK_SEVEN: chess::BitBoard = BitBoard(71776119061217280);
const RANK_TWO: chess::BitBoard = BitBoard(65280);

const PROMISING_PAWN: i32 = 50;
const KNIGHT_PENALTY: i32 = 30;
const DOUBLE_CHECK: i32 = 40;
const ONE_CHECK: i32 = 20;
const MID_PAWN: i32 = 20;
const BAD_PAWN: i32 = 10;

#[inline]
pub fn evaluation(board: &Board, ai: Color) -> i32 {
  let mut value = 0;

  let num_checkers = board.checkers().popcnt();
  if num_checkers == 1 {
    value += ONE_CHECK * if board.side_to_move() == ai { -1 } else { 1 };
  }
  else if num_checkers == 2 {
    value += DOUBLE_CHECK * if board.side_to_move() == ai { -1 } else { 1 };
  }
  value += (board.pieces(Piece::Knight) & board.color_combined(ai) & SIDE_A).popcnt() as i32 * -KNIGHT_PENALTY;
  value += (board.pieces(Piece::Knight) & board.color_combined(!ai) & SIDE_A).popcnt() as i32 * KNIGHT_PENALTY;
  value += (board.pieces(Piece::Knight) & board.color_combined(ai) & SIDE_H).popcnt() as i32 * -KNIGHT_PENALTY;
  value += (board.pieces(Piece::Knight) & board.color_combined(!ai) & SIDE_H).popcnt() as i32 * KNIGHT_PENALTY;

  let ai_pawns = board.pieces(Piece::Pawn) & board.color_combined(ai);
  let human_pawns = board.pieces(Piece::Pawn) & board.color_combined(!ai);
  value += (ai_pawns & MID).popcnt() as i32 * MID_PAWN;
  value += (ai_pawns & if ai==Color::White { RANK_SEVEN } else { RANK_TWO }).popcnt() as i32 * PROMISING_PAWN;
  value += (ai_pawns & if ai==Color::White { BAD_SQ_PAWN_WHITE } else { BAD_SQ_PAWN_BLACK }).popcnt() as i32 * -BAD_PAWN;
  value += (human_pawns & MID).popcnt() as i32 * -MID_PAWN;
  value += (human_pawns & if ai==Color::White { RANK_TWO } else { RANK_SEVEN }).popcnt() as i32 * -PROMISING_PAWN;
  value += (human_pawns & if ai==Color::White { BAD_SQ_PAWN_BLACK } else { BAD_SQ_PAWN_WHITE }).popcnt() as i32 * BAD_PAWN; 

  for piece in ALL_PIECES {
    value += material_value(piece) * (board.count_piece(piece, ai) as i32 - board.count_piece(piece, !ai) as i32)
  }
  return value;
}

#[inline]
fn material_value(piece: Piece) -> i32 {
  match piece {
    Piece::King => 0,
    Piece::Pawn => 101,
    Piece::Rook => 503,
    Piece::Queen => 901,
    Piece::Bishop => 323,
    Piece::Knight => 311,
  }
}