const validationRules =
  require("./modules/validator/index.validator").validationRules;
const mongoDB = require("./modules/mongoDB/index.mongoDB");
const response = require("./modules/response/index.response");

console.log(validationRules, mongoDB, response);
module.exports = {
  validationRules,
  mongoDB,
  response,
};
