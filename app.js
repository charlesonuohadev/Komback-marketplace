/**
 * cPanel / Phusion Passenger startup file.
 *
 * Application Manager defaults to `app.js` as the application startup file. This
 * shim boots the bundled CommonJS server (`dist/server.cjs`), which is produced by
 * `npm run build`. Passenger injects PORT; the server reads it from the environment.
 */
import('./dist/server.cjs').catch((error) => {
  console.error('[komback] failed to start the bundled server:', error);
  process.exit(1);
});
