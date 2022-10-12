module.exports = async function projectionGenerator(
  projectionObject = undefined,
  fetchAllowedAttributes = undefined,
  fieldsArray = undefined
) {
  let projection = projectionObject ? projectionObject : { _id: 1 };

  if (!projectionObject) {
    if (fieldsArray !== undefined) {
      if (typeof fieldsArray === "string") {
        fieldsArray = [fieldsArray];
      }

      fieldsArray.map((attributeName) => {
        if (Object.hasOwn(fetchAllowedAttributes, attributeName)) {
          projection[fetchAllowedAttributes[attributeName]] = 1;
        }
      });
    }
  }

  return { projection };
};
