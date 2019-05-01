import should from 'should';
import createSchemaDefinition from '../../../src/swagger/createSchemaDefinition';
import { swagger } from '../../../src';

describe('createSchemaDefinition', () => {
	it('Given a decorated class, it should create a schema definition', () => {
		const Customer = class {
			firstname: string;
			lastname: string;
		};

		swagger.definition({ title: 'Customer' })(Customer);
		swagger.prop({ type: String })(Customer.prototype, 'firstname');
		swagger.prop({ type: String })(Customer.prototype, 'lastname');
		/**
		 * This is equivalent to:
		 *
		 * class Customer {
		 * 		@swagger.prop()
		 *  	firstname: string;
		 * 		@swagger.prop()
		 *  	lastname: string;
		 *  };
		 */

		const definition = createSchemaDefinition(Customer);
		should(definition).be.deepEqual({
			Customer: {
				title: 'Customer',
				type: 'object',
				properties: {
					firstname: {
						type: 'string'
					},
					lastname: {
						type: 'string'
					}
				},
				required: []
			}
		});
	});

	it('supports nested objects', () => {
		class CustomerPhone {
			number: string;
			isPrimary: boolean;
		}

		const Customer = class {
			phone: CustomerPhone;
		};

		swagger.definition({ title: 'Customer' })(Customer);
		swagger.prop({ type: CustomerPhone })(Customer.prototype, 'phone');

		swagger.prop({ type: String })(CustomerPhone.prototype, 'number');
		swagger.prop({ type: Boolean })(CustomerPhone.prototype, 'isPrimary');

		/**
		 * This is equivalent to:
		 *
		 * class CustomerPhone {
		 * 		@swagger.prop()
		 *  	number: number;
		 * 		@swagger.prop()
		 *  	isPrimary: boolean;
		 *  };
		 *
		 * @swagger.definition({ title: 'Customer'})
		 * class Customer {
		 * 		@swagger.prop()
		 *  	phone: CustomerPhone;
		 *  };
		 */

		const definition = createSchemaDefinition(Customer);
		should(definition).be.deepEqual({
			Customer: {
				title: 'Customer',
				type: 'object',
				properties: {
					phone: {
						title: 'phone',
						type: 'object',
						properties: {
							number: {
								type: 'string'
							},
							isPrimary: {
								type: 'boolean'
							}
						},
						required: []
					}
				},
				required: []
			}
		});
	});

	it('supports nested definitions', () => {
		class CustomerPhone {
			number: string;
			isPrimary: boolean;
		}

		const Customer = class {
			phone: CustomerPhone;
		};

		swagger.definition({ title: 'Customer' })(Customer);
		swagger.prop({ type: CustomerPhone })(Customer.prototype, 'phone');

		swagger.definition({ title: 'CustomerPhone' })(CustomerPhone);
		swagger.prop({ type: String })(CustomerPhone.prototype, 'number');
		swagger.prop({ type: Boolean })(CustomerPhone.prototype, 'isPrimary');

		/**
		 * This is equivalent to:
		 *
		 * @swagger.definition({ title: 'CustomerPhone' })
		 * class CustomerPhone {
		 * 		@swagger.prop()
		 *  	number: number;
		 * 		@swagger.prop()
		 *  	isPrimary: boolean;
		 *  };
		 *
		 * @swagger.definition({ title: 'Customer' })
		 * class Customer {
		 * 		@swagger.prop()
		 *  	phone: CustomerPhone;
		 *  };
		 */

		const definition = createSchemaDefinition(Customer);
		should(definition).be.deepEqual({
			CustomerPhone: {
				title: 'CustomerPhone',
				type: 'object',
				properties: {
					number: {
						type: 'string'
					},
					isPrimary: {
						type: 'boolean'
					}
				},
				required: []
			},
			Customer: {
				title: 'Customer',
				type: 'object',
				properties: {
					phone: {
						$ref: 'CustomerPhone'
					}
				},
				required: []
			}
		});
	});

	it('supports arrays', () => {
		const Customer = class {
			groups: string[];
		};

		swagger.definition({ title: 'Customer' })(Customer);
		swagger.prop({ type: [String] })(Customer.prototype, 'groups');
		/**
		 * This is equivalent to:
		 *
		 * class Customer {
		 * 		@swagger.prop()
		 *  	groups: string[];
		 *  };
		 */

		const definition = createSchemaDefinition(Customer);
		should(definition).be.deepEqual({
			Customer: {
				title: 'Customer',
				type: 'object',
				properties: {
					groups: {
						type: 'array',
						items: {
							type: 'string'
						}
					}
				},
				required: []
			}
		});
	});

	it('support array of objects', () => {
		class CustomerPhone {
			number: string;
			isPrimary: boolean;
		}

		const Customer = class {
			phone: CustomerPhone[];
		};

		swagger.definition({ title: 'Customer' })(Customer);
		swagger.prop({ type: [CustomerPhone] })(Customer.prototype, 'phone');

		swagger.prop({ type: String })(CustomerPhone.prototype, 'number');
		swagger.prop({ type: Boolean })(CustomerPhone.prototype, 'isPrimary');

		/**
		 * This is equivalent to:
		 *
		 * class CustomerPhone {
		 * 		@swagger.prop()
		 *  	number: number;
		 * 		@swagger.prop()
		 *  	isPrimary: boolean;
		 *  };
		 *
		 * @swagger.definition({ title: 'Customer' })
		 * class Customer {
		 * 		@swagger.prop()
		 *  	phone: CustomerPhone[];
		 *  };
		 */

		const definition = createSchemaDefinition(Customer);
		should(definition).be.deepEqual({
			Customer: {
				title: 'Customer',
				type: 'object',
				properties: {
					phone: {
						type: 'array',
						items: {
							title: 'phone',
							type: 'object',
							properties: {
								number: {
									type: 'string'
								},
								isPrimary: {
									type: 'boolean'
								}
							},
							required: []
						}
					}
				},
				required: []
			}
		});
	});

	it('support array of definitions', () => {
		class CustomerPhone {
			number: string;
			isPrimary: boolean;
		}

		const Customer = class {
			phone: CustomerPhone[];
		};

		swagger.definition({ title: 'Customer' })(Customer);
		swagger.prop({ type: [CustomerPhone] })(Customer.prototype, 'phone');

		swagger.definition({ title: 'CustomerPhone' })(CustomerPhone);
		swagger.prop({ type: String })(CustomerPhone.prototype, 'number');
		swagger.prop({ type: Boolean })(CustomerPhone.prototype, 'isPrimary');

		/**
		 * This is equivalent to:
		 *
		 * @swagger.definition({ title: 'CustomerPhone' })
		 * class CustomerPhone {
		 * 		@swagger.prop()
		 *  	number: number;
		 * 		@swagger.prop()
		 *  	isPrimary: boolean;
		 *  };
		 *
		 * @swagger.definition({ title: 'Customer' })
		 * class Customer {
		 * 		@swagger.prop()
		 *  	phone: CustomerPhone[];
		 *  };
		 */

		const definition = createSchemaDefinition(Customer);
		should(definition).be.deepEqual({
			CustomerPhone: {
				title: 'CustomerPhone',
				type: 'object',
				properties: {
					number: {
						type: 'string'
					},
					isPrimary: {
						type: 'boolean'
					}
				},
				required: []
			},
			Customer: {
				title: 'Customer',
				type: 'object',
				properties: {
					phone: {
						type: 'array',
						items: {
							$ref: 'CustomerPhone'
						}
					}
				},
				required: []
			}
		});
	});

	it('should populate the required array', () => {
		const Customer = class {
			firstname: string;
			lastname: string;
		};

		swagger.definition({ title: 'Customer' })(Customer);
		swagger.prop({ type: String, required: true })(Customer.prototype, 'firstname');
		swagger.prop({ type: String })(Customer.prototype, 'lastname');
		/**
		 * This is equivalent to:
		 *
		 * class Customer {
		 * 		@swagger.prop({ required: true })
		 *  	firstname: string;
		 * 		@swagger.prop()
		 *  	lastname: string;
		 *  };
		 */

		const definition = createSchemaDefinition(Customer);
		should(definition).be.deepEqual({
			Customer: {
				title: 'Customer',
				type: 'object',
				properties: {
					firstname: {
						type: 'string'
					},
					lastname: {
						type: 'string'
					}
				},
				required: ['firstname']
			}
		});
	});
});
