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
let currentPlayer = "w";

app.set("view engine","ejs");
app.use(express.static(path.join(__dirname, "public")));
//console.log(path.join(__dirname, "public"));


app.get("/test", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "javascripts", "chessgame.js"));
});

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


if(!players.white){
    players.white= uniquesocket.id;
    uniquesocket.emit("playerRole","w");//sending to the one who just connected
}
else if(!players.black){
    players.black= uniquesocket.id;
    uniquesocket.emit("playerRole","b");
}
else{
    uniquesocket.emit("playerRole","spectator role");
}




uniquesocket.on("disconnect",function(){
    if(uniquesocket.id===players.white){
        delete players.white;
    }
    else if(uniquesocket.id===players.black){
        delete players.black;
    }
    io.emit("player disconnected"); //sending to all
  });


uniquesocket.on("move",function(move){
    try{
        if(chess.turn()==='w' && uniquesocket.id!==players.white)return;
        if(chess.turn()==='b' && uniquesocket.id!==players.black)return;

        const result=chess.move(move);
        if(result){
            currentPlayer=chess.turn();
            io.emit("move",move);
            io.emit("boardState", chess.fen())
        }
        else{
            console.log("Invalid move: ",move);
            uniquesocket.emit("invalidMove", move);
        }
    }
    catch(err){
        console.log(err);
        uniquesocket.emit("Invalid move: ",move);
    }
})

});



server.listen(3000,function(){
    console.log("listening on 3000");
});