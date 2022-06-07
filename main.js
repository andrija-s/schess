import {Game,Q_PROM,R_PROM,B_PROM,K_PROM, ONPEASANT,
        WHITE,BLACK,EMPTY,w_squares,h_squares} from "./scripts/game.js";
import {ai} from "./scripts/ai.js";


const c_width = 700;
const c_height = 700;
const width = c_width/w_squares;
const height = c_height/h_squares;
const checkb_color = "blue";
const border_color = "black";
const selected_color = "yellow";
const sq_lcolor = "#ff7a39";
const sq_dcolor = "green";
const highlight_color = "red";
const sq_from ="teal";
const sq_to ="aqua";
const piece_set = "anarcandy";
const images = {};
const audio = {"move": new Audio("./assets/sound/move.wav")};
// default: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR
const DEFAULT = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -";

let main_state = null;
let player = WHITE;
let moves_highlight = [];
let recent_from = -1;
let recent_to = -1;
let selected = -1;
let black_checked = false;
let white_checked = false;
let flipped = false;
let promote_piece = Q_PROM;
let c = null; // canvas element
let ctx = null;
////////////////////////////////////////////////////////////////////
async function init() {
  c = document.createElement("canvas");
  let attrs = { 
                id: "chessBoard", 
                width: c_width, 
                height: c_height, 
                style: "border:2px solid #913c3c; position:absolute; top:60px; left:250px;"
              };
  for(let key in attrs) {
    c.setAttribute(key, attrs[key]);
  };
  c.onselectstart = function () { return false; }
  document.body.appendChild(c);
  ctx = c.getContext("2d");
  await init_images(images);
  reset();
  bind_buttons();
  bind_click();

}

window.addEventListener("DOMContentLoaded", init());
////////////////////////////////////////////////////////////////////

// yet to be used
function promote(input) {
  promote_piece = input;
}
// yet to be used
function pickColor(input) {
  return;
}

function flip() {
  flipped = !flipped;
  selected = -1;
  moves_highlight = [];
  render_state();
}

function load_image(url) {
  return new Promise(r => { let i = new Image(); i.onload = (() => r(i)); i.src = url; });
}

async function init_images(dict) {
  dict["11"] = await load_image(`./assets/pieces/${piece_set}/bR.svg`);
  dict["12"] = await load_image(`./assets/pieces/${piece_set}/bN.svg`);
  dict["13"] = await load_image(`./assets/pieces/${piece_set}/bK.svg`);
  dict["14"] = await load_image(`./assets/pieces/${piece_set}/bP.svg`);
  dict["15"] = await load_image(`./assets/pieces/${piece_set}/bQ.svg`);
  dict["16"] = await load_image(`./assets/pieces/${piece_set}/bB.svg`);
  dict["01"] = await load_image(`./assets/pieces/${piece_set}/wR.svg`);
  dict["02"] = await load_image(`./assets/pieces/${piece_set}/wN.svg`);
  dict["03"] = await load_image(`./assets/pieces/${piece_set}/wK.svg`);
  dict["04"] = await load_image(`./assets/pieces/${piece_set}/wP.svg`);
  dict["05"] = await load_image(`./assets/pieces/${piece_set}/wQ.svg`);
  dict["06"] = await load_image(`./assets/pieces/${piece_set}/wB.svg`);
}

function render_board() {
  let WK_POS = main_state.king_positions[WHITE];
  let BK_POS = main_state.king_positions[BLACK];
  for (let i = 0; i < w_squares; i++) {
    for (let j = 0; j < h_squares; j++) {
      let [x,y] = (flipped) ? [7-i,7-j] : [i,j]; 
      let pos = Game.linear(x,y);
      ctx.fillStyle =  border_color;
      ctx.fillRect(i*width,j*height,width,height);
      ctx.fillStyle = ((pos===WK_POS && white_checked) || (pos===BK_POS && black_checked)) ? checkb_color : ((j % 2 === i % 2) ? sq_lcolor : sq_dcolor);
      if (selected === pos) ctx.fillStyle = selected_color;
      else if (findSelected(moves_highlight, pos) !== null) ctx.fillStyle = highlight_color;
      else if (pos === recent_from) ctx.fillStyle = sq_from;
      else if (pos === recent_to) ctx.fillStyle = sq_to;
      ctx.fillRect(i*width,j*height,width-1,height-1);
    }
  }
}

function render_state() {
  render_board();
  for (let i in main_state.board) {
    if (main_state.board[i].TYPE===EMPTY) {
      continue;
    };
    let [x, y] = Game.nonlinear(i);
    [x, y] = (flipped) ? [7-x,7-y] : [x,y];
    let str = main_state.board[i].COLOR + "" + main_state.board[i].TYPE;
    let img = images[str];
    ctx.drawImage(img, (x*width)+(width/16), (y*height)+(width/16), c.width/9, c.height/9);
  }
}

