const socket = io();
const chess= new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece=null;
let sourceSquare= null;
let playerRole=null;

// Prompt for the player's name
const playerName = prompt("Enter your name:");
socket.emit("setPlayerName", playerName);

const renderBoard=()=>
{
    const board= chess.board();
    boardElement.innerHTML="";
    board.forEach((row,rowindex) => {
        console.log(row,rowindex);
        row.forEach((square,squareindex)=>{
               const squareElement=document.createElement("div");
               squareElement.classList.add("square", 
                (rowindex+squareindex)%2===0?"light":"dark"
               ); //this is for creating the board pattern
            
               squareElement.dataset.row = rowindex;
               squareElement.dataset.col=squareindex;
               if(square)
                {
                const pieceElement= document.createElement("div");
                pieceElement.classList.add("piece",square.color==='w' ?"white" : "black" );
                //creating elemnts over pattern
               pieceElement.innerText=getPieceUnicode(square);
               pieceElement.draggable = playerRole===square.color;

               pieceElement.addEventListener("dragstart",(e)=>{
                if(pieceElement.draggable){
                    draggedPiece=pieceElement;
                    sourceSquare ={row:rowindex, col:squareindex};
                    e.dataTransfer.setData("text/plain","");// for no problems in drag
                }

               })
               pieceElement.addEventListener("dragend",(e)=>{
                draggedPiece=null;
                sourceSquare=null;
               });
               squareElement.appendChild(pieceElement);
            }
            squareElement.addEventListener("dragover", function(e){
                e.preventDefault();
            });

            squareElement.addEventListener("drop",function(e){
                e.preventDefault();
                if(draggedPiece){
                    const targetSource={
                        row:parseInt(squareElement.dataset.row),
                        col:parseInt(squareElement.dataset.col),
                    };

                    handleMove(sourceSquare,targetSource);
                }
            });
       
        boardElement.appendChild(squareElement);
    });
    });

    
 if(playerRole==='b'){
    boardElement.classList.add("flipped");
 }
 else{
    boardElement.classList.remove("flipped");
 }
};

const handleMove=(source,target)=>{
    const move={
        from:`${String.fromCharCode(97+source.col)}${8-source.row}` ,
        to: `${String.fromCharCode(97+target.col)}${8-target.row}`,
        promotion: 'q',
    };

    socket.emit("move",move);
};

const getPieceUnicode=(piece)=>{
    const unicodePieces={
        // White pieces (uppercase)
// Black pieces (uppercase)
P : "♟", // Black Pawn
R : "♜", // Black Rook
N : "♞", // Black Knight
B : "♝", // Black Bishop
Q : "♛", // Black Queen
K : "♚", // Black King

// White pieces (lowercase)
p : "♙", // White Pawn
r : "♖", // White Rook
n : "♘", // White Knight
b : "♗", // White Bishop
q : "♕", // White Queen
k : "♔" // White King


    };
    return unicodePieces[piece.type] || "";
};

socket.on("playerRole",function(role){
    playerRole=role;
    if (role === "w") {
        alert("You are the White Player.");
    } else if (role === "b") {
        alert("You are the Black Player.");
    } else {
        alert("You are a Spectator.");
    }
    renderBoard();
});

socket.on("playerJoined", ({ name, role }) => {
    alert(`${name} has joined as ${role}.`);
});

socket.on("spectatorRule",function(){
 playerRole=null;
 renderBoard();
});

socket.on("boardState",function(fen){
    chess.load(fen);
    renderBoard();
});

socket.on("move",function(move){
    chess.load(move);
    renderBoard();
});


socket.on("gameOver", (message) => {
    alert(message); // Display game result
});

socket.on("playerDisconnected", (message) => {
   // console.log("Message received:", message); // Check if it's logged
    alert(message); 
});


renderBoard();






