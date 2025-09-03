const app = require("express")();
const server = require("http").Server(app);
const bodyParser = require("body-parser");
const Datastore = require("nedb");

app.use(bodyParser.json());

module.exports = app;

const { getNeDbFilePath, ensureDataDirsExist } = require("../dbUtil");
ensureDataDirsExist();

// Sessions DB
let sessionsDB = new Datastore({
    filename: getNeDbFilePath("sessions.db"),
    autoload: true
});

sessionsDB.ensureIndex({ fieldName: "_id", unique: true });
sessionsDB.ensureIndex({ fieldName: "name" });

// --- Routes ---

app.get("/", function(req, res) {
    res.send("Sessions API");
});

// Get all sessions
app.get("/all", function(req, res) {
    sessionsDB.find({}, function(err, docs) {
        if (err) return res.status(500).send(err);
        res.send(docs);
    });
});

// Get session by ID
app.get("/session/:id", function(req, res) {
    const id = parseInt(req.params.id);
    sessionsDB.findOne({ _id: id }, function(err, doc) {
        if (err) return res.status(500).send(err);
        if (!doc) return res.status(404).send("Session not found");
        res.send(doc);
    });
});

// Create new session
app.post("/session", function(req, res) {
    let session = req.body || {};
    session._id = Math.floor(Date.now() / 1000); // integer ID
    session.startDate = session.startDate || new Date().toJSON();
    session.status = session.status || "active";

    if (!session.name) {
        return res.status(400).send("Session name is required");
    }

    sessionsDB.insert(session, function(err, doc) {
        if (err) return res.status(500).send(err);
        res.send(doc);
    });
});

// Update session
app.put("/session", function(req, res) {
    const id = req.body._id;
    if (!Number.isInteger(id)) return res.status(400).send("Invalid session ID");

    sessionsDB.update({ _id: id }, req.body, {}, function(err, numReplaced) {
        if (err) return res.status(500).send(err);
        if (numReplaced === 0) return res.status(404).send("Session not found");
        res.sendStatus(200);
    });
});

// Delete session
app.delete("/session/:id", function(req, res) {
    const id = parseInt(req.params.id);
    sessionsDB.remove({ _id: id }, function(err, numRemoved) {
        if (err) return res.status(500).send(err);
        if (numRemoved === 0) return res.status(404).send("Session not found");
        res.sendStatus(200);
    });
});
