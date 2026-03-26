export default {
    schema: "./schema.prisma",
    migrations: {
        path: "./prisma/migrations",
    },
    url: process.env.DATABASE_URL,
}