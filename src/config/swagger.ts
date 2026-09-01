import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Freightrek Server API',
      version: '1.0.0',
      description: 'REST API for Freightrek freight management system with admin authentication and RBAC',
      contact: {
        name: 'Freightrek Team',
        email: 'support@freightrek.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: 'https://freightrekapi.vercel.app',
        description: 'Production (Vercel)'
      },
      {
        url: 'http://localhost:3000',
        description: 'Development (local)'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from login endpoint'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['name', 'email', 'phoneNo', 'password', 'roleId'],
          properties: {
            name: {
              type: 'string',
              description: 'User full name',
              example: 'John Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john@example.com'
            },
            phoneNo: {
              type: 'string',
              description: 'Phone number',
              example: '1234567890'
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'User password (min 6 characters)',
              example: 'Pass@123'
            },
            roleId: {
              type: 'string',
              description: 'MongoDB ObjectId of the role',
              example: '65abc123def456789'
            }
          }
        },
        Login: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com'
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'Pass@123'
            }
          }
        },
        Role: {
          type: 'object',
          required: ['name', 'permissions'],
          properties: {
            name: {
              type: 'string',
              example: 'Manager'
            },
            permissions: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['read', 'write', 'delete']
            },
            status: {
              type: 'boolean',
              default: true
            }
          }
        },
        Hub: {
          type: 'object',
          required: ['name', 'location'],
          properties: {
            name: {
              type: 'string',
              example: 'Mumbai Hub'
            },
            location: {
              type: 'string',
              example: 'Mumbai, Maharashtra'
            },
            capacity: {
              type: 'number',
              example: 1000
            },
            status: {
              type: 'boolean',
              default: true
            }
          }
        },
        Agency: {
          type: 'object',
          required: ['agencyName', 'agencyOwner', 'phone'],
          properties: {
            agencyName: {
              type: 'string',
              example: 'SpeedX Express'
            },
            agencyOwner: {
              type: 'string',
              example: 'David Kumar'
            },
            phone: {
              type: 'string',
              example: '9185647852'
            },
            status: {
              type: 'string',
              enum: ['Active', 'Inactive'],
              default: 'Active'
            },
            agencyType: {
              type: 'boolean',
              default: false,
              description:
                'Ownership as a boolean: true = Own, false = Third Party. The same thing as `type`, for a checkbox on the form — send either one. Sending both is allowed only if they agree. An Own agency keeps no commission.',
              example: false
            },
            type: {
              type: 'string',
              enum: ['Third Party', 'Own'],
              default: 'Third Party',
              description: 'Ownership in words. Kept in step with `agencyType`.'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'speedx@example.com'
            },
            address: {
              type: 'string',
              example: 'Chennai, Tamil Nadu'
            },
            gstNumber: {
              type: 'string',
              example: '29ABCDE1234F2Z5'
            },
            profitPercentage: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              default: 0,
              description:
                'Share of each parcel booking amount this branch keeps. The rest is debited from the branch wallet and credited to the admin settlement wallet on every booking.',
              example: 10
            },
            loadingChargePercentage: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              default: 10,
              description:
                'Loading charge added on top of the transportation charge at booking time. Read-only here — set it with PATCH /admin/agency/{id}/profit-percentage.',
              example: 10
            },
            miscChargePercentage: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              default: 10,
              description:
                'Miscellaneous charge added on top of the transportation charge at booking time. Read-only here — set it with PATCH /admin/agency/{id}/profit-percentage.',
              example: 10
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation successful'
            },
            data: {
              type: 'object'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/admin/**/*.ts',
    './dist/routes/admin/**/*.js',
    './src/routes/hub/**/*.ts',
    './dist/routes/hub/**/*.js',
    './src/controllers/admin/**/*.ts',
    './dist/controllers/admin/**/*.js'
  ]
};

export const swaggerSpec = swaggerJsdoc(options);
