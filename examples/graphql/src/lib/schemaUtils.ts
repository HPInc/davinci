/**
 * This file contains helpers for demonstration purposes.
 */

import { FieldDecoratorOptionsFactory } from '@davinci/graphql';

export const requiredForMutations: FieldDecoratorOptionsFactory = ({ operationType }) => {
	const required = operationType === 'mutation';

	return { required };
};
