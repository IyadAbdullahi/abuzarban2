const { ensureDataDirsExist } = require("../dbUtil");
ensureDataDirsExist();
const app = require("express")();
const server = require("http").Server(app);
const bodyParser = require("body-parser");

app.use(bodyParser.json());

module.exports = app;

app.get("/", function(req, res) {
	res.send("Sync API Placeholder");
});

// Simple endpoints to simulate push/pull
app.post("/push", function(req, res) {
	// Accept payload and pretend to sync
	res.send({ status: 'ok', pushed: true, items: (req.body && req.body.length) || 0 });
});

app.get("/pull", function(req, res) {
	// Return empty set for now
	res.send({ status: 'ok', data: [] });
});


