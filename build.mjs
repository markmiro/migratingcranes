import fse from "fs-extra";
import Handlebars from "handlebars";
import slugify from "slugify";
import _ from "lodash";

const source = fse.readFileSync("public/index.html.handlebars", "utf8");
const template = Handlebars.compile(source);

const files = fse.readdirSync("data/us");
const COUNT = files.length; // Number of countries to show on the homepage (for now)

const countries = _.take(files, COUNT).map((file) => {
  const name = file.replace("_Report_Prototype.html", "").replace(", The", "");
  const slug = slugify(name, { lower: true, remove: /[',]/g });
  fse.cpSync(`data/us/${file}`, `public/to/us/from/${slug}.html`);
  return { name, slug };
});

const res = template({ countries });
fse.writeFileSync("public/index.html", res);
