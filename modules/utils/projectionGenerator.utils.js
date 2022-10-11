module.exports = async function projectionGenerator(
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
};
