const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Shahar Sahayya Kranti (CivicMate) API',
      version: '1.0.0',
      description: 'AI-Driven City Grievances Platform - Complete API Documentation',
      contact: {
        name: 'CivicMate Team',
        email: 'sangram.salunkhe2004@gmail.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.civicmate.in',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from login'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['username', 'email', 'password', 'firstname', 'lastname'],
          properties: {
            _id: {
              type: 'string',
              description: 'User ID'
            },
            username: {
              type: 'string',
              description: 'Unique username'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            firstname: {
              type: 'string',
              description: 'First name'
            },
            lastname: {
              type: 'string',
              description: 'Last name'
            },
            city: {
              type: 'string',
              description: 'City'
            },
            state: {
              type: 'string',
              description: 'State'
            },
            pincode: {
              type: 'string',
              description: 'Postal code'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              default: 'user',
              description: 'User role'
            }
          }
        },
        Tweet: {
          type: 'object',
          required: ['title', 'description', 'location', 'user'],
          properties: {
            _id: {
              type: 'string',
              description: 'Complaint ID'
            },
            title: {
              type: 'string',
              description: 'Complaint title'
            },
            description: {
              type: 'string',
              description: 'Detailed description'
            },
            location: {
              type: 'string',
              description: 'Location of issue'
            },
            image: {
              type: 'string',
              description: 'Image filename'
            },
            category: {
              type: 'string',
              enum: ['drainage', 'garbage', 'potholes', 'public washroom', 'streetlight', 'water_leakage', 'others'],
              default: 'others',
              description: 'Issue category'
            },
            completed: {
              type: 'string',
              enum: ['pending', 'in-progress', 'completed'],
              default: 'pending',
              description: 'Complaint status'
            },
            user: {
              type: 'string',
              description: 'User ID who created complaint'
            },
            upvotes: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Array of user IDs who upvoted'
            },
            priority: {
              type: 'number',
              default: 0,
              description: 'Calculated priority score'
            },
            feedbackSubmitted: {
              type: 'boolean',
              default: false,
              description: 'Whether user submitted feedback'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Feedback: {
          type: 'object',
          required: ['tweet', 'user', 'rating'],
          properties: {
            _id: {
              type: 'string',
              description: 'Feedback ID'
            },
            tweet: {
              type: 'string',
              description: 'Complaint ID'
            },
            user: {
              type: 'string',
              description: 'User ID'
            },
            rating: {
              type: 'number',
              minimum: 1,
              maximum: 5,
              description: 'Rating (1-5 stars)'
            },
            comment: {
              type: 'string',
              maxLength: 500,
              description: 'Optional comment'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Submission timestamp'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              description: 'Error message'
            },
            statusCode: {
              type: 'number',
              description: 'HTTP status code'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      },
      {
        name: 'Complaints',
        description: 'Complaint/Tweet management'
      },
      {
        name: 'Feedback',
        description: 'Feedback and ratings'
      },
      {
        name: 'Chatbot',
        description: 'AI chatbot assistant'
      },
      {
        name: 'Admin',
        description: 'Admin-only operations'
      }
    ]
  },
  apis: ['./routes/*.js', './server-improved.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
