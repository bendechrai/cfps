# CFP Tracker

A modern web application to help speakers track and manage conference speaking opportunities. Built with Next.js and TypeScript, this tool helps you (hopefully) never miss a CFP (Call for Papers) deadline again.

## Features

- Filter conferences by continent
- Search through available CFPs
- Track submission status (Submitted/Not Interested)
- Privacy-focused: All submission statuses stored locally in your browser
- Responsive design for desktop and mobile
- Real-time data from multiple sources:
  - [Codosaurus](https://codosaur.us)
  - [Confs.tech](https://confs.tech)
  - [developers.events](https://developers.events)
  - [Joind.in](https://joind.in)
  - [Leon Adato](https://adatosystems.com)
  - [Papercall.io](https://papercall.io)
  - More to come!

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm, yarn, or pnpm
- PostgreSQL 15 or later

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/bendechrai/cfps.git
   cd cfps
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up your local environment:

   Create a `.env` file in the project root with:
   ```
   ARCJET_KEY=ajkey_key_goes_here
   ALLOWED_ORIGINS=http://localhost:3000,https://cfp.bendechr.ai,https://cfp-jade.vercel.app
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cfps?schema=public"
   ```
   Adjust as needed.

4. Set up the database:

   ```bash
   # Create and apply database migrations
   npm run db:migrate:dev
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Management

This project uses Prisma as the ORM with PostgreSQL. Here are the available database management commands:

- `npm run db:studio` - Open Prisma Studio to view and edit your database
- `npm run db:push` - Push schema changes directly to the database (development only)
- `npm run db:migrate:dev` - Create and apply new migrations (development)
- `npm run db:migrate:deploy` - Apply existing migrations (production)
- `npm run db:reset` - Reset the database and apply all migrations

## Usage

- **Search**: Use the search box to filter conferences by name
- **Filter by Location**: Select continents to filter conferences by location
- **Track Submissions**: Mark CFPs as "Submitted" or "Not Interested"
- **View Deadlines**: See submission deadlines for each conference
- **Quick Access**: Click conference links to visit their websites or submission forms

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is open source and available under the MIT license.
