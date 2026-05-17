# TODO

## Google OAuth fix
- [x] Update frontend Google login flow in `frontend/src/components/Auth/Auth.jsx` to use `window.google.accounts.id.initialize` and send the received `credential` as `idToken`.

- [ ] After change, restart frontend dev server.
- [ ] Confirm `.env` values:
  - `VITE_GOOGLE_CLIENT_ID` is the *full* OAuth Client ID ending with `.apps.googleusercontent.com`.
  - `VITE_API_URL` points to backend.
- [ ] Confirm Google Cloud OAuth client settings:
  - Authorized JavaScript origins include `http://localhost:5173`.
  - Authorized redirect URIs / credentials are consistent with the client type used.
- [ ] Restart backend (if any env changes).
- [ ] Test Google login again and verify backend receives `idToken`.

