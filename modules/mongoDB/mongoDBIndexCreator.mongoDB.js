module.exports = async function mongoDBIndexCreator(collection, indexes) {
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
