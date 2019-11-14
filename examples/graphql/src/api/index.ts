// this file is required to be able to deal with circular dependencies
// read more: https://medium.com/visual-development/how-to-fix-nasty-circular-dependency-issues-once-and-for-all-in-javascript-typescript-a04c987cf0de
export { default as AuthorSchema } from './author/author.schema';
export { default as BookSchema } from './book/book.schema';

export { default as BookController } from './book/book.controller';
export { default as AuthorController } from './author/author.controller';
