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


// Route to render user book recommendations

app.get('/suggestions', (req, res) => {
  res.render('suggestions', { suggestion: null });
});

// POST suggestion form submission
app.post('/suggestions', async (req, res) => {
  const { title, author, reason, isbn } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO suggestions (title, author, reason, isbn)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, author, reason, isbn || null]
    );

    const newSuggestion = result.rows[0];
    res.render('suggestions', { suggestion: newSuggestion });
  } catch (err) {
    console.error('Error saving suggestion:', err);
    res.status(500).send('Error submitting suggestion');
  }
});


// Route to fetch book matches in search bar

app.get('/search', async (req, res) => {
  const searchTerm = req.query.q.toLowerCase();

  try {
    const result = await db.query(
      `SELECT id, title, author, isbn FROM books 
       WHERE LOWER(title) LIKE $1 
       OR LOWER(author) LIKE $1`,
      [`%${searchTerm}%`]
    );

    if (result.rows.length > 0) {
      res.json(result.rows);
    } else {
      res.json([]);
    }
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Server error' });
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

       // 2. Fetch extra info from Open Library using ISBN
       let bookDetails = null;

       if (book.isbn) {
         const response = await axios.get("https://openlibrary.org/api/books", {
           params: {
             bibkeys: `ISBN:${book.isbn}`,
             format: "json",
             jscmd: "data"
           }
         });
   
         bookDetails = response.data[`ISBN:${book.isbn}`] || null;
       }

    res.render("review.ejs", { book, bookDetails });
  } catch (err) {
    console.error("Error in reviews route:", err);
    res.status(500).send("Error fetching book review");
  }
});

// Route to fetch detailed book info by ISBN using Axios
app.get("/book-info/:isbn", async (req, res) => {
  const { isbn } = req.params;

  try {
    const response = await axios.get("https://openlibrary.org/api/books", {
      params: {
        bibkeys: `ISBN:${isbn}`,
        format: "json",
        jscmd: "data"
      }
    });

    const bookData = response.data[`ISBN:${isbn}`];

    if (bookData) {
      res.json(bookData);
    } else {
      res.status(404).json({ error: "Book not found" });
    }
  } catch (err) {
    console.error("Axios error fetching book data:", err);
    res.status(500).json({ error: "Server error while fetching book info" });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));