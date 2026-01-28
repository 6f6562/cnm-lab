require("dotenv").config();
const express = require("express");
const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(require("./routes/product.routes"));

app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
