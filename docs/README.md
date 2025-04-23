# Vue DNDNR Documentation

This directory contains the VitePress documentation for Vue DNDNR, a Vue 3 component library for draggable and resizable elements.

## Development

To start the documentation development server:

```bash
pnpm docs:dev
```

## Building

To build the documentation for production:

```bash
pnpm docs:build
```

## Deployment

The documentation is configured to be deployed to Vercel. When you push changes to the main branch, Vercel will automatically build and deploy the documentation.

### Manual Deployment

If you want to deploy manually:

1. Install the Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy from the project root:
   ```bash
   vercel
   ```

3. For production deployment:
   ```bash
   vercel --prod
   ```

## Structure

- `.vitepress/` - VitePress configuration
- `index.md` - Home page
- `guide/` - Getting started guides
- `components/` - Component documentation
- `hooks/` - Hook documentation
- `examples/` - Example usage
