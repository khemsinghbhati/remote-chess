var game = new Chess()
function makeid(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}
var peer = new Peer(makeid(5));
var Conn;
let me;
let him;
let myCol='white';
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


function gameRoomLaunch(){
  
  var cont=document.getElementById("pagee");
  cont.innerHTML="  <p style = 'color: skyblue'>HELLO,  welcome to game room </p><p style='color:orange ' id='yourID'>yourID :   </p><p style='color:orange' id='oppID' > opponentID: </p><div id='myBoard'></div>";
  var yourID=document.getElementById("yourID");
  yourID.append(me);
  var oppID=document.getElementById("oppID");
  oppID.append(him);
  cont.innerHTML += "<p style = 'color: red; font-size: 200% '> Chat here  </p> <input type='text' id='msg'>  <button id='sendButton'onclick='sendMsg()'> send </button> <div id='msgBoxContainer'><p id='msgBox'> </p> </div>";
  launchBoard();
  document.getElementById("msg").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      document.getElementById("sendButton").click();
    }
  });
}

var board;
function launchBoard(){
 
  var config={
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    showNotation : false,
    orientation : myCol
  }
  board = Chessboard('myBoard',config);
  
}

function onDragStart (source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false;
  // only pick up pieces for the side to move and respective color
  if(board.orientation() == 'white' && (piece.search(/^b/) !== -1 || game.turn() === 'b'))
         return false;
  if(board.orientation() == 'black' && (piece.search(/^w/) !== -1 || game.turn() === 'w'))
         return false;

}

function onDrop (source, target) {
  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' 
  })

  // illegal move
  if (move === null) return 'snapback'
  // send move if legal
  let moveS=source+target;
  Conn.send('m'+ moveS);
  
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
  board.position(game.fen());
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
  msg.value="";}
}
function handleRec(){
 Conn.on('open',function(){
   Conn.on('data', function(data) {
    // alert(data);
    if(data.charAt(0) =='c'){
    data = data.slice(1); 
    addMsg("Opponent : " + data); 
   }
   else {
     data = data.slice(1);
    game.move({
      from: data.charAt(0)+data.charAt(1),
      to: data.charAt(2)+data.charAt(3),
      promotion: 'q' 
    })
       board.position(game.fen());
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
   });
 }); 

}
function addMsg(msg){
  var cont=document.getElementById("msgBox");
  cont.innerHTML=msg+"<br><br>"+cont.innerHTML;
}
function Game_end(winner){
  
  var cont=document.getElementById("pagee");
  cont.innerHTML="";
  cont.innerHTML += "<div id='myBoard'></div>";
  var config={
    draggable: true,
    position: board.position(),
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd,
    showNotation : false,
    orientation : myCol
  }
  board = Chessboard('myBoard',config);
   if(winner == board.orientation())
    cont.innerHTML += "<p class='gameoverpara' > GAMEOVER, YOU WON </p>";
   else if(winner == 'd')
    cont.innerHTML += "<p class='gameoverpara'> GAMEOVER, IT'S A DRAW </p>";
   else
    cont.innerHTML += "<p class='gameoverpara'> GAMEOVER, YOU LOSE </p>";
 
}