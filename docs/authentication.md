# Authentication

The app uses Firebase Auth with browser-local persistence, falling back to session persistence when local persistence is unavailable. Both normal and guest identities use the existing member-ID based Firestore access rules. Guest sign-in does not bypass authentication or membership checks.

## Guest setup

Enable **Authentication → Sign-in method → Anonymous** in the `hh-bankboken` Firebase project. A project administrator must do this; app deployment does not enable a Firebase provider. When disabled, the app displays a readable error and lets the guest retry.

The guest chooses a name and may optionally provide a Swish number to receive payments through the existing flow. Firebase creates an anonymous UID and the app saves the guest profile under `users/{uid}`. The existing invitation, reserved participant selection, group capacity, expenses and balances are reused. No email address or password is collected. The guest identity persists in the same browser. Cross-device sign-in and conversion to an email/password account are not part of this implementation. Automatic deletion of anonymous identities should not be enabled for identities with retained group membership.

If profile creation fails after anonymous sign-in, retrying reuses the signed-in UID rather than creating another identity. A returning anonymous identity without a profile is shown the guest name form.

## Password reset

The reset button calls Firebase `sendPasswordResetEmail`, using the app language and Firebase's hosted action handler. It requires a valid email address, but no password. Authentication actions remain disabled until SDK initialization finishes. The pending reset button is disabled to prevent duplicate clicks.

Success text is deliberately conditional: Firebase can conceal whether an account exists. A successful SDK response does not prove email delivery. Network and rate-limit errors are translated, and unknown-user errors use the same neutral acknowledgement. Spam filtering, mail delivery, quotas and real reset links still require an administrator or a consenting account owner to verify.

## Verification

`npm test` checks financial behavior and HTML/module integrity. `npm run test:browser` runs both existing application acceptance tests and isolated auth acceptance tests. The auth tests intercept Firebase and block every non-local request, so they cannot send emails or touch production accounts. They cover delayed startup, validation, repeated reset clicks, errors, ordinary login validation, disabled anonymous auth, invitation/profile claiming, a guest expense and identity persistence after reload.

A production probe on 2026-10-20 returned `ADMIN_ONLY_OPERATION` for anonymous sign-up; anonymous auth was disabled. The hosted Firebase action handler was available. The Firebase console denied access to the currently connected Google account, so provider activation could not be performed in this session.
