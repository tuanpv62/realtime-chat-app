import swaggerJsdoc from "swagger-jsdoc";
import config from "./app.config.js";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "🚀 Realtime Chat API",
      version: "1.0.0",
      description: `
## Realtime Chat Application API

### Authentication
Dùng JWT Bearer token. Sau khi signin, lấy \`accessToken\` và thêm vào header:
\`\`\`
Authorization: Bearer <accessToken>
\`\`\`

### Refresh Token
Refresh token được lưu trong httpOnly cookie, tự động gửi theo request.

### Base URL
- **Development:** \`http://localhost:5000/api/v1\`
      `,
      contact: { name: "API Support", email: "support@chatapp.com" },
    },
    servers: [
      {
        url: `http://localhost:${config.server.port}/api/v1`,
        description: "Development",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: 'Nhập accessToken vào đây (không cần "Bearer " prefix)',
        },
      },
      schemas: {
        // ── User ──────────────────────────────────────────────────
        User: {
          type: "object",
          properties: {
            id: { type: "string", example: "64f1a2b3c4d5e6f7a8b9c0d1" },
            username: { type: "string", example: "john_doe" },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            displayName: { type: "string", example: "John Doe" },
            avatar: { type: "string", nullable: true, example: null },
            bio: { type: "string", example: "Hello there!" },
            isOnline: { type: "boolean", example: true },
            lastSeen: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        // ── Message ───────────────────────────────────────────────
        Message: {
          type: "object",
          properties: {
            id: { type: "string" },
            conversation: { type: "string" },
            sender: { $ref: "#/components/schemas/User" },
            type: {
              type: "string",
              enum: ["text", "image", "file", "system"],
            },
            content: { type: "string", example: "Hello world!" },
            attachments: { type: "array", items: { type: "object" } },
            replyTo: { nullable: true, $ref: "#/components/schemas/Message" },
            isDeleted: { type: "boolean" },
            isEdited: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        // ── Conversation ──────────────────────────────────────────
        Conversation: {
          type: "object",
          properties: {
            id: { type: "string" },
            type: { type: "string", enum: ["direct", "group"] },
            participants: {
              type: "array",
              items: { $ref: "#/components/schemas/User" },
            },
            name: { type: "string", nullable: true },
            lastMessage: { $ref: "#/components/schemas/Message" },
            unreadCount: { type: "integer", example: 3 },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        // ── FriendRequest ─────────────────────────────────────────
        FriendRequest: {
          type: "object",
          properties: {
            id: { type: "string" },
            sender: { $ref: "#/components/schemas/User" },
            receiver: { $ref: "#/components/schemas/User" },
            status: {
              type: "string",
              enum: ["pending", "accepted", "rejected", "cancelled"],
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        // ── API Response ──────────────────────────────────────────
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Success" },
            data: { type: "object" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Error message" },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Friends", description: "Friend management" },
      { name: "Conversations", description: "Conversation management" },
      { name: "Messages", description: "Message management" },
    ],
  },
  // Files chứa JSDoc comments
  apis: ["./src/routes/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
