use chess::{Board, Color, Piece, ALL_PIECES};

pub fn evaluation(board: &Board, player: Color) -> i32 {
  let mut value = 0;
  for piece in ALL_PIECES {
    value += material_value(piece) * (board.count_piece(piece, player) - board.count_piece(piece,!player))
  }
  return value;
}

#[inline]
fn material_value(piece: Piece) -> i32 {
  match piece {
    Piece::King => 0,
    Piece::Pawn => 100,
    Piece::Rook => 500,
    Piece::Queen => 900,
    Piece::Bishop => 330,
    Piece::Knight => 320,
  }
}
