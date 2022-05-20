import { chess_state } from "./chess_class.js";
function PERFT(state, depth) {
  if (depth===0) {
    return 1;
  }
  let temp_state;
  let sum=0;
  let legal_moves = state.allMoves();
  for (let mov of legal_moves) {
    temp_state = state.copy();
    temp_state.move(mov);
    sum += PERFT(temp_state, depth-1);
  }
  return sum;
}
function test1() {
  let board = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -";
  let expected = 97862;
  let depth = 3;
  let test_state = new chess_state(board);
  let time = performance.now();
  let nodes = PERFT(test_state, depth);
  time = performance.now() - time;
  let result = (expected===nodes) ? "\u2713" : "!";
  console.log(result + " expected: " + expected + " result: " + nodes + " \n" + "depth: " +depth+"\n"+ "time: " + time + "\n" + board + "\n");
}
function test2() {
  let board = "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - -";
  let expected = 43238;
  let depth = 4;
  let test_state = new chess_state(board);
  let time = performance.now();
  let nodes = PERFT(test_state, depth);
  time = performance.now() - time;
  let result = (expected===nodes) ? "\u2713" : "!";
  console.log(result + " expected: " + expected + " result: " + nodes + " \n" + "depth: " +depth+"\n"+ "time: " + time + "\n" + board + "\n");
}
function test3() {
  let board = "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1";
  let expected = 9467;
  let depth = 3;
  let test_state = new chess_state(board);
  let time = performance.now();
  let nodes = PERFT(test_state, depth);
  time = performance.now() - time;
  let result = (expected===nodes) ? "\u2713" : "!";
  console.log(result + " expected: " + expected + " result: " + nodes + " \n" + "depth: " +depth+"\n"+ "time: " + time + "\n" + board + "\n");
}
function test4() {
  let board = "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8";
  let expected = 62379;
  let depth = 3;
  let test_state = new chess_state(board);
  let time = performance.now();
  let nodes = PERFT(test_state, depth);
  time = performance.now() - time;
  let result = (expected===nodes) ? "\u2713" : "!!!";
  console.log(result + " expected: " + expected + " result: " + nodes + " \n" + "depth: " +depth+"\n"+ "time: " + time + "\n" + board + "\n");
}
export function performance_nodes_test(num) {
  if (num > 0) test1();
  if (num > 1) test2();
  if (num > 2) test3();
  if (num > 3) test4();
}