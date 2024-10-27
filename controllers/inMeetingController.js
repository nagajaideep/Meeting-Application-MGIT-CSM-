let meeting_id_generator = require("../middleware/idGenerator");
let _db = require("../config/db");
const { ObjectId } = require('mongodb');



let new_meeting = async (req, res) => {
    let meetingId = meeting_id_generator();
    let db = _db.getDb();
    let userId = req.userId;

    try {
        let result = await db.collection("users")
            .findOneAndUpdate(
                { _id: new ObjectId(userId) },
                {
                    $set:
                    {
                        isOngoingMeeting: true,
                        ongoingMeetingId: meetingId
                    }
                }
            );
        if (result) {
            res.redirect("/meeting/" + meetingId)
        } else {
            res.send("Something went wrong")
        }
    } catch (err) {
        console.log(err)
        res.send(err)
    }
}



let join_meeting = async (req, res) => {
    let { meetingId } = req.query;
    let db = _db.getDb();

    let isMeetingExists = await db.collection("users").findOne({
        ongoingMeetingId: meetingId
    }, {
        projection:
        {
            _id: false,
            isOngoingMeeting: true
        }
    })

    if (isMeetingExists) {
        res.render("join-meeting.ejs", {
            meetingId: meetingId,
            userId: req.userId,
            name: req.name
        })
    } else {
        res.send("There is no meeting with this id")
    }
}


let join_existing_meeting = async (req, res) => {
    let id_in_param = req.params.id;
    let db = _db.getDb();
    let userId = req.userId;


    let { isOngoingMeeting, ongoingMeetingId } = await db
        .collection("users")
        .findOne(
            { _id: new ObjectId(userId) },
            {
                projection:
                {
                    _id: false,
                    isOngoingMeeting: true,
                    ongoingMeetingId: true
                }
            }
        );


    if (id_in_param == ongoingMeetingId) {
        res.render("meeting.ejs", {
            name: req.name,
            email: req.email,
            meetingId: ongoingMeetingId
        })
    } else {
        res.send("There is no such meeting")
    }
}


let get_joined_members = async (req, res) => {
    let meetingId = req.query.meetingId;
    let db = _db.getDb();

    // Check if the request has been send by the person who created the meeting
    let joinedMembers = await db.collection("users")
        .findOne(
            { _id: new ObjectId(req.userId), ongoingMeetingId: meetingId },
            { projection: { _id: 0, joinedMembers: 1 } }
        );

    if (joinedMembers) {
        res.json({ joinedMembers: joinedMembers.joinedMembers });
    } else {
        res.send("Something error happened")
    }
}



let add_members_to_meeting = async (req, res) => {
    let { meetingId, memberId } = req.query;
    let db = _db.getDb();

    try {
        let result = await db.collection("users").findOneAndUpdate(
            {
                _id: new ObjectId(req.userId),
                ongoingMeetingId: meetingId
            },
            {
                $push: {
                    joinedMembers: memberId
                }
            }
        )
        if (result) {
            res.json({ isOk: true })
        } else {
            res.json({ isOk: false });
        }
    } catch (err) {
        res.send(err)
    }
}

let add_active_members_to_db = async (req, res) => {
    let { meetingId, memberId } = req.query;
    let db = _db.getDb();

    try {
        let result = await db.collection("users").findOneAndUpdate(
            {
                _id: new ObjectId(req.userId),
                ongoingMeetingId: meetingId
            },
            {
                $addToSet: {
                    activeMembers: memberId
                }
            }
        )
        if (result) {
            res.json({ isOk: true })
        } else {
            res.json({ isOk: false });
        }
    } catch (err) {
        res.send(err)
    }
}


let remove_active_members_from_db = async (req, res) => {
    let { meetingId, memberId } = req.query;
    let db = _db.getDb();

    try {
        let result = await db.collection("users").findOneAndUpdate(
            {
                joinedMembers: { $in: [req.userId] },
                ongoingMeetingId: meetingId
            },
            {
                $pull: {
                    activeMembers: memberId
                }
            }
        )
        if (result) {
            res.json({ isOk: true })
        } else {
            res.json({ isOk: false });
        }
    } catch (err) {
        res.send(err)
    }
}


let get_active_members = async (req, res) => {
    let meetingId = req.query.meetingId;
    let db = _db.getDb();

    // Check if the request has been send by the person who created the meeting
    let activeMembers = await db.collection("users")
        .findOne(
            { ongoingMeetingId: meetingId },
            { projection: { _id: 0, activeMembers: 1 } }
        );

    if (activeMembers) {
        res.json({ isOk: true, activeMembers: activeMembers.activeMembers });
    } else {
        res.json({ isOk: false })
    }
}


let remove_meeting_from_db = async (req, res) => {
    let { meetingId } = req.query
    let db = _db.getDb();

    try {
        let result = await db.collection("users").findOneAndUpdate({
            _id: new ObjectId(req.userId),
            ongoingMeetingId: meetingId
        }, {
            $set: {
                isOngoingMeeting: false,
                ongoingMeetingId: "",
                joinedMembers: [],
                activeMembers: [],
                blockedMembers: []
            }
        })

        if (result) {
            res.json({ isOk: true })
        } else {
            res.json({ isOk: false })
        }
    } catch (err) {
        res.send(err)
    }
}




module.exports = {
    get_joined_members,
    add_members_to_meeting,
    add_active_members_to_db,
    remove_active_members_from_db,
    get_active_members,
    remove_meeting_from_db,
    new_meeting,
    join_meeting,
    join_existing_meeting
}