/* eslint-disable no-console */
import { Validator } from "@seriousme/openapi-schema-validator";
import path from "path";
import { fileURLToPath } from "url";

const validator = new Validator();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dirPath = path.resolve(__dirname, "..", "..", "public", "tools", "schema");
const filesToValidate = ["openapi_rest_demo.json", "openapi_learning.json"];

const validationResults = {};

for (const file of filesToValidate) {
  const filePath = path.resolve(dirPath, file);
  const res = await validateSchema(filePath);
  validationResults[file] = res;
}

displaySchemaErrors(validationResults);

async function validateSchema(pathToSchema) {
  const res = await validator.validate(pathToSchema);
  return res;
}

function displaySchemaErrors(results) {
  for (const [file, result] of Object.entries(results)) {
    // Quick check to see if the schema is valid
    if (result.valid) {
      console.log(`Specification ${file} is valid ✅`);
    } else {
      console.log(`Specification ${file} is invalid ❌`);
    }
  }

  // Display the errors
  for (const [file, result] of Object.entries(results)) {
    if (!result.valid) {
      console.log(`---------------------------------`);
      console.log(`Specification ${file} is invalid ❌`);
      console.log(result.errors);
    }
  }
}
