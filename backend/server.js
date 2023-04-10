const express = require("express");
const cors = require("cors");
const mysql = require("mysql"); // middleware to enablet Cross-Origin Resource Sharing

const app = express();
const bcrypt = require("bcrypt"); // hash the password
const jwt = require("jsonwebtoken"); //create token

const port = 5000;

//connect with database
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "letmein",
  database: "my_database",
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("Connected to MySQL database");
});

app.use(cors());
app.use(express.json());

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.post("/api/signup", (req, res) => {
  console.log(req.body);
  const { email, password, firstName, lastName } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  db.query(
    "INSERT INTO users (email, password, firstName, lastName) VALUES (?, ?, ?, ?)",
    [email, hashedPassword, firstName, lastName],
    (error, results) => {
      if (error) throw error;
      res.json({ message: "User created" });
    }
  );
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  db.query("SELECT * FROM users WHERE email = ?", [email], (error, results) => {
    if (error) throw error;
    if (results.length === 0) {
      res.status(401).json({ message: "Unauthorized" });
    } else {
      const hashedPassword = results[0].password;
      const passwordMatch = bcrypt.compareSync(password, hashedPassword);
      if (passwordMatch) {
        console.log("uth");

        const token = jwt.sign({ email }, "secret");
        res.json({ token: token });
      } else {
        console.log("notuth");

        res.status(401).json({ message: "Unauthorized" });
      }
    }
  });
});

app.get("/api/user/:email", verifyToken, (req, res) => {
  const { email } = req.params;
  db.query("SELECT * FROM users WHERE email = ?", [email], (error, result) => {
    if (error) throw error;
    if (result.length === 0) {
      console.log("no user", email);
      return res.status(404).json({ message: "User not found" });
    } else {
      const user = result[0];
      return res.json(user);
    }
  });
});

app.get("/api/data", verifyToken, (req, res) => {
  console.log("data");
  const sql = "SELECT * FROM my_table";
  db.query(sql, (err, result) => {
    if (err) {
      throw err;
    }
    console.log(result);
    res.send(result);
  });
});
app.get("/api/medicine", verifyToken, (req, res) => {
  const sql = "SELECT * FROM medicine";
  db.query(sql, (err, result) => {
    if (err) {
      throw err;
    }
    console.log(result);
    res.send(result);
  });
});

app.get("/api/profile", verifyToken, (req, res) => {
  const sql = "SELECT * FROM use";
  db.query(sql, (err, result) => {
    if (err) {
      throw err;
    }
    console.log(result);
    res.send(result);
  });
});

app.post("/api/signout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Signed out successfully" });
});

function verifyToken(req, res, next) {
  // console.log("yes", req, res, next);
  // Get token from header, cookie, or query parameter
  const token = req.headers.authorization;
  //|| req.cookies.token || req.query.token;
  if (!token) {
    // If token is missing, return error
    return res.status(401).json({ message: "Authorization token is missing" });
  }

  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, "secret");

    // Attach the decoded token to the request object
    req.token = decoded;

    // Call the next middleware
    next();
  } catch (err) {
    // If token is invalid, return error
    return res.status(401).json({ message: "Authorization token is invalid" });
  }
}

app.post("/api/medicine", verifyToken, (req, res) => {
  console.log(req.body);
  const { name } = req.body;
  db.query(
    "INSERT INTO medicine (name ) VALUES (?)",
    [name],
    (error, results) => {
      if (error) throw error;
      res.json({ message: "medicine is added" });
    }
  );
});

app.post("/api/reminder/add", verifyToken, (req, res) => {
  console.log(req.body);

  const {
    medicine,
    dosage,
    repetition,
    frequency,
    startDate,
    endDate,
    time,
    note,
  } = req.body;
  console.log("alando", repetition);
  db.query(
    "INSERT INTO reminder (medicine, dosage, repetition, frequency, startDate, endDate, time, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [medicine, dosage, repetition, frequency, startDate, endDate, time, note],
    (error, results) => {
      if (error) throw error;
      res.json({ message: "reminder is added" });
    }
  );
});

app.put("/api/users/:email", verifyToken, (req, res) => {
  const { email } = req.params;

  const { firstName, lastName, password, newEmail } = req.body;

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.query(
    "UPDATE users SET firstName = ?, lastName = ?, password = ?, email = ? WHERE email = ?",
    [firstName, lastName, hashedPassword, newEmail, email],
    (error, results) => {
      if (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
      } else if (results.affectedRows === 0) {
        res.status(404).json({ message: "User not found" });
      } else {
        res.status(200).json({ message: "User updated successfully" });
      }
    }
  );
});