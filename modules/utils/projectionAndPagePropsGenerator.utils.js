module.exports = async function projectionAndPagePropsGenerator(
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
};
