import {chess_state,Q_PROM,R_PROM,B_PROM,K_PROM,
        WHITE,BLACK,EMPTY,w_squares,h_squares} from "./chess_class.js";
const c = document.getElementById("chessBoard");
c.onselectstart = function () { return false; }
const ctx = c.getContext("2d");
const width = c.width/w_squares;
const height = c.height/h_squares;
const checkb_color = "blue";
const border_color = "black";
const selected_color = "yellow";
const sq_lcolor = "#ff7a39";
const sq_dcolor = "green";
const highlight_color = "red";
const piece_set = "anarcandy";
const images = {"11" : loadImage(`/assets/pieces/${piece_set}/bR.svg`),
                "12" : loadImage(`/assets/pieces/${piece_set}/bN.svg`),
                "13" : loadImage(`/assets/pieces/${piece_set}/bK.svg`),
                "14" : loadImage(`/assets/pieces/${piece_set}/bP.svg`),
                "15" : loadImage(`/assets/pieces/${piece_set}/bQ.svg`),
                "16" : loadImage(`/assets/pieces/${piece_set}/bB.svg`),
                "01" : loadImage(`/assets/pieces/${piece_set}/wR.svg`),
                "02" : loadImage(`/assets/pieces/${piece_set}/wN.svg`),
                "03" : loadImage(`/assets/pieces/${piece_set}/wK.svg`),
                "04" : loadImage(`/assets/pieces/${piece_set}/wP.svg`),
                "05" : loadImage(`/assets/pieces/${piece_set}/wQ.svg`),
                "06" : loadImage(`/assets/pieces/${piece_set}/wB.svg`),};
const audio = {"move": new Audio("/assets/sound/move.wav")};


// default: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR
let main_state = new chess_state("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -");
let moves_highlight = [];
let recent_from = -1;
let recent_to = -1;
let selected = -1;
let black_checked = false;
let white_checked = false;
let flipped = false;
let promote_piece = 2;

function promote(input) {
  promote_piece = input;
}
function pickColor(input) {
  return;
}
function flip() {
  flipped = !flipped;
  selected = -1;
  moves_highlight = [];
  render_state();
}
function loadImage(url) {
  return new Promise(r => { let i = new Image(); i.onload = (() => r(i)); i.src = url; });
}


////////////////////////////////////////////////////////////////////

function render_board() {
  let WK_POS = main_state.king_positions[WHITE];
  let BK_POS = main_state.king_positions[BLACK];
  for (let i = 0; i < w_squares; i++) {
    for (let j = 0; j < h_squares; j++) {
      let [x,y] = (flipped) ? [7-i,7-j] : [i,j]; 
      let pos = chess_state.linear(x,y);
      ctx.fillStyle =  border_color;
      ctx.fillRect(i*width,j*height,width,height);
      ctx.fillStyle = ((pos===WK_POS && white_checked) || (pos===BK_POS && black_checked)) ? checkb_color : ((j % 2 === i % 2) ? sq_lcolor : sq_dcolor);
      if (selected === pos) ctx.fillStyle = selected_color;
      else if (findSelected(moves_highlight, pos) !== null) ctx.fillStyle = highlight_color;
      ctx.fillRect(i*width,j*height,width-1,height-1);
    }
  }
}
async function render_state() {
  render_board();
  for (let i in main_state.board) {
    if (main_state.board[i].TYPE===EMPTY) {
      continue;
    };
    let [x, y] = chess_state.nonlinear(i);
    [x, y] = (flipped) ? [7-x,7-y] : [x,y];
    let str = main_state.board[i].COLOR + "" + main_state.board[i].TYPE;
    let img = await images[str];
    ctx.drawImage(img, (x*width)+(width/16), (y*height)+(width/16), c.width/9, c.height/9);
  }
}
function findSelected(moves, pos) {
  for (let mov of moves) {
    if (mov[1] === pos) {
      return mov;
    }
  }
  return null;
}
function bind_buttons() {
  let buttons = document.getElementById("flipbtn");
  buttons.addEventListener("click", () => {
    flip();
  });
  buttons = document.querySelectorAll(".dropdown-content > a");
  for (let btn of buttons) {
    btn.addEventListener("click", (e) => {
      if (btn.innerHTML==="Queen") { promote_piece=Q_PROM; }
      else if (btn.innerHTML==="Bishop")  { promote_piece=B_PROM; }
      else if (btn.innerHTML==="Knight") { promote_piece=K_PROM; }
      else if (btn.innerHTML==="Rook") { promote_piece=R_PROM; }
      for (let opt of buttons) {
        opt.style["background-color"] = "";
      }
      e.target.style["background-color"] = "#aaff80";
    })
  }
}
function bind_click() {
  c.addEventListener("mousedown", function(e) {
    let rect = c.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / width) | 0;
    let y = ((e.clientY - rect.top) / height) | 0;
    if (x > 7 || y > 7) return;
    let player = (main_state.turn % 2 === 0) ? WHITE : BLACK;
    [x, y] = (flipped) ? [7-x,7-y] : [x,y];
    let position = chess_state.linear(x, y);
    if (selected===-1 && main_state.board[position].TYPE!==EMPTY && main_state.board[position].COLOR===player) {
      selected = position;
      moves_highlight = main_state.movesFrom(position);
      if(moves_highlight.length<1) selected = -1;
    }
    else if (selected!==-1) {
      let mov = findSelected(moves_highlight, position);
      if (mov !== null) {
        if (mov[2] >= Q_PROM && mov[2] <= R_PROM) {
          mov[2] = promote_piece;
        }
        main_state.move(mov);
        audio["move"].play();
        if (player===BLACK) {
          black_checked = false;
          white_checked = main_state.underAttack(WHITE, main_state.king_positions[WHITE]);
        }
        else {
          white_checked = false;
          black_checked = main_state.underAttack(BLACK, main_state.king_positions[BLACK]);
        }
      }
      selected = -1;
      moves_highlight = [];
    }
    render_state();
  });
}

function init() {
  bind_buttons();
  render_state();
  bind_click();
}
window.addEventListener("DOMContentLoaded", init());
