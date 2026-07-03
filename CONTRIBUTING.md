# Contributing to Wizzardobe

Thank you for your interest in contributing to Wizzardobe! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and inclusive in all interactions with other contributors.

## Getting Started

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/wizzardobe.git
   cd wizzardobe
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Setup environment files**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

4. **Run the development environment**
   ```bash
   docker-compose up
   ```

## Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes following the code style
3. Test your changes thoroughly
4. Commit with clear messages: `git commit -m "feat(scope): description"`
5. Push to your fork: `git push origin feature/your-feature`
6. Submit a Pull Request

## Commit Message Convention

```
type(scope): brief description

[optional body explaining the change in more detail]

[optional footer with references to issues, e.g., Closes #123]
```

### Types
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring without feature changes
- `perf`: Performance improvements
- `test`: Test additions or updates
- `chore`: Build, dependency, or configuration changes

### Examples
```
feat(wardrobe): add bulk upload for garments
fix(auth): handle expired JWT tokens gracefully
docs(readme): update installation instructions
refactor(api): simplify outfit engine logic
```

## Testing

- Backend: `cd backend && npm test`
- Frontend: Test manually during development
- Before submitting PR, ensure all tests pass

## Code Style

- Use consistent indentation (2 spaces)
- Follow existing code patterns in the project
- Keep functions focused and maintainable
- Add comments for complex logic

## Pull Request Process

1. Ensure your branch is up to date with `main`
2. Provide a clear description of changes
3. Reference any related issues
4. Ensure tests pass
5. Request review from maintainers

## Reporting Issues

When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs. actual behavior
- Environment details (OS, Node version, browser, etc.)
- Screenshots if applicable

## Questions?

Feel free to open an issue for questions or discussions about the project.

---

Thank you for contributing to Wizzardobe! 🧙✨
