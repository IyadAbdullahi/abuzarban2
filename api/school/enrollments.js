const app = require("express")();
const server = require("http").Server(app);
const bodyParser = require("body-parser");
const Datastore = require("nedb");

const { paymentCategoryDB } = require('./payment-categories');

app.use(bodyParser.json());

module.exports = app;

const { getNeDbFilePath, ensureDataDirsExist } = require("../dbUtil");
ensureDataDirsExist();
// let enrollmentsDB = new Datastore({
// 	filename: getNeDbFilePath("enrollments.db"),
// 	autoload: true
// });

let enrollmentsDB = new Datastore( {
	//make sure the databases folder exists
	filename: getNeDbFilePath("enrollments.db"),
	autoload: true
} );




// Access payment categories to optionally generate invoices on enrollment
let  invoicesDB = new Datastore( {
	//make sure the databases folder exists
	filename: getNeDbFilePath("invoice.db"),
	autoload: true
} );


enrollmentsDB.ensureIndex({ fieldName: "_id", unique: true });
enrollmentsDB.ensureIndex({ fieldName: "student_id" });

invoicesDB.ensureIndex({ fieldName: "_id", unique: true });
invoicesDB.ensureIndex({ fieldName: "student_id" });

app.get("/", function(req, res) {
	res.send("Enrollments API");
});

app.get("/all", function(req, res) {
	enrollmentsDB.find({}, function(err, docs) {
		if (err) return res.status(500).send(err);
		res.send(docs);
	});
});

app.get("/by-student/:studentId", function(req, res) {
	const studentId = parseInt(req.params.studentId);
	enrollmentsDB.find({ student_id: studentId }, function(err, docs) {
		if (err) return res.status(500).send(err);
		res.send(docs);
	});
});

app.post("/enrollment", function(req, res) {
	let enrollment = req.body || {};
	enrollment._id = Math.floor(Date.now() / 1000);
	enrollment.date_enrolled = enrollment.date_enrolled || new Date().toJSON();
	enrollment.status = enrollment.status || 'Enrolled';
	
	if (!enrollment.student_id) {
		return res.status(400).send("student_id is required");
	}
	
	enrollmentsDB.insert(enrollment, function(err, doc) {
		if (err) return res.status(500).send(err);
		const generate = String(req.query.generateInvoices || '0') === '1';
		if (!generate) return res.send(doc);
		
		// generate invoices from compulsory categories
		paymentCategoryDB.find({ type: 'compulsory', is_active: { $ne: false } }, function(err2, cats) {
			if (err2) return res.status(500).send(err2);
			const now = new Date().toJSON();
			const invoices = cats.map(c => ({
				_id: Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000),
				student_id: parseInt(enrollment.student_id),
				payment_category_id: c._id,
				amount: parseFloat(c.amount || 0),
				amount_paid: 0,
				status: 'unpaid',
				payment_type: 'compulsory',
				session: enrollment.session,
				term: enrollment.term,
				date: now
			}));
			if (invoices.length === 0) return res.send(doc);
			invoicesDB.insert(invoices, function(err3) {
				if (err3) return res.status(500).send(err3);
				res.send({ enrollment: doc, invoices_created: invoices.length });
			});
		});
	});
});

app.put("/enrollment", function(req, res) {
	const id = req.body._id;
	if (!Number.isInteger(id)) return res.status(400).send("Invalid enrollment ID");
	enrollmentsDB.update({ _id: id }, req.body, {}, function(err) {
		if (err) return res.status(500).send(err);
		res.sendStatus(200);
	});
});

app.delete("/enrollment/:id", function(req, res) {
	const id = parseInt(req.params.id);
	enrollmentsDB.remove({ _id: id }, function(err) {
		if (err) return res.status(500).send(err);
		res.sendStatus(200);
	});
});

// Invoices endpoints
app.get("/invoices/by-student/:studentId", function(req, res) {
	const studentId = parseInt(req.params.studentId);
	invoicesDB.find({ student_id: studentId }, function(err, docs) {
		if (err) return res.status(500).send(err);
		res.send(docs);
	});
});

app.get("/invoices/by-session", function(req, res) {
	const session = req.query.session;
	const term = req.query.term;
	let q = {};
	if (session) q.session = session;
	if (term) q.term = term;
	invoicesDB.find(q, function(err, docs) {
		if (err) return res.status(500).send(err);
		res.send(docs);
	});
});

app.post("/invoices/invoice", function(req, res) {
	let inv = req.body || {};
	inv._id = Math.floor(Date.now() / 1000);
	inv.date = inv.date || new Date().toJSON();
	inv.amount = parseFloat(inv.amount || 0);
	inv.amount_paid = parseFloat(inv.amount_paid || 0);
	inv.status = inv.status || 'unpaid';
	
	invoicesDB.insert(inv, function(err, doc) {
		if (err) return res.status(500).send(err);
		res.send(doc);
	});
});

app.put("/invoices/invoice", function(req, res) {
	const id = req.body._id;
	if (!Number.isInteger(id)) return res.status(400).send("Invalid invoice ID");
	invoicesDB.update({ _id: id }, req.body, {}, function(err) {
		if (err) return res.status(500).send(err);
		res.sendStatus(200);
	});
});

app.delete("/invoices/invoice/:id", function(req, res) {
	const id = parseInt(req.params.id);
	invoicesDB.remove({ _id: id }, function(err) {
		if (err) return res.status(500).send(err);
		res.sendStatus(200);
	});
});


