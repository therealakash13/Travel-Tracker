# Travel Tracker

A Node.js web application to track visited countries and popular tourist cities around the world. Users can add countries they've visited, search for cities, and visualize visited countries on an interactive map.

---

## Features

* Add countries and cities visited.
* Highlights visited countries on a SVG map.
* Stores country and city data in PostgreSQL.
* Automatically prevents duplicate country entries.
* Uses ISO country codes (ISO2, ISO3, Numeric, ISO 3166-2).

---

## Technologies Used

* **Backend:** Node.js, Express.js
* **Database:** PostgreSQL
* **Frontend:** HTML, CSS, JavaScript, EJS templates
* **Data:** City-to-country JSON, ISO country codes CSV
* **Utilities:** `fs/promises`, `path` for file handling, `pg` for postgres.

---

## Installation

1. **Clone the repository**

```bash
git clone https://github.com/therealakash13/Travel-Tracker.git
cd travel-tracker
```

2. **Install dependencies**

```bash
npm install
```

3. **Setup PostgreSQL database**

* Create a database (e.g., `travel_tracker`)
* Create tables using your CSV import `/public/countries.csv` or SQL scripts:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE,
    color CHAR(10)
);

CREATE TABLE countries (
    country_name TEXT,
    iso_2_code CHAR(2) UNIQUE,
    iso_3_code CHAR(3) UNIQUE,
    numeric_code NUMERIC(3) UNIQUE,
    iso_3166_2 TEXT
);

CREATE TABLE visited_countries (
    country_name TEXT,
    iso_2_code CHAR(2) UNIQUE,
    iso_3_code CHAR(3),
    numeric_code NUMERIC(3),
    iso_3166_2 TEXT,
    user_id INTEGER REFERENCES users(id)
);
```

4. **Configure database connection**

Update your PostgreSQL connection in `server.js`:

```js
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "travel_tracker",
  password: "your_password",
  port: 5432
});
```

5. **Run the server**

```bash
npm start
```

Open `http://localhost:3000` in your browser.

---

## Project Structure

```
public/
    ├── images/
        └── world.svg
    ├── styles/
        └── main.css
    └── cityToCountry.json
views/
    └── index.ejs
.gitignore
package-lock.json
package.json
server.js
```

---

## Usage

* **Add a country**: Type the country name or city in the input box and submit.
* **Highlight visited countries**: The map automatically highlights countries you've added.
* **Add countries based on cities**: Type a city name to add country.

---

## Notes

* Uses ISO standards to ensure country codes are consistent.
* JSON file for cities is loaded asynchronously using `fs.promises`.
* Duplicate entries are prevented via SQL checks.
* Country and city names with multiple words use `and` instead of commas to prevent CSV parsing issues.

---

## Future Improvements

* Add user authentication to track multiple users.
* Include more detailed tourist information for each city.
* Implement pagination or infinite scroll for large city lists.
* Delete visited countries functionality.
* Enhance the map with hover info and tooltips.
* More precise svgfor seperate cities.

---
