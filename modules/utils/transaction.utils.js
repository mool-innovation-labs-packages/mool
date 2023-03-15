const { MongoError } = require("mongodb");
const response = require("../response/methods.response");

const DBTransaction = async (client, callBack, callBackOptions) => {
  const transactionOptions = {
    readConcern: { level: "snapshot" },
    writeConcern: { w: "majority" },
    readPreference: "primary",
  };
  const session = client.startSession();
  try {
    session.startTransaction(transactionOptions);
    let callBackResult = await callBack(session, callBackOptions);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    if (callBackResult) {
      return callBackResult;
    } else {
      return response.error(
        "No response was sent from the transaction callback function",
        null,
        500,
        "TR-DBT-1"
      );
    }
  } catch (error) {
    console.log("transaction", error);
    if (
      error instanceof MongoError &&
      error.hasErrorLabel("UnknownTransactionCommitResult")
    ) {
      // add your logic to retry or handle the error
    } else if (
      error instanceof MongoError &&
      error.hasErrorLabel("TransientTransactionError")
    ) {
      // add your logic to retry or handle the error
    } else {
      console.log(
        "An error occurred in the transaction, performing a data rollback:",
        error
      );
    }
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    if (error.type) {
      return error;
    } else {
      throw error;
    }
  } finally {
    await session.endSession();
  }
};

module.exports = { DBTransaction };
