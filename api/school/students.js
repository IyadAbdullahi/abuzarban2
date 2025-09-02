const app = require("express")();
const server = require("http").Server(app);
const bodyParser = require("body-parser");
const Datastore = require("nedb");
const async = require("async");

app.use(bodyParser.json());

module.exports = app;

const { getNeDbFilePath, ensureDataDirsExist } = require("../dbUtil");
ensureDataDirsExist();

let studentDB = new Datastore( {
    //make sure the databases folder exists
    filename: getNeDbFilePath("students.db"),
    autoload: true
} );


studentDB.ensureIndex({ fieldName: '_id', unique: true });
// studentDB.ensureIndex({ fieldName: 'student_id', unique: true });

app.get("/", function(req, res) {
    res.send("Students API");
});

app.get("/student/:studentId", function(req, res) {
    if (!req.params.studentId) {
        res.status(500).send("ID field is required.");
    } else {
        studentDB.findOne({ id: String(req.params.studentId) }, function(err, student) {
            if (err) return res.status(500).send(err);
            res.send(student);
        });
    }
});

app.get("/student/by-student-id/:studentId", function(req, res) {
    if (!req.params.studentId) {
        res.status(500).send("Student ID field is required.");
    } else {
        studentDB.findOne({
            student_id: req.params.studentId
        }, function(err, student) {
            if (err) return res.status(500).send(err);
            res.send(student);
        });
    }
});

app.get("/all", function(req, res) {
    studentDB.find({}, function(err, docs) {
        if (err) return res.status(500).send(err);
        // Ensure all students have id as string
        const students = docs.map(s => {
            if (!s.id) s.id = s._id;
            s.id = String(s.id);
            return s;
        });
        res.send(students);
    });
});

app.get("/by-class/:className", function(req, res) {
    studentDB.find({
        class: req.params.className
    }, function(err, docs) {
        if (err) return res.status(500).send(err);
        res.send(docs);
    });
});


// Add a new student (frontend structure)
app.post("/add", function(req, res) {
    let s = req.body;
    // Generate a unique string id if not provided
    const newId = s.id ? String(s.id) : String(Date.now());
    const newStudent = {
        _id: newId,
        id: newId,
        name: s.name,
        guardian: s.guardian || '',
        phone: s.phone || '',
        email: s.email || '',
        classId: s.classId,
        balance: typeof s.balance === 'number' ? s.balance : 0,
        date_enrolled: s.date_enrolled || new Date().toJSON(),
        status: s.status || 'Active'
    };
    studentDB.insert(newStudent, function(err, student) {
        if (err) res.status(500).send(err);
        else res.json(student);
    });
});

// Update a student (frontend structure)
app.put("/update/:id", function(req, res) {
    const id = String(req.params.id);
    const s = req.body;
    const updateFields = {
        name: s.name,
        guardian: s.guardian || '',
        phone: s.phone || '',
        email: s.email || '',
        classId: s.classId,
        balance: typeof s.balance === 'number' ? s.balance : 0,
        status: s.status || 'Active'
    };
    studentDB.update({ id }, { $set: updateFields }, {}, function(err, numReplaced) {
        if (err) return res.status(500).send(err);
        if (numReplaced === 0) return res.status(404).send("Student not found");
        studentDB.findOne({ id }, function(err, updatedDoc) {
            if (err) return res.status(500).send(err);
            res.json(updatedDoc);
        });
    });
});
app.delete("/student/:studentId", function(req, res) {
    studentDB.remove({ id: String(req.params.studentId) }, function(err, numRemoved) {
        if (err) res.status(500).send(err);
        else res.sendStatus(200);
    });
});

app.put("/student", function(req, res) {
    const studentId = req.body._id;
    
    if (Number.isInteger(studentId)) {
        studentDB.update(
            { _id: studentId },
            req.body,
            {},
            function(err, numReplaced, student) {
                if (err) res.status(500).send(err);
                else res.sendStatus(200);
            }
        );
    } else {
        res.status(400).send("Invalid student ID");
    }
});

// Search students by name or student ID
app.get("/search/:query", function(req, res) {
    const query = req.params.query;
    const regex = new RegExp(query, 'i');
    
    studentDB.find({
        $or: [
            { name: regex },
            { student_id: regex },
            { guardian_name: regex }
        ]
    }, function(err, docs) {
        if (err) res.status(500).send(err);
        else res.send(docs);
    });
});