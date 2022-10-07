const ObjectID = require("mongodb").ObjectID;

module.exports = {
  validationRules: {
    financialYear: {
      type: "string",
      pattern: "(19|20)\\d{2}-(19|20)\\d{2}",
      length: 9,
      messages: {
        stringPattern:
          "Financial year string pattern must be in the format YYYY-YYYY, example: `2020-2021` ",
      },
    },
    dateTime: {
      type: "string",
      pattern: "^\\d{4}-\\d\\d-\\d\\dT\\d\\d:\\d\\d:\\d\\d.\\d\\d\\dZ",
      messages: {
        stringPattern:
          "Date string pattern must be in ISO 8601 format with zone offset being Z, example: `1950-01-01T01:01:01.001Z` ",
      },
    },
    projectionObject: { type: "object", optional: true },
    projectionArray: {
      type: "array",
      items: { type: "string", empty: false },
      optional: true,
    },
    objectID: { type: "objectID", ObjectID },
    monthNumber: { type: "number", convert: true, min: 0, max: 11 },
    PAN: {
      type: "string",
      uppercase: true,
      pattern: "[A-Z,a-z]{5}[0-9]{4}[A-Z,a-z]{1}",
    },
    email: { type: "email", empty: false },
    passportNumber: {
      type: "string",
      pattern:
        "[A-PR-WYa-pr-wy][1-9]\\d\\s?\\ d{4}[1-9][A-PR-WYa-pr-wy][1-9]\\d\\s?\\ d{4}[1-9]",
    },
    phoneNumber: { type: "string", pattern: "[6-9]{1}[0-9]{9}", length: 10 },
    aadhaarNumber: {
      type: "string",
      pattern: "[2-9]{1}[0-9]{3}s[0-9]{4}s[0-9]{4}",
    },
    pageNumber: { type: "number", optional: true, convert: true },
    pageSize: { type: "number", optional: true, convert: true },
  },
};
