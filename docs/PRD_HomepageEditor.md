# Homepage Config Editor - Product Requirements Document (PRD) & Architecture

## 1. Project Overview

*   **Purpose:** Provide a user-friendly, application-centric web interface for managing the configuration of a Homepage (https://gethomepage.dev/) instance.
*   **Context:** To simplify management of a Dockerized Homepage instance, allowing users to add, edit, and remove services, bookmarks, widgets, and settings through a structured GUI rather than primarily editing raw YAML files.
*   **Goal:** Offer an intuitive and modern interface for managing Homepage items, reduce configuration errors through guided input and validation, streamline updates, provide version history, and offer secure, role-based access. Raw file editing will be available as a secondary feature.
*   **Target Config Files:** `settings.yaml`, `bookmarks.yaml`, `docker.yaml`, `services.yaml`, `widgets.yaml`, `kubernetes.yaml`, `custom.css`, `custom.js`.
*   **Configuration Details:** For a detailed analysis of how Homepage uses these configuration files, see [Homepage Configuration File Analysis](./HomepageConfigAnalysis.md).

## 2. User Personas

*   **Admin:** The primary manager of the editor. Typically the person who sets up the Homepage instance.
    *   **Needs:** Full control over Homepage configuration, ability to manage user access to the editor, ensure configuration validity, track changes, revert mistakes.
    *   **Skills:** Comfortable with Docker, basic YAML understanding.
    *   **Motivation:** Wants a secure, reliable, graphical tool for managing Homepage and controlling editor access.
*   **User:** A user granted access by an Admin to edit Homepage configurations.
    *   **Needs:** Edit specific Homepage configuration files as permitted, view history, potentially rollback changes (depending on fine-grained permissions, though initially roles are functionally identical besides user management).
    *   **Skills:** May have varying technical skills, benefits from a GUI.
    *   **Motivation:** Needs to update specific parts of the Homepage configuration without needing deep technical knowledge or direct file access.

## 3. Functional Requirements

*   **FR1: Authentication & Initial Setup:**
    *   Secure login via email (as username) and password.
    *   On first run (if no users exist), prompt for creation of the initial 'Admin' account.
    *   Only authenticated users can access the editor beyond the initial setup/login pages.
*   **FR2: User Management (Admin):**
    *   Admins can manage users (add, remove, list, change role - Admin/User).
    *   No self-registration for new users.
    *   Cannot demote the last Admin.
*   **FR3: User Profile Management (All Users):**
    *   Users can change their own password.
*   **FR4: Service Management (CRUD):**
    *   View a list of existing services, grouped as defined in `services.yaml` / `settings.yaml` layout.
    *   Add a new service to an existing or new group via a structured form (fields for name, href, description, icon, optional widget config, optional ping/siteMonitor, optional Docker/K8s link).
        *   **Service Widget Implementation:** The form will include an optional "Widget Type" dropdown. Selecting a type dynamically renders the specific configuration fields for that widget using dedicated, modular frontend components. See [Service Widget Implementation Guide](./ServiceWidgetImplementationGuide.md) for details.
    *   Edit an existing service's details via a form, including its optional widget configuration.
    *   Remove an existing service (which also removes its associated widget config).
    *   Reorder services within a group (potentially drag-and-drop).
    *   Reorder groups (potentially drag-and-drop).
*   **FR5: Bookmark Management (CRUD):**
    *   View a list of existing bookmarks, grouped as defined in `bookmarks.yaml` / `settings.yaml` layout.
    *   Add a new bookmark to an existing or new group via a form (fields for name, href, abbr/icon, optional description).
    *   Edit an existing bookmark's details via a form.
    *   Remove an existing bookmark.
    *   Reorder bookmarks within a group.
    *   Reorder groups.
*   **FR6: Global Widget Management (CRUD):**
    *   View a list of existing global widgets defined in `widgets.yaml`.
    *   Add a new global widget via a form (selecting widget type and filling its specific options).
    *   Edit an existing global widget's configuration.
    *   Remove an existing global widget.
    *   Reorder global widgets.
*   **FR7: Settings Management:**
    *   Provide a structured UI (forms, toggles, dropdowns) to edit common settings from `settings.yaml` (e.g., title, theme, color, background, header style, language, layout basics like group order/tabs - advanced layout styling might require raw edit).
*   **FR8: Raw File Editing (Secondary Feature):**
    *   Provide an interface to select and edit the raw content of configuration files (`*.yaml`, `*.css`, `*.js`) using a code editor (e.g., Monaco).
    *   Include syntax highlighting.
    *   Include basic YAML syntax validation on save for YAML files.
*   **FR9: Version History & Rollback (Applies to underlying files):**
    *   Track changes made via the UI or raw editor at the file level using Git.
    *   Allow viewing history (commits) for each configuration file.
    *   Allow rollback to a previous version of a file. Store user email with commit.
*   **FR10: Editor Configuration:** Store editor-specific settings (e.g., theme preference) in `/data/config.json`.
*   **FR11: Environment Variable Display:** Read `/config/.env` (if exists) and display available `HOMEPAGE_VAR_` variables for user reference (e.g., in settings or when editing relevant fields). Direct substitution logic remains within Homepage itself.

## 4. Non-Functional Requirements

*   **NFR1: Security:**
    *   Implement secure password hashing (e.g., bcrypt).
    *   Use secure session management (e.g., JWT or secure cookies).
    *   Prevent directory traversal; strictly limit file access to the designated config volume.
    *   Validate all API inputs.
    *   Keep dependencies updated.
*   **NFR2: Usability & Look/Feel:**
    *   Modern, intuitive, and clean user interface.
    *   Support for both Light and Dark themes, ideally with automatic switching based on system preference and a manual toggle. (Consider using a UI component library like Material UI, Chakra UI, Mantine, or Tailwind CSS + Headless UI to achieve this).
    *   Clear visual feedback for actions (saving, validation success/failure, rollback).
    *   Helpful error messages and guided input where possible (e.g., dropdowns for known options, icon pickers).
*   **NFR3: Responsiveness:** UI must adapt gracefully to various screen sizes, primarily targeting desktop and tablet use.
*   **NFR4: Performance:** Editor should load and save typical configuration files (< 1MB) within a few seconds. Validation should be near-instantaneous.
*   **NFR5: Deployment:** The application must run as a single Docker container. It should be easily integrable into a `docker-compose.yml` file alongside the main Homepage container, sharing the configuration volume (`/config`) and having its own persistent data volume (`/data`) for the database and editor config.
*   **NFR6: Scalability:** Designed to support 1-10 concurrent administrative users reliably.

## 5. User Flows

1.  **Initial Setup:** User navigates to editor URL -> System detects no admin exists -> Presents Initial Admin Setup form -> User enters email/password -> Submits -> System creates admin user -> Redirects to Login.
2.  **Login:** User navigates to editor URL -> Enters email/password -> Submits -> System validates credentials -> Grants access to dashboard.
3.  **Add Service:** User navigates to Services section -> Clicks "Add Service" -> Fills form (group, name, href, icon, etc.) -> Clicks "Save" -> System parses `services.yaml`, adds new service data, serializes back to YAML, saves file, commits change -> UI updates list.
4.  **Edit Service:** User navigates to Services section -> Clicks "Edit" on a service -> Modifies details in form -> Clicks "Save" -> System parses `services.yaml`, updates service data, serializes back to YAML, saves file, commits change -> UI updates list.
5.  **Remove Service:** User navigates to Services section -> Clicks "Delete" on a service -> Confirms -> System parses `services.yaml`, removes service data, serializes back to YAML, saves file, commits change -> UI updates list.
6.  **(Similar flows for Bookmarks and Global Widgets)**
7.  **Edit Settings:** User navigates to Settings section -> Modifies form fields (e.g., changes Title, selects Theme) -> Clicks "Save" -> System parses `settings.yaml`, updates relevant keys, serializes back to YAML, saves file, commits change -> UI reflects changes (e.g., theme updates).
8.  **Raw Edit File:** User navigates to Raw Editor section -> Selects a file -> Editor loads content -> User modifies content -> Clicks "Save" -> System validates YAML syntax (if applicable), saves file, commits change -> Shows success/error.
9.  **View History/Rollback:** User navigates to History section (or context menu on item/file) -> Selects a file -> Views commit list -> Selects a commit -> Clicks "Rollback to this version" -> Confirms -> System checks out file content from Git, saves file, creates new commit -> Shows success.
10. **Admin - Manage Users:** Admin navigates to User Management -> Performs Add/Remove/Change Role actions -> System updates database.
11. **Change Own Password:** User navigates to Profile/Settings -> Enters current/new password -> Submits -> System updates database.
12. **Logout:** User clicks "Logout" -> System invalidates session -> Redirects to login page.

## 6. Technical Architecture

```mermaid
graph TD
    User[Admin/User] -- HTTPS --> Browser[Web Browser]
    Browser -- API Calls --> EditorBackend[Homepage Editor Backend (Node.js)]
    EditorBackend -- Reads/Writes/Git --> ConfigVolume[Shared Docker Volume (/config)]
    EditorBackend -- Stores/Retrieves --> Database[SQLite DB (/data/editor.db - Users, Roles)]
    EditorBackend -- Reads/Writes --> EditorConfig[config.json (/data/config.json)]
    EditorBackend -- Reads --> DotEnvFile[/config/.env]
    Homepage[Homepage Container] -- Reads --> ConfigVolume

    subgraph Editor Container
        Browser -- Serves UI --> EditorFrontend[React SPA]
        EditorFrontend -- Bundled --> EditorBackend
        EditorBackend
        Database -- Stored in --> EditorDataVolume[/data]
        EditorConfig -- Stored in --> EditorDataVolume[/data]
    end

    subgraph Host System / Docker Environment
        DockerDaemon[Docker Daemon]
        DockerDaemon -- Manages --> Editor Container
        DockerDaemon -- Manages --> Homepage[Homepage Container]
        DockerDaemon -- Mounts --> ConfigVolume
        DockerDaemon -- Mounts --> EditorDataVolume
    end

    style Editor Container fill:#f9f,stroke:#333,stroke-width:2px
    style Homepage fill:#ccf,stroke:#333,stroke-width:2px
```

*   **Components:**
    *   **Frontend:** React Single Page Application (SPA) using Vite for bundling/development. Includes the Monaco Editor component.
    *   **Backend:** Node.js API server using Express or Fastify. Handles authentication, user management (SQLite), parsing/manipulating YAML data structures, serializing back to YAML, file I/O on the shared volume, Git operations for versioning, and serves the frontend static assets.
    *   **Database:** SQLite database file (`editor.db`) stored in the Editor Data Volume (`/data`). Stores user credentials (email, hashed password) and roles (Admin/User).
    *   **Editor Configuration:** A JSON file (`config.json`) stored in the Editor Data Volume (`/data`) for editor-specific settings.
    *   **Environment Variables:** Reads `.env` file from the *configuration* volume (`/config/.env`) at startup.
    *   **Versioning Mechanism:** Git repository initialized within the shared configuration volume (`/config`). The backend executes `git` commands (`init`, `add`, `commit`, `log`, `checkout`) to manage versions.
    *   **Configuration Volume (`/config`):** Shared Docker volume mounted to both Homepage and Editor containers. Contains the `.yaml`, `.css`, `.js` files.
    *   **Editor Data Volume (`/data`):** Persistent Docker volume mounted only to the Editor container. Stores the SQLite database (`editor.db`) and the editor configuration file (`config.json`).

## 7. Technology Stack Recommendation

*   **Backend Framework:** Node.js (v20+ recommended/required) w/ Fastify (Performance focus) or Express (Wider middleware ecosystem)
*   **Frontend Framework:** React w/ Vite
*   **Code Editor Component:** Monaco Editor
*   **YAML Parsing/Validation:** `js-yaml` (Parsing), `ajv` (JSON Schema validation)
*   **Authentication:** `bcrypt` (Hashing), JWT or Session Cookies (`express-session`)
*   **Database:** `sqlite3` Node.js package (or an ORM like Sequelize/Prisma for easier management)
*   **.env Handling:** `dotenv` Node.js package
*   **Versioning:** Direct `git` CLI execution via Node.js `child_process`.
*   **Containerization:** Docker / Docker Compose

## 8. API Design (Conceptual Endpoints)

*   **Authentication & Setup:**
    *   `GET /api/setup/status`: -> { needsSetup: boolean }
    *   `POST /api/setup/admin`: { email, password } -> Success/Failure
    *   `POST /api/auth/login`: { email, password } -> { token/session, user: { email, role } }
    *   `POST /api/auth/logout`: {} -> Success/Failure
    *   `GET /api/auth/status`: -> { loggedIn: boolean, user?: { email, role } }
*   **User Management:**
    *   `PUT /api/users/me/password`: { currentPassword, newPassword } -> Success/Failure
    *   `GET /api/users`: (Admin only) -> [{ id, email, role }]
    *   `POST /api/users`: (Admin only) { email, password, role } -> { id, email, role }
    *   `DELETE /api/users/{userId}`: (Admin only) -> Success/Failure
    *   `PUT /api/users/{userId}/role`: (Admin only) { role } -> Success/Failure
*   **Homepage Item Management (Structured Data):**
    *   `GET /api/services`: -> [Parsed Service Groups Structure]
    *   `POST /api/services`: { groupName, serviceData } -> Success/Failure (Adds new service)
    *   `PUT /api/services/{groupName}/{serviceName}`: { serviceData } -> Success/Failure (Updates existing service)
    *   `DELETE /api/services/{groupName}/{serviceName}`: -> Success/Failure
    *   `PUT /api/services/order`: { orderedGroups: [...] } -> Success/Failure (Reorders groups/services within groups)
    *   `(Similar endpoints for /api/bookmarks, /api/widgets/global, /api/settings)`
*   **Raw File Management (Secondary):**
    *   `GET /api/files/raw`: -> [{ name, type, modified_at }] (Lists editable files)
    *   `GET /api/files/raw/{filename}`: -> { content: "..." }
    *   `PUT /api/files/raw/{filename}`: { content: "..." } -> Success/Failure (With basic YAML validation)
*   **Versioning:**
    *   `GET /api/files/raw/{filename}/history`: -> [{ id, message, author_email, timestamp }]
    *   `POST /api/files/raw/{filename}/rollback`: { versionId: "..." } -> Success/Failure
*   **Configuration:**
    *   `GET /api/config/homepage-vars`: -> { VAR_NAME: "value", ... }

## 9. Security Considerations

*   **Password Hashing:** Use `bcrypt` with a sufficient cost factor.
*   **Session Management:** Use secure, HTTP-only cookies for sessions or short-lived JWTs. Implement CSRF protection if using cookies.
*   **Input Sanitization/Validation:** Validate all API inputs rigorously. Sanitize filenames passed in URLs/bodies to prevent directory traversal (ensure they resolve within the `/config` base path).
*   **File Permissions:** Ensure the container runs as a non-root user with appropriate permissions on the `/config` and `/data` volumes.
*   **Dependency Management:** Regularly scan and update dependencies (npm audit/yarn audit). Ensure Node.js version meets dependency requirements (v20+ recommended).
*   **Rate Limiting:** Consider basic rate limiting on login endpoints.

## 10. Development Roadmap (High-Level Phases)

1.  **Phase 1: UI Foundation & Initial Setup UI** (Priority)
    *   Setup React frontend project (Vite).
    *   Choose and integrate a UI component library (e.g., Material UI, Chakra UI, Mantine) supporting theming.
    *   Implement basic layout structure (sidebar navigation, main content area).
    *   Implement Light/Dark theme switching.
    *   Implement UI components for Login page.
    *   Implement UI components for Initial Admin Setup page.
    *   Implement basic routing between Setup/Login/Main App views.
    *   Setup Node.js backend project (Fastify/Express).
    *   Implement basic Dockerfile and docker-compose service definition (as done previously, may need minor tweaks).
2.  **Phase 2: Backend Setup - Auth & Structured Data Reading**
    *   Setup SQLite database (users table: email, password_hash, role). Consider ORM (Sequelize/Prisma).
    *   Implement backend logic for initial setup (`/api/setup/status`, `/api/setup/admin`).
    *   Implement backend logic for authentication (`/api/auth/login`, `/api/auth/logout`, `/api/auth/status`, password hashing, session/JWT management).
    *   Implement backend logic to read and parse `services.yaml`, `bookmarks.yaml`, `widgets.yaml`, `settings.yaml` into structured JavaScript objects/arrays.
    *   Implement basic API endpoints to serve this parsed data (e.g., `GET /api/services`, `GET /api/bookmarks`, etc.).
    *   Implement backend logic for user profile management (`PUT /api/users/me/password`).
    *   Implement backend logic for Admin user management (`GET /api/users`, `POST /api/users`, etc.).
    *   Protect relevant API endpoints.
3.  **Phase 3: Application/Widget Management UI & Backend Logic**
    *   Implement UI views/components for listing Services, Bookmarks, Global Widgets, and Settings.
    *   Implement UI forms (modals or pages) for Adding/Editing Services, Bookmarks, Global Widgets, and common Settings.
        *   **Service Widget Forms:** Enhance Add/Edit Service forms to include a widget type selector. Implement individual React components for **all documented** Service Widget types' fields (as listed in `sourcecode_homepage/docs/widgets/services/`, located in `editor-app/frontend/src/components/ServiceWidgets/`) following the [Service Widget Implementation Guide](./ServiceWidgetImplementationGuide.md). These components will be loaded dynamically based on the selection.
    *   Implement backend logic to modify the parsed data structures based on UI actions (add, edit, delete), ensuring the nested `widget` structure within services is handled correctly.
    *   Implement backend logic to safely serialize the modified data structures back into valid YAML format, preserving the nested `widget` structure.
    *   Implement backend logic to write the updated YAML back to the corresponding files in `/config`.
    *   Implement UI components for reordering items/groups (e.g., drag-and-drop).
    *   Implement backend logic for reordering.
4.  **Phase 4: Versioning & Raw File Editing**
    *   Implement backend logic to initialize Git repo in `/config` if not present.
    *   Modify backend save logic (for both structured UI saves and raw edits) to `git add` and `git commit` changes, including user email in commit message.
    *   Implement backend endpoints for file history (`GET /api/files/raw/{filename}/history`) and rollback (`POST /api/files/raw/{filename}/rollback`).
    *   Implement UI for viewing file history and triggering rollbacks.
    *   Implement Raw File Editor UI section using Monaco Editor.
    *   Implement backend endpoints for raw file listing, reading, and saving (`/api/files/raw/...`).
    *   Integrate basic YAML syntax validation for raw YAML file saves.
5.  **Phase 5: Advanced Features & Polish**
    *   Implement advanced YAML schema validation (using AJV) for structured UI saves and potentially raw saves.
    *   Implement `.env` variable reading and display (`GET /api/config/homepage-vars`).
    *   Refine UI/UX based on user flows, add loading states, improve error handling.
    *   Implement responsive design improvements.
    *   Add comprehensive backend logging.
    *   Write user documentation (README, usage).
    *   Final testing.
## 11. Security Enhancement Plan

This section outlines specific security improvements identified and prioritized for implementation based on the security review and user feedback.

### 11.1 Authentication & Session Management

*   **SR1: JWT Token Management (Access & Refresh Tokens):**
    *   **Requirement:** Implement a robust JWT-based authentication system using short-lived access tokens and long-lived refresh tokens to enhance security and session management.
    *   **Details:**
        *   **Access Token:**
            *   Issued upon successful login.
            *   Lifespan: 1 hour.
            *   Transmitted in the `Authorization` header of API requests.
            *   Contains user claims (ID, email, role).
        *   **Refresh Token:**
            *   Issued alongside the access token upon successful login.
            *   Lifespan: 7 days.
            *   Transmitted to the client as an `HttpOnly`, `Secure` (in production), and `SameSite=Strict` (or `Lax`) cookie.
            *   Used to obtain a new access token when the current one expires.
            *   Consider implementing refresh token rotation (issuing a new refresh token when the old one is used).
            *   Consider stateful refresh tokens (e.g., storing a hash or reference in the database associated with the user and session/device) to allow for server-side revocation.
        *   **Backend API (`editor-app/backend/server.js`):**
            *   Modify the login endpoint ([`POST /api/auth/login`](editor-app/backend/server.js:227)) to generate and return both access and refresh tokens.
            *   Create a new endpoint (e.g., `POST /api/auth/refresh`) to accept a refresh token (from the cookie) and issue a new access token (and potentially a new refresh token).
            *   Update JWT signing logic to include appropriate expiration times for both token types.
            *   Implement logic for validating refresh tokens (checking expiration, revocation status if stateful).
        *   **Frontend:**
            *   Store the access token securely (e.g., in memory).
            *   Implement logic to detect 401 Unauthorized responses (due to access token expiration).
            *   Upon detecting a 401, automatically attempt to refresh the access token using the `/api/auth/refresh` endpoint (the browser will send the refresh token cookie automatically).
            *   If refresh is successful, update the stored access token and retry the original failed API request.
            *   If refresh fails (e.g., refresh token is invalid or expired), redirect the user to the login page.
        *   **Logout (`POST /api/auth/logout`):**
            *   Clear the refresh token cookie.
            *   If stateful refresh tokens are used, invalidate the refresh token on the server-side.
*   **SR2: Account Lockout:**
    *   **Requirement:** Implement an account lockout mechanism to mitigate brute-force login attempts.
    *   **Details:** After 10 unsuccessful login attempts for a specific user account, the account shall be locked for a duration of 1 hour. This will require tracking failed login attempts (e.g., in memory with appropriate eviction, or in the database) and checking the lockout status during login.
*   **SR3: User Profile Management UI (including Password Change):**
    *   **Requirement:** Provide a dedicated user profile/settings area accessible from the main application header, allowing authenticated users to manage their profile, primarily to change their own password.
    *   **Details:**
        *   **UI Placement:** Add a new user profile icon or button (e.g., a user avatar icon or the user's email/name) in the top-right application header bar, positioned *before* the light/dark mode toggle and the logout button.
        *   **Access:** Clicking this new icon/button should open a modal dialog, a dropdown menu leading to a settings page, or navigate to a dedicated user profile page.
        *   **Functionality (Password Change):** This user profile area must include the UI elements for changing the password:
            *   Fields for "Current Password," "New Password," and "Confirm New Password."
            *   The frontend will call the existing backend API endpoint [`PUT /api/users/me/password`](editor-app/backend/server.js:324) to perform the password update.
        *   **Future Expansion:** This area can later be expanded to include other user-specific settings if needed (e.g., changing email if supported, managing API tokens if implemented).

### 11.2 Dependency Management

*   **SR4: Automated Dependency Scanning:**
    *   **Requirement:** Integrate automated security vulnerability scanning for dependencies into the container build process.
    *   **Details:**
        *   Modify the [`editor-app/Dockerfile`](editor-app/Dockerfile:1) to include a step that runs `npm audit` (or a similar tool like Snyk CLI if available/preferred) after `npm ci` in both `backend-builder` and `frontend-builder` stages.
        *   The build process should ideally fail if high or critical severity vulnerabilities are detected, or at minimum, a report should be generated that can be reviewed.
        *   Establish a process for regularly reviewing and updating dependencies based on scan results.

### 11.3 General Security Practices

*   **SR5: HTTP Security Headers:**
    *   **Requirement:** Implement standard HTTP security headers to enhance protection against common web vulnerabilities.
    *   **Details:** Configure the Fastify backend ([`editor-app/backend/server.js`](editor-app/backend/server.js:1)) to send the following headers on responses:
        *   `Content-Security-Policy` (CSP): Define a restrictive policy. Start with a basic policy (e.g., `default-src 'self'`) and refine as needed for specific resources (scripts, styles, images, connect-src for API calls).
        *   `X-Content-Type-Options: nosniff`
        *   `X-Frame-Options: DENY` (or `SAMEORIGIN` if embedding is ever required from the same origin).
        *   `Strict-Transport-Security` (HSTS): (e.g., `max-age=31536000; includeSubDomains`). This should only be enabled if the application will always be served over HTTPS.
        *   `Referrer-Policy: strict-origin-when-cross-origin` (or a more restrictive policy like `no-referrer`).
        *   This can be achieved using a plugin like `@fastify/helmet` and configuring it appropriately.
*   **SR6: API Rate Limiting:**
    *   **Requirement:** Implement rate limiting on sensitive API endpoints to protect against brute-force attacks and potential denial-of-service.
    *   **Details:** Apply rate limiting to the following backend API endpoints in [`editor-app/backend/server.js`](editor-app/backend/server.js:1):
        *   Login: [`POST /api/auth/login`](editor-app/backend/server.js:227)
        *   Initial Admin Setup: [`POST /api/setup/admin`](editor-app/backend/server.js:183)
        *   Password Change: [`PUT /api/users/me/password`](editor-app/backend/server.js:324)
        *   Consider other user management endpoints if they are deemed sensitive to abuse (e.g., user creation by admin).
        *   This can be implemented using a plugin like `fastify-rate-limit`, configuring appropriate limits (e.g., X requests per minute per IP or per user ID if authenticated).