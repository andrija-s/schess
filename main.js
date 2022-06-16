import { Game,
         Q_PROM, R_PROM, B_PROM, K_PROM, ONPEASANT,
         WHITE, BLACK, EMPTY,
         SQUARES_W, SQUARES_H,
         PAWN, BISHOP, ROOK, QUEEN, KING, KNIGHT } from "./scripts/game.js";


const c_height = window.innerHeight / 1.1; // canvas height
const c_width = c_height;  // canvas width
const width = c_width/SQUARES_W;   // square width
const height = c_height/SQUARES_H; // square height
const PROM_IMG_W = SQUARES_W+3;
const PROM_IMG_H = SQUARES_H+3;
const btn_highl = "#d4d422";
const check_color = "yellow";
const border_color = "black"; // square border
const selected_color = "goldenrod";
const sq_lcolor = "#ff7a39"; // square light
const sq_dcolor = "brown";   // square dark
const highlight_color = "navajowhite"; // move highlight
const sq_from ="teal";
const sq_to ="aqua";
const piece_sets = ["alpha", "anarcandy", "cburnett", "chessnut", "kosal", "maestro", "merida"];
const images = {}; // piece images
const audio = {};
const ai_vals = [ 1, 2, 3, 4, 5 ];
const promotes = { 
  "Q":  Q_PROM,
  "R":   R_PROM,
  "N": K_PROM,
  "B": B_PROM 
};

let prom_move = null;
let curr_set = "kosal";
let worker = null
let main_state = null;
let player = WHITE;
let moves_highlight = [];
let recent_from = -1;
let recent_to = -1;
let selected = -1;
let is_black_checked = false;
let is_white_checked = false;
let is_flipped = false;
let c = null; // canvas element
let ctx = null; // canvas context
let evaluation = 0;
let can_move = true;
let ai_time = 0.0;
let curr_depth = 3;

// TODO
function promote(input) {
  promote_piece = input;
}
// TODO
function pick_color(input) {
  return;
}
/**
 * 
 * @param {Array} moves array of Move objects 
 * @param {Number} pos position of target move
 * @returns Move
 */
function selected_move(moves, pos) {
  for (let mov of moves) {
    if (mov.TO === pos) {
      return mov;
    }
  }
  return null;
}

function render_board() {
  for (let i = 0; i < SQUARES_W; i++) {
    for (let j = 0; j < SQUARES_H; j++) {
      let [x,y] = (is_flipped) ? [7-i,7-j] : [i,j]; 
      let pos = Game.linear(x,y);
      ctx.fillStyle =  border_color;
      ctx.fillRect(i*width,j*height,width,height);
      ctx.fillStyle = ((pos===main_state.wk_pos && is_white_checked) 
                      || (pos===main_state.bk_pos && is_black_checked)) 
                      ? check_color : 
                        ((j % 2 === i % 2) ? sq_lcolor : sq_dcolor);
      if (selected === pos) ctx.fillStyle = selected_color;
      else if (selected_move(moves_highlight, pos) !== null) ctx.fillStyle = highlight_color;
      else if (pos === recent_from) ctx.fillStyle = sq_from;
      else if (pos === recent_to) ctx.fillStyle = sq_to;
      ctx.fillRect(i*width,j*height,width-1,height-1);
    }
  }
}

async function render_state() {
  render_board();
  for (let i=0; i<SQUARES_H*SQUARES_W; i++) {
    if (main_state.get_type(i)===EMPTY) {
      continue;
    };
    let [x, y] = Game.nonlinear(i);
    [x, y] = (is_flipped) ? [7-x,7-y] : [x,y];
    let str = main_state.get_color(i) + "" + main_state.get_type(i);
    let img = images[str];
    ctx.drawImage(img, (x*width)+(width/(SQUARES_W+SQUARES_W)), (y*height)+(height/(SQUARES_H+SQUARES_H)), c.width/(SQUARES_W+1), c.height/(SQUARES_H+1));
  }
}

async function flip(change=false) {
  if (change && ((is_flipped && player===BLACK) || (!is_flipped && player===WHITE))) return;
  is_flipped = !is_flipped;
  if(can_move) selected = -1;
  moves_highlight = [];
  await render_state();
}

function load_image(url) {
  return new Promise((resolve, reject) => { 
                        let i = new Image(); 
                        i.addEventListener('load', () => resolve(i));
                        i.addEventListener('error', (err) => reject(err));
                        i.src = url; 
                      });
}

