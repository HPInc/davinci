import { entity } from '../../../src';
import { Author } from './AuthorSchema';

@entity()
export class Book {
	@entity.prop()
	title: string;

	@entity.prop({ typeFactory: () => Author })
	author: Author;
}
