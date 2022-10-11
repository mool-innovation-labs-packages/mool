module.exports = async function pagePropsGenerator(
  pageSize = undefined,
  pageNumber = undefined
) {
  let limit = 0;
  let skip = 0;

  if (pageSize && pageNumber) {
    limit = pageSize;
    skip = (pageNumber - 1) * pageSize;
  }

  return { limit, skip };
};
