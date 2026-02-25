# Homepage Editor - Version History

This document outlines the key changes and features introduced in each version of the Homepage Editor.

## Version 0.8.8

This version resolves all remaining HIGH security vulnerabilities by migrating away from the unmaintained `fastify-multer` package and upgrading key dependencies.

*   **Security: Migrate fastify-multer to @fastify/multipart:**
    *   **Problem:** `fastify-multer` is unmaintained and incompatible with Fastify >=5.7.3, which forced pinning Fastify to `~5.3.3` and left 2 HIGH CVEs unpatched (DoS via sendWebStream, Content-Type tab bypass)
    *   **Solution:** Replaced `fastify-multer` + `multer` with the official `@fastify/multipart` plugin
    *   **Fastify Unpinned:** Changed from `~5.3.3` to `^5.7.4`, resolving the 2 Fastify CVEs
    *   **Upload Endpoint Rewrite:** `POST /api/images/upload` now uses `request.file()` / `data.toBuffer()` pattern instead of multer preHandler
    *   **Filename Sanitization:** Extracted `sanitizeImageFilename()` as a standalone helper function
    *   **Error Handling:** Added graceful handling for malformed multipart requests
    *   **No Frontend Changes:** `@fastify/multipart` parses `FormData` identically to multer
*   **Security: Resolve tar Chain Vulnerabilities:**
    *   **bcrypt 5.1.1 → 6.0.0:** Drops `@mapbox/node-pre-gyp` (and its vulnerable `tar@6`) in favor of `prebuildify` with prebuilt binaries shipped in the package
    *   **npm overrides for tar:** Forces `sqlite3`'s transitive `tar` dependency to `^7.5.8` (patched version)
    *   **Result:** `npm audit` now reports **0 vulnerabilities** (was 7 HIGH)
*   **Testing:**
    *   New automated test suite: `test_code/test-image-upload-multipart.js` (10 tests)
    *   Tests cover: valid upload, MIME rejection, size limit, filename sanitization, auth, malformed requests, delete, and view

## Version 0.8.7

This version fixes a critical production crash, merges the Group Reorder page into a single unified list, and resolves CSP issues blocking the Raw Editor in production.

*   **Critical Production Fix:**
    *   **Fastify Crash Loop:** Pinned fastify to `~5.3.3` to fix `fastify-multer` incompatibility (FST_ERR_CTP_INVALID_TYPE) that caused the container to crash-loop after `npm audit fix` upgraded fastify to 5.7.4
*   **Unified Group Reorder Page:**
    *   **Single List:** Merged two-column layout (Service Groups / Bookmark Groups) into a single unified list matching `settings.yaml` layout order
    *   **Visual Distinction:** Service groups have a blue left border + "Service" chip, bookmark groups have an orange left border + "Bookmark" chip, layout-only groups show a grey "Layout" chip
    *   **Color Legend:** Added legend above the list showing blue = Service Group, orange = Bookmark Group
    *   **Three-File Sync:** Drag-and-drop now saves order to all three files: `settings.yaml`, `services.yaml`, and `bookmarks.yaml`
    *   **New Backend Endpoint:** Added `PUT /api/services/groups-order` to reorder service groups in `services.yaml`
    *   **Testing:** 15/15 automated tests passing (`test_code/test-group-reorder-unified.js`)
*   **Service List Improvements:**
    *   **Layout Order Sorting:** Services page now displays groups sorted by `settings.yaml` layout order instead of `services.yaml` file order
    *   **Service Filter Fix:** Fixed scroll-to-top behavior on edit save
*   **CSP Fixes for Raw Editor:**
    *   **Monaco Editor CDN:** Added `https://cdn.jsdelivr.net` to `scriptSrc`, `styleSrc`, and `fontSrc` CSP directives to allow Monaco Editor to load its scripts, stylesheets, and codicon fonts from the CDN in production

## Version 0.8.6

This version completes all remaining security requirements from the PRD, implements ProxmoxVM widget for full Homepage v1.8.0+ compatibility, and fixes a critical widget editing bug.

