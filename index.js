const validationRules =
  require("./modules/validator/index.validator").validationRules;
const mongoDB = require("./modules/mongoDB/index.mongoDB");
const response = require("./modules/response/index.response");
const utils = require("./modules/utils/index.utils");

const exportObject = {
  /**
   * Custom validation rules for commonly used fields in the mool applications.
   */
  validationRules,
  /**
   * Custom mongoDB adapter and indexCreator for mool applications.
   */
  mongoDB,
  /**
   * Custom response object for mool applications.
   */
  response,
  /**
   * Commonly used util function of mool applications.
   */
  utils,
};

module.exports = exportObject;
