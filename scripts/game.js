const WCS = 0; const WCL = 1; const BCS = 2; const BCL = 3;

export const ROOK   = 1; export const KNIGHT = 2; export const KING   = 3;
export const PAWN   = 4; export const QUEEN  = 5; export const BISHOP = 6;

export const ONPEASANT = 7;

const WCS_MOV = 11; const WCL_MOV = 13;
const BCS_MOV = 15; const BCL_MOV = 17;

export const Q_PROM = 18; export const B_PROM = 25;
export const K_PROM = 32; export const R_PROM = 39;

export const WHITE = 0; export const BLACK = 1;

const NONE = -1; export const EMPTY = 0;

export const SQUARES_W = 8;export const SQUARES_H = 8;

class Move {
  constructor(from, to, special) {
    this.FROM = from;
    this.TO = to;
    this.SPECIAL = special;
  }
}

export class Game {
  constructor(board="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -") {
    [this.board_type, this.board_color, this.wk_pos, this.bk_pos, this.turn, this.castles, this.enpeasant] = Game.convert(board);
    this.history = [];
    this.game_over = false;
  }
  set_color(pos, color) {
    this.board_color[pos] = color;
  }
  set_type(pos, type) {
    this.board_type[pos] = type;
  }
  get_type(pos) {
    return this.board_type[pos];
  }
  get_color(pos) {
    return this.board_color[pos];
  }
  king_pos(color) {
    return ((color===WHITE) ? this.wk_pos : this.bk_pos); 
  }
  check_diag(x, y, color, checked, booli, offset) {
    if (booli[offset] && Game.in_bound(x, y)) {
      let pos = Game.linear(x, y);
      if (this.get_type(pos)!==EMPTY) booli[offset] = false;
      if (this.get_color(pos)!==color && this.get_type(pos)>PAWN) {
        checked = true;
      }
    }
    return checked;
  }
  under_attack(color, pos) {
    let [x,y] = Game.nonlinear(pos);
    let checked = false;
    // pawn checks
    let temp_x,temp_y, temp_val;
    let offset = (color===WHITE) ? 1 : -1;
    for (let val of [x-1,x+1]) {
      if (Game.in_bound(val, y-offset)) {
        temp_val = Game.linear(val, y-offset);
        if (this.get_type(temp_val)>KNIGHT && this.get_color(temp_val)!==color) {
          return true;
        }
      }
    }
    // oppo king check
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        temp_x = x+i;
        temp_y = y+j;
        temp_val = Game.linear(temp_x,temp_y);
        if (!(i===0&&j===0) && Game.in_bound(temp_x,temp_y) && this.get_type(temp_val)===KING 
            && this.get_color(temp_val)!==color) {
          return true;
        }
      }
    }

    // diagonal check for queen/bishops
    let lines = [true, true, true, true];
    for (let i=1; i<SQUARES_W; i++) {
      if (checked=this.check_diag(x+i,y+i,color,checked,lines,0))
        return checked;
      if (checked=this.check_diag(x+i,y-i,color,checked,lines,1))
        return checked;
      if (checked=this.check_diag(x-i,y+i,color,checked,lines,2))
        return checked;
      if (checked=this.check_diag(x-i,y-i,color,checked,lines,3))
        return checked;
    }
    // column/row check for queen/rooks
    for (let i=pos-1; i>=pos-x; i--) {
      if (this.get_type(i)!==EMPTY) {
        if (this.get_color(i)!==color && (this.get_type(i)===ROOK || this.get_type(i)===QUEEN)) {
            return true;
        }
        break;
      }
    }
    for (let i=pos+1; i<(y*SQUARES_W)+8; i++) {
      if (this.get_type(i)!==EMPTY) {
        if (this.get_color(i)!==color && (this.get_type(i)===ROOK || this.get_type(i)===QUEEN)) {
            return true;
        }
        break;
      }
    }

    // column check

    for (let i=pos-SQUARES_W; i>=x; i-=SQUARES_W) {
      if (this.get_type(i)!==EMPTY) {
        if (this.get_color(i)!==color && (this.get_type(i)===ROOK || this.get_type(i)===QUEEN)) {
            return true;
        }
        break;
      }
    }
    for (let i=pos+SQUARES_W; i<(SQUARES_W*SQUARES_H); i+=SQUARES_W) {
      if (this.get_type(i)!==EMPTY) {
        if (this.get_color(i)!==color && (this.get_type(i)===ROOK || this.get_type(i)===QUEEN)) {
            return true;
        }
        break;
      }
    }
    // knight check
    for (let i=-2;i<3;i++) {
      for (let j=-2;j<3;j++) {
        if (i===0 || j===0 || Math.abs(i)===Math.abs(j))
          continue;
        [temp_x,temp_y] = [x+i, y+j];
        temp_val = Game.linear(temp_x,temp_y);
        if (Game.in_bound(temp_x,temp_y) && this.get_type(temp_val)===KNIGHT 
            && this.get_color(temp_val)!==color)
          return true;
      }
    }
    return checked;
  }
  king_moves(from,test=false) {
    let color = this.get_color(from);
    let moves = [];
    let pos;
    let [x, y] = Game.nonlinear(from);
    let special=0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (!(i===0&&j===0) && Game.in_bound(x+i,y+j)) {
          pos = Game.linear(x+i,y+j);
          if (this.get_color(pos)!== color) {
            moves.push(new Move(from, pos, special + this.get_type(pos)));
          }
        }
      }
    }
    if (!this.under_attack(color, from)){
      if (color===BLACK) {
        if (this.castles[BCS] && this.get_type(from+1)===EMPTY && this.get_type(from+2)===EMPTY
            && !this.under_attack(color, from+1) && !this.under_attack(color, from+2)) {
          moves.push(new Move(from, from+2, BCS_MOV));
        }
        if (this.castles[BCL] && this.get_type(from-1)===EMPTY && this.get_type(from-2)===EMPTY 
            && this.get_type(from-3)===EMPTY && !this.under_attack(color, from-1) 
            && !this.under_attack(color, from-2)) {
          moves.push(new Move(from, from-2, BCL_MOV));
        }
      }
      else {
        if (this.castles[WCS] && this.get_type(from+1)===EMPTY && this.get_type(from+2)===EMPTY 
            && !this.under_attack(color, from+1) && !this.under_attack(color, from+2)) {
          moves.push(new Move(from, from+2, WCS_MOV));
        }
        if (this.castles[WCL] && this.get_type(from-1)===EMPTY && this.get_type(from-2)===EMPTY
            && this.get_type(from-3)===EMPTY && !this.under_attack(color, from-1) 
            && !this.under_attack(color, from-2)) {
          moves.push(new Move(from, from-2, WCL_MOV));
        }
      }
    }
    return moves;
  }
  pawn_moves(from, test=false) {
    let color = this.get_color(from);
    let moves = [];
    let [x, y] = Game.nonlinear(from);
    let going_up = (color===WHITE);
    let inc = SQUARES_W - ((SQUARES_W * 2) * going_up);
    let proms = ((going_up && y===1) || (!going_up && y===6)) ? true : false;
    let arr = [K_PROM,Q_PROM];
    if (test) {
      arr = [K_PROM,B_PROM,R_PROM,Q_PROM];
    }
    if (this.get_type(from + inc)===EMPTY) {
      if (proms) {
        arr.forEach(x => moves.push(new Move(from,from + inc,x)));
      }
      else {
        moves.push(new Move(from,from + inc,0));
      }
      if (((going_up && y===6) || (!going_up && y===1)) && (this.get_type(from + inc + inc)===EMPTY)) {
        let val = this.get_type(from + inc + inc);
        moves.push(new Move(from,from + inc + inc,val));
      }
    }
    let y_move = (going_up) ? y-1 : y+1;
    function calculate(x_offset, state) {
      let lin_pos = Game.linear(x_offset, y_move);
      if ((state.get_type(lin_pos)!==EMPTY && state.get_color(lin_pos)!==color)) {
        if (proms) {
          arr.forEach(x => moves.push(new Move(from,lin_pos,x)));
        }
        else {
          moves.push(new Move(from,lin_pos,state.get_type(lin_pos)));
        }
      }
      else if (lin_pos===state.enpeasant) {
        moves.push(new Move(from,lin_pos,ONPEASANT));
      }
    }
    if (x !== 7) {
      calculate(x+1, this);
    }
    if (x !== 0) {
      calculate(x-1, this);
    }
    return moves;
  }
  diag_calc(x, y, moves, from, booli) {
    let color = (this.turn % 2===0) ? WHITE : BLACK;
    if (booli && Game.in_bound(x, y)) {
        let pos = Game.linear(x, y);
        if (this.get_color(pos)!==color) {
          moves.push(new Move(from,pos,this.get_type(pos)));
        }
        if (this.get_type(pos)!==EMPTY) {
          return false;
        }
      }
    return booli;
  }
  bishop_moves(from, test=false) {
    let moves = [];
    let [x, y] = Game.nonlinear(from);
    let direction = [true, true, true, true];
    for (let i = 1; i < SQUARES_W; i++) {
      direction[0] = this.diag_calc(x+i,y+i,moves,from,direction[0]);
      direction[1] = this.diag_calc(x+i,y-i,moves,from,direction[1]);
      direction[2] = this.diag_calc(x-i,y+i,moves,from,direction[2]);
      direction[3] = this.diag_calc(x-i,y-i,moves,from,direction[3]);
    }
    return moves;
  }
  queen_moves(from, test=false) {
    let color = (this.turn % 2===0) ? WHITE : BLACK;
    let moves = [];
    let [x, y] = Game.nonlinear(from);
    let direction = [true, true, true, true];
    for (let i = 1; i < SQUARES_W; i++) {
      direction[0] = this.diag_calc(x+i,y+i,moves,from,direction[0]);
      direction[1] = this.diag_calc(x+i,y-i,moves,from,direction[1]);
      direction[2] = this.diag_calc(x-i,y+i,moves,from,direction[2]);
      direction[3] = this.diag_calc(x-i,y-i,moves,from,direction[3]);
    }
    for (let i=from-1; i>=from-x; i--) {
      if (this.get_type(i)===EMPTY) {
        moves.push(new Move(from,i,this.get_type(i)));
      }
      else {
        if (this.get_color(i)!==color) {
          moves.push(new Move(from,i,this.get_type(i)));
        }
        break;
      }
    }
    for (let i=from+1; i<(y*SQUARES_W)+8; i++) {
      if (this.get_type(i)===EMPTY) {
        moves.push(new Move(from,i,this.get_type(i)));
      }
      else {
        if (this.get_color(i)!==color) {
          moves.push(new Move(from,i,this.get_type(i)));
        }
        break;
      }
    }
    // column check
    for (let i=from-SQUARES_W; i>=x; i-=SQUARES_W) {
      if (this.get_type(i) === EMPTY) {
        moves.push(new Move(from,i,this.get_type(i)));
      }
      else {
        if (this.get_color(i)!==color) {
          moves.push(new Move(from,i,this.get_type(i)));
        }
        break;
      }
    }
    for (let i=from+SQUARES_W; i<(SQUARES_W*SQUARES_H); i+=SQUARES_W) {
      if (this.get_type(i) === EMPTY) {
        moves.push(new Move(from,i,this.get_type(i)));
      }
      else {
        if (this.get_color(i)!==color) {
          moves.push(new Move(from,i,this.get_type(i)));
        }
        break;
      }
    }
    return moves;
  }
  knight_moves(from, test=false) {
    let color = (this.turn % 2===0) ? WHITE : BLACK;
    let moves = [];
    let [x,y] = Game.nonlinear(from);
    let x_mov, y_mov, lin_pos;
    for (let i=-2;i<3;i++) {
      for (let j=-2;j<3;j++) {
        if (i===0 || j===0 || Math.abs(i)===Math.abs(j))
          continue;
        [x_mov,y_mov] = [x+i, y+j];
        lin_pos = Game.linear(x_mov,y_mov);
        if (Game.in_bound(x_mov,y_mov) && (this.get_type(lin_pos)===EMPTY || this.get_color(lin_pos)!==color))
          moves.push(new Move(from,lin_pos,this.get_type(lin_pos)));
      }
    }
    return moves;
  }
  rook_moves(from, test=false) {
    let color = this.get_color(from);
    let moves = [];
    let [x, y] = Game.nonlinear(from);
    let special = 0;
    // row check
    for (let i=from-1; i>=from-x; i--) {
      if (this.get_type(i)===EMPTY) {
        special = (special===0) ? this.get_type(i) : special;
        moves.push(new Move(from,i,special));
      }
      else {
        if (this.get_color(i)!==color) {
          special = (special===0) ? this.get_type(i) : special;
          moves.push(new Move(from,i,special));
        }
        break;
      }
    }
    for (let i = from+1; i<(y*SQUARES_W)+8; i++) {
      if (this.get_type(i)===EMPTY) {
        special = (special===0) ? this.get_type(i) : special;
        moves.push(new Move(from,i,special));
      }
      else {
        if (this.get_color(i)!==color) {
          special = (special===0) ? this.get_type(i) : special;
          moves.push(new Move(from,i,special));
        }
        break;
      }
    }
    // column check
    for (let i=from-SQUARES_W; i>=x; i-=SQUARES_W) {
      if (this.get_type(i)===EMPTY) {
        special = (special===0) ? this.get_type(i) : special;
        moves.push(new Move(from,i,special));
      }
      else {
        if (this.get_color(i)!==color) {
          special = (special===0) ? this.get_type(i) : special;
          moves.push(new Move(from,i,special));
        }
        break;
      }
    }
    for (let i=from+SQUARES_W; i<(SQUARES_W*SQUARES_H); i+=SQUARES_W) {
      if (this.get_type(i)===EMPTY) {
        special = (special===0) ? this.get_type(i) : special;
        moves.push(new Move(from,i,special));
      }
      else {
        if (this.get_color(i)!==color) {
          special = (special===0) ? this.get_type(i) : special;
          moves.push(new Move(from,i,special));
        }
        break;
      }
    }
    return moves;
  }
  filter_moves(color, moves) {
    let good_moves = [];
    for (let mov of moves) {
      this.move(mov);
      if (!this.under_attack(color, this.king_pos(color))) {
        good_moves.push(mov);
      }
      this.unmove();
    }
    return good_moves;
  }
  all_moves(test=false) {
    let moves = [];
    let color = (this.turn % 2===0) ? WHITE : BLACK;
    for (let pos=0; pos<SQUARES_H*SQUARES_W;pos++) {
      if (this.get_color(pos)===color) {
      if (this.get_type(pos)===KING) { 
        moves.push(...this.king_moves(pos,test)); }
      else if (this.get_type(pos)===QUEEN) { 
        moves.push(...this.queen_moves(pos,test)); }
      else if (this.get_type(pos)===ROOK) { 
        moves.push(...this.rook_moves(pos,test)); }
      else if (this.get_type(pos)===KNIGHT) {
        moves.push(...this.knight_moves(pos,test)); }
      else if (this.get_type(pos)===BISHOP) { 
        moves.push(...this.bishop_moves(pos,test)); }
      else if (this.get_type(pos)===PAWN) { 
        moves.push(...this.pawn_moves(pos,test)); }
      }
    }
    return this.filter_moves(color, moves);
  }
  moves_from(from) {
    let moves = [];
    let color = this.get_color(from);
    if (this.get_type(from)===ROOK)        { moves = this.rook_moves(from,true); }
    else if (this.get_type(from)===KNIGHT) { moves = this.knight_moves(from,true); }
    else if (this.get_type(from)===BISHOP) { moves = this.bishop_moves(from, true); }
    else if (this.get_type(from)===KING)   { moves = this.king_moves(from,true); }
    else if (this.get_type(from)===QUEEN)  { moves = this.queen_moves(from, true); }
    else if (this.get_type(from)===PAWN)   { moves = this.pawn_moves(from, true); }
    return this.filter_moves(color, moves);
  }
  move(mov, main=true) {
    if (main) this.history.push(this.duplicate());
    this.enpeasant = -1;
    if (this.get_type(mov.FROM)===PAWN) {
      let [x_to, y_to] = Game.nonlinear(mov.TO);
      if (Math.abs(mov.TO-mov.FROM) === 16) {
        this.enpeasant = (this.get_color(mov.FROM)===WHITE) ? mov.TO + 8 : mov.TO - 8;;
      }
      else if (y_to===0 || y_to===7) {
        switch(mov.SPECIAL) {
          case Q_PROM:
            this.set_type(mov.FROM, QUEEN);
            break;
          case B_PROM:
            this.set_type(mov.FROM, BISHOP);
            break;
          case K_PROM:
            this.set_type(mov.FROM, KNIGHT);
            break;
          case R_PROM:
            this.set_type(mov.FROM, ROOK);
            break;
        }
        if ((mov.TO===63 && this.castles[WCS]===1)
         || (mov.TO===56 && this.castles[WCL]===1) 
         || (mov.TO===7  && this.castles[BCS]===1) 
         || (mov.TO===0  && this.castles[BCL]===1)) {
        }
      }
      else {
        if (mov.SPECIAL===ONPEASANT) {
          let pos = (this.get_color(mov.FROM)===WHITE) ? mov.TO + 8 : mov.TO - 8;
          this.set_type(pos, EMPTY);
          this.set_color(pos, NONE);
        }
      }
    }
    else if (this.get_type(mov.FROM)===ROOK) {
      if      (mov.FROM===63) { this.castles[WCS] = 0; }
      else if (mov.FROM===56) { this.castles[WCL] = 0; }
      else if (mov.FROM===7)  { this.castles[BCS] = 0; }
      else if (mov.FROM===0)  { this.castles[BCL] = 0; }
    }
    else if (this.get_type(mov.FROM)===KING) {
      if (this.get_color(mov.FROM)===WHITE) {
        this.castles[WCS] = 0;
        this.castles[WCL] = 0;
        this.wk_pos = mov.TO;
      }
      else {
        this.castles[BCS] = 0;
        this.castles[BCL] = 0;
        this.bk_pos = mov.TO;
      }
    }
    this.set_type(mov.TO, this.get_type(mov.FROM));
    this.set_color(mov.TO, this.get_color(mov.FROM));
    this.set_type(mov.FROM ,EMPTY);
    this.set_color(mov.FROM, NONE);
    // castling
    if (mov.SPECIAL>=WCS_MOV && mov.SPECIAL<=BCL_MOV) {
      let rook_pos, r_mov;
      switch(mov.SPECIAL) {
        case WCS_MOV:
          r_mov = mov.FROM + 1;
          rook_pos = 63;
          break;
        case WCL_MOV:
          r_mov = mov.FROM - 1;
          rook_pos = 56;
          break;
        case BCS_MOV:
          r_mov = mov.FROM + 1;
          rook_pos = 7;
          break;
        case BCL_MOV:
          r_mov = mov.FROM - 1;
          rook_pos = 0;
          break;
      }
      this.set_type(rook_pos ,EMPTY);
      this.set_color(rook_pos, NONE);
      this.set_type(r_mov ,ROOK);
      this.set_color(r_mov, this.get_color(mov.TO));
    }
    if      (mov.TO===63) { this.castles[WCS] = 0; }
    else if (mov.TO===56) { this.castles[WCL] = 0; }
    else if (mov.TO===7)  { this.castles[BCS] = 0; }
    else if (mov.TO===0)  { this.castles[BCL] = 0; }
    this.turn += 1;
  }
  
  unmove() {
    let temp = this.history.pop();
    this.board_type = temp.board_type;
    this.board_color = temp.board_color;
    this.enpeasant = temp.enpeasant;
    this.turn = temp.turn;
    this.castles = temp.castles;
    this.game_over = temp.game_over;
    this.wk_pos = temp.wk_pos;
    this.bk_pos = temp.bk_pos;
  }
  
  static in_bound(x, y) {
    return (x >= 0 && x < SQUARES_W && y >= 0 && y < SQUARES_H);
  }
  static linear(x, y) {
    return ((SQUARES_H*y)+x);
  }
  static nonlinear(z) {
    let x = z % SQUARES_W;
    let y = (z / SQUARES_H) | 0;
    return [x, y];
  }
  static convert(string) {
    if (string==="") return [null,null,null,null,null];
    let str_split = string.split(' ');
    let turn = (str_split[1] === "w") ? 0 : 1;
    let castles = [0,0,0,0];
    for (let char of str_split[2]) {
      if (char==="K") castles[0]=1;
      else if (char==="Q") castles[1]=1;
      else if (char==="k") castles[2]=1;
      else if (char==="q") castles[3]=1;
    }
    let enpeas = -1;
    if (str_split[3]!=="-") {
      const x = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7, };
      enpeas = Game.linear(x[str_split[3].charAt(0)], 7-(parseInt(str_split[3].charAt(1)-1)))
    }
    let arr_type = [];
    let arr_color = [];
    let curr_char, type, color, upper, wk_pos, bk_pos;
    let count = 0;
    for (let i = 0; i < str_split[0].length; i++) {
      curr_char = str_split[0].toString().charAt(i);
      if (curr_char==="/") continue;
      if (!isNaN(parseInt(curr_char))) {
        for (let j = 0; j < parseInt(curr_char); j++) {
          arr_type.push(EMPTY);
          arr_color.push(NONE);
          count += 1;
        }
        continue;
      }
      upper = curr_char.toUpperCase();
      color = (upper===curr_char) ? WHITE : BLACK;
      if (upper==="R") type = ROOK;
      else if (upper==="Q") type = QUEEN;
      else if (upper==="K") {
        type = KING;
        if (color===WHITE) wk_pos=count;
        else bk_pos=count;
      }
      else if (upper==="B") type = BISHOP;
      else if (upper==="N") type = KNIGHT;
      else if (upper==="P") type = PAWN;
      arr_type.push(type);
      arr_color.push(color);
      count += 1;
    }
    return [arr_type, arr_color, wk_pos, bk_pos, turn, castles, enpeas];
  }
  duplicate() {
    let ret = new Game("");
    ret.board_type = this.board_type.slice(0);
    ret.board_color = this.board_color.slice(0);
    ret.enpeasant = this.enpeasant;
    ret.turn = this.turn;
    ret.game_over = this.game_over;
    ret.castles = this.castles.slice(0);
    ret.wk_pos = this.wk_pos;
    ret.bk_pos = this.bk_pos;
    return ret;
  }
  copy(other) {
    this.board_type = other.board_type.slice(0);
    this.board_color = other.board_color.slice(0);
    this.enpeasant = other.enpeasant;
    this.turn = other.turn;
    this.game_over = other.game_over;
    this.castles = other.castles.slice(0);
    this.wk_pos = other.wk_pos;
    this.bk_pos = other.bk_pos;
  }
}