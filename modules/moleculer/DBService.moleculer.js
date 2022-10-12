"use strict";

const _ = require("lodash");
const Promise = require("bluebird");
const { ValidationError } = require("moleculer").Errors;
const pkg = require("../../package.json");

/**
 * Service mixin to access database entities
 *
 * @name moleculer-db
 * @module Service
 */
module.exports = {
  // Must overwrite it
  name: "",

  // Service's metadata
  metadata: {
    $category: "database",
    $description: "Mool's Data Access service",
    $official: true,
    $package: {
      name: pkg.name,
      version: pkg.version,
      repo: pkg.repository ? pkg.repository.url : null,
    },
  },

  // Store adapter (NeDB adapter is the default)
  adapter: null,

  /**
   * Default settings
   */
  settings: {
    /** @type {String} Name of ID field. */
    idField: "_id",

    /** @type {Array<String>?} Field filtering list. It must be an `Array`. If the value is `null` or `undefined` doesn't filter the fields of entities. */
    fields: null,

    /** @type {Array?} Schema for population. [Read more](#populating). */
    populates: null,

    /** @type {Number} Default page size in `list` action. */
    pageSize: 10,

    /** @type {Number} Maximum page size in `list` action. */
    maxPageSize: 100,

    /** @type {Number} Maximum value of limit in `find` action. Default: `-1` (no limit) */
    maxLimit: -1,

    /** @type {Object|Function} Validator schema or a function to validate the incoming entity in `create` & 'insert' actions. */
    entityValidator: null,

    /** @type {Boolean} Whether to use dot notation or not when updating an entity. Will **not** convert Array to dot notation. Default: `false` */
    useDotNotation: false,

    /** @type {String} Type of cache clean event type. Values: "broadcast" or "emit" */
    cacheCleanEventType: "broadcast",
  },

  /**
   * Actions
   */
  actions: {},

  /**
   * Methods
   */
  methods: {
    /**
     * Connect to database.
     */
    connect() {
      return this.adapter.connect().then(() => {
        // Call an 'afterConnected' handler in schema
        if (_.isFunction(this.schema.afterConnected)) {
          try {
            return this.schema.afterConnected.call(this);
          } catch (err) {
            /* istanbul ignore next */
            this.logger.error("afterConnected error!", err);
          }
        }
      });
    },

    /**
     * Disconnect from database.
     */
    disconnect() {
      if (_.isFunction(this.adapter.disconnect))
        return this.adapter.disconnect();
    },
  },

  /**
   * Service created lifecycle event handler
   */
  created() {
    // Compatibility with < 0.4
    if (_.isString(this.settings.fields)) {
      this.settings.fields = this.settings.fields.split(" ");
    }

    if (!this.schema.adapter) console.error("Adapter not found");
    else this.adapter = this.schema.adapter;

    this.adapter.init(this.broker, this);

    // Transform entity validation schema to checker function
    if (
      this.broker.validator &&
      _.isObject(this.settings.entityValidator) &&
      !_.isFunction(this.settings.entityValidator)
    ) {
      const check = this.broker.validator.compile(
        this.settings.entityValidator
      );
      this.settings.entityValidator = async (entity) => {
        let res = check(entity);
        if (check.async === true || res.then instanceof Function)
          res = await res;
        if (res === true) return Promise.resolve();
        else
          return Promise.reject(
            new ValidationError("Entity validation error!", null, res)
          );
      };
    }
  },

  /**
   * Service started lifecycle event handler
   */
  started() {
    if (this.adapter) {
      return new Promise((resolve) => {
        let connecting = () => {
          this.connect()
            .then(resolve)
            .catch((err) => {
              this.logger.error("Connection error!", err);
              setTimeout(() => {
                this.logger.warn("Reconnecting...");
                connecting();
              }, 1000);
            });
        };

        connecting();
      });
    }

    /* istanbul ignore next */
    return Promise.reject(new Error("Please set the store adapter in schema!"));
  },

  /**
   * Service stopped lifecycle event handler
   */
  stopped() {
    if (this.adapter) return this.disconnect();
  },
};
