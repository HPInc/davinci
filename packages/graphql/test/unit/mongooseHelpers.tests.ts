import should from 'should';
import { withOperators, parseGqlQuery } from '../../src/mongooseHelpers';

describe('mongooseHelpers', () => {
	describe('#parseGqlQuery', () => {
		it('should correctly transform the query', () => {
			const query = {
				firstname: { EQ: 'Mike' },
				lastname: { NOT: { EQ: 'Jordan' } },
				home: { address: { NE: 'Foobar' } },
				OR: [{ lastname: { IN: ['Foo'] } }, { lastname: { NIN: ['Bar'] } }],
				AND: [{ home: { address: { EXISTS: true } } }, { OR: [{ weight: { EQ: 122 } }, { age: { EQ: 30 } }] }]
			};

			const mongodbQuery = parseGqlQuery(query);

			should(mongodbQuery).be.deepEqual({
				firstname: {
					$eq: 'Mike'
				},
				lastname: {
					$not: {
						$eq: 'Jordan'
					}
				},
				'home.address': {
					$ne: 'Foobar'
				},
				$or: [
					{
						lastname: {
							$in: ['Foo']
						}
					},
					{
						lastname: {
							$nin: ['Bar']
						}
					}
				],
				$and: [
					{
						'home.address': {
							$exists: true
						}
					},
					{
						$or: [
							{
								weight: {
									$eq: 122
								}
							},
							{
								age: {
									$eq: 30
								}
							}
						]
					}
				]
			});
		});
	});

	describe('#withOperators', () => {
		withOperators;
	});
});