async function init_images(set) {
  images[""+BLACK+ROOK]   = await load_image(`./assets/pieces/${set}/bR.svg`);
  images[""+BLACK+KNIGHT] = await load_image(`./assets/pieces/${set}/bN.svg`);
  images[""+BLACK+KING]   = await load_image(`./assets/pieces/${set}/bK.svg`);
  images[""+BLACK+PAWN]   = await load_image(`./assets/pieces/${set}/bP.svg`);
  images[""+BLACK+QUEEN]  = await load_image(`./assets/pieces/${set}/bQ.svg`);
  images[""+BLACK+BISHOP] = await load_image(`./assets/pieces/${set}/bB.svg`);
  images[""+WHITE+ROOK]   = await load_image(`./assets/pieces/${set}/wR.svg`);
  images[""+WHITE+KNIGHT] = await load_image(`./assets/pieces/${set}/wN.svg`);
  images[""+WHITE+KING]   = await load_image(`./assets/pieces/${set}/wK.svg`);
  images[""+WHITE+PAWN]   = await load_image(`./assets/pieces/${set}/wP.svg`);
  images[""+WHITE+QUEEN]  = await load_image(`./assets/pieces/${set}/wQ.svg`);
  images[""+WHITE+BISHOP] = await load_image(`./assets/pieces/${set}/wB.svg`);
}

async function init_audio() {
  audio["move"] = new Audio("./assets/sound/move.wav");
}

function reset_highlight(iter) {
  for (let opt of iter.children) {
        opt.style["background-color"] = "";
  }
}

function set_worker() {
  worker = new Worker("./scripts/ai.js", { type: "module" });
  worker.onmessage = ai_done;
}

async function reset() {
  if (worker !== null)  worker.terminate();
  set_worker();
  hide_prom();
  main_state = new Game();
  moves_highlight = [];
  recent_from = -1;
  recent_to = -1;
  selected = -1;
  is_black_checked = false;
  is_white_checked = false;
  can_move = true;
  if (player===BLACK) {
    move_ai(WHITE);
  }
  await render_state();
}
function prom_images() {
  let color = (player===WHITE) ? "w" : "b";
  for (let prom of document.getElementById("drop-prom").children) {
    prom.innerHTML = `<img src="./assets/pieces/${curr_set}/${color}${prom.id}.svg" width="${c.width/PROM_IMG_W}" height="${c.height/PROM_IMG_H}"/>`;
  }
}
function change_color() {
  player = (player===WHITE) ? BLACK : WHITE;
  prom_images();
  reset();
}

function hide_prom() {
  document.querySelector(".proms").style.display = "none";
}

function bind_buttons() {

  let ai_iter = document.getElementById("drop-ai");
  for (let i=0; i<ai_vals.length; i++) {
    let tag = document.createElement("a");
    tag.innerHTML = "Depth " + ai_vals[i];
    if (tag.innerHTML==="Depth " + curr_depth) tag.style["background-color"] = btn_highl;
    tag.addEventListener("click", (e) => {
      if (tag.innerHTML==="Depth " + curr_depth) { return; }
      reset_highlight(ai_iter);
      e.target.style["background-color"] = btn_highl;
      curr_depth = ai_vals[i];
    });
    ai_iter.appendChild(tag);
  }
  let flip_btn = document.getElementById("flipbtn");
  flip_btn.addEventListener("click", () => {
    flip();
  });

  let prom_iter = document.getElementById("drop-prom");
  for (const piece in promotes) {
    let tag = document.createElement("a");
    tag.id = piece
    tag.addEventListener("click", () => {
      prom_move.SPECIAL = promotes[piece];
      conclude_move(prom_move);
      hide_prom();
    });
    prom_iter.appendChild(tag);
  }
  prom_images();
  let set_iter = document.getElementById("drop-sets");
  for (const set of piece_sets) {
    let tag = document.createElement("a");
    tag.innerHTML = set;
    if (tag.innerHTML===curr_set) tag.style["background-color"] = btn_highl;
    tag.addEventListener("click", async function(e) {
      if (tag.innerHTML===curr_set) { return; }
      try { await init_images(tag.innerHTML); }
      catch(e) { return; }
      curr_set = tag.innerHTML;
      reset_highlight(set_iter);
      e.target.style["background-color"] = btn_highl;
      prom_images();
      await render_state();
    });
    set_iter.appendChild(tag);
  }

  let reset_btn = document.getElementById("resetbtn");
  reset_btn.addEventListener("click", () => {
    reset();
  });

  let change_btn = document.getElementById("changebtn");
  change_btn.addEventListener("click", () => {
    change_color();
    flip(true);
  });
}


