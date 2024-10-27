let _db = require("../config/db");
const { ObjectId } = require('mongodb');
let jwt = require("jsonwebtoken");
let bcrypt = require("bcrypt");
require("dotenv").config;


let home = async (req, res) => {
    let db = _db.getDb();
    let userId = req.userId;
    try {
        let { isOngoingMeeting, ongoingMeetingId } = await db.collection("users").findOne(
            { _id: new ObjectId(userId) },
            {
                projection:
                    { _id: false, isOngoingMeeting: true, ongoingMeetingId: true }
            });
        console.log("isOngoingMeeting")
        if (isOngoingMeeting == false) {
            console.log("Hello")
            res.render("home.ejs", {
                name: req.name,
                ongoingMeetingId: ""
            })
        } else {
            res.render("home.ejs", {
                name: req.name,
                ongoingMeetingId: ongoingMeetingId
            })
        }
    } catch (err) {
        res.send(err);
    }
}


let login_process = async (req, res) => {
    let body = req.body;
    let { email, password } = body;
    let db = _db.getDb();


    // Check if the user is present in the DB or not
    let data_in_db = await db.collection("users").findOne({ email: email });

    if (!data_in_db) {
        res.send("Email or password is wrong");
    } else {

        // Check the password in DB and match with the provided passowrd
        let password_in_db = data_in_db.password;
        let is_password_right = bcrypt.compareSync(password, password_in_db);

        if (!is_password_right) {
            res.send("Email or password is wrong")
        } else {
            let access_token = jwt.sign(
                {
                    "userId": data_in_db._id,
                    "name": data_in_db.name,
                    "email": data_in_db.email
                },
                process.env.jwt_secret, { expiresIn: "6h" }
            );
            res.cookie("accesstoken", access_token);
            console.log("user Logged in");
            res.redirect("/home");
        }
    }
}


let signup_process = async (req, res) => {
    let entered_data = req.body;
    let db = _db.getDb();
    let { number, password, email } = entered_data;

    entered_data.password = bcrypt.hashSync(password, 10);

    // Add the timestamp to the data
    entered_data.time_stamp = new Date().toGMTString();
    entered_data.isOngoingMeeting = false;
    entered_data.ongoingMeetingId = "";
    entered_data.joinedMembers = []
    entered_data.blockedMembers = []


    let number_in_db = await db.collection("users").findOne({ "number": number });
    let mail_in_db = await db.collection("users").findOne({ "number": email });

    if (number_in_db || mail_in_db) {
        res.send("Number or Email already exists.");
    } else {
        try {
            db.collection("users").insertOne(entered_data);
            res.send("You are signed Up Now <a href='/login'>Login Here</a>")
        } catch (err) {
            console.log(err);
            res.send(err);
        }
    }
}



let logout = (req, res) => {
    res.cookie("accesstoken", "")
    res.redirect("/login")
}



module.exports = {
    home,
    login_process,
    signup_process,
    logout
}