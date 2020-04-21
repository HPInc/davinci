import should from 'should';
import { withOperators, parseGqlQuery } from '../../src/mongooseHelpers';

describe('mongooseHelpers', () => {
	describe('#parseGqlQuery', () => {
		it('should correctly transform the query', () => {
			const query = {
				firstname: { EQ: 'Mike' },
				home: { address: { NE: 'Foobar' } },
				AND: [{ lastname: { IN: ['Foo'] } }, { lastname: { NIN: ['Bar'] } }],
				OR: [{ home: { address: { EXISTS: true } } }]
			};

			const mgooseQuery = parseGqlQuery(query);

			should(mgooseQuery).be.deepEqual({
				firstname: {
					$eq: 'Mike'
				},
				'home.address': {
					$ne: 'Foobar'
				},
				$and: [
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
				$or: [
					{
						'home.address': {
							$exists: true
						}
					}
				]
			});
		});
	});

	describe('#withOperators', () => {
		withOperators;
	});
});
