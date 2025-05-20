
# Contributing Guide

Thank you for your interest in contributing to this voice-powered content generation platform! This document will help you get started with the development process.

## Development Setup

Please follow the [Local Development Guide](./docs/LOCAL_DEVELOPMENT.md) to set up your development environment.

## Project Structure

- `/src`: Source code
  - `/components`: Reusable UI components
  - `/hooks`: Custom React hooks
  - `/integrations`: External service integrations
  - `/layouts`: Page layouts
  - `/lib`: Utilities and helpers
  - `/pages`: Main page components

## Code Style

We use ESLint and Prettier for code formatting. Please make sure to:

1. Install the recommended VS Code extensions
2. Run linting before submitting a PR: `npm run lint`
3. Follow the existing code style patterns

## Development Workflow

1. **Create a branch**: Create a new branch for your feature or bugfix
2. **Develop**: Make changes in your branch
3. **Test**: Ensure your changes work as expected
4. **Lint**: Run `npm run lint` to check for code style issues
5. **Submit a PR**: Push your branch and create a pull request

## Pull Request Process

1. Update the README.md or documentation with details of changes if appropriate
2. Update or add tests for your changes
3. Make sure your code passes all tests and linting
4. Fill out the PR template with all requested information
5. Get approval from at least one maintainer before merging

## Adding Dependencies

When adding dependencies, consider:
1. Is this dependency necessary?
2. Is it actively maintained?
3. What's the impact on bundle size?

Add dependencies using:
```bash
npm install dependency-name --save
# or
yarn add dependency-name
```

## Working with ElevenLabs Integration

See the [ElevenLabs documentation](./docs/ELEVENLABS.md) for details on how the ElevenLabs integration works.

When making changes to the ElevenLabs integration:
1. Test thoroughly with your own API key
2. Document any configuration changes
3. Consider backward compatibility

## Working with Supabase

When making changes to Supabase:
1. Ensure your local environment is connected to the development Supabase instance
2. Document any schema changes
3. Update types for TypeScript in `src/integrations/supabase/types.ts`

## Testing

Please ensure all your changes are tested:
1. Manual testing of your feature
2. Unit tests for utilities and hooks
3. Integration tests for components

## Reporting Bugs

When reporting bugs, please include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshots if applicable
5. Desktop/browser information

## Feature Requests

Feature requests are welcome! Please:
1. Describe the feature in detail
2. Explain why it would be valuable
3. Consider implementation details if possible

## Code of Conduct

- Be respectful and inclusive
- Practice empathy and kindness
- Focus on constructive feedback
- Respect others' time and contributions

## Questions?

If you have any questions about contributing, please [contact information here].
