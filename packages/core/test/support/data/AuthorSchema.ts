import { entity } from '../../../src';
import { Book } from './BookSchema';

@entity()
export class Author {
	@entity.prop()
	name: string;

	@entity.prop({ typeFactory: () => [Book] })
	books: Array<Book>;
}
