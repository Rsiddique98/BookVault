import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from 'dotenv';

const app = express();
const PORT = process.env.PORT || 3000;

dotenv.config(); // Load variables from .env

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

db.connect();

// EJS and static files
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//Middleware to parse JSON requests
app.use(express.json());

//Route to fetch books from database

app.get("/", async (req, res) => {
  const { sort } = req.query;
  let query = "SELECT * FROM books";

    
  // Append sort logic
  if (sort === "rating") {
    query += " ORDER BY rating DESC";
  } else if (sort === "recency") {
    query += " ORDER BY created_at DESC";
  } else if (sort === "currentlyReading") {
    query += " WHERE status = 'currently reading'";
  } else {
    query += " ORDER BY id DESC"; // default sort
  }

  try {
    const result = await db.query(query);
    const books = result.rows;
    res.render("index.ejs", { books, sort });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching books");
  }
});

// Route to render reviews page 

app.get("/reviews/:id", async (req, res) => {
  const bookId = req.params.id;

  try {
    const result = await db.query("SELECT * FROM books WHERE id = $1", [bookId]);
    const book = result.rows[0];

    if (!book) {
      return res.status(404).send("Book not found");
    }

    res.render("review.ejs", { book });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching book review");
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));