function set_check() {
  is_white_checked = main_state.under_attack(WHITE, main_state.king_pos(WHITE));
  is_black_checked = main_state.under_attack(BLACK, main_state.king_pos(BLACK));
}

async function ai_done(event) {
  let ai_move = event.data;
  evaluation = ai_move[0].toFixed(2) * ((player===WHITE) ? -1 : 1);
  let time = ((Date.now() - ai_time) / 1000).toFixed(2);
  console.log("depth base: %d\n%f secs\neval: %f\nmove: %O\nleaf nodes:%i", 
              curr_depth, time, evaluation, ai_move[1], ai_move[2]);

  if (ai_move[1] !== null) {
    main_state.move(ai_move[1]);
    play_audio(ai_move[1]);
    recent_from = ai_move[1].FROM;
    recent_to = ai_move[1].TO;
    if (main_state.all_moves(true).length===0) {
      if (ai_move[0]==Number.POSITIVE_INFINITY) {
        alert("YOU LOSE!");
      }
      else {
        alert("DRAW!");
      }
      main_state.game_over = true;
    }
  }
  else {
    recent_from = -1;
    recent_to = -1;
    if (ai_move[0]===0) alert("DRAW!");
    else if (ai_move[0]<0) alert("YOU WIN!");
    main_state.game_over = true;
  }
  if (!main_state.game_over) {
    can_move = true;
  }
  set_check();
  await render_state();
}
/**
 * @param {Number} color 
 */
function move_ai(color) {
  can_move = false;
  ai_time = Date.now();
  worker.postMessage(
   { 
    depth: curr_depth,
    state: main_state,
    color: color }
  );
}
/**
 * @param {Move} move 
 */
function play_audio(move) {
  if (main_state.get_type(move.TO)!==EMPTY || move.SPECIAL===ONPEASANT) {
    audio["move"].play();
  }
  else {
    audio["move"].play();
  }
}
/**
 * @param {Move} move 
 */
async function conclude_move(move) {
  let ai_color = (player===WHITE) ? BLACK : WHITE;
  play_audio(move);
  main_state.move(move);
  moves_highlight = [];
  selected = -1
  set_check();
  await render_state();
  move_ai(ai_color);
  await render_state();
}
function bind_click() {
  c.addEventListener("mousedown", async function(e) {
    if (main_state.game_over || !can_move) return;
    let rect = c.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / width) | 0;
    let y = ((e.clientY - rect.top) / height) | 0;
    if (x > 7 || y > 7) return;
    [x, y] = (is_flipped) ? [7-x,7-y] : [x,y];
    let pos = Game.linear(x, y);
    if (selected===-1 && main_state.get_type(pos)!==EMPTY && main_state.get_color(pos)===player) {
      selected = pos;
      moves_highlight = main_state.moves_from(pos);
      if(moves_highlight.length<1) selected = -1;
    }
    else if (selected!==-1) {
      let mov = selected_move(moves_highlight, pos);
      if (mov !== null) {
        if (mov.SPECIAL>=Q_PROM && mov.SPECIAL<=R_PROM) {
          prom_move = mov;
          can_move = false;
          let proms = document.querySelector(".proms");
          proms.style.display = "block";
          proms.style.position = "absolute";
          proms.style.left = `${e.clientX}px`;
          proms.style.top = `${e.clientY}px`;
          return;
        }
        else {
          conclude_move(mov);
          return;
        }
      }
      else {
        selected = -1;
        moves_highlight = [];
      }
    }
    if (can_move) await render_state();
  });
}
////////////////////////////////////////////////////////////////////
async function init() {
  c = document.createElement("canvas");
  let attrs = { 
    id: "chessBoard", 
    width: c_width, 
    height: c_height, 
    style: "border:.25em solid black; position:relative; top:2rem; left:15rem;"
  };
  for(let key in attrs) {
    c.setAttribute(key, attrs[key]);
  };
  c.onselectstart = function () { return false; }
  document.body.appendChild(c);
  ctx = c.getContext("2d");
  await init_images(curr_set);
  await init_audio();
  reset();
  bind_buttons();
  bind_click();
}

window.addEventListener("DOMContentLoaded", init());
////////////////////////////////////////////////////////////////////