*   **Security Enhancements (SR4, SR5, SR6):**
    *   **HTTP Security Headers (SR5):** Enhanced `@fastify/helmet` configuration with comprehensive web security protections
        - **Conditional HSTS:** Enabled only when `HTTPS_ENABLED=true` or `NODE_ENV=production` (max-age: 1 year, includeSubDomains)
        - **Referrer-Policy:** Set to `strict-origin-when-cross-origin` for balanced security and functionality
        - **X-Content-Type-Options:** Explicitly set to `nosniff` to prevent MIME sniffing attacks
        - **X-Frame-Options:** Set to `DENY` to prevent clickjacking attacks
        - **Enhanced CSP Documentation:** Clear comments explaining why `unsafe-inline` is required for React/Vite/MUI
        - **Testing:** 21/21 automated tests passed, user verified no CSP violations
    *   **API Rate Limiting (SR6):** Implemented custom in-memory rate limiter to protect sensitive endpoints
        - **Strict Limits:** 5 requests per minute on login, admin setup, and password change endpoints
        - **Global Limiter:** 100 requests per minute available for other endpoints
        - **Automatic Cleanup:** Expired entries removed every 5 minutes
        - **Clear Error Messages:** HTTP 429 responses with retry-after timing
        - **Integration:** Works alongside existing account lockout feature (9 failed attempts)
    *   **Enhanced Dependency Scanning (SR4):** Docker build now enforces security audit compliance
        - **Build Failure:** Docker build fails on HIGH or CRITICAL vulnerabilities (`npm audit --audit-level=high`)
        - **Fixed Vulnerabilities:** Resolved 6 existing vulnerabilities (1 moderate, 5 high)
        - **Updated Packages:** glob, js-yaml, jws, multer, tar-fs, validator
        - **Current Status:** 0 vulnerabilities in both backend and frontend
