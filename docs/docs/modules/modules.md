# Intro

A module is the place where all the heavy-lifting happens.  
Modules implements functionalities, like spinning up an HTTP server or a headless service that consumes from a RabbitMQ queue.

A module must implement at least the following method:
- getModuleById

And it can optionally implement the following 3 lifecycle methods:
- onRegister
- onInit
- onDestroy

An example of a dummy module:
```ts
class DummyModule extends Module {
	getModuleId() {
		return ['dummyModule']
	}
	
	onRegister() {
		console.log('module registered')
	}

	onInit() {
		console.log('module initialized')
	}

	onDestroy() {
		console.log('module destroyed')
	}
}
```
