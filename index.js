const express = require('express');
const app = express();
const peer = require("peer");
const path = require('path');
let cookieParser = require("cookie-parser")
let ejs = require("ejs")
let _db = require("./config/db");
const { ExpressPeerServer } = peer
const { Server } = require('socket.io');
const httpServer = require("http").createServer(app);
require("dotenv").config();


let { isLoggedIn } = require("./middleware/auth");



let auth = require("./controllers/authController");
let inMeetingController = require("./controllers/inMeetingController")


_db.conntectToDB();



const io = new Server(httpServer, {
    allowEIO3: true
});



io.on("connection", (socket) => {

    socket.on("call-denied", (data) => {
        io.to(data.socketId).emit("call-denied", data.message)
    })

    socket.on("new-member-joined", (data) => {
        socket.broadcast.emit("new-member-joined", {
            name: data.name,
            memberId: data.memberId,
            joinedMembers: data.joinedMembers
        })
    })

    socket.on("screen-share", (data) => {
        socket.broadcast.emit("screen-share", data)
    })

    socket.on("screen-sharing-stopped", (data) => {
        socket.broadcast.emit("screen-sharing-stopped", data)
    })

    socket.on("leave-meeting", (data) => {
        socket.broadcast.emit("leave-meeting", data)
    })


})



// Creating a new server for peerjs to avoid port conflict with socket.io
let peer_httpServer = require("http").createServer();


// When running on localhost
let peerServer = ExpressPeerServer(peer_httpServer, {
    host: "localhost",
    port: 9000,
    path: "/"
})



/*
// When running on ngrok
let peerServer = ExpressPeerServer(httpServer, {
    host: "f470-49-249-159-198.ngrok-free.app",
    path: "/peerjs"
})
*/


app.use("/peerjs", peerServer)


app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser());
app.set("view engine", ejs)
app.set("views", path.join(__dirname, "public/views"))
app.use(express.static(path.join(__dirname, "public/")))





app.get('/', isLoggedIn, (req, res) => { res.redirect("/home") });
app.get("/home", isLoggedIn,  auth.home)

app.get("/login", (req, res) => { res.render("login.ejs") })
app.get("/signup", (req, res) => { res.render("signup.ejs") })
app.post("/login_process", auth.login_process);
app.post("/signup_process", auth.signup_process);
app.get("/logout", auth.logout);

app.get("/new-meeting", isLoggedIn, inMeetingController.new_meeting)
app.get("/meeting/:id", isLoggedIn, inMeetingController.join_existing_meeting);
app.get("/join-meeting", isLoggedIn, inMeetingController.join_meeting)
app.get("/get-joined-members", isLoggedIn, inMeetingController.get_joined_members);
app.get("/add-members-to-meeting", isLoggedIn, inMeetingController.add_members_to_meeting);
app.get("/add-active-member-to-db", isLoggedIn, inMeetingController.add_active_members_to_db)
app.get("/remove-active-member-from-db", isLoggedIn, inMeetingController.remove_active_members_from_db);
app.get("/get-active-members", isLoggedIn, inMeetingController.get_active_members)
app.get("/remove-meeting-from-db/", isLoggedIn, inMeetingController.remove_meeting_from_db);

app.get("*", (req, res) => {res.send("Error 404")})




peer_httpServer.listen(process.env.peerjs_port, () => {
    console.log("Server (Peerjs) running  on port 9000")
})

httpServer.listen(process.env.express_port, () => {
    console.log('Server (Main) running on port 3000')
});
