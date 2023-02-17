# Local App Variables

Local App Variables are a way to decorate the DaVinci app instance with additional variables that persist throughout the life of the application. Some common use cases for this feature include:

- Injection of a method to perform fake HTTP requests without the need for a listening HTTP server
- Scripting, such as generating client SDKs
- Common utilities or libraries

## How to use

### 1. Typescript Augmentation

To modify existing DaVinci types and effectively augment them, [declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html) is used. This allows for the addition of types for newly defined local variables. The augmentation must be performed in the main file of a module, as shown below:

```ts
// this file is set as the target of the 'main' entry in the package.json

declare module '@davinci/core' {
	interface LocalVars {
        // a custom local variable
		myCustomVariable?: number
		
		// instances
		dbInstance?: DBInstance
		
		// common methods
		recordMetric: (name: string, value: unknown) => void 
	}
}
```

### 2. Setting the variables
After dealing with the TypeScript shenanigans, the next step is to add the variables defined above into the app. Here's an example of how to do this, 
within a module lifecycle.

```ts
import { Module } from "./Module";
import { App } from "./App";

class MyModule extends Module {
	onRegister(app: App) {
		app.addLocalVariable('myCustomVariable', 100);
        app.addLocalVariable('recordMetric', (name: string, value: unknown) => {
            // ...
		})
	}
}

```
