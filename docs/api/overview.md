# API Reference Overview

The Shipflow API is powered by tRPC on the backend and mapped to standard OpenAPI REST endpoints using `trpc-to-openapi`.

## Interactive API Documentation
You can explore the interactive API documentation and make live requests via the Scalar UI embedded in the application:
- **Interactive UI**: `{BASE_URL}/docs`
- **Raw OpenAPI Spec**: `{BASE_URL}/openapi.json`

## Using the API
By default, the REST endpoints are mapped to the `/api` prefix. For example, the tRPC procedure `organization.create` is accessible via a `POST` request to `/api/organization/create` (or whatever path is configured in the `.meta({ openapi: {...} })` tags of the tRPC router).

## Importing into Postman/Insomnia
To test the API locally or integrate it into your tools:
1. Copy the URL to your OpenAPI spec (e.g. `http://localhost:8000/openapi.json`).
2. Open Postman or Insomnia.
3. Select "Import" and paste the URL.
4. The entire collection of endpoints will be automatically populated with request body schemas and query parameters.