function findSelected(moves, pos) {
  for (let mov of moves) {
    if (mov.TO === pos) {
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
  let iter = document.querySelectorAll(".dropdown-content > a");
  for (let btn of iter) {
    btn.addEventListener("click", (e) => {
      if (btn.innerHTML==="Queen") { promote_piece=Q_PROM; }
      else if (btn.innerHTML==="Bishop")  { promote_piece=B_PROM; }
      else if (btn.innerHTML==="Knight") { promote_piece=K_PROM; }
      else if (btn.innerHTML==="Rook") { promote_piece=R_PROM; }
      for (let opt of iter) {
        opt.style["background-color"] = "";
      }
      e.target.style["background-color"] = "#aaff80";
    })
  }
  buttons = document.getElementById("resetbtn");
  buttons.addEventListener("click", () => {
    reset();
  });
  buttons = document.getElementById("changebtn");
  buttons.addEventListener("click", () => {
    change_color();
  });
}

function move_ai(color) {
  let time = Date.now();
  let ai_move = ai(12, main_state, color);
  time = ((Date.now() - time) / 1000).toFixed(2);
  console.log(time, ai_move);
  if (ai_move[1] !== null) {
    main_state.move(ai_move[1]);
    recent_from = ai_move[1].FROM;
    recent_to = ai_move[1].TO;
    if (ai_move[0]==Number.POSITIVE_INFINITY && main_state.allMoves(true).length===0) {
      alert("YOU LOSE!");
    }
  }
  else {
    recent_from = -1;
    recent_to = -1;
    if (ai_move[0]===0) alert("DRAW!");
    else if (ai_move[0]<0) alert("YOU WIN!");
  }
}

function reset() {
  main_state = new Game(DEFAULT);
  moves_highlight = [];
  recent_from = -1;
  recent_to = -1;
  selected = -1;
  black_checked = false;
  white_checked = false;
  if (player===BLACK) {
    move_ai(WHITE);
  }
  render_state();
}

function change_color() {
  player = (player===WHITE) ? BLACK : WHITE;
  reset();
}

function set_check() {
  white_checked = main_state.underAttack(WHITE, main_state.king_positions[WHITE]);
  black_checked = main_state.underAttack(BLACK, main_state.king_positions[BLACK]);
}

function bind_click() {
  c.addEventListener("mousedown", function(e) {
    let rect = c.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / width) | 0;
    let y = ((e.clientY - rect.top) / height) | 0;
    if (x > 7 || y > 7) return;
    [x, y] = (flipped) ? [7-x,7-y] : [x,y];
    let position = Game.linear(x, y);
    if (selected===-1 && main_state.board[position].TYPE!==EMPTY
        && main_state.board[position].COLOR===player) {
      selected = position;
      moves_highlight = main_state.movesFrom(position);
      if(moves_highlight.length<1) selected = -1;
    }
    else if (selected!==-1) {
      let mov = findSelected(moves_highlight, position);
      if (mov !== null) {
        let ai_color = (player === WHITE) ? BLACK : WHITE;
        if (mov.SPECIAL >= Q_PROM && mov.SPECIAL <= R_PROM) {
          mov.SPECIAL = promote_piece;
        }
        if (main_state.board[mov.TO].TYPE !== EMPTY || mov.SPECIAL === ONPEASANT) {
          audio["move"].play();
        }
        else {
          audio["move"].play();
        }
        main_state.move(mov);
        moves_highlight = [];
        selected = -1
        set_check();
        render_state();
        setTimeout(() => {
          move_ai(ai_color);
          set_check();
        }, 0);
      }
      selected = -1;
      moves_highlight = [];
    }
    setTimeout(() => {
          render_state();
    }, 0);
  });
}



/* {"11" : load_image(`./assets/pieces/${piece_set}/bR.svg`),
    "12" : load_image(`./assets/pieces/${piece_set}/bN.svg`),
    "13" : load_image(`./assets/pieces/${piece_set}/bK.svg`),
    "14" : load_image(`./assets/pieces/${piece_set}/bP.svg`),
    "15" : load_image(`./assets/pieces/${piece_set}/bQ.svg`),
    "16" : load_image(`./assets/pieces/${piece_set}/bB.svg`),
    "01" : load_image(`./assets/pieces/${piece_set}/wR.svg`),
    "02" : load_image(`./assets/pieces/${piece_set}/wN.svg`),
    "03" : load_image(`./assets/pieces/${piece_set}/wK.svg`),
    "04" : load_image(`./assets/pieces/${piece_set}/wP.svg`),
    "05" : load_image(`./assets/pieces/${piece_set}/wQ.svg`),
    "06" : load_image(`./assets/pieces/${piece_set}/wB.svg`),} */
