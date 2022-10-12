module.exports = async function projectionAndPagePropsGenerator(
  projectionObject = undefined,
  fetchAllowedAttributes = undefined,
  fieldsArray = undefined,
  pageSize = undefined,
  pageNumber = undefined
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

  let limit = 0;
  let skip = 0;

  if (pageSize && pageNumber) {
    limit = pageSize;
    skip = (pageNumber - 1) * pageSize;
  }

  return { projection, limit, skip };
};
