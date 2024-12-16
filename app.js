const express= require('express');
const app=express();//this will do the routing part, middleware setup,etc . this is instance of express
const socket=require('socket.io');
const http=require('http');
const {Chess}=require('chess.js');

const server= http.createServer(app);//linling of http server to express app
const io= socket(server);//socket runs on this server

const chess=new Chess();
const path=require('path');
//setting up variables
let players={};
let playerNames = {}; 
let currentPlayer = "w";

app.set("view engine","ejs");
app.use(express.static(path.join(__dirname, "public")));
//console.log(path.join(__dirname, "public"));


app.get("/",function(req,res){
    res.render("index",{title:"Chess game"});
});

io.on("connection",function(uniquesocket){//socket here is unique info about the one joined
  console.log("Connected");

//   uniquesocket.on("disconnect",function(){
//     console.log("disconnect hogya");
//   })
//   uniquesocket.on("disconnect",function(){
//     io.emit("disconnect hogya"); //sending to all
//   })


// if(!players.white){
//     players.white= uniquesocket.id;
//     uniquesocket.emit("playerRole","w");//sending to the one who just connected
// }
// else if(!players.black){
//     players.black= uniquesocket.id;
//     uniquesocket.emit("playerRole","b");
// }
// else{
//     uniquesocket.emit("playerRole","spectator role");
// }

// uniquesocket.on("setPlayerName", (name) => {
//     if (!players.white) {
//         players.white = uniquesocket.id;
//         playerNames[uniquesocket.id] = name;
//         uniquesocket.emit("playerRole", "w");
//     } else if (!players.black) {
//         players.black = uniquesocket.id;
//         playerNames[uniquesocket.id] = name;
//         uniquesocket.emit("playerRole", "b");
//     } else {
//         uniquesocket.emit("playerRole", "spectator");
//     }
// });

uniquesocket.on("setPlayerName", (name) => {
    if (!players.white) {
        players.white = uniquesocket.id;
        playerNames[uniquesocket.id] = name;
        uniquesocket.emit("playerRole", "w"); // Notify the player about their role
        io.emit("playerJoined", { name, role: "White Player" }); // Notify others
    } else if (!players.black) {
        players.black = uniquesocket.id;
        playerNames[uniquesocket.id] = name;
        uniquesocket.emit("playerRole", "b"); // Notify the player about their role
        io.emit("playerJoined", { name, role: "Black Player" }); // Notify others
    } else {
        uniquesocket.emit("playerRole", "spectator");
        playerNames[uniquesocket.id] = name; // Notify the player about their role
        io.emit("playerJoined", { name, role: "Spectator" }); // Notify others
    }
});





// uniquesocket.on("disconnect",function(){
//     if(uniquesocket.id===players.white){
//         delete players.white;
//     }
//     else if(uniquesocket.id===players.black){
//         delete players.black;
//     }
//     io.emit("player disconnected"); //sending to all
//   });


// uniquesocket.on("move",function(move){
//     try{
//         if(chess.turn()==='w' && uniquesocket.id!==players.white)return;
//         if(chess.turn()==='b' && uniquesocket.id!==players.black)return;

//         const result=chess.move(move);
//         if(result){
//             currentPlayer=chess.turn();
//             io.emit("move",move);
//             io.emit("boardState", chess.fen())
//         }
//         else{
//             console.log("Invalid move: ",move);
//             uniquesocket.emit("invalidMove", move);
//         }
//     }
//     catch(err){
//         console.log(err);
//         uniquesocket.emit("Invalid move: ",move);
//     }
// })

uniquesocket.on("move", (move) => {
    try {
        if (chess.turn() === 'w' && uniquesocket.id !== players.white) return;
        if (chess.turn() === 'b' && uniquesocket.id !== players.black) return;

        const result = chess.move(move);
        if (result) {
            currentPlayer = chess.turn();
            io.emit("move", move);
            io.emit("boardState", chess.fen());

            // Check for game-ending conditions
            if (chess.isGameOver()) {
                let winner = null;
                if (chess.isCheckmate()) {
                    winner = currentPlayer === 'b' ? playerNames[players.white] : playerNames[players.black];
                    io.emit("gameOver", `Checkmate! ${winner} wins the game.`);
                } else if (chess.isDraw()) {
                    io.emit("gameOver", "It's a draw!");
                }
            }
        } else {
            console.log("Invalid move:", move);
            uniquesocket.emit("invalidMove", move);
        }
    } catch (err) {
        console.log("Error:", err);
        uniquesocket.emit("error", "Invalid move");
    }
});

uniquesocket.on("disconnect", () => {
    if (uniquesocket.id === players.white) {
        delete players.white;
    } else if (uniquesocket.id === players.black) {
        delete players.black;
    }
    console.log(`${playerNames[uniquesocket.id] || 'A player'} disconnected`);
    let pname= playerNames[uniquesocket.id];
    delete playerNames[uniquesocket.id];
    io.emit("playerDisconnected", `${pname || 'A player'} disconnected`);
  
});

});



const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
