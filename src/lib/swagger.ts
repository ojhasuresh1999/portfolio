import { createSwaggerSpec } from "next-swagger-doc";

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: "src/app/api", // Define where your API routes are
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Portfolio API",
        version: "1.0.0",
        description: "API documentation for the Portfolio Application",
        contact: {
          name: "API Support",
          url: "http://www.example.com/support",
          email: "sureshojha12.dev@gmail.com",
        },
      },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
        schemas: {
          ContactForm: {
            type: "object",
            required: ["name", "email", "message"],
            properties: {
              name: {
                type: "string",
                minLength: 2,
                maxLength: 100,
                example: "John Doe",
              },
              email: {
                type: "string",
                format: "email",
                example: "john@example.com",
              },
              subject: {
                type: "string",
                maxLength: 200,
                example: "Project Inquiry",
              },
              message: {
                type: "string",
                minLength: 10,
                maxLength: 5000,
                example:
                  "I would like to discuss a potential project regarding web development.",
              },
            },
          },
          AdminLogin: {
            type: "object",
            required: ["email", "password"],
            properties: {
              email: {
                type: "string",
                format: "email",
                example: "admin@example.com",
              },
              password: {
                type: "string",
                example: "securePassword123",
              },
              stayLinked: {
                type: "boolean",
                default: false,
              },
            },
          },
          TokenResponse: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              accessToken: { type: "string" },
              refreshToken: { type: "string" },
              expiresIn: { type: "integer" },
              user: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  email: { type: "string" },
                  name: { type: "string" },
                  role: { type: "string" },
                },
              },
            },
          },
          Project: {
            type: "object",
            required: ["title", "slug", "description"],
            properties: {
              title: {
                type: "string",
                maxLength: 200,
                example: "E-commerce Platform",
              },
              slug: {
                type: "string",
                pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
                example: "ecommerce-platform",
              },
              description: {
                type: "string",
                maxLength: 500,
                example: "A full-stack e-commerce solution built with Next.js",
              },
              longDescription: { type: "string" },
              image: { type: "string", format: "uri" },
              images: {
                type: "array",
                items: { type: "string", format: "uri" },
              },
              codeSnippet: { type: "string" },
              technologies: {
                type: "array",
                items: { type: "string" },
                example: ["Next.js", "TypeScript", "MongoDB"],
              },
              liveUrl: { type: "string", format: "uri" },
              githubUrl: { type: "string", format: "uri" },
              accentColor: {
                type: "string",
                enum: ["primary", "secondary"],
                default: "primary",
              },
              order: { type: "integer", default: 0 },
              isFeatured: { type: "boolean", default: false },
              isVisible: { type: "boolean", default: true },
            },
          },
          BlogPost: {
            type: "object",
            required: ["title", "slug", "excerpt", "content", "category"],
            properties: {
              title: {
                type: "string",
                maxLength: 200,
                example: "Understanding React Server Components",
              },
              slug: {
                type: "string",
                pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
                example: "understanding-react-server-components",
              },
              excerpt: {
                type: "string",
                maxLength: 500,
                example: "A deep dive into the new architecture of React...",
              },
              content: { type: "string" },
              coverImage: { type: "string", format: "uri" },
              images: {
                type: "array",
                items: { type: "string", format: "uri" },
              },
              category: { type: "string", example: "Development" },
              tags: {
                type: "array",
                items: { type: "string" },
                example: ["React", "Next.js"],
              },
              readTime: { type: "integer", minimum: 1, default: 5 },
              isPublished: { type: "boolean", default: false },
              publishedAt: { type: "string", format: "date-time" },
            },
          },
          Error: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: { type: "string", example: "Error message details" },
            },
          },
          Success: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object" },
              message: { type: "string", example: "Operation successful" },
            },
          },
        },
      },
      security: [],
    },
  });
  return spec;
};
