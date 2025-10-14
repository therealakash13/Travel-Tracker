import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import ejs from "ejs";
import fs from "fs/promises";
import path from "path";

const server = express();
const PORT = 3000;
const pool = new pg.Pool({
  connectionString:
    "postgresql://akash:EqUvgC7KgR5g36w258GQCLrzBm6qlL47@dpg-d3maeql6ubrc73ekmj80-a.singapore-postgres.render.com/learningdb_qnnp",
  ssl: { rejectUnauthorized: false },
});

server.use(bodyParser.urlencoded({ extended: true }));
server.use(express.static("public"));
server.set("view engine", "ejs");

async function fetchCountry() {
  try {
    let countries = []; // Initialize an empty array which will countain all the iso-2 codes 

    // Fetching only iso-2 code of all the countries from visited countries table
    const res = await pool.query("SELECT iso_2_code FROM visited_countries");
    res.rows.forEach((c) => {
      countries.push(c.iso_2_code); // Pushing all the iso-2 codes into empty array 
    });

    return countries; // Return the array containing all the iso-2 codes 
  } catch (error) {
    console.error("Error fetching visited countries:", error);
    return [];
  }
}

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

server.get("/", async (req, res) => {
  // Fetching country codes by calling fetchCountry() function
  const countries = await fetchCountry();

  // Check if countries exists in the result
  if (countries.length === 0) {
    return res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      error: "No countries to show. Add countries!",
    });
  }

  // If there exists countries pass them to ejs file and show them on svg with the help of country code. 
  return res.render("index.ejs", {
    countries: countries,
    total: countries.length,
  });
});

server.post("/add", async (req, res) => {
  const toSearch = req.body.string.trim(); // Trimming the empty spaces

  // Calling cityToCountry() function containing input string which returns country name based on city/country name
  const country = await cityToCountry(toSearch);

  try {
    // Using the country name to fetch country data, 'iso' is just placeholder name
    const iso = await fetchIso(country);

    // Checking if country data already eists in visited_country table 
    const exists = await pool.query(
      "SELECT * FROM visited_countries WHERE iso_2_code = $1",
      [iso.iso_2_code]
    );

    // if data doesnt exists meaning visiting country for first time then populate the visited_countries table with iso 
    if (exists.rowCount === 0) {
      await pool.query(
        "INSERT INTO visited_countries (country_name, iso_2_code, iso_3_code, numeric_code, iso_3166_2) VALUES ($1,$2,$3,$4,$5)",
        [
          iso.country_name,
          iso.iso_2_code,
          iso.iso_3_code,
          iso.numeric_code,
          iso.iso_3166_2,
        ]
      );

      return res.redirect("/"); // Redirecting to '/' (home)
    } else {
      // else return the error message
      const countries = await fetchCountry();
      return res.render("index.ejs", {
        countries,
        total: countries.length,
        error: "Unable to find country. Try Again!",
      });
    }
  } catch (error) {
    console.error("Error adding country:", error);
    const countries = await fetchCountry();
    return res.render("index.ejs", {
      countries,
      total: countries.length,
      error: "Database error. Try Again!",
    });
  }
});

server.listen(PORT, (err) => {
  if (err) console.error("Error while starting server, ", err);
  console.log(`App is running on http://localhost:${PORT}.`);
});
