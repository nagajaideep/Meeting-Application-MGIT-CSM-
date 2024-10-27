const jwt = require("jsonwebtoken")
require("dotenv").config;


const isLoggedIn = async (req, res, next) => {
    let token = req.cookies["accesstoken"];
    try {
        let decodedToken = await jwt.verify(token, process.env.jwt_secret);
        if (decodedToken) {
            req.userId = decodedToken.userId;
            req.name = decodedToken.name;
            req.email = decodedToken.email;
            next();
        } else {
            req.send("There is some error")
        }
    } catch (err) {
        res.redirect("/login")
    }
}

module.exports = {
    isLoggedIn
};