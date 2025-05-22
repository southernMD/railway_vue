# Vue Admin Template

This is a basic admin template built with Vue 3, Vite, Element Plus, and Vue Router.
It features a two-level sidebar navigation.

## Project Setup

### Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Compile and Hot-Reload for Development

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

### Compile and Minify for Production

```bash
npm run build
# or
yarn build
# or
pnpm build
```

### Preview Production Build

```bash
npm run preview
# or
yarn preview
# or
pnpm preview
```

## Customization

- **Router**: Configure routes in `src/router/index.js`.
- **Layout**: Modify layout components in `src/components/layout/`.
- **Views**: Add or edit page views in `src/views/`.
- **Styling**: Global styles can be added in `src/App.vue`. Component-specific styles are within their respective `.vue` files.
- **Element Plus Icons**: Remember to install and register `@element-plus/icons-vue` if you plan to use more icons. You can install it via `npm install @element-plus/icons-vue` and then register components globally in `src/main.js` or import them as needed.
