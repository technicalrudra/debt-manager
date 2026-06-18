# DebtManager

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.11.

## Supabase database setup

Run these files in the Supabase SQL Editor in this order:

1. `supabase/supabase-schema.sql`
2. `supabase/RBAC_migration.sql`
3. `supabase/bootstrap-first-admin.sql`
4. `supabase/check-access-control.sql`

Supabase login accounts are stored in `auth.users` and are visible under
**Authentication > Users**. Application user details used by the admin UI are
stored in `public.profiles`.

The access-control tables in the `public` schema are:

- `profiles`
- `roles`
- `permissions`
- `role_permissions`
- `modules`
- `user_roles`
- `user_modules`

To create the first administrator, register one account through the application,
then run `supabase/bootstrap-first-admin.sql` in the SQL Editor. It promotes the
earliest registered Supabase Auth user to an approved admin only if no approved
admin exists yet.

To promote a specific account instead, edit the email in
`supabase/make-admin.sql` and run that file in the SQL Editor.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
