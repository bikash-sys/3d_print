# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Deploying to Vercel

This project is configured to run both the **Vite React Frontend** and **Express Node Backend** as a unified serverless application on Vercel.

### Prerequisites
1. Install Vercel CLI globally if you haven't already:
   ```bash
   npm install -g vercel
   ```

### Local Development
Now that the Vite proxy and Express config are updated:
1. Start the backend:
   ```bash
   cd server && npm run start
   ```
2. Start the frontend:
   ```bash
   npm run dev
   ```
   *Vite will automatically proxy any frontend requests starting with `/api` to the backend on `http://localhost:5005`.*

### Deployment Steps
1. Run the `vercel` command from the project root:
   ```bash
   vercel
   ```
2. Follow the prompts to log in and set up a new project.
3. Configure the following **Environment Variables** in your Vercel Dashboard (Project Settings > Environment Variables):
   - `RAZORPAY_KEY_ID`: Your Razorpay Key ID
   - `RAZORPAY_KEY_SECRET`: Your Razorpay Key Secret
   - `VITE_RAZORPAY_KEY_ID`: Your Razorpay Key ID (needed by the client checkouts)
4. Deploy to production:
   ```bash
   vercel --prod
   ```

The rewrite configuration in [`vercel.json`](file:///Users/bikash/3d%20print/vercel.json) routes all `/api/*` traffic automatically to the Serverless Function defined in [`api/index.js`](file:///Users/bikash/3d%20print/api/index.js), while Vercel serves the static frontend assets from Vite.

