# Security

## Supported versions

Security-sensitive fixes are applied on the default branch (`main`) and deployed from there. Use the latest revision for production-like deployments.

## Reporting a vulnerability

Please **do not** open a public issue for undisclosed security problems.

- Use **[GitHub private vulnerability reporting](https://github.com/weo-soft/gem-viability/security/advisories/new)** for this repository if it is enabled, or
- Contact the maintainers through an appropriate private channel offered on the [weo-soft](https://github.com/weo-soft) organization or maintainer profiles.

Include enough detail to reproduce or understand the issue (affected component, steps, impact). We will treat reports in good faith and coordinate disclosure after a fix when practical.

## Scope notes

The app is **static** (no server-side API in this repo). Typical concerns include XSS if untrusted content is ever introduced, supply-chain and dependency issues, and unsafe patterns in build or deploy configuration.
