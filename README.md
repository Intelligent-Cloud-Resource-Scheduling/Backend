# Backend Contribution Documentation

Welcome to the Backend documentation! This guide provides all the necessary information to get you up to speed with running the project, understanding its architecture, and creating new endpoints.

---

## 🚀 How to Run the Project

### 1. Running in Development (Without Nodemon)
To run the server in development mode using `tsx watch` (which automatically restarts the server on file changes without needing nodemon):
```bash
npm run dev
```

### 2. Running in Development (With Nodemon)
If you prefer using Nodemon for watching file changes:
```bash
npm run dev:nodemon
```
*(This uses the configuration defined in `nodemon.json` to execute the app via `tsx`).*

### 3. How to Build for Production
To compile the TypeScript code into JavaScript:
```bash
npm run build
```
This runs the TypeScript compiler (`tsc`) and resolves path aliases (`tsc-alias`). Once built, you can start the production server:
```bash
npm run start
```

### 4. Running with Docker
The project includes a `docker-compose.yml` file to easily spin up the application and its PostgreSQL database.
```bash
docker-compose up -d
```
This builds the `backend` Dockerfile and starts both the `backend` and `postgres` services in detached mode.

### 5. What to do after changing the DB Schema
If you modify `prisma/schema.prisma`, you MUST update the database and the Prisma Client:
1. Push the changes to your local database (or create a migration):
   ```bash
   npx prisma db push
   # OR
   npx prisma migrate dev
   ```
2. Regenerate the Prisma Client so TypeScript knows about the new schema:
   ```bash
   npx prisma generate
   ```

---

## 🏗️ Project Architecture

Here is a breakdown of the directories within the Backend folder:

### `prisma/`
- **Purpose**: Database modeling and seeding.
- **Files**: 
  - `schema.prisma`: The single source of truth for the database schema.
  - `seed.ts`: Script used to populate the database with initial/dummy data.

### `src/` (Main Application Source)

> ⚠️ **IMPORTANT: RESTRICTED AREAS**
> You must **NOT** touch or modify files in the `config/`, `middlewares/`, `response.ts`, `AppError.ts`, and `app.ts` without notifying the lead developer or clarifying first. These are core to the application's stability.

- **`config/`** ⚠️: Contains core configuration files (`env.ts` for environment variables, `prisma.ts` for database connection).
- **`constants/`**: Holds constant variables and enums used across the application to avoid magic strings.
- **`jobs/`**: Contains background jobs or cron tasks.
- **`middlewares/`** ⚠️: Contains Express middlewares (detailed below). 
- **`routes/`**: Contains all the API endpoint definitions and routers.
- **`types/`**: Contains TypeScript types and interfaces (e.g., `unifiedResponse.ts`).
- **`utils/`**: Helper functions and generic classes (e.g., unified responses, custom errors).

### Key Infrastructure Files
- **`nodemon.json`**: Configures Nodemon to watch specific file extensions (`.ts`, `.ejs`, `.json`) in the `src` folder and ignore test files (`.spec.ts`). It executes the app using `tsx`.
- **`Dockerfile`**: Defines the production container image. It uses Node 22 Alpine, installs dependencies, generates the Prisma client, builds the TS code, and runs the compiled JS.
- **`docker-compose.yml`**: Orchestrates the multi-container setup. It defines the `postgres` database service (with volumes for data persistence) and the `backend` service, mapping environment variables and ports.

---

## ⚙️ Core Files & Functions Breakdown

### 1. Middlewares (`src/middlewares/`) ⚠️

- **`asyncHandler.ts`**: Wraps asynchronous route handlers to catch any errors and automatically pass them to the `next()` function. This eliminates the need for repetitive `try/catch` blocks in your routes.
- **`validate.ts`**: A global validation middleware. It accepts a **Zod schema** and validates the incoming `req.body`. If validation fails, it automatically throws an `AppError` with the validation details.
- **`error.ts`**: The global error handler. It catches all errors thrown in the app, hides sensitive internal details in production, and formats the output using `sendError`.
- **`requestId.ts`**: Generates a unique request ID for each incoming request, which is useful for tracing logs.
- **`auth.ts`**: Middleware used to verify authentication tokens/sessions before allowing access to protected routes.

### 2. Utilities (`src/utils/`)

- **`AppError.ts`**⚠️: A custom Error class extending the native `Error`. 
  - *Use Case*: Throw this whenever you want to return a specific HTTP status code and error code to the user (e.g., `throw new AppError('User not found', 404, 'USER_NOT_FOUND')`).
- **`response.ts`**⚠️: Contains `sendSuccess` and `sendError` functions.
  - *Use Case*: Ensures every single API response has the exact same JSON structure (`success`, `message`, `data`, `requestId`). 

### 3. App Entry Point (`src/app.ts` & `src/server.ts`)

- **`src/server.ts`**: Initializes the Express app, applies global middlewares (like JSON parsing and `requestId`), mounts the routers (e.g., `App.use('/users', userExampleRoutes)`), and strictly registers the global `errorHandler` at the very end.
- **`src/app.ts`**⚠️: The execution entry point. It imports the configured `App` from `server.ts` and starts the server listening on the defined `PORT`.

---

## 🛠️ How to Create New Endpoints

### 1. Creating and Validating a Route
Follow these steps to add a new route:

1. **Create the file**: Create a new `.ts` file in `src/routes/` (e.g., `product-route.ts`).
2. **Define your Zod Schema**: Create a schema to validate the incoming request body.
3. **Write the Route**: Use `router.post()`, `router.get()`, etc.
   - Wrap your async logic in `asyncHandler(...)`.
   - If expecting a body, add `validate(yourSchema)` before the `asyncHandler`.
4. **Return Responses/Errors**: 
   - Success: `return sendSuccess(res, data, "Optional message");`
   - Error: `throw new AppError("Message", statusCode, "CODE");`

### 2. Activating the Route in the Server
Once your route file is created and exported:
1. Open `src/server.ts`.
2. Import your new route file.
3. Mount it using `App.use()` **BEFORE** the `errorHandler`.
   ```typescript
   import productRoutes from '@/routes/product-route.js';
   
   // ... other routes
   App.use('/products', productRoutes);
   ```

### Example Breakdown: `user-Example-route.ts`

If you look at `src/routes/user-Example-route.ts`, you'll see a perfect example of this flow:

```typescript
// 1. Zod Schema defined for validation
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});

// 2. Route Definition
router.post(
  '/',
  validate(createUserSchema), // 3. Middleware intercepts and validates req.body
  asyncHandler(async (req, res) => { // 4. asyncHandler catches any async errors
    const user = await prisma.user.create({
      data: req.body,
    });

    // 5. Success response using the unified response utility
    return sendSuccess(res, user, 'User created'); 
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res, next) => {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!user) {
      // 6. Throwing a controlled AppError if something goes wrong
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return sendSuccess(res, user);
  })
);
```

By adhering to these patterns, the codebase remains clean, predictable, and heavily type-safe! Happy Coding!