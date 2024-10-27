require("dotenv").config();

let mongo = require("mongodb")
let db_url = process.env.db_url
let _db;


module.exports = {
    conntectToDB: async function (callback) {
        try {
            let x = await mongo.MongoClient.connect(db_url);
            _db = x.db("meeting-application");
            console.log("DB Connected");

            let collections = await _db.listCollections().toArray();
            collections = collections.map(item => item.name)

            if (!collections.includes("users")) {
                _db.createCollection("users");
            }


        } catch (err) {
            console.log(err);
        }
    },
    getDb: () => _db
}