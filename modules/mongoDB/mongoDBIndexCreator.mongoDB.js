/**
 * Custom mongoDB indexCreator.
 *
 * call this function to create a new collection or check for existence of an index in the collection.
 *
 * @param collection
 * @param indexes
 *
 * It will kill the process if the index creation failed.
 */
module.exports = async function indexCreator(collection, indexes) {
  try {
    await Promise.all(
      indexes.map(async (index) => {
        await collection.createIndex(index.fields, index.options);
      })
    );
  } catch (error) {
    if (error.code === 11000) {
      process.kill(process.pid, "SIGTERM");
    }
  }
};
