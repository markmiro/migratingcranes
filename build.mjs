import fse from "fs-extra";
import Handlebars from "handlebars";
import slugify from "slugify";
import _ from "lodash";

function compileHbs(filePath) {
  const source = fse.readFileSync(filePath, "utf8");
  const res = Handlebars.compile(source);
  return res;
}

function compilePartials() {
  const files = fse.readdirSync("src/partials");
  files.forEach((file) => {
    const template = compileHbs(`src/partials/${file}`);
    const name = file.replace(".hbs", "");
    Handlebars.registerPartial(name, template);
  });
}

function buildPage(filePath, { title, metaDescription }) {
  const template = compileHbs(filePath);
  const res = template({ title, metaDescription });
  const name = filePath.replace("src/", "").replace(".hbs", ".html");
  fse.writeFileSync(`dist/${name}`, res);
}

function copyReports(countries) {
  // Copy the reports
  fse.ensureDirSync("dist/to/us/from");
  countries.forEach(({ file, name, slug }) => {
    const source = fse.readFileSync(`data/us/${file}`, "utf8");
    const lines = source.split("\n");
    // Grab middle part of the report
    const outLines = lines
      .slice(360, -45)
      .join("\n")
      .replace(/class=".*"/g, ""); // remove classes
    const template = Handlebars.compile(`
      {{#>layout}}
      <div class="mc-report">
        <div class="mc-container">
        <small>
          <nav aria-label="breadcrumb">
            <ol class="mc-breadcrumb">
              <li class="mc-breadcrumb-item"><a href="/">Home</a></li>
              <li class="mc-breadcrumb-item"><a href="/to/us">To US</a></li>
              <li class="mc-breadcrumb-item mc-active" aria-current="page">From ${name}</li>
            </ol>
          </nav>
          </small>
          ${outLines}
        </div>
      </div>
      {{/layout}}
    `);
    const res = template({
      title: name + " to US Immigration Fact Sheet",
      // metaDescription: `Immigration to United States from ${name}`,
    });
    fse.ensureDirSync("dist/to/us/from");
    fse.writeFileSync(`dist/to/us/from/${slug}.html`, res);

    // fse.cpSync(`data/us/${file}`, `dist/to/us/from/${slug}.html`);
  });
}

function createReportIndex(countries) {
  const countriesGrouped = _.groupBy(countries, (c) => c.name[0]);

  console.log(countriesGrouped);

  // const countriesGrouped2 = {
  //   A: countriesGrouped["A"],
  //   B: countriesGrouped["B"],
  //   C: countriesGrouped["C"],
  //   D: countriesGrouped["D"],
  //   E: countriesGrouped["E"],
  //   F: countriesGrouped["F"],
  //   G: countriesGrouped["G"],
  //   H: countriesGrouped["H"],
  //   I: countriesGrouped["I"],
  //   J: countriesGrouped["J"],
  //   K: countriesGrouped["K"],
  //   L: countriesGrouped["L"],
  //   M: countriesGrouped["M"],
  //   N: countriesGrouped["N"],
  //   O: countriesGrouped["O"],
  //   P: countriesGrouped["P"],
  //   Q: countriesGrouped["Q"],
  //   R: countriesGrouped["R"],
  //   S: countriesGrouped["S"],
  //   T: countriesGrouped["T"],
  //   U: countriesGrouped["U"],
  //   V: countriesGrouped["V"],
  //   W: countriesGrouped["W"],
  //   X: countriesGrouped["X"],
  //   Y: countriesGrouped["Y"],
  //   Z: countriesGrouped["Z"],
  // };

  const countriesGrouped2 = {
    A: countriesGrouped["A"],
    B: countriesGrouped["B"],
    C: countriesGrouped["C"],
    "D-F": countriesGrouped["D"].concat(
      countriesGrouped["E"],
      countriesGrouped["F"]
    ),
    G: countriesGrouped["G"],
    "H-J": countriesGrouped["H"].concat(
      countriesGrouped["I"],
      countriesGrouped["J"]
    ),
    K: countriesGrouped["K"],
    L: countriesGrouped["L"],
    M: countriesGrouped["M"],
    N: countriesGrouped["N"],
    "O-R": countriesGrouped["O"].concat(
      countriesGrouped["P"],
      countriesGrouped["Q"],
      countriesGrouped["R"]
    ),
    S: countriesGrouped["S"],
    "T-V": countriesGrouped["T"].concat(
      countriesGrouped["U"],
      countriesGrouped["V"]
    ),
    "W-Z": [].concat(
      // countriesGrouped["W"],
      // countriesGrouped["X"],
      countriesGrouped["Y"],
      countriesGrouped["Z"]
    ),
  };

  const countriesHtml = Object.keys(countriesGrouped2)
    .map((key) => {
      return `
      <h2 class="">${key}</h2>
      <ul class="mc-col-text">
      ${(countriesGrouped2[key] || [])
        .map(
          (c) => `<li><a href="/to/us/from/${c.slug}.html">${c.name}</a></li>`
        )
        .join("\n")}
      </ul>
      `;
    })
    .join("\n");

  // Compile the us reports template
  const template = compileHbs("src/to-us.hbs");
  const res = template({
    title: "To US",
    countries: countriesHtml,
    // JSON.stringify(countriesGrouped2, null, 2),
    metaDescription:
      "Index page for immigration to United States from various countries.",
  });
  fse.ensureDirSync("dist/to/us/from");
  fse.writeFileSync("dist/to/us/index.html", res);
}

function buildUsReports() {
  const files = fse.readdirSync("data/us");
  const COUNT = files.length; // Number of countries to show on the homepage (for now)

  const countries = _.take(files, COUNT).map((file) => {
    const name = file
      .replace("_Report_Prototype.html", "")
      .replace(", The", "");
    const slug = slugify(name, { lower: true, remove: /[',]/g });
    return { file, name, slug };
  });

  copyReports(countries);
  createReportIndex(countries);
}

// Clean the dist folder
fse.emptyDirSync("dist");
compilePartials();
buildPage("src/index.hbs", {
  title: "Home",
  metaDescription:
    "Get detailed reports on travel and immigration between the US and other countries, using curated data from national statistics.",
});
buildPage("src/about.hbs", {
  title: "About",
  metaDescription: "",
});
buildUsReports();

// Copy the rest of the files
fse.cpSync("src/favicon.ico", "dist/favicon.ico");
fse.cpSync("src/styles.css", "dist/styles.css");
fse.cpSync("src/robots.txt", "dist/robots.txt");
fse.cpSync("src/immigration-photo.webp", "dist/immigration-photo.webp");
