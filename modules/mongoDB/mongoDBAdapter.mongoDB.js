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

  /**
   *
   * @param query
   * @param options
   * @param projectionObject
   * @param fetchAllowedAttributes
   * @param fieldsArray
   * @returns {Promise<{code: *, data: *, success: boolean, message: *, timestamp: number}|{code: *, data: *, success: boolean, message: *, type: *, timestamp: number}>}
   */
  async findOne(
    query = {},
    options = {},
    projectionObject = undefined,
    fetchAllowedAttributes = undefined,
    fieldsArray = undefined
  ) {
    try {
      let { skip, limit, projection } = await utils.projectionGenerator(
        projectionObject,
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
      if (error.code === 31249) {
        return response.error(
          `find failed because a parent field and its child field where requested together in the field('f') query. `,
          null,
          400,
          "DB-FO-PATH-COLLISION"
        );
      }
      return response.error("FindOne failed", error, 500, "UNCAUGHT-DB-FO");
    }
  }

  /**
   *
   * @param query
   * @param options
   * @param projectionObject
   * @param fetchAllowedAttributes
   * @param fieldsArray
   * @param pageSize
   * @param pageNumber
   * @returns {Promise<{code: *, data: *, success: boolean, message: *, timestamp: number}|{code: *, data: *, success: boolean, message: *, type: *, timestamp: number}>}
   */
  async find(
    query = {},
    options = {},
    projectionObject = undefined,
    fetchAllowedAttributes = undefined,
    fieldsArray = undefined,
    pageSize = undefined,
    pageNumber = undefined
  ) {
    try {
      let { projection, skip, limit } =
        await utils.projectionAndPagePropsGenerator(
          projectionObject,
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
      if (error.code === 31249) {
        return response.error(
          `find failed because a parent field and its child field where requested together in the field('f') query. `,
          error.keyValue,
          400,
          "DB-FI-PATH-COLLISION"
        );
      }
      return response.error("find failed", error, 500, "UNCAUGHT-DB-FI");
    }
  }

  /**
   *
   * @param doc
   * @param options
   * @returns {Promise<{code: *, data: *, success: boolean, message: *, timestamp: number}|{code: *, data: *, success: boolean, message: *, type: *, timestamp: number}>}
   */
  async insertOne(doc = {}, options = {}) {
    try {
      let insertOneData = await this.collection.insertOne(doc, options);
      if (insertOneData.acknowledged) {
        return response.success("insertOne successful", insertOneData, 200);
      } else {
        return response.error(
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

  /**
   *
   * @param docs
   * @param options
   * @returns {Promise<{code: *, data: *, success: boolean, message: *, timestamp: number}|{code: *, data: *, success: boolean, message: *, type: *, timestamp: number}>}
   */
  async insertMany(docs = [], options = {}) {
    try {
      let insertManyData = await this.collection.insertMany(docs, options);
      if (insertManyData.acknowledged) {
        return response.success("insertMany successful", insertManyData, 200);
      } else {
        return response.error(
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

  /**
   *
   * @param filter
   * @param replacement
   * @param options
   * @returns {Promise<{code: undefined, data: null, success: boolean, message: null, timestamp: number}|{code: undefined, data: null, success: boolean, message: null, type: null, timestamp: number}>}
   */
  async findOneAndReplace(filter = {}, replacement = {}, options = {}) {
    try {
      let findOneAndReplaceData = await this.collection.findOneAndReplace(
        filter,
        replacement,
        options
      );
      if (
        findOneAndReplaceData.ok &&
        findOneAndReplaceData.lastErrorObject?.n === 1
      ) {
        return response.success(
          "findOneAndReplace successful",
          findOneAndReplaceData,
          200
        );
      } else {
        return response.error(
          "findOneAndReplace failed",
          findOneAndReplaceData,
          500,
          "DB-FOAR-1"
        );
      }
    } catch (error) {
      if (error.code === 11000) {
        return response.error(
          `findOneAndReplace failed because the field ${
            Object.keys(error.keyValue)[0]
          } must be unique`,
          error.keyValue,
          400,
          "DB-FOAR-DUPLICATE-FIELD"
        );
      }
      return response.error(
        "findOneAndReplace failed",
        error,
        500,
        "UNCAUGHT-DB-FOAR"
      );
    }
  }

  /**
   *
   * @param filter
   * @param updateFilter
   * @param options
   * @returns {Promise<{code: undefined, data: null, success: boolean, message: null, timestamp: number}|{code: undefined, data: null, success: boolean, message: null, type: null, timestamp: number}>}
   */
  async findOneAndUpdate(filter = {}, updateFilter = {}, options = {}) {
    try {
      let findOneAndUpdateData = await this.collection.findOneAndUpdate(
        filter,
        updateFilter,
        options
      );
      if (
        findOneAndUpdateData.ok &&
        findOneAndUpdateData.lastErrorObject?.n === 1
      ) {
        return response.success(
          "findOneAndUpdate successful",
          findOneAndUpdateData,
          200
        );
      } else {
        return response.error(
          "findOneAndUpdate failed",
          findOneAndUpdateData,
          500,
          "DB-FOAU-1"
        );
      }
    } catch (error) {
      if (error.code === 11000) {
        return response.error(
          `findOneAndUpdate failed because the field ${
            Object.keys(error.keyValue)[0]
          } must be unique`,
          error.keyValue,
          400,
          "DB-FOAU-DUPLICATE-FIELD"
        );
      }
      return response.error(
        "findOneAndUpdate failed",
        error,
        500,
        "UNCAUGHT-DB-FOAU"
      );
    }
  }

  /**
   *
   * @param filter
   * @param updateFilter
   * @param options
   * @returns {Promise<{code: *, data: *, success: boolean, message: *, timestamp: number}|{code: *, data: *, success: boolean, message: *, type: *, timestamp: number}>}
   */
  async updateOne(filter = {}, updateFilter = {}, options = {}) {
    try {
      let updateOneData = await this.collection.updateOne(
        filter,
        updateFilter,
        options
      );
      if (
        updateOneData.acknowledged &&
        ((updateOneData.matchedCount === 1 &&
          updateOneData.modifiedCount === 1) ||
          updateOneData.upsertedCount === 1)
      ) {
        return response.success("updateOne successful", updateOneData, 200);
      } else {
        return response.error(
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

  /**
   *
   * @param filter
   * @param updateFilter
   * @param options
   * @returns {Promise<{code: *, data: *, success: boolean, message: *, timestamp: number}|{code: *, data: *, success: boolean, message: *, type: *, timestamp: number}>}
   */
  async updateMany(filter = {}, updateFilter = {}, options = {}) {
    try {
      let updateManyData = await this.collection.updateMany(
        filter,
        updateFilter,
        options
      );
      return response.success("updateMany successful", updateManyData, 200);
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

  /**
   *
   * @param filter
   * @param options
   * @returns {Promise<{code: undefined, data: null, success: boolean, message: null, timestamp: number}|{code: undefined, data: null, success: boolean, message: null, type: null, timestamp: number}>}
   */
  async findOneAndDelete(filter = {}, options = {}) {
    try {
      let findOneAndDeleteData = await this.collection.findOneAndDelete(
        filter,
        options
      );
      if (
        findOneAndDeleteData.ok &&
        findOneAndDeleteData.lastErrorObject?.n === 1
      ) {
        return response.success(
          "findOneAndDelete successful",
          findOneAndDeleteData,
          200
        );
      } else {
        return response.error(
          "findOneAndDelete failed",
          findOneAndDeleteData,
          500,
          "DB-FOAD-1"
        );
      }
    } catch (error) {
      return response.error(
        "findOneAndDelete failed",
        error,
        500,
        "UNCAUGHT-DB-FOAD"
      );
    }
  }

  /**
   *
   * @param filter
   * @param options
   * @returns {Promise<{code: *, data: *, success: boolean, message: *, timestamp: number}|{code: *, data: *, success: boolean, message: *, type: *, timestamp: number}>}
   */
  async deleteOne(filter = {}, options = {}) {
    try {
      let deleteOneData = await this.collection.deleteOne(filter, options);
      if (deleteOneData.acknowledged && deleteOneData.deletedCount === 1) {
        return response.success("deleteOne successful", deleteOneData, 200);
      } else {
        return response.error(
          "deleteOne failed",
          deleteOneData,
          500,
          "DB-DO-1"
        );
      }
    } catch (error) {
      return response.error("deleteOne failed", error, 500, "UNCAUGHT-DB-DO");
    }
  }

  /**
   *
   * @param filter
   * @param options
   * @returns {Promise<{code: *, data: *, success: boolean, message: *, timestamp: number}|{code: *, data: *, success: boolean, message: *, type: *, timestamp: number}>}
   */
  async deleteMany(filter = {}, options = {}) {
    try {
      let deleteManyData = await this.collection.deleteMany(filter, options);
      if (deleteManyData.acknowledged) {
        return response.success("deleteMany successful", deleteManyData, 200);
      } else {
        return response.error(
          "deleteMany failed",
          deleteManyData,
          500,
          "DB-DM-1"
        );
      }
    } catch (error) {
      return response.error("deleteMany failed", error, 500, "UNCAUGHT-DB-DM");
    }
  }
}

module.exports = MongoDbAdapter;
