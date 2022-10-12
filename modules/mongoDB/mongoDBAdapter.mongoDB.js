const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;
const response = require("../response/methods.response");
const indexCreator = require("./mongoDBIndexCreator.mongoDB");
const utils = require("../utils/index.utils");

class MongoDbAdapter {
  /**
   * Creates an instance of MongoDbAdapter.
   * @param {String} uri
   * @param {Object?} opts
   * @param {String?} indexes
   *
   * @memberof MongoDbAdapter
   */
  constructor(uri, opts, indexes) {
    this.uri = uri;
    this.opts = opts;
    this.indexes = indexes;
  }

  /**
   * Initialize adapter
   *
   * @param {ServiceBroker} broker
   * @param {Service} service
   *
   * @memberof MongoDbAdapter
   */
  init(broker, service) {
    this.broker = broker;
    this.service = service;
    if (!this.service.schema.collection) {
      throw new Error("Missing `collection` definition in schema of service!");
    }
  }

  /**
   * Connect to database
   *
   * @returns {Promise}
   *
   * @memberof MongoDbAdapter
   */
  connect() {
    this.client = new MongoClient(this.uri, this.opts);
    return this.client
      .connect()
      .then((mongoClient) => {
        this.db = this.client.db(this.dbName);
        this.collection = this.db.collection(this.service.schema.collection);
        this.service.logger.info("MongoDB adapter has connected successfully.");
        mongoClient.on("close", () =>
          this.service.logger.warn("MongoDB adapter has disconnected.")
        );
        mongoClient.on("error", (err) =>
          this.service.logger.error("MongoDB error.", err)
        );
        mongoClient.on("reconnect", () =>
          this.service.logger.info("MongoDB adapter has reconnected.")
        );
        mongoClient.on("connectionCreated", () =>
          this.service.logger.info("MongoDB's connection created.")
        );
        mongoClient.on("connectionClosed", () =>
          this.service.logger.warn("MongoDB adapter's connectionClosed.")
        );
        mongoClient.on("connectionReady", () =>
          this.service.logger.info("MongoDB's connectionReady.")
        );
      })
      .then(() => {
        indexCreator(this.collection, this.indexes);
      })
      .catch((error) =>
        this.service.logger.error("MongoDB uncaught error at adapter.", error)
      );
  }

  /**
   * Disconnect from database
   *
   * @returns {Promise}
   *
   * @memberof MongoDbAdapter
   */
  disconnect() {
    if (this.client) {
      this.client.close();
    }
    return Promise.resolve();
  }

  async findOne(
    query = {},
    options = {},
    projectObject = undefined,
    fetchAllowedAttributes = undefined,
    fieldsArray = undefined
  ) {
    try {
      let { skip, limit, projection } = await utils.projectionGenerator(
        projectObject,
        fetchAllowedAttributes,
        fieldsArray
      );
      let findOneData = await this.collection.findOne(query, {
        projection,
        skip,
        limit,
        ...options,
      });
      return response.success("findOne successful", findOneData, 200);
    } catch (error) {
      return response.error("FindOne failed", error, 500, "UNCAUGHT-DB-ERROR");
    }
  }

  async find(
    query = {},
    options = {},
    projectObject = undefined,
    fetchAllowedAttributes = undefined,
    fieldsArray = undefined,
    pageSize = undefined,
    pageNumber = undefined
  ) {
    try {
      let { projection, skip, limit } =
        await utils.projectionAndPagePropsGenerator(
          projectObject,
          fetchAllowedAttributes,
          fieldsArray,
          pageSize,
          pageNumber
        );
      let findData = await this.collection
        .find(query, {
          projection,
          skip,
          limit,
          ...options,
        })
        .toArray();
      return response.success("find successful", findData, 200);
    } catch (error) {
      return response.error("find failed", error, 500, "UNCAUGHT-DB-ERROR");
    }
  }

  async insertOne(doc = {}, options = {}) {
    try {
      let insertOneData = await this.collection.insertOne(doc, options);
      if (insertOneData.acknowledged) {
        return response.success("insertOne successful", insertOneData, 200);
      } else {
        return response.success(
          "insertOne failed",
          insertOneData,
          500,
          "DB-IO-1"
        );
      }
    } catch (error) {
      if (error.code === 11000) {
        return response.error(
          `insertOne failed because the field ${
            Object.keys(error.keyValue)[0]
          } must be unique`,
          error.keyValue,
          400,
          "DB-IO-DUPLICATE-FIELD"
        );
      }
      return response.error("insertOne failed", error, 500, "UNCAUGHT-DB-IO");
    }
  }

