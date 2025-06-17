# Homepage Editor - Version History

This document outlines the key changes and features introduced in each version of the Homepage Editor.

## Version 0.8

This version focuses on significant security enhancements and critical vulnerability fixes, making the editor more robust and secure.

*   **Security Enhancements Implemented:**
    *   **Account Lockout (SR2):** Accounts are now automatically locked for 1 hour after 9 unsuccessful login attempts to prevent brute-force attacks. Users receive feedback on remaining attempts.
    *   **Enhanced User Profile Management (SR3):** Users can now update their email address (with password verification) in addition to changing their password through the "Profile Settings" page.
    *   **Advanced JWT Token Management (SR1):** Implemented a more secure authentication system using short-lived (1-hour) access tokens and long-lived (7-day) refresh tokens (HttpOnly, Secure cookies) with automatic refresh capabilities.
*   **Critical Vulnerability Fixes (CVEs):**
    *   Addressed CVE-2025-47935 by updating the `multer` package.
    *   Addressed CVE-2024-21538 by updating the global `npm` version within the Docker image.

## Version 0.7

This version brought major UI/UX improvements, new helper features, and robust input validation.

*   **Input Validation & Sanitization:** Implemented comprehensive server-side validation and sanitization to protect against common vulnerabilities like XSS and ensure data integrity.
*   **Icon Display for Services & Bookmarks:** Enhanced visual identification by displaying icons for services and bookmarks, with support for various sources and theme-aware variants.
*   **Custom Image Management:** Introduced a dedicated interface for users to upload, browse, and delete custom images for use within their Homepage configuration (e.g., for icons or backgrounds).
*   **Comprehensive Help Page:** Added a detailed help page within the editor to guide users through its features and functionalities.
*   **Enhanced Item Reordering:** Improved the user experience for reordering services, bookmarks, global widgets, and their respective groups directly within their list views.
*   **General UI Enhancements:** Included updates like a custom favicon, refined sidebar navigation, and display of application version information.

## Version 0.6

Focused on completing the core widget functionality and initial polishing.

*   **Service Widget Completion:** Finalized the implementation for all ~140 Service Widget types. This includes:
    *   Dynamic forms based on widget type.
    *   Support for `.env` variable autocomplete (`{{HOMEPAGE_VAR_...}}` and `{{HOMEPAGE_FILE_...}}`).
    *   Mandatory field validation with visual error indicators.
    *   Password visibility toggles for secret fields.
*   **Environment Variable Display:** Implemented the ability to read and display `HOMEPAGE_VAR_` variables from the `.env` file for user reference.
*   **UI/UX Refinements:** Initial improvements to user flows, loading states, and error handling.

## Version 0.5

Introduced critical features for configuration management and advanced editing.

*   **Version Control (Git Integration):**
    *   Integrated Git to track all changes made to configuration files.
    *   Allows viewing commit history for each file.
    *   Enabled rollback functionality to previous versions of a file.
    *   User email is associated with each commit.
*   **Raw File Editor:**
    *   Provided an interface to directly edit the raw content of configuration files (`.yaml`, `.css`, `.js`) using the Monaco editor.
    *   Includes syntax highlighting and basic YAML validation on save.

## Version 0.4

Focused on expanding widget support and core usability.

*   **Service Widget Implementation (Initial Batch):** Began implementation of dynamic forms for various Service Widget types, allowing users to configure them through the UI.
*   **Item & Group Reordering:** Implemented initial backend and UI capabilities for reordering services, bookmarks, and widgets within their groups, and reordering the groups themselves.

## Version 0.3

Established the core CRUD (Create, Read, Update, Delete) functionalities for primary Homepage items.

*   **Basic Management UI:**
    *   Implemented UI views for listing Services, Bookmarks, Global Widgets, and common Settings.
    *   Developed UI forms (modals/pages) for adding and editing these items.
*   **Backend Logic for CRUD:**
    *   Implemented backend logic to modify parsed data structures based on UI actions.
    *   Ensured safe serialization of modified data back into valid YAML format.
    *   Handled writing updated YAML back to the respective configuration files.

## Version 0.2

Focused on setting up the backend authentication and foundational data handling.

*   **Backend Authentication:**
    *   Implemented SQLite database for user storage (email, hashed password, role).
    *   Developed backend logic for initial admin setup if no users exist.
    *   Implemented core authentication endpoints (login, logout, status).
    *   Added backend logic for user profile management (password change) and Admin user management (add, remove, list users).
*   **Configuration File Handling:**
    *   Implemented backend logic to read and parse `services.yaml`, `bookmarks.yaml`, `widgets.yaml`, and `settings.yaml` into structured objects.
    *   Created basic API endpoints to serve this parsed data to the frontend.

## Version 0.1

The initial version establishing the project's foundation.

*   **Core Application Structure:**
    *   Set up the React frontend project (using Vite).
    *   Established the Node.js backend project (using Fastify).
    *   Created the basic Dockerfile and `docker-compose.yml` service definition for the editor.
*   **UI Foundation:**
    *   Implemented the basic layout structure (sidebar navigation, main content area).
    *   Integrated a UI component library with Light/Dark theme switching capabilities.
*   **Initial Setup & Login UI:**
    *   Developed UI components for the Login page.
    *   Created UI components for the Initial Admin Setup page (triggered on first run).
    *   Implemented basic frontend routing.