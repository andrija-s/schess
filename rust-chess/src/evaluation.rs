use chess::{Board, Color, Piece, ALL_SQUARES};


pub fn evaluation(board: &Board, player: Color) -> i32
{
  let mut value   = 0;
  let mut queens  = 0;
  let mut pawns   = 0;
  let mut bishops = 0;
  let mut knights = 0;
  let mut rooks   = 0;
  for sq in ALL_SQUARES.iter() 
  {
    let col = board.color_on(*sq);
    if board.piece_on(*sq).is_none() || col.is_none() { continue; };
    let c = if col==Some(player) { 1 } else { -1 };
    match board.piece_on(*sq) 
    {
      Some(Piece::Bishop) => { bishops += c; },
      Some(Piece::Knight) => { knights += c; },
      Some(Piece::Queen)  => { queens  += c; },
      Some(Piece::Rook)   => { rooks   += c; },
      Some(Piece::Pawn)   => { pawns   += c; },
      _ => (),
    }
  }
  value += (330 * bishops) + (320 * knights) + (900 * queens) + (500 * rooks)+ (100 * pawns);
  return value;
}