const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;
const ObjectID = mongodb.ObjectID;
const response = require("../response/index.response");
const mongoDBIndexCreator = require("./mongoDBIndexCreator.mongoDB");

class MongoDbAdapter {
  /**
   * Creates an instance of MongoDbAdapter.
   * @param {String} uri
   * @param {Object?} opts
   * @param {String?} dbName
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
        mongoDBIndexCreator(this.collection, this.indexes);
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

  async findOne(query = {}, options = {}) {
    try {
      let findOneData = await this.collection.findOne(query, options);
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
    extraAttributesArray = undefined,
    pageSize = undefined,
    pageNumber = undefined
  ) {
    try {
      let { skip, limit } = await this.projectionAndPagePropsGenerator(
        projectObject,
        fetchAllowedAttributes,
        extraAttributesArray,
        pageSize,
        pageNumber
      );
      let findData = await this.collection
        .find(query, {
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
      return response.success("insertOne successful", insertOneData, 200);
    } catch (error) {
      if (error.code === 11000) {
        return response.error(
          `insertOne failed because the field ${
            Object.keys(error.keyValue)[0]
          } must be unique`,
          error.keyValue,
          400,
          "DB-DUPLICATE-FIELD"
        );
      }
      return response.error(
        "insertOne failed",
        error,
        500,
        "UNCAUGHT-DB-ERROR"
      );
    }
  }

  async pagePropsGenerator(pageSize = undefined, pageNumber = undefined) {
    let limit = 0;
    let skip = 0;

    if (pageSize && pageNumber) {
      limit = pageSize;
      skip = (pageNumber - 1) * pageSize;
    }

    return { limit, skip };
  }

  async projectionAndPagePropsGenerator(
    projectObject = undefined,
    fetchAllowedAttributes = undefined,
    extraAttributesArray = undefined,
    pageSize = undefined,
    pageNumber = undefined
  ) {
    let project = projectObject ? projectObject : { _id: 1 };

    if (!projectObject) {
      if (extraAttributesArray !== undefined) {
        if (typeof extraAttributesArray === "string") {
          extraAttributesArray = [extraAttributesArray];
        }

        extraAttributesArray.map((attributeName) => {
          if (Object.hasOwn(fetchAllowedAttributes, attributeName)) {
            project[fetchAllowedAttributes[attributeName]] = 1;
          }
        });
      }
    }

    let limit = 0;
    let skip = 0;

    if (pageSize && pageNumber) {
      limit = Number(pageSize);
      skip = pageNumber * pageSize;
    }

    return { project, limit, skip };
  }

  async projectionGenerator(
    projectObject = undefined,
    fetchAllowedAttributes = undefined,
    extraAttributesArray = undefined
  ) {
    let project = projectObject ? projectObject : { _id: 1 };

    if (!projectObject) {
      if (extraAttributesArray !== undefined) {
        if (typeof extraAttributesArray === "string") {
          extraAttributesArray = [extraAttributesArray];
        }

        extraAttributesArray.map((attributeName) => {
          if (Object.hasOwn(fetchAllowedAttributes, attributeName)) {
            project[fetchAllowedAttributes[attributeName]] = 1;
          }
        });
      }
    }

    return { project };
  }
}

module.exports = MongoDbAdapter;
