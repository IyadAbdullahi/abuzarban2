const app = require("express")();
const server = require("http").Server(app);
const bodyParser = require("body-parser");
const Datastore = require("nedb");
const async = require("async");
const { getNeDbFilePath, ensureDataDirsExist } = require("./dbUtil");

app.use(bodyParser.json());

module.exports = app;

ensureDataDirsExist();
// let studentPaymentDB = new Datastore({
let studentPaymentDB = new Datastore( {
    //make sure the databases folder exists
    filename: getNeDbFilePath("students_payments.db"),
    autoload: true
} );

studentPaymentDB.ensureIndex({ fieldName: '_id', unique: true });

app.get("/", function(req, res) {
    res.send("Student Payments API");
});

app.get("/all", function(req, res) {
    studentPaymentDB.find({}, function(err, docs) {
        if (err) return res.status(500).send(err);
        res.send(docs);
    });
});

// Summary across all students
app.get("/summary-all", function(req, res) {
    studentPaymentDB.find({}, function(err, payments) {
        if (err) return res.status(500).send(err);
        let totals = {
            total_paid: 0,
            total_outstanding: 0
        };
        payments.forEach(p => {
            const paid = parseFloat(p.amount_paid || 0);
            totals.total_paid += paid;
            const outstanding = Math.max(0, parseFloat(p.amount || 0) - parseFloat(p.amount_paid || 0));
            totals.total_outstanding += outstanding;
        });
        res.send(totals);
    });
});

app.get("/student/:studentId", function(req, res) {
    studentPaymentDB.find({
        student_id: parseInt(req.params.studentId)
    }, function(err, docs) {
        if (err) return res.status(500).send(err);
        res.send(docs);
    });
});

app.get("/outstanding/:studentId", function(req, res) {
    studentPaymentDB.find({
        student_id: parseInt(req.params.studentId),
        $where: function() {
            return (this.amount || 0) > (this.amount_paid || 0);
        }
    }, function(err, docs) {
        if (err) return res.status(500).send(err);
        res.send(docs);
    });
});

app.get("/by-category/:categoryId", function(req, res) {
    studentPaymentDB.find({
        payment_category_id: parseInt(req.params.categoryId)
    }, function(err, docs) {
        res.send(docs);
    });
});

app.post("/payment", function(req, res) {
    let newPayment = req.body;
    newPayment._id = Math.floor(Date.now() / 1000);
    newPayment.date = new Date().toJSON();
    newPayment.amount = parseFloat(newPayment.amount || 0);
    newPayment.amount_paid = parseFloat(newPayment.amount_paid || 0);
    
    // Determine status based on payment
    if (newPayment.amount_paid >= newPayment.amount) {
        newPayment.status = 'paid';
    } else if (newPayment.amount_paid > 0) {
        newPayment.status = 'partial';
    } else {
        newPayment.status = 'unpaid';
    }
    
    studentPaymentDB.insert(newPayment, function(err, payment) {
        if (err) res.status(500).send(err);
        else res.send(payment);
    });
});

app.put("/payment", function(req, res) {
    const paymentId = req.body._id;
    
    if (Number.isInteger(paymentId)) {
        studentPaymentDB.update(
            { _id: paymentId },
            req.body,
            {},
            function(err, numReplaced, payment) {
                if (err) res.status(500).send(err);
                else res.sendStatus(200);
            }
        );
    } else {
        res.status(400).send("Invalid payment ID");
    }
});

app.delete("/payment/:paymentId", function(req, res) {
    studentPaymentDB.remove({
        _id: parseInt(req.params.paymentId)
    }, function(err, numRemoved) {
        if (err) res.status(500).send(err);
        else res.sendStatus(200);
    });
});

// Get payment summary for a student
app.get("/summary/:studentId", function(req, res) {
    const studentId = parseInt(req.params.studentId);
    
    studentPaymentDB.find({ student_id: studentId }, function(err, payments) {
        if (err) {
            res.status(500).send(err);
            return;
        }
        
        let summary = {
            total_paid: 0,
            total_outstanding: 0,
            compulsory_paid: 0,
            compulsory_outstanding: 0,
            optional_paid: 0,
            optional_outstanding: 0
        };
        
        payments.forEach(payment => {
            const paid = parseFloat(payment.amount_paid || 0);
            const total = parseFloat(payment.amount || 0);
            const outstanding = Math.max(0, total - paid);
            
            summary.total_paid += paid;
            summary.total_outstanding += outstanding;
            
            if (payment.payment_type === "compulsory") {
                summary.compulsory_paid += paid;
                summary.compulsory_outstanding += outstanding;
            } else {
                summary.optional_paid += paid;
                summary.optional_outstanding += outstanding;
            }
        });
        
        res.send(summary);
    });
});

// Get payments by date range
app.get("/by-date", function(req, res) {
    let startDate = new Date(req.query.start);
    let endDate = new Date(req.query.end);
    
    let query = {
        date: { $gte: startDate.toJSON(), $lte: endDate.toJSON() }
    };
    
    if (req.query.student_id && req.query.student_id != 0) {
        query.student_id = parseInt(req.query.student_id);
    }
    
    if (req.query.payment_type && req.query.payment_type !== 'all') {
        query.payment_type = req.query.payment_type;
    }
    
    studentPaymentDB.find(query, function(err, docs) {
        if (err) return res.status(500).send(err);
        res.send(docs || []);
    });
});