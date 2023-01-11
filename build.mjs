import fse from "fs-extra";
import Handlebars from "handlebars";
import slugify from "slugify";
import _ from "lodash";

const files = fse.readdirSync("data/us");
const COUNT = 3; // Number of countries to show on the homepage (for now)

const countries = _.take(files, COUNT).map((file) => {
  const name = file.replace("_Report_Prototype.html", "").replace(", The", "");
  const slug = slugify(name, { lower: true, remove: /[',]/g });
  fse.cpSync(`data/us/${file}`, `dist/to/us/from/${slug}.html`);
  return { name, slug };
});

// Compile the google-analytics.hbs partial
{
  const source = fse.readFileSync("src/partials/google-analytics.hbs", "utf8");
  const template = Handlebars.compile(source);
  Handlebars.registerPartial("google-analytics", template);
}

// Compile the layout.hbs partial
{
  const source = fse.readFileSync("src/partials/layout.hbs", "utf8");
  const template = Handlebars.compile(source);
  Handlebars.registerPartial("layout", template);
}

// Compile the index.hbs template
{
  const source = fse.readFileSync("src/index.hbs", "utf8");
  const template = Handlebars.compile(source);
  const res = template({ title: "Home" });
  fse.writeFileSync("dist/index.html", res);
}

// Compile the about.hbs template
{
  const source = fse.readFileSync("src/about.hbs", "utf8");
  const template = Handlebars.compile(source);
  const res = template({ title: "About" });
  fse.writeFileSync("dist/about.html", res);
}

// Compile the us reports template
{
  const source = fse.readFileSync("src/to-us.hbs", "utf8");
  const template = Handlebars.compile(source);
  const res = template({ title: "to US", countries });
  fse.writeFileSync("dist/to/us/index.html", res);
}

// Copy the rest of the files
fse.cpSync("src/favicon.ico", "dist/favicon.ico");