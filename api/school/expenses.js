const app = require("express")();
const server = require("http").Server(app);
const bodyParser = require("body-parser");
const Datastore = require("nedb");

app.use(bodyParser.json());

module.exports = app;

const { getNeDbFilePath, ensureDataDirsExist } = require("../dbUtil");
ensureDataDirsExist();

let expensesDB = new Datastore( {
	//make sure the databases folder exists
	filename: getNeDbFilePath("expences.db"),
	autoload: true
} );

expensesDB.ensureIndex({ fieldName: "_id", unique: true });
expensesDB.ensureIndex({ fieldName: "date" });
expensesDB.ensureIndex({ fieldName: "category" });

app.get("/", function(req, res) {
	res.send("Expenses API");
});

// List all expenses
app.get("/all", function(req, res) {
	expensesDB.find({}).sort({ date: -1 }).exec(function(err, docs) {
		if (err) return res.status(500).send(err);
		res.send(docs);
	});
});

// List by date range and optional category
app.get("/by-date", function(req, res) {
	let startDate = req.query.start ? new Date(req.query.start) : new Date(0);
	let endDate = req.query.end ? new Date(req.query.end) : new Date();
	let query = {
		date: { $gte: startDate.toJSON(), $lte: endDate.toJSON() }
	};
	if (req.query.category && req.query.category !== "all") {
		query.category = req.query.category;
	}
	expensesDB.find(query).sort({ date: -1 }).exec(function(err, docs) {
		if (err) return res.status(500).send(err);
		res.send(docs);
	});
});

// Create expense
app.post("/expense", function(req, res) {
	let expense = req.body || {};
	expense._id = Math.floor(Date.now() / 1000);
	expense.date = expense.date ? new Date(expense.date).toJSON() : new Date().toJSON();
	expense.amount = parseFloat(expense.amount || 0);
	expensesDB.insert(expense, function(err, doc) {
		if (err) return res.status(500).send(err);
		res.send(doc);
	});
});

// Update expense
app.put("/expense", function(req, res) {
	const expenseId = req.body._id;
	if (!Number.isInteger(expenseId)) {
		return res.status(400).send("Invalid expense ID");
	}
	let payload = Object.assign({}, req.body);
	if (payload.date) {
		payload.date = new Date(payload.date).toJSON();
	}
	expensesDB.update({ _id: expenseId }, payload, {}, function(err) {
		if (err) return res.status(500).send(err);
		res.sendStatus(200);
	});
});

// Delete expense
app.delete("/expense/:expenseId", function(req, res) {
	const expenseId = parseInt(req.params.expenseId);
	expensesDB.remove({ _id: expenseId }, function(err) {
		if (err) return res.status(500).send(err);
		res.sendStatus(200);
	});
});

// Summary totals by date range and optional category
app.get("/summary", function(req, res) {
	let startDate = req.query.start ? new Date(req.query.start) : new Date(0);
	let endDate = req.query.end ? new Date(req.query.end) : new Date();
	let query = {
		date: { $gte: startDate.toJSON(), $lte: endDate.toJSON() }
	};
	if (req.query.category && req.query.category !== "all") {
		query.category = req.query.category;
	}
	expensesDB.find(query, function(err, docs) {
		if (err) return res.status(500).send(err);
		let total = docs.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
		res.send({ total, count: docs.length });
	});
});


