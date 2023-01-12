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

function buildPage(filePath, { title }) {
  const template = compileHbs(filePath);
  const res = template({ title });
  const name = filePath.replace("src/", "").replace(".hbs", ".html");
  fse.writeFileSync(`dist/${name}`, res);
}

function buildUsReports() {
  const files = fse.readdirSync("data/us");
  const COUNT = 3; // Number of countries to show on the homepage (for now)

  const countries = _.take(files, COUNT).map((file) => {
    const name = file
      .replace("_Report_Prototype.html", "")
      .replace(", The", "");
    const slug = slugify(name, { lower: true, remove: /[',]/g });
    return { file, name, slug };
  });

  // Copy the reports
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
        <div class="container">
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
              <li class="breadcrumb-item"><a href="/">Home</a></li>
              <li class="breadcrumb-item"><a href="/to/us">To US</a></li>
              <li class="breadcrumb-item active" aria-current="page">From ${name}</li>
            </ol>
          </nav>
          ${outLines}
        </div>
      </div>
      {{/layout}}
    `);
    const res = template({ title: name });
    fse.ensureDirSync("dist/to/us/from");
    fse.writeFileSync(`dist/to/us/from/${slug}.html`, res);

    // fse.cpSync(`data/us/${file}`, `dist/to/us/from/${slug}.html`);
  });

  // Compile the us reports template
  const template = compileHbs("src/to-us.hbs");
  const res = template({ title: "to US", countries });
  fse.writeFileSync("dist/to/us/index.html", res);
}

// Clean the dist folder
fse.emptyDirSync("dist");
compilePartials();
buildPage("src/index.hbs", { title: "Home" });
buildPage("src/about.hbs", { title: "About" });
buildUsReports();

// Copy the rest of the files
fse.cpSync("src/favicon.ico", "dist/favicon.ico");
fse.cpSync("src/styles.css", "dist/styles.css");
