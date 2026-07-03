# Changelog

All notable changes to Wizzardobe will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project scaffolding and setup
- Core wardrobe management system
- AI-powered outfit suggestion engine
- Laundry tracking system
- Analytics dashboard with cost-per-wear metrics
- Shopping wishlist and gap analysis
- Google Calendar integration
- Photo upload capability for garments
- Authentication system with JWT
- Docker containerization
- Postman API collection for testing

### Changed
- Improved .gitignore to properly exclude build artifacts and dependencies

### Fixed
- Repository cleanup to reduce git change history

## [1.0.0] - Initial Release

### Added
- **Smart Wardrobe Management** — Add, organize, and search wardrobe items
- **AI Outfit Suggestions** — GPT-powered recommendations by occasion and weather
- **Laundry Tracker** — Track laundry with overdue alerts
- **Analytics Dashboard** — View cost-per-wear and style metrics
- **Shopping Tools** — AI-powered gap analysis and wishlist management
- **Stylist Features** — Trip packing and capsule wardrobe builder
- **Calendar Integration** — Google Calendar event integration
- **Photo Support** — Attach images to garments
- **Secure Authentication** — JWT-based auth system
- **API Endpoints** — RESTful API for all features
- **Docker Support** — Full Docker/Docker Compose setup

---

## Development Guidelines

### Version Format
- Major.Minor.Patch (e.g., 1.0.0)
- Major: Breaking changes or new major features
- Minor: New features, backward compatible
- Patch: Bug fixes, documentation updates

### Commit Message Convention
```
type(scope): brief description

[optional body]
[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

### Release Process
1. Update version in `backend/package.json` and `frontend/package.json`
2. Update this CHANGELOG
3. Create git tag: `git tag v1.0.0`
4. Push changes and tags

---

For more information, visit the [GitHub Repository](https://github.com/yourusername/wizzardobe)
