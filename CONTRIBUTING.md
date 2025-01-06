# Contributing to CFP Tracker

Thank you for your interest in contributing to CFP Tracker! We aim to make conference speaking opportunities more accessible and manageable for everyone.

## Code of Conduct

By participating in this project, you agree to maintain a welcoming, inclusive, and harassment-free environment for all contributors.

## How to Contribute

### Reporting Issues

- Use the [GitHub issue tracker](https://github.com/bendechrai/cfps/issues)
- Check if the issue already exists before creating a new one
- Include clear steps to reproduce bugs
- Suggest features with clear use cases

### Development Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting
   ```bash
   npm run lint
   ```
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Pull Request Guidelines

- Keep changes focused and atomic
- Update documentation as needed
- Follow the existing code style
- Add tests for new features
- Ensure all tests pass
- Reference any related issues

## Development Setup

1. Ensure you have Node.js 18+ installed
2. Fork and clone the repository
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
cfps/
├── src/
│   ├── app/           # Next.js app router pages
│   ├── components/    # Reusable React components
│   └── utils/         # Helper functions and types
├── public/           # Static assets
└── package.json     # Project dependencies and scripts
```

## TypeScript

The project uses TypeScript for type safety. Key types:

- `CFP`: Represents a conference Call for Papers
- `Conference`: Conference details
- `Continent`: Valid continent values for filtering
- `CFPStatus`: Submission status types

## Styling

- CSS Modules for component styling
- Mobile-first responsive design
- Follow the existing color scheme and design patterns

## Testing

- Add tests for new features
- Ensure existing tests pass
- Follow existing test patterns

## Questions?

Feel free to [open an issue](https://github.com/bendechrai/cfps/issues) for any questions about contributing.
