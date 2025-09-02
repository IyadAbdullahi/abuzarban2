const app = require("express")();
const server = require("http").Server(app);
const bodyParser = require("body-parser");
const Datastore = require("nedb");
const async = require("async");
const { getNeDbFilePath, ensureDataDirsExist } = require("../dbUtil");

app.use(bodyParser.json());

module.exports = app;

ensureDataDirsExist();

let paymentCategoryDB = new Datastore( {
    //make sure the databases folder exists
    filename:getNeDbFilePath("payment_categories.db"),
    autoload: true
} );

paymentCategoryDB.ensureIndex({ fieldName: '_id', unique: true });

app.get("/", function(req, res) {
    res.send("Payment Categories API");
});

app.get("/all", function(req, res) {
    paymentCategoryDB.find({}, function(err, docs) {
        if (err) return res.status(500).send(err);
        res.send(docs);
    });
});

app.get("/compulsory", function(req, res) {
    paymentCategoryDB.find({ type: "compulsory" }, function(err, docs) {
        if (err) return res.status(500).send(err);
        res.send(docs);
    });
});

app.get("/optional", function(req, res) {
    paymentCategoryDB.find({ type: "optional" }, function(err, docs) {
        if (err) return res.status(500).send(err);
        res.send(docs);
    });
});

app.post("/category", function(req, res) {
    let newCategory = req.body;
    newCategory._id = Math.floor(Date.now() / 1000);
    newCategory.is_active = newCategory.is_active !== false; // Default to true
    newCategory.amount = parseFloat(newCategory.amount || 0);
    
    paymentCategoryDB.insert(newCategory, function(err, category) {
        if (err) res.status(500).send(err);
        else res.send(category);
    });
});

app.delete("/category/:categoryId", function(req, res) {
    paymentCategoryDB.remove({
        _id: parseInt(req.params.categoryId)
    }, function(err, numRemoved) {
        if (err) res.status(500).send(err);
        else res.sendStatus(200);
    });
});

app.put("/category", function(req, res) {
    const categoryId = req.body._id;
    if (!Number.isInteger(categoryId)) {
        return res.status(400).send("Invalid category ID");
    }
    
    let updateData = Object.assign({}, req.body);
    updateData.amount = parseFloat(updateData.amount || 0);
    
    paymentCategoryDB.update({
        _id: categoryId
    }, updateData, {}, function(err, numReplaced) {
        if (err) res.status(500).send(err);
        else res.sendStatus(200);
    });
});

// At the end of payment-categories.js
module.exports.paymentCategoryDB = paymentCategoryDB;