import { Game,
         Q_PROM,R_PROM,B_PROM,K_PROM,ONPEASANT,
         WHITE,BLACK,EMPTY,
         SQUARES_W, SQUARES_H } from "./scripts/game.js";

import { ai } from "./scripts/ai.js";


const c_width = 700;  // canvas width
const c_height = 700; // canvas height
const width = c_width/SQUARES_W;   // square width
const height = c_height/SQUARES_H; // square height
const check_color = "blue";
const border_color = "black"; // square border
const selected_color = "yellow";
const sq_lcolor = "#ff7a39"; // square light
const sq_dcolor = "green";   // square dark
const highlight_color = "navajowhite"; // move highlight
const sq_from ="teal";
const sq_to ="aqua";
const piece_set = "anarcandy";
const images = {}; // piece images
const audio = {};

let ai_depth = 12;
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
let ctx = null; // canvas context
let evaluation = 0.0
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
  await init_audio(audio);
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
function pick_color(input) {
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

async function init_audio(dict) {
  dict["move"] = new Audio("./assets/sound/move.wav")
}

function render_board() {

  for (let i = 0; i < SQUARES_W; i++) {
    for (let j = 0; j < SQUARES_H; j++) {
      let [x,y] = (flipped) ? [7-i,7-j] : [i,j]; 
      let pos = Game.linear(x,y);
      ctx.fillStyle =  border_color;
      ctx.fillRect(i*width,j*height,width,height);
      ctx.fillStyle = ((pos===main_state.wk_pos && white_checked) || (pos===main_state.bk_pos && black_checked)) ? check_color : ((j % 2 === i % 2) ? sq_lcolor : sq_dcolor);
      if (selected === pos) ctx.fillStyle = selected_color;
      else if (selected_move(moves_highlight, pos) !== null) ctx.fillStyle = highlight_color;
      else if (pos === recent_from) ctx.fillStyle = sq_from;
      else if (pos === recent_to) ctx.fillStyle = sq_to;
      ctx.fillRect(i*width,j*height,width-1,height-1);
    }
  }
}

function render_state() {

  render_board();
  for (let i=0; i<SQUARES_H*SQUARES_W; i++) {
    if (main_state.get_type(i)===EMPTY) {
      continue;
    };
    let [x, y] = Game.nonlinear(i);
    [x, y] = (flipped) ? [7-x,7-y] : [x,y];
    let str = main_state.get_color(i) + "" + main_state.get_type(i);
    let img = images[str];
    ctx.drawImage(img, (x*width)+(width/16), (y*height)+(width/16), c.width/9, c.height/9);
  }
}

function selected_move(moves, pos) {

  for (let mov of moves) {
    if (mov.TO === pos) {
      return mov;
    }
  }
  return null;
}
function bind_buttons() {

  let ai_iter = document.getElementById("drop-ai");
  for (let btn of ai_iter.children) {
    if (btn.innerHTML==="Level Two") btn.style["background-color"] = "#aaff80";
    btn.addEventListener("click", (e) => {
      if (btn.innerHTML==="Level One") { ai_depth=8; }
      else if (btn.innerHTML==="Level Two")  { ai_depth=12; }
      else if (btn.innerHTML==="Level Three") { ai_depth=16; }
      for (let opt of ai_iter.children) {
        opt.style["background-color"] = "";
      }
      e.target.style["background-color"] = "#aaff80";
    })
  }

  let flip_btn = document.getElementById("flipbtn");
  flip_btn.addEventListener("click", () => {
    flip();
  });

  let prom_iter = document.getElementById("drop-prom");
  for (let btn of prom_iter.children) {
    if (btn.innerHTML==="Queen") btn.style["background-color"] = "#aaff80";
    btn.addEventListener("click", (e) => {
      if (btn.innerHTML==="Queen") { promote_piece=Q_PROM; }
      else if (btn.innerHTML==="Bishop")  { promote_piece=B_PROM; }
      else if (btn.innerHTML==="Knight") { promote_piece=K_PROM; }
      else if (btn.innerHTML==="Rook") { promote_piece=R_PROM; }
      for (let opt of prom_iter.children) {
        opt.style["background-color"] = "";
      }
      e.target.style["background-color"] = "#aaff80";
    })
  }

  let reset_btn = document.getElementById("resetbtn");
  reset_btn.addEventListener("click", () => {
    reset();
  });

  let change_btn = document.getElementById("changebtn");
  change_btn.addEventListener("click", () => {
    change_color();
  });
}

function move_ai(color) {

  let time = Date.now();
  let ai_move = ai(ai_depth, main_state, color);
  time = ((Date.now() - time) / 1000).toFixed(2);
  evaluation = ai_move[0].toFixed(2) * ((player===WHITE) ? -1 : 1);
  console.log("depth: %d\n%f secs\neval: %f\nmove: %O\nleaf nodes:%i", 
              ai_depth, time, evaluation, ai_move[1], ai_move[2]);

  if (ai_move[1] !== null) {
    main_state.move(ai_move[1]);
    recent_from = ai_move[1].FROM;
    recent_to = ai_move[1].TO;
    if (ai_move[0]==Number.POSITIVE_INFINITY && main_state.all_moves(true).length===0) {
      alert("YOU LOSE!");
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
}

function reset() {

  main_state = new Game();
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

  white_checked = main_state.under_attack(WHITE, main_state.wk_pos);
  black_checked = main_state.under_attack(BLACK, main_state.bk_pos);
}

function bind_click() {

  c.addEventListener("mousedown", function(e) {
    if (main_state.game_over) return;
    let rect = c.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / width) | 0;
    let y = ((e.clientY - rect.top) / height) | 0;
    if (x > 7 || y > 7) return;
    [x, y] = (flipped) ? [7-x,7-y] : [x,y];
    let pos = Game.linear(x, y);
    if (selected===-1 && main_state.get_type(pos)!==EMPTY && main_state.get_color(pos)===player) {
      selected = pos;
      moves_highlight = main_state.moves_from(pos);
      if(moves_highlight.length<1) selected = -1;
    }
    else if (selected!==-1) {
      let mov = selected_move(moves_highlight, pos);
      if (mov !== null) {
        let ai_color = (player===WHITE) ? BLACK : WHITE;
        if (mov.SPECIAL>=Q_PROM && mov.SPECIAL<=R_PROM) {
          mov.SPECIAL = promote_piece;
        }
        if (main_state.get_type(mov.TO)!==EMPTY || mov.SPECIAL===ONPEASANT) {
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
