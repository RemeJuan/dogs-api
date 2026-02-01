# Dogs API

This project allows users to view various images of dogs based on their species.

## How to run

Once the repository is cloned, follow these steps:

1. From the repository root run `npm install` to install dependencies.
2. Set up environment variables:
   - Create a `./.env` file in the repository root. See `./.env.example` for reference.
3. Start the application:
   - TO run the full project: run `npm start`.
   - Or start individual apps:
     - `npm run start:api` (NestJS API)
     - `npm start:web` (React UI)
4. Open your browser at `http://localhost:4200` (or the port configured for the React app) to view the web app.
   - You will be able to view swagger documentation for the API at `http://localhost:3000/api/docs` (or the port
     configured
     for the API).

## Tech Stack

- NX (Project)
- ReactJS (UI)
- NestJS (API)

# Reasoning

NX works well for scaffolding monorepo projects that contain multiple applications and shared libraries. It provides
powerful tools for managing dependencies, building, and testing applications within the monorepo structure.

In this case we have the API and the UI setup as well as a shared library for types. This allows for easy sharing of
types between the API and UI without duplicating code.

## Features:

### API

Currently, the API exposes the following endpoints:

- Authentication endpoints (Register, Login)
- Dog endpoints (Get all dogs, Get images by breed)
- Favorite endpoints (Add favorite dog, Get user favorites, Remove favorite dog)

I also proxy requests to the external Dog API (https://thedogapi.com/) to fetch the dogs list and available image URLs.
Additionally, I proxy requests to an external Auth API (https://dummyjson.com) for user authentication.

While proxying was not required for the project it simplified a few things and had this been a production level project,
it would benefit from security through obscurity and being able to hide any API keys from the client side.

In-memory caching was also added to the backend, this can be configured via the environment variables, preventing
unnecessary calls to third party providers.

SQLite was used as the database for simplicity, this stores the data that comes back from dummyjson for the user as well
as any favourites a user may have saved.

### UI

The client side application makes use of a ReactJS (CRA) application.

Users are able to:

- View lists of dog breeds and their images
- Add any of the images to favourites (provided they are authenticated)
- View all of their favourite images as well as unfavourite any of these images

On the client side I made use of `swr` for data fetching, in part as it works well with react via hooks and also allows
for easy client side caching through a built-in caching mechanism.

## Some screenshots from the project

**Main landing page with breed selected.**

![Dog List](./docs/images/01.jpeg)

**Adding a favourite before logging in.**

![Dog List](./docs/images/02.jpeg)

**Viewing favourites after logging in.**

![Dog List](./docs/images/04.jpeg)

**Authenticated user menu.**

![Dog List](./docs/images/03.jpeg)
