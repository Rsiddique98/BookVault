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

app.get("/", (req, res) => {
    res.render("index.ejs");
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));