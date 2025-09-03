const express = require("express");
const Datastore = require("nedb");
const { getNeDbFilePath, ensureDataDirsExist } = require("../dbUtil");
const { studentDB } = require('./students');
const app = express();
app.use(express.json());

ensureDataDirsExist();
const classesDB = new Datastore({
  filename: getNeDbFilePath("classes.db"),
  autoload: true
});

// Get all classes
app.get("/", (req, res) => {
  classesDB.find({}, (err, classes) => {
    if (err) return res.status(500).send(err);

    studentDB.find({}, (err2, students) => {
      if (err2) return res.status(500).send(err2);

      // Count students per class_id
      const classCounts = students.reduce((acc, s) => {
        const cid = s.classId;
        acc[cid] = (acc[cid] || 0) + 1;
        return acc;
      }, {});

      // Attach count to each class
      const result = classes.map(cls => ({
        ...cls,
        studentCount: classCounts[cls.id] || 0
      }));

      res.send(result);
    });
  });
});


// Get a class by ID
app.get("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  classesDB.findOne({ id }, (err, doc) => {
    if (err) return res.status(500).send(err);
    if (!doc) return res.status(404).send("Class not found");
    res.send(doc);
  });
});

// Add a new class
app.post("/", (req, res) => {
  const newClass = req.body;
  if (!newClass.name || !newClass.level) {
    return res.status(400).send("Class name and level are required");
  }
  newClass.id = Math.floor(Date.now() / 1000);
  newClass.studentCount = newClass.studentCount || 0;
  classesDB.insert(newClass, (err, doc) => {
    if (err) return res.status(500).send(err);
    res.send(doc);
  });
});

// Update a class
// Update a class
app.put("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const updateFields = req.body;
  classesDB.update({ id }, { $set: updateFields }, {}, (err, numReplaced) => {
    if (err) return res.status(500).send(err);
    if (numReplaced === 0) return res.status(404).send("Class not found");
    // Return the updated class
    classesDB.findOne({ id }, (err, updatedDoc) => {
      if (err) return res.status(500).send(err);
      res.json(updatedDoc);
    });
  });
});

// Delete a class
app.delete("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  classesDB.remove({ id }, {}, (err, numRemoved) => {
    if (err) return res.status(500).send(err);
    if (numRemoved === 0) return res.status(404).send("Class not found");
    res.sendStatus(200);
  });
});

module.exports = app;