  async insertMany(docs = [], options = {}) {
    try {
      let insertManyData = await this.collection.insertMany(docs, options);
      if (insertManyData.acknowledged) {
        return response.success("insertMany successful", insertManyData, 200);
      } else {
        return response.success(
          "insertMany failed",
          insertManyData,
          500,
          "DB-IM-1"
        );
      }
    } catch (error) {
      if (error.code === 11000) {
        return response.error(
          `insertMany failed because the field ${
            Object.keys(error.keyValue)[0]
          } must be unique`,
          error.keyValue,
          400,
          "DB-IM-DUPLICATE-FIELD"
        );
      }
      return response.error("insertOne failed", error, 500, "UNCAUGHT-DB-IM");
    }
  }

  async updateOne(filter = {}, updateFilter = {}, options = {}) {
    try {
      let updateOneData = await this.collection.updateOne(
        filter,
        updateFilter,
        options
      );
      if (updateOneData.acknowledged) {
        return response.success("updateOne successful", updateOneData, 200);
      } else {
        return response.success(
          "updateOne failed",
          updateOneData,
          500,
          "DB-UO-1"
        );
      }
    } catch (error) {
      if (error.code === 11000) {
        return response.error(
          `updateOne failed because the field ${
            Object.keys(error.keyValue)[0]
          } must be unique`,
          error.keyValue,
          400,
          "DB-UO-DUPLICATE-FIELD"
        );
      }
      return response.error("updateOne failed", error, 500, "UNCAUGHT-DB-UO");
    }
  }

  async updateMany(filter = {}, updateFilter = {}, options = {}) {
    try {
      let updateManyData = await this.collection.updateMany(
        filter,
        updateFilter,
        options
      );
      if (updateManyData.acknowledged) {
        return response.success("updateMany successful", updateManyData, 200);
      } else {
        return response.success(
          "updateMany failed",
          updateManyData,
          500,
          "DB-UM-1"
        );
      }
    } catch (error) {
      if (error.code === 11000) {
        return response.error(
          `updateMany failed because the field ${
            Object.keys(error.keyValue)[0]
          } must be unique`,
          error.keyValue,
          400,
          "DB-UM-DUPLICATE-FIELD"
        );
      }
      return response.error("updateMany failed", error, 500, "UNCAUGHT-DB-UM");
    }
  }

  async deleteOne(filter = {}, options = {}) {
    try {
      let deleteOneData = await this.collection.deleteOne(filter, options);
      if (deleteOneData.acknowledged) {
        return response.success("deleteOne successful", deleteOneData, 200);
      } else {
        return response.success(
          "deleteOne failed",
          deleteOneData,
          500,
          "DB-DO-1"
        );
      }
    } catch (error) {
      if (error.code === 11000) {
        return response.error(
          `deleteOne failed because the field ${
            Object.keys(error.keyValue)[0]
          } must be unique`,
          error.keyValue,
          400,
          "DB-DO-DUPLICATE-FIELD"
        );
      }
      return response.error("deleteOne failed", error, 500, "UNCAUGHT-DB-DO");
    }
  }

  async deleteMany(filter = {}, options = {}) {
    try {
      let deleteManyData = await this.collection.deleteMany(filter, options);
      if (deleteManyData.acknowledged) {
        return response.success("deleteMany successful", deleteManyData, 200);
      } else {
        return response.success(
          "deleteMany failed",
          deleteManyData,
          500,
          "DB-DM-1"
        );
      }
    } catch (error) {
      if (error.code === 11000) {
        return response.error(
          `deleteMany failed because the field ${
            Object.keys(error.keyValue)[0]
          } must be unique`,
          error.keyValue,
          400,
          "DB-DM-DUPLICATE-FIELD"
        );
      }
      return response.error("deleteMany failed", error, 500, "UNCAUGHT-DB-DM");
    }
  }
}

module.exports = MongoDbAdapter;
