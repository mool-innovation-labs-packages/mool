const stringGenerator = (lengthOfSecretKey) => {
	let result = '';
	let characters =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._~()'!*:@,;0123456789";
	let charactersLength = characters.length;
	for (let i = 0; i < lengthOfSecretKey; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
};

const numberGenerator = (min, max) => {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.trunc(Math.random() * (max - min) + min);
};

const random = {
	stringGenerator,
	numberGenerator,
};

module.exports = random;
