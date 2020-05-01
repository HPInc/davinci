/*
 * © Copyright 2020 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

export default () => (req, res, next) => {
	const { requestHandled } = req;
	const { result } = req;
	const { statusCode } = req;

	if (!requestHandled) return next();

	if (typeof result === 'undefined') {
		res.status(statusCode || 204).end();
	} else {
		res.status(statusCode || 200).send(result);
	}

	return null;
};
