const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Manager API',
      version: '1.0.0',
      description: 'A RESTful API for managing tasks',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Task: {
          type: 'object',
          required: ['title', 'user'],
          properties: {
            _id: {
              type: 'string',
              description: 'The task ID',
            },
            title: {
              type: 'string',
              description: 'The task title',
            },
            description: {
              type: 'string',
              description: 'The task description',
            },
            completed: {
              type: 'boolean',
              description: 'Whether the task is completed',
              default: false,
            },
            dueDate: {
              type: 'string',
              format: 'date-time',
              description: 'The task due date',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'The task priority',
            },
            user: {
              type: 'string',
              description: 'The ID of the user who owns the task',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'The date the task was created',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'The date the task was last updated',
            },
          },
        },
      },
    },
    security: [{
      bearerAuth: [],
    }],
  },
  apis: ['./routes/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = specs; 