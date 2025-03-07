import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())


module.exports = defineConfig({
  projectConfig: {
    workerMode: process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server",
    redisUrl: process.env.REDIS_URL,
    databaseDriverOptions: process.env.NODE_ENV !== "development" 
      ? { connection: { ssl: { rejectUnauthorized: false } } } 
      : {},
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },

  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
  },

  modules: [
    // S3 / MinIO nur laden, wenn S3-Zugangsdaten vorhanden sind
    ...(process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY && process.env.S3_BUCKET ? [
      {
        resolve: "@medusajs/medusa/file",
        options: {
          providers: [
            {
              resolve: "@medusajs/medusa/file-s3",
              id: "s3",
              options: {
                file_url: process.env.S3_FILE_URL,
                access_key_id: process.env.S3_ACCESS_KEY_ID,
                secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
                region: process.env.S3_REGION,
                bucket: process.env.S3_BUCKET,
                endpoint: process.env.S3_ENDPOINT,
                additional_client_config: {
                  forcePathStyle: true,
                },
              },
            },
          ],
        },
      },
    ] : []),

    // Stripe nur laden, wenn API-Key vorhanden ist
    ...(process.env.STRIPE_API_KEY ? [
      {
        resolve: "@medusajs/medusa/payment",
        options: {
          providers: [
            {
              resolve: "@medusajs/medusa/payment-stripe",
              id: "stripe",
              options: {
                apiKey: process.env.STRIPE_API_KEY,
                webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
              },
            },
          ],
        },
      },
    ] : []),

    // Nodemailer nur laden, wenn E-Mail Zugangsdaten vorhanden sind
    ...(process.env.MAIL_HOST && process.env.MAIL_USER && process.env.MAIL_PW && process.env.DC_WEBHOOK_URL ? [
      {
        resolve: "@medusajs/medusa/notification",
        options: {
          providers: [
            {
              resolve: "./src/modules/nodemailer",
              id: "nodemailer",
              options: {
                channels: ["email"],
                host: process.env.MAIL_HOST,
                port: 465,
                auth: {
                  user: process.env.MAIL_USER,
                  pass: process.env.MAIL_PW,
                },
              },
            },
            {
              resolve: "./src/modules/discord",
              id: "discord",
              options: {
                channels: ["discord"],
                webhookUrl: process.env.DC_WEBHOOK_URL,
              },
            },
          ],
        },
      },
    ] : []),

    // Redis-basierte Module nur laden, wenn REDIS_URL existiert
    ...(process.env.REDIS_URL ? [
      {
        resolve: "@medusajs/medusa/cache-redis",
        options: {
          redisUrl: process.env.REDIS_URL,
        },
      },
      {
        resolve: "@medusajs/medusa/event-bus-redis",
        options: {
          redisUrl: process.env.REDIS_URL,
        },
      },
      {
        resolve: "@medusajs/medusa/workflow-engine-redis",
        options: {
          redis: {
            url: process.env.REDIS_URL,
          },
        },
      },
    ] : []),
  ],
});
