declare module 'immutable-set' {
	export default function set<Input = unknown, Result = unknown>(
		obj: Input | null | undefined,
		path: string | Array<string>,
		value: unknown,
		options: {
			withArrays?: boolean;
			equality?: (currValue: unknown, newVal: unknown) => boolean;
			safe?: boolean;
			sameValue?: boolean;
		}
	): Result;
}
