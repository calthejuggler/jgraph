# Cache Versioning

When the engine response schema changes, bump `SCHEMA_VERSION` in the root `.env` file (single source of truth). Both the engine and server read this env var at startup — it invalidates all three cache tiers (engine memory/Redis/file via the cache key) and browser HTTP cache (via the ETag). The frontend `_v` query param is a static one-time cache bust and does not need bumping.
