import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import ejs from "ejs";

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
    let countries = [];
    const res = await pool.query("SELECT iso_2_code FROM visited_countries");
    res.rows.forEach((c) => {
      countries.push(c.iso_2_code);
    });
    return countries;
  } catch (error) {
    console.error("Error fetching visited countries:", error);
    return [];
  }
}

server.get("/", async (req, res) => {
  const countries = await fetchCountry();

  if (countries.length === 0) {
    return res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      error: "No countries to show. Add countries!",
    });
  }
  return res.render("index.ejs", {
    countries: countries,
    total: countries.length,
  });
});

server.post("/add", async (req, res) => {
  const country = req.body.country.trim();

  try {
    const result = await pool.query(
      "SELECT iso_2_code FROM countries WHERE country_name ILIKE '%' || $1 || '%'",
      [country]
    );

    if (result.rows.length > 0) {
      const code = result.rows[0].iso_2_code.trim();
      console.log(code);

      const exists = await pool.query(
        "SELECT * FROM visited_countries WHERE iso_2_code = $1",
        [code]
      );
      // Fix this while uploading it should return whole row of countries table if name matches and store it to visited_counries table
      console.log(exists.rows);

      //   if (exists.rows.length === 0) {
      //     await pool.query(
      //       "INSERT INTO visited_countries (country_code) VALUES ($1)",
      //       [code]
      //     );
      //   }

      //   return res.redirect("/");
      // } else {
      //   const countries = await fetchCountry();
      //   return res.render("index.ejs", {
      //     countries,
      //     total: countries.length,
      //     error: "Unable to find country. Try Again!",
      //   });
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
