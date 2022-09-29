/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

export const coerceArray = <T = unknown>(item: T | T[]): T[] => (Array.isArray(item) ? item : [item]);
