import should from 'should';
import createSchemaDefinition from '../../../../src/route/openapi/createSchemaDefinition';
import { openapi } from '../../../../src/route';

describe('createSchemaDefinition', () => {
	it('Given a decorated class, it should create a schema definition', () => {
		@openapi.definition({ title: 'Customer' })
		class Customer {
			@openapi.prop()
			firstname: string;
			@openapi.prop()
			lastname: string;
		}

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
				}
			}
		});
	});

	it('supports nested objects', () => {
		class CustomerPhone {
			@openapi.prop()
			number: string;
			@openapi.prop()
			isPrimary: boolean;
		}

		@openapi.definition({ title: 'Customer' })
		class Customer {
			@openapi.prop()
			phone: CustomerPhone;
		}

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
						}
					}
				}
			}
		});
	});

	it('supports nested definitions', () => {
		@openapi.definition({ title: 'CustomerPhone' })
		class CustomerPhone {
			@openapi.prop()
			number: string;

			@openapi.prop()
			isPrimary: boolean;
		}

		@openapi.definition({ title: 'Customer' })
		class Customer {
			@openapi.prop({ type: CustomerPhone })
			phone: CustomerPhone;
		}

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
				}
			},
			Customer: {
				title: 'Customer',
				type: 'object',
				properties: {
					phone: {
						$ref: '#/definitions/CustomerPhone'
					}
				}
			}
		});
	});

	it('supports arrays', () => {
		@openapi.definition({ title: 'Customer' })
		class Customer {
			@openapi.prop({ type: [String] })
			groups: string[];
		}

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
				}
			}
		});
	});

	it('support array of objects', () => {
		class CustomerPhone {
			@openapi.prop()
			number: string;
			@openapi.prop()
			isPrimary: boolean;
		}

		@openapi.definition({ title: 'Customer' })
		class Customer {
			@openapi.prop({ type: [CustomerPhone] })
			phone: CustomerPhone[];
		}

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
							}
						}
					}
				}
			}
		});
	});

	it('support array of definitions', () => {
		class CustomerPhone {
			number: string;
			isPrimary: boolean;
		}

		class Customer {
			phone: CustomerPhone[];
		}

		openapi.definition({ title: 'Customer' })(Customer);
		openapi.prop({ type: [CustomerPhone] })(Customer.prototype, 'phone');

		openapi.definition({ title: 'CustomerPhone' })(CustomerPhone);
		openapi.prop({ type: String })(CustomerPhone.prototype, 'number');
		openapi.prop({ type: Boolean })(CustomerPhone.prototype, 'isPrimary');

		/**
		 * This is equivalent to:
		 *
		 * @openapi.definition({ title: 'CustomerPhone' })
		 * class CustomerPhone {
		 * 		@openapi.prop()
		 *  	number: number;
		 * 		@openapi.prop()
		 *  	isPrimary: boolean;
		 *  };
		 *
		 * @openapi.definition({ title: 'Customer' })
		 * class Customer {
		 * 		@openapi.prop()
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
				}
			},
			Customer: {
				title: 'Customer',
				type: 'object',
				properties: {
					phone: {
						type: 'array',
						items: {
							$ref: '#/definitions/CustomerPhone'
						}
					}
				}
			}
		});
	});

	it('should populate the required array', () => {
		@openapi.definition({ title: 'Customer' })
		class Customer {
			@openapi.prop({ required: true })
			firstname: string;
			@openapi.prop()
			lastname: string;
		}

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

	it('support passing advanced JSON schema options via `rawSchemaOptions` argument', () => {
		@openapi.definition({ title: 'Customer' })
		class Customer {
			@openapi.prop({ required: true, rawSchemaOptions: { oneOf: [{ type: 'object' }, { type: 'array' }] } })
			customData: string;
		}

		const definition = createSchemaDefinition(Customer);
		should(definition).be.deepEqual({
			Customer: {
				title: 'Customer',
				type: 'object',
				properties: {
					customData: {
						type: 'string',
						oneOf: [
							{
								type: 'object'
							},
							{
								type: 'array'
							}
						]
					}
				},
				required: ['customData']
			}
		});
	});

	it('combines schema from `rawSchemaOptions` argument and the one generated from `type` argument ', () => {
		@openapi.definition({ title: 'ScanPayloadArrayItem' })
		class ScanPayloadArrayItem {
			@openapi.prop({ required: true })
			barcode: string;

			@openapi.prop()
			count: number;

			@openapi.prop()
			problem: string;

			@openapi.prop()
			time: string;
		}

		@openapi.definition({ title: 'ScanPayload' })
		class ScanPayload {
			@openapi.prop({ required: true })
			scannerCode: string;

			@openapi.prop({ required: true, type: [ScanPayloadArrayItem], rawSchemaOptions: { minItems: 1 } })
			scans: ScanPayloadArrayItem[];
		}

		const definition = createSchemaDefinition(ScanPayload);
		should(definition).be.deepEqual({
			ScanPayload: {
				title: 'ScanPayload',
				type: 'object',
				properties: {
					scannerCode: {
						type: 'string'
					},
					scans: {
						type: 'array',
						minItems: 1,
						items: {
							$ref: '#/definitions/ScanPayloadArrayItem'
						}
					}
				},
				required: ['scannerCode', 'scans']
			},
			ScanPayloadArrayItem: {
				title: 'ScanPayloadArrayItem',
				type: 'object',
				properties: {
					barcode: {
						type: 'string'
					},
					count: {
						type: 'number'
					},
					problem: {
						type: 'string'
					},
					time: {
						type: 'string'
					}
				},
				required: ['barcode']
			}
		});
	});

	it('should support passing the explicit `type` equal to null or false, to ignore the type detection (useful when passing rawOptions (oneOf, anyOf)', () => {
		@openapi.definition({ title: 'Customer' })
		class Customer {
			@openapi.prop({
				type: false,
				rawSchemaOptions: { oneOf: [{ type: 'object' }, { type: 'array', items: { type: 'string' } }] }
			})
			someProp: object | string[];
		}

		const definition = createSchemaDefinition(Customer);
		should(definition).be.deepEqual({
			Customer: {
				title: 'Customer',
				type: 'object',
				properties: {
					someProp: {
						oneOf: [
							{
								type: 'object'
							},
							{
								type: 'array',
								items: { type: 'string' }
							}
						]
					}
				}
			}
		});
	});

	it('should support dependencies', () => {
		@openapi.definition({
			title: 'Customer',
			dependencies: {
				c: ['a']
			},
			oneOf: [
				{ required: ['a'] },
				{ required: ['b'] }
			]
		})
		class Customer {
			@openapi.prop()
			a?: string;

			@openapi.prop()
			b?: string;

			@openapi.prop()
			c?: string;
		}

		const definition = createSchemaDefinition(Customer);
		should(definition).be.deepEqual({
			Customer: {
				title: 'Customer',
				type: 'object',
				properties: {
					a: {
						type: 'string'
					},
					b: {
						type: 'string'
					},
					c: {
						type: 'string'
					}
				},
				dependencies: { c: ['a'] },
				oneOf: [
					{ required: ['a'] },
					{ required: ['b'] }
				]
			}
		});
	});
});
