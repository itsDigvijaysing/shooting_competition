const mysql = require("mysql");

const db = mysql.createConnection({
  host: "localhost",
  user: "root", // your MySQL username
  password: "", // your MySQL password
  database: "shooting_competition", // name of the database you created
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database: " + err.stack);
    return;
  }
  console.log("Connected to the database as ID " + db.threadId);
});