*   **ProxmoxVM Widget Implementation (Widget #150):**
    *   **New Widget:** ProxmoxVM service widget for monitoring specific Proxmox VMs/LXC containers
        - **Required Fields:** URL, API Token User, API Token Secret, Node Name, VM/Container ID
        - **Optional Field:** Type selection (QEMU/LXC), defaults to QEMU
        - **YAML Field:** Uses `vmtype` field to avoid confusion with widget `type`
        - **Features:** .env variable autocomplete support, password visibility toggle
    *   **Widget Count:** Updated from 148 → **150 widgets (100% Homepage v1.8.0+ compatibility)**
*   **Critical Bug Fix:**
    *   **Black Screen Issue:** Resolved "Invalid hook call" errors affecting ALL widgets when editing services
        - **Root Cause:** Vite bundling multiple React instances for lazy-loaded components
        - **Fix 1:** Added `resolve.dedupe` in vite.config.js to ensure single React instance
        - **Fix 2:** Added `optimizeDeps.include` to pre-bundle React, React-DOM, MUI, and Emotion
        - **Fix 3:** Separated `initialWidgetData` from `widgetData` to prevent infinite loops
        - **Fix 4:** Removed invalid widget types (calendar, plex-tautulli)
        - **Fix 5:** Fixed unifi-controller mismatch in component comments
        - **User Verification:** All widgets now work correctly, YAML structure validates
*   **Testing Resources Created:**
    *   `test_code/test-security-headers.js` - Automated security header verification (21 tests)
    *   `test_code/test-rate-limiting.js` - Automated rate limiting tests (4 scenarios)
    *   `test_code/SECURITY_HEADERS_TESTING_GUIDE.md` - Comprehensive manual testing guide (450+ lines)
    *   `test_code/PROXMOXVM_TESTING_GUIDE.md` - ProxmoxVM widget testing guide
    *   `test_code/test-proxmoxvm-widget.js` - Automated ProxmoxVM widget tests
*   **Security Status:**
    *   ✅ SR1: JWT Token Management (Access & Refresh Tokens)
    *   ✅ SR2: Account Lockout (9 failed attempts, 1-hour lockout)
    *   ✅ SR3: User Profile Management UI (Password & Email)
    *   ✅ SR4: Automated Dependency Scanning (Fails on HIGH/CRITICAL)
    *   ✅ SR5: HTTP Security Headers (Comprehensive protection)
    *   ✅ SR6: API Rate Limiting (5 req/min on sensitive endpoints)
    *   **Result:** 100% of PRD Security Requirements Complete

## Version 0.8.5

This version focuses on Homepage v1.8.0 compatibility, React 19 stability improvements, and multi-platform Docker deployment.

*   **Homepage v1.8.0 Compatibility:**
    *   **Version Baseline Update:** Updated `homepageversion.txt` from v1.2.0 to v1.8.0, establishing compatibility with the latest Homepage release.
    *   **10 New Service Widgets Implemented:**
        1. **Wallos** - Finance tracking application (URL + API key)
        2. **Trilium** - Advanced note-taking (URL + ETAPI token)
        3. **Backrest** - Backup solution with optional authentication
        4. **Checkmk** - Comprehensive monitoring (URL + site + username + password)
        5. **Filebrowser** - File management with conditional validation (URL + username + password + optional authHeader)
        6. **Jellystat** - Jellyfin statistics with number validation (URL + API key + optional days parameter)
        7. **Yourspotify** - Spotify statistics with interval dropdown (URL + API key + optional interval: day/week/month/year/all)
        8. **Komodo** - Container management with boolean flags (URL + key + showSummary + showStacks)
        9. **Pangolin** - Network monitoring with checkbox array (URL + key + org + up to 4 of 6 fields)
        10. **Unraid** - Server management with 4 optional pool fields (URL + key + pool1-4)
    *   **Total Service Widgets:** Now supporting 148 service widgets (100% coverage for Homepage v1.8.0)
*   **React 19 Compatibility Fixes:**
    *   **Flickering Resolution:** Fixed re-render loops in `EnvVarAutocompleteInput.jsx` affecting ALL 148 widgets
    *   **Technical Improvements:**
        - Implemented `useRef(false)` to track fetch state without triggering re-renders
        - Removed unstable dependencies from `fetchOptions` callback
        - Memoized entire `endAdornment` JSX with `useMemo` for stable rendering
        - Memoized visibility toggle handlers with `useCallback`
    *   **Impact:** All password and API key fields across all widgets now render stably without flickering
*   **Bug Fixes:**
    *   **.env Path Resolution:** Fixed backend path resolution in `server.js` (line 2065)
        - Local development: Now correctly reads from `./local_data/.env`
        - Production Docker: Correctly reads from `/compose_root/.env` (mounted volume)
        - Resolved issue where environment variables weren't showing on `/env-vars` page
    *   **Corrected Patterns:** Updated with accurate React 19 patterns:
        - Two-parameter onChange signature: `onChange(dataForParent, errors)`
        - Individual state pattern instead of single state object
        - Two useEffect pattern for initialization and validation
        - Memoized handler patterns with `useCallback`
    *   **Architectures Supported:** linux/amd64 and linux/arm64
    *   **Docker Hub Secret Management:** Updated `pushtoregistry-Dockerhub.sh` to use Infisical for secure credential management

## Version 0.8

This version focuses on significant security enhancements and critical vulnerability fixes, making the editor more robust and secure.

*   **Security Enhancements Implemented:**
    *   **Account Lockout (SR2):** Accounts are now automatically locked for 1 hour after 9 unsuccessful login attempts to prevent brute-force attacks. Users receive feedback on remaining attempts.
    *   **Enhanced User Profile Management (SR3):** Users can now update their email address (with password verification) in addition to changing their password through the "Profile Settings" page.
    *   **Advanced JWT Token Management (SR1):** Implemented a more secure authentication system using short-lived (1-hour) access tokens and long-lived (7-day) refresh tokens (HttpOnly, Secure cookies) with automatic refresh capabilities.
*   **Critical Vulnerability Fixes (CVEs):**
    *   Addressed CVE-2025-47935 by updating the `multer` package.
    *   Addressed CVE-2024-21538 by updating the global `npm` version within the Docker image.
*   **Bug Fixes:**
    *   **Image Management Authentication:** Fixed authentication issue on Image Management page by migrating from `localStorage.getItem('authToken')` to the centralized `getAccessToken()` utility function, ensuring consistent token retrieval across the application.
    *   **External CDN Image Loading:** Fixed Content Security Policy (CSP) headers that were blocking external CDN images from homarr-labs/dashboard-icons and other sources. Updated `imgSrc` directive to allow all HTTPS images and added `https://cdn.jsdelivr.net` to `connectSrc` directive to allow metadata fetching. This resolved the issue where service and bookmark icons were displaying as `error.svg` in production.

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