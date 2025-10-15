import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import ejs from "ejs";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const server = express();
const PORT = process.env.PORT;
const pool = new pg.Pool({
  connectionString: `${process.env.DB_URL}`,
  ssl: { rejectUnauthorized: false },
});

server.use(bodyParser.urlencoded({ extended: true }));
server.use(express.static("public"));
server.set("view engine", "ejs");

let currentUserId = 1; // Initialize current user to 1

// fetch country data from visited_countries table
async function fetchCountry(uid) {
  try {
    let countries = []; // Initialize an empty array which will countain all the iso-2 codes

    // Fetching only iso-2 code of all the countries from visited countries table of the current user
    const res = await pool.query("SELECT iso_2_code FROM visited_countries WHERE user_id = $1",[uid]);
    res.rows.forEach((c) => {
      countries.push(c.iso_2_code); // Pushing all the iso-2 codes of current user into empty array
    });

    return countries; // Return the array containing all the iso-2 codes of current user
  } catch (error) {
    console.error("Error fetching visited countries:", error);
    return [];
  }
}

// find and return country name form json file
async function cityToCountry(toSearch) {
  try {
    const filePath = path.resolve("public/cityToCountry.json"); // Constructs absolute path for jsopn file
    const fileString = await fs.readFile(filePath, "utf-8"); // Returns file content in string format
    const data = JSON.parse(fileString); // Parse string to json

    // Filter the json searching for input string returns an object containing city and country name
    const res = data.filter(
      (obj) =>
        obj.country_name.toLowerCase().includes(toSearch.toLowerCase()) ||
        obj.city_name.toLowerCase().includes(toSearch.toLowerCase())
    );

    // If Country / City found return country name
    if (res.length > 0) {
      return res[0].country_name;
    } else {
      // If Country / City not found throw error
      console.log(Array.isArray(res));
      throw new Error("No match found.");
    }
  } catch (error) {
    // Catch all the error and log them and return empty string
    console.log(error);
    return "";
  }
}

// fetch data from one table to populate another table
async function fetchIso(country) {
  try {
    // Fetch all the data from countries table to later populate visited_countries table
    const result = await pool.query(
      "SELECT * FROM countries WHERE country_name ILIKE '%' || $1 || '%'",
      [country]
    );

    // if data not found
    if (result.rowCount === 0) {
      throw new Error("Cant find country.");
    }
    return result.rows[0]; // Returns array containing country data at 0th index
  } catch (error) {
    console.error("Error fetching iso code:", error);
    return []; // Returns empty array
  }
}

// Fetch all the users to show on the top
async function fetchUsers() {
  const result = await pool.query("SELECT * FROM users");
  return result.rows;
}

// Fetch color of current user
async function fetchColor(uid) {
  const result = await pool.query('SELECT color FROM users WHERE id = $1',[uid]);
  return result.rows[0].color  
}

server.get("/", async (req, res) => {
  // Fetching country codes by calling fetchCountry() function
  const countries = await fetchCountry(currentUserId);  
  const users = await fetchUsers();
  console.log(users);
  const color = await fetchColor(currentUserId);
  
  // Check if countries exists in the result
  if (countries.length === 0) {
    return res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: [],  // This is giving problem after creating user because length is 0 its not showing anything Fix it
      color: "",
    });
  }

  // If there exists countries pass them to ejs file and show them on svg with the help of country code.
  return res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: color,
  });
});

server.post("/add", async (req, res) => {
  const toSearch = req.body.string.trim(); // Trimming the empty spaces

  // Calling cityToCountry() function containing input string which returns country name based on city/country name
  const country = await cityToCountry(toSearch);

  try {
    // Using the country name to fetch country data, 'iso' is just placeholder name
    const data = await fetchIso(country);

    // Checking if country data already eists in visited_country table
    const exists = await pool.query(
      "SELECT * FROM visited_countries WHERE iso_2_code = $1",
      [data.iso_2_code]
    );

    // if data doesnt exists meaning visiting country for first time then populate the visited_countries table with iso
    if (exists.rowCount === 0) {
      await pool.query(
        "INSERT INTO visited_countries (country_name, iso_2_code, iso_3_code, numeric_code, iso_3166_2, user_id) VALUES ($1,$2,$3,$4,$5,$6)",
        [
          data.country_name,
          data.iso_2_code,
          data.iso_3_code,
          data.numeric_code,
          data.iso_3166_2,
          currentUserId,
        ]
      );

      return res.redirect("/"); // Redirecting to '/' (home)
    } else {
      // else return the error message
      const countries = await fetchCountry();
      return res.render("index.ejs", {
        countries,
        total: countries.length,
      });
    }
  } catch (error) {
    console.error("Error adding country:", error);
    const countries = await fetchCountry();
    return res.render("index.ejs", {
      countries,
      total: countries.length,
    });
  }
});

server.post("/user", async (req, res) => {
  if (req.body.user) {
    currentUserId = req.body.user;
    return res.redirect("/");
  } else if(req.body.add){
    return res.redirect(`/${req.body.add}`);
  }
});

server.get('/new', (req, res)=>{
  res.render('new.ejs')
})

server.post("/new", async (req, res) => {    
  const userCreated = await pool.query(`INSERT INTO users (name, color) VALUES($1, $2) RETURNING *`,[req.body.name, req.body.color]);
  return res.redirect('/');
});

server.listen(PORT, (err) => {
  if (err) console.error("Error while starting server, ", err);
  console.log(`App is running on http://localhost:${PORT}.`);
});
