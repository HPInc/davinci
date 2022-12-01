/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { decorateParameter, DecoratorId } from '@davinci/reflector';

export function context() {
	return decorateParameter(
		{
			[DecoratorId]: 'core.parameter.context'
		},
		{ allowMultiple: false }
	);
}
