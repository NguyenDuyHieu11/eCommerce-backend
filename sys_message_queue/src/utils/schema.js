// shared/schemas.js
const z = require('zod');

const UserSignupSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  createdAt: z.string().datetime().optional()
});

module.exports = { UserSignupSchema };