## [2.0.2](https://github.com/sashamilenkovic/bundlewatch/compare/v2.0.1...v2.0.2) (2025-11-16)


### Bug Fixes

* filter out node_modules and .pnpm from module-level analysis ([83dd25e](https://github.com/sashamilenkovic/bundlewatch/commit/83dd25ef2efe03a6530dc8fbf49ae0aef9026aa9))

## [2.0.1](https://github.com/sashamilenkovic/bundlewatch/compare/v2.0.0...v2.0.1) (2025-11-15)


### Bug Fixes

* **core:** correctly detect if bundlewatch-data branch exists ([4920c0c](https://github.com/sashamilenkovic/bundlewatch/commit/4920c0c17c62358ee3a05422baebe9f8aace2809))

# [2.0.0](https://github.com/sashamilenkovic/bundlewatch/compare/v1.5.1...v2.0.0) (2025-11-15)


### Features

* add hybrid backfill with first-run detection and interactive mode ([79c9208](https://github.com/sashamilenkovic/bundlewatch/commit/79c920842bd69daca7fec8d4207fcc6d0593db68))


### BREAKING CHANGES

* none

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

## [1.5.1](https://github.com/sashamilenkovic/bundlewatch/compare/v1.5.0...v1.5.1) (2025-11-09)


### Bug Fixes

* **parsers:** extract meaningful module names from file paths ([6e5bea3](https://github.com/sashamilenkovic/bundlewatch/commit/6e5bea3257196796cb14f2fab4091c4f6e8f7489))

# [1.5.0](https://github.com/sashamilenkovic/bundlewatch/compare/v1.4.0...v1.5.0) (2025-11-09)


### Bug Fixes

* add missing SolidStart entry files ([1757937](https://github.com/sashamilenkovic/bundlewatch/commit/17579379c832468d56086e05410ec9e3f1d9314a))
* add missing SvelteKit app.html template ([71d0b5c](https://github.com/sashamilenkovic/bundlewatch/commit/71d0b5c5b0f74e8f2835da5bd41cf41c6575e15f))
* update remaining examples and e2e dependencies ([39d2403](https://github.com/sashamilenkovic/bundlewatch/commit/39d240337005b4d9000cd91c80f2de4498635312))


### Features

* add CLI backfill command for historical bundle analysis ([08ab1ba](https://github.com/sashamilenkovic/bundlewatch/commit/08ab1baaba4463d840dee3fb8b819c0abc6f4165))
* add framework examples for Next.js, Nuxt, SvelteKit, and SolidStart ([514b8a3](https://github.com/sashamilenkovic/bundlewatch/commit/514b8a318109151a12fe2a1a0f0a072b2be083ff))

# [1.4.0](https://github.com/sashamilenkovic/bundlewatch/compare/v1.3.0...v1.4.0) (2025-11-08)


### Features

* add webpack stats parser package - 2000x faster than re-analyzing files ([56f0a29](https://github.com/sashamilenkovic/bundlewatch/commit/56f0a2969062a9f2787c9ccef44a3a16d94f597c))

# [1.3.0](https://github.com/sashamilenkovic/bundlewatch/compare/v1.2.1...v1.3.0) (2025-11-08)


### Features

* add interactive dashboard generation with D3.js treemap visualization ([dd6458b](https://github.com/sashamilenkovic/bundlewatch/commit/dd6458b817f9dac160f7ae4e66ea4fbdb9fcf8d3))

## [1.2.1](https://github.com/sashamilenkovic/bundlewatch/compare/v1.2.0...v1.2.1) (2025-11-08)


### Bug Fixes

* use NODE_AUTH_TOKEN for npm authentication in CI ([d290e58](https://github.com/sashamilenkovic/bundlewatch/commit/d290e5820a16513d9eeeba6946e92b6dd0db8596))

# [1.2.0](https://github.com/sashamilenkovic/bundlewatch/compare/v1.1.5...v1.2.0) (2025-11-08)


### Features

* add Vite 7 support to vite plugin ([f0dd87d](https://github.com/sashamilenkovic/bundlewatch/commit/f0dd87d420b6a254ce2961271333330bf222dd9f))

## [1.1.5](https://github.com/sashamilenkovic/bundlewatch/compare/v1.1.4...v1.1.5) (2025-11-03)


### Bug Fixes

* rebuild vite plugin with Vite 6 types for compatibility ([3015832](https://github.com/sashamilenkovic/bundlewatch/commit/301583289047393615c54874b35e891d51631189))

## [1.1.4](https://github.com/sashamilenkovic/bundlewatch/compare/v1.1.3...v1.1.4) (2025-11-03)


### Bug Fixes

* use pnpm publish to correctly resolve workspace dependencies ([861958a](https://github.com/sashamilenkovic/bundlewatch/commit/861958a4d2cf924b19c26c8d9dded66bf95423ed))

## [1.1.3](https://github.com/sashamilenkovic/bundlewatch/compare/v1.1.2...v1.1.3) (2025-11-03)


### Bug Fixes

* use correct npm token for publishing ([b876705](https://github.com/sashamilenkovic/bundlewatch/commit/b876705a5365621fa4e84374c26b75612fa749c7))

## [1.1.2](https://github.com/sashamilenkovic/bundlewatch/compare/v1.1.1...v1.1.2) (2025-11-03)


### Bug Fixes

* sync workspace package versions before publishing ([b60ceae](https://github.com/sashamilenkovic/bundlewatch/commit/b60ceaea930ce0e233ccfcc2eb6cabe4f6a2afbb))

## [1.1.1](https://github.com/sashamilenkovic/bundlewatch/compare/v1.1.0...v1.1.1) (2025-11-03)


### Bug Fixes

* enable npm publishing with corrected authentication ([174b36d](https://github.com/sashamilenkovic/bundlewatch/commit/174b36d5b4253513d457e28f89fc264bfda76ab6))

# [1.1.0](https://github.com/sashamilenkovic/bundlewatch/compare/v1.0.0...v1.1.0) (2025-11-03)


### Features

* configure semantic-release to publish all workspace packages ([368d1d5](https://github.com/sashamilenkovic/bundlewatch/commit/368d1d54a26bad46084b77500445c807fe321748))

# 1.0.0 (2025-11-03)


### Bug Fixes

* CSS syntax error in globals.css ([13c2ce7](https://github.com/sashamilenkovic/bundlewatch/commit/13c2ce7cae9ffeced7b9bf673eb55722db0c03ee))
* disable parallel test execution to prevent race conditions ([f6e0f70](https://github.com/sashamilenkovic/bundlewatch/commit/f6e0f70e4a223d34858cbd47024f7a8b7097a2c5))
* exclude e2e tests from vitest and update webpack config ([b95b559](https://github.com/sashamilenkovic/bundlewatch/commit/b95b559f3200ac83b293c6530b6de8f64ce9eccd))
* relax webpack test assertions ([6ba9575](https://github.com/sashamilenkovic/bundlewatch/commit/6ba9575e18c7cd4c4eb2cdc63a99b4a3fa753441))
* remove aggressive rm -rf from build scripts ([660820d](https://github.com/sashamilenkovic/bundlewatch/commit/660820da3dcd30de8584571e348794fb19b33071))
* remove duplicate workers flag ([6875fdd](https://github.com/sashamilenkovic/bundlewatch/commit/6875fddd4a051354bcae55f1fe36ae97e4c126f5))
* remove Tailwind from example apps, use vanilla CSS ([715c6db](https://github.com/sashamilenkovic/bundlewatch/commit/715c6db2ba8d3ae286e2e45cb72c0bc6053aa7e6))
* resolve Tailwind config and stale build artifacts ([13de5fb](https://github.com/sashamilenkovic/bundlewatch/commit/13de5fb3b3980ca241e2d2f2cb810998bae8d75d))
* webpack config import and add codecov integration ([8c74c3f](https://github.com/sashamilenkovic/bundlewatch/commit/8c74c3f8356adcfa6b84daf2f907a8b1898bfbb3))


### Features

* adds webpack and next.js support ([3b19411](https://github.com/sashamilenkovic/bundlewatch/commit/3b19411d5ef741b1e685af453e73af9a9fa913f4))
* lighthouse ([783d701](https://github.com/sashamilenkovic/bundlewatch/commit/783d701c2eba29cbc411f084e85e5880486cc9ba))
* set up milencode namespace and semantic release ([b35ce30](https://github.com/sashamilenkovic/bundlewatch/commit/b35ce303a7b6c5ab16c713c4e3cc2a7a0776154e))

# Changelog

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- 
This file is auto-generated by semantic-release.
Do not edit manually.
-->
