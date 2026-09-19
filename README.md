# Tasklist

Next.js 16, Better Auth, Prisma 7 and PostgreSQL task workspace.

## Local setup

1. Run `npm ci`.
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL`, `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`.
3. Start PostgreSQL and run `npm run db:migrate` followed by `npm run db:generate`.
4. Run `npm run dev`.

Sign-up uses email and password without email verification or an email provider. An account created before this change can sign in with its password even if its email was never verified. This setup is intended for personal use. If you later invite others by email, add email verification or a separate invitation code flow before relying on the email address for access control.

## Checks

```sh
npm test
npm run lint
npx tsc --noEmit
npm run build
```

## Free personal deployment

1. Create a free PostgreSQL database on Neon. For a serverless Vercel app, use Neon's pooled connection string as `DATABASE_URL`; enable TLS in the connection string.
2. With `DATABASE_URL` set locally to the production database, run `npm run db:deploy` once before opening the app. Repeat after future schema migrations. Do not use `prisma migrate dev` on production.
3. Import this repository into a Vercel Hobby project. Set `DATABASE_URL`, `BETTER_AUTH_SECRET` (at least 32 random characters) and `BETTER_AUTH_URL` (the final `https://...vercel.app` URL) in Production environment variables.
4. Deploy. The build script generates Prisma Client before building Next.js. Test sign-up, sign-in and task creation using the deployed URL.

Vercel Hobby is for personal, non-commercial use. Free plans have limits; check the providers' current terms before launch. Never commit `.env` or API keys.

Task lists are fetched in pages of 40. Search and filters run on the server before pagination.
