var game = new Chess();

function makeid() {
 return localStorage.getItem("myID");
}

var peer = new Peer(makeid());
var Conn;
let me;
let him;
let myCol='white';
var lastSquareClicked;
var lastSquareHovered;

//let toSend=false;
peer.on('open', function(id) {
    //alert("hello")
    let playerID =  document.getElementById("playerID");
    playerID.append(id);
    me=id;
  });
 
function startConnect(){
  let IDinbox = document.getElementById("toConnectID").value;
  Conn = peer.connect(IDinbox);
  him=IDinbox;
    gameRoomLaunch();  
    //connection to other side
    handleRec();
   
}
 //connection from other side
 peer.on('connection', function(conn) { 
       him=conn.peer;
       Conn = conn;
       myCol='black';
       gameRoomLaunch();  
       handleRec();

  });
// reconnect
 peer.on('disconnected',() => {
  peer.reconnect();
 });

function gameRoomLaunch(){
  var promotionOptionsHtml = " <div id='pawnPromotionOptions'> Pawn Promtion Choice : <button id='queenButton'  onClick='changePromotionChoiceToQueen()'> ♕ </button> <button id='rookButton' onClick='changePromotionChoiceToRook()'> ♖ </button> <button id='bishopButton'  onClick='changePromotionChoiceToBishop()'> ♗ </button> <button id='knightButton'  onClick='changePromotionChoiceToKnight()'> ♘ </button></div>";
  var cont=document.getElementById("pagee");
  cont.innerHTML="  <p style = 'color: skyblue'>HELLO,  welcome to game room "+promotionOptionsHtml+" </p><p style='color:orange ' id='yourID'>yourID :   </p><p style='color:orange' id='oppID' > opponentID: </p><div id='myBoard' onClick='squareClicked()'></div>";
  var yourID=document.getElementById("yourID");
  yourID.append(me);
  var oppID=document.getElementById("oppID");
  oppID.append(him);
  var resignButtonHtml = "<button id='resignButton' onclick='resign()'> Resign🏳️ </button>";
  var drawButtonHtml = "<button id='drawButton'> Draw🤝 </button>";
  cont.innerHTML += resignButtonHtml + drawButtonHtml+ "<div id='msgContainerDiv'><p style = 'color: yellow; font-size: 200% '> Chat here  </p> <input type='text' id='msg'>  <button id='sendButton'onclick='sendMsg()'> send </button> <div id='msgBoxContainer'><p id='msgBox'> </p> </div> </div>";
  launchBoard();
  document.getElementById("msg").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      document.getElementById("sendButton").click();
    }
  });
}
function resign(){
  //alert();
  let winner = (myCol == 'white') ? 'b' : 'white';
  Conn.send('r');
  Game_end(winner);
}
var Board;
function launchBoard(){
 
  var config={
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onMouseoverSquare: onMouseoverSquare,
    onSnapEnd : onSnapEnd,
    showNotation : false,
    orientation : myCol
  }
  Board = Chessboard('myBoard',config);
  
}
//drag to move 
function onDragStart (source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false;
  // only pick up pieces for the side to move and respective color
  if(Board.orientation() == 'white' && (piece.search(/^b/) !== -1 || game.turn() === 'b'))
         return false;
  if(Board.orientation() == 'black' && (piece.search(/^w/) !== -1 || game.turn() === 'w'))
         return false;
  lastSquareClicked=source;      
}

function onDrop (source, target) {
  makeMove(source,target);
}
var promotionChoice='q';
function changePromotionChoiceToQueen(){
  document.getElementById("queenButton").style.backgroundColor = "white";
  document.getElementById("rookButton").style.backgroundColor = "black";
  document.getElementById("bishopButton").style.backgroundColor = "black";
  document.getElementById("knightButton").style.backgroundColor = "black";
  promotionChoice = 'q';
}
function changePromotionChoiceToRook(){
  document.getElementById("rookButton").style.backgroundColor = "white";
  document.getElementById("queenButton").style.backgroundColor = "black";
  document.getElementById("bishopButton").style.backgroundColor = "black";
  document.getElementById("knightButton").style.backgroundColor = "black";
 promotionChoice = 'r';
}
function changePromotionChoiceToBishop(){
  document.getElementById("bishopButton").style.backgroundColor = "white";
  document.getElementById("rookButton").style.backgroundColor = "black";
  document.getElementById("queenButton").style.backgroundColor = "black";
  document.getElementById("knightButton").style.backgroundColor = "black";
  promotionChoice = 'b';
}
function changePromotionChoiceToKnight(){
  document.getElementById("knightButton").style.backgroundColor = "white";
  document.getElementById("rookButton").style.backgroundColor = "black";
  document.getElementById("bishopButton").style.backgroundColor = "black";
  document.getElementById("queenButton").style.backgroundColor = "black";
  promotionChoice = 'n';
}

function getPromotion(){
  return promotionChoice;
}
function makeMove(source,target){
 // see if the move is legal
 var move = game.move({
  from: source,
  to: target,
  promotion: getPromotion() 
})
// illegal move
if (move === null) {
  if(source !== target)
  lastSquareClicked="";
  return 'snapback';
}
// send move if legal
let moveS=source+target;
Conn.send('m'+ moveS + getPromotion());
playMoveSound();
removecolorSquares();
colorSquare(source);
colorSquare(target);
if(game.in_check()) {
  let targetColor='b';
  if(Board.orientation() == 'black')
  targetColor='w';
   colorKing(targetColor);
 }
}
 //update board , because in moves like castling chessboardjs needs support from chess js for proper update
 
function onSnapEnd(){
  //first updating the position then check game over , order matters otherwise gameovercheck might set a game over board and then board.position again set it .. causing irregular display
 Board.position(game.fen());
 GameOverCheck();
}
// end of drag to move 

//click to move

function onMouseoverSquare (square, piece) {
  lastSquareHovered=square;
}
function squareClicked(){
 let snapped = makeMove(lastSquareClicked,lastSquareHovered);
 lastSquareClicked=lastSquareHovered;
 //update board
 if(snapped !== 'snapback'){
  //first update the position then check game over , order matters otherwise gameovercheck might set a game over board and then board.position again set it .. causing irregular display
  Board.position(game.fen());
  lastSquareClicked = "";
  GameOverCheck(); 
}
}
//end of click to move
function GameOverCheck(){
  if(game.game_over()){   
    let winner;
     if(game.in_checkmate() == true){
        if(game.turn() == 'b')
         {
              winner='white';
         }
         else {
          winner='b';
         }
     }
     else{
      winner='d';
     }
     Game_end(winner);
   }
}

function sendMsg(){
  var msg=document.getElementById("msg");
  if(msg.value != ""){
  Conn.send('c'+msg.value);
  addMsg("You: " + msg.value);
  msg.value="";
}
}
//this function is required because Conn obj is defined only after the connection gets established.
//also it reduces lines of code, we are avoiding writing it above twice !. moreover Conn data can only be recieved after connecting
// so it's just better to make this peice of code come into picture when it is required.  
function handleRec(){
 Conn.on('open',function(){
   Conn.on('data', function(data) {
    // alert(data);
    if(data.charAt(0) =='c'){
    data = data.slice(1); 
    addMsg("Opponent : " + data); 
    playChatMsgSound();
   }
   else if(data.charAt(0) == 'r'){
    let winner = myCol;
    Game_end(winner,true);
   }
   else {
     playMoveSound();
     data = data.slice(1);
     var promotedTo = ''+ data.charAt(4);
    game.move({
      from: data.charAt(0)+data.charAt(1),
      to: data.charAt(2)+data.charAt(3),
      promotion: promotedTo
    })
       Board.position(game.fen());
       removecolorSquares();
       colorSquare(data.charAt(0)+data.charAt(1));
       colorSquare(data.charAt(2)+data.charAt(3));
       if(game.in_check()) {
        let targetColor='w';
        if(Board.orientation() == 'black')
        targetColor='b';
         colorKing(targetColor);
       }
       GameOverCheck();
   }
   });
 }); 

}

function addMsg(msg){
  var cont=document.getElementById("msgBox");
  cont.innerHTML=msg+"<br><br>"+cont.innerHTML;
}
function Game_end(winner,byResign=false){
  playGameOverSound();
  var cont=document.getElementById("pagee");
  var msgContainerDiv = document.getElementById("msgContainerDiv").innerHTML;
  cont.innerHTML="";
  cont.innerHTML += "<div id='myBoard'></div>";
  var config={
    draggable: true,
    position: Board.position(),
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd : onSnapEnd,
    showNotation : false,
    orientation : Board.orientation()
  }
  Board = Chessboard('myBoard',config);
   if(winner == Board.orientation())
    cont.innerHTML += "<p class='gameoverpara'> GAMEOVER, YOU WON </p>";
   else if(winner == 'd')
    cont.innerHTML += "<p class='gameoverpara'> GAMEOVER, IT'S A DRAW </p>";
   else
    cont.innerHTML += "<p class='gameoverpara'> GAMEOVER, YOU LOSE </p>";
   
    if(byResign == true) 
     cont.innerHTML += "<p class='gameoverpara' >Opponent resigned </p>";
    cont.innerHTML += msgContainerDiv//"<p style = 'color: yellow; font-size: 200% '> Chat here  </p> <input type='text' id='msg'>  <button id='sendButton'onclick='sendMsg()'> send </button> <div id='msgBoxContainer'><p id='msgBox'> </p> </div>";
    //press enter to send
    document.getElementById("msg").addEventListener("keypress", function(event) {
      if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("sendButton").click();
      }
    });
}
function playMoveSound() {
  var audio = new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-self.mp3');
  audio.play();
}
function playGameOverSound(){
  var audio = new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/game-end.mp3');
  audio.play();
}
function playChatMsgSound(){
  var audio = new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/notify.mp3');
  audio.play();
}

var whiteSquarecolor = '#8d8ce6'
var blackSquarecolor = '#8d8ce6'
var checkSquarecolor = '#b30727'
function removecolorSquares () {
  $('#myBoard .square-55d63').css('background', '')
}

function colorSquare (square,checkSquare=false) {
  var $square = $('#myBoard .square-' + square)

  var background = whiteSquarecolor
  if ($square.hasClass('black-3c85d')) {
    background = blackSquarecolor
  }
  //color king square red
  if(checkSquare == true){
    background = checkSquarecolor; 
  }
  $square.css('background', background)
}
// called when king is in check 
function colorKing(targetColor){
  var toSearch = 'k'.charCodeAt(0);
  if(targetColor == 'w')
      toSearch = 'K'.charCodeAt(0);
  var fen = game.fen();  
  var kingSquare = findKingSquare(fen,toSearch)
  colorSquare(kingSquare,true);
}
// calculates king's square
function findKingSquare(fen,toSearch){
  var num = 0;
for (let i = 0; i < fen.length; i++) {
var ch = fen.charCodeAt(i);
if(ch == toSearch) break;	
    if(ch == '/'.charCodeAt(0)) continue;
if(ch >= '1'.charCodeAt(0) && ch <= '8'.charCodeAt(0)) 
  num += (ch - '0'.charCodeAt(0));
else
 num += 1;
}
var file = String.fromCharCode('a'.charCodeAt(0) + num % 8 );
var rank = 8 - Math.floor(num / 8);
 return (file+rank); 
}

// messages format
/* 
m = move , c= chat , r= resign
*/