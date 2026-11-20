# Contributing to Urban Air Quality Assistant

Thank you for helping improve the Urban Air Quality Assistant.

## Development Workflow

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Copy environment template**:
   ```bash
   cp .env.example .env
   ```
3. **Run local dev server**:
   ```bash
   npm run dev
   ```
4. **Before opening a Pull Request**, verify all quality gates pass:
   ```bash
   npm run lint
   npm run typecheck
   npm run format:check
   npm run test:coverage
   npm run build
   ```

## Coding Standards

- TypeScript strict mode (`strict: true`, no `any`, no unused symbols).
- Add JSDoc comments to exported domain functions in `src/lib/`.
- Every interactive control must maintain WCAG 2.2 AA accessibility (semantic landmarks, visible focus rings, non-color status indicators, and `axe-core` compliance).
- Follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).
