# DaddysAI

A Next.js application with AI capabilities, authentication, and MongoDB integration for trading data.

## Deployment Instructions

### Prerequisites
- Node.js 18.x or later
- npm or yarn package manager
- MongoDB Atlas account (or other MongoDB deployment)
- Environment variables set up (see `.env.example`)

### Environment Variables
Make sure to set up the following environment variables in your deployment platform:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk public key
- `CLERK_SECRET_KEY`: Your Clerk secret key
- `GOOGLE_AI_API_KEY`: Your Google AI API key
- `NEXT_PUBLIC_VERCEL_ANALYTICS`: Set to "true" to enable analytics
- `MONGODB_URI`: Your MongoDB connection string (e.g. `mongodb+srv://username:password@cluster.mongodb.net/daddysai?retryWrites=true&w=majority`)

### MongoDB Setup
1. Create a MongoDB Atlas account or use an existing MongoDB deployment
2. Create a new cluster and database named `daddysai`
3. Set up a database user with read/write permissions
4. Add your IP address to the IP access list
5. Get your connection string and add it to the `.env` file as `MONGODB_URI`

### Build and Deploy

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Build the application:
```bash
npm run build
# or
yarn build
```

3. Start the production server:
```bash
npm start
# or
yarn start
```

### Deployment Platforms

#### Vercel (Recommended)
1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy with default settings

#### Other Platforms
The application is configured with `output: 'standalone'` in Next.js config, making it suitable for containerized deployments:

1. Build the application
2. The standalone output will be in `.next/standalone`
3. Copy the following to your deployment:
   - `.next/standalone/`
   - `.next/static` to `.next/standalone/.next/static`
   - `public` to `.next/standalone/public`

### Post-Deployment Checklist
- [ ] Verify all environment variables are set
- [ ] Test authentication flow
- [ ] Check AI features functionality
- [ ] Verify static assets and images are loading
- [ ] Test MongoDB connection and trade data storage
- [ ] Monitor analytics if enabled

## Features

### Trading Platform
- Real-time market data visualization
- Virtual trading with paper money
- Portfolio management
- Transaction history and ledger

### MongoDB Integration
The application uses MongoDB to store:
- User trade data
- Trade history organized by date in a ledger collection
- User-specific data isolation for security

### Trade Ledger
- Comprehensive trade history tracking
- Date-based organization of trades
- Filtering by date range
- CSV export functionality
- Detailed view of all transactions

## Support
For issues and support, please create an issue in the repository.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
