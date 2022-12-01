/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { decorateMethod, DecoratorId } from '@davinci/reflector';

export interface HealthCheckDecoratorData {
	[DecoratorId]: 'health-check.method';
	healthCheckName: string;
}

export function healthCheck(healthCheckName: string) {
	return decorateMethod(
		<HealthCheckDecoratorData>{
			[DecoratorId]: 'health-check.method',
			healthCheckName
		},
		{ allowMultiple: true, inherit: true }
	);
}
