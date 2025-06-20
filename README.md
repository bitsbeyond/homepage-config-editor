# Homepage Config Editor

[![Homepage](https://img.shields.io/badge/Homepage_config_editor-through_UI-blue)](https://github.com/platteel/homepage-editor/)
<!-- Add other badges here later: e.g., License, Build Status, Docker Pulls -->

The Homepage Config Editor is a user-friendly, web-based graphical interface designed to simplify the management of configuration files for your [Homepage](https://gethomepage.dev/) dashboard. If you love Homepage but prefer a GUI for managing its extensive YAML configurations, this tool is for you! It aims to reduce manual editing errors and make Homepage customization more accessible to a wider range of users.

This editor runs as a separate Docker container alongside your Homepage instance, interacting with the configuration files through a shared volume.

## Vibe code project

This project was autonomously built in VSCode with 'Roo code', leveraging Google Gemini Pro 2.5. Testing and validation was fully done by humans.

## Features

*   **Intuitive Configuration Management:**
    *   Manage Services, Bookmarks, and global Info Widgets through structured forms and lists.
    *   Easily edit common Homepage settings via a dedicated UI.
*   **Comprehensive Service Widget Support:**
    *   Configure all available Homepage Service Widgets.
    *   Utilize `.env` variable autocomplete (`{{HOMEPAGE_VAR_...}}`, `{{HOMEPAGE_FILE_...}}`) for sensitive data within widget configurations.
    *   Benefit from built-in mandatory field validation for service widgets.
*   **Raw File Editor:**
    *   Directly edit raw YAML, CSS, and JS configuration files with syntax highlighting (powered by Monaco Editor).
    *   Basic YAML syntax validation on save.
*   **Version Control & History:**
    *   Automatically track changes to your configuration files using Git.
    *   View commit history for each file.
    *   Rollback configurations to previous versions.
*   **User Authentication:**
    *   Secure login with Admin and User roles.
    *   Initial admin account setup on first run.
    *   (Admin) Manage user accounts.
*   **Modern User Experience:**
    *   Clean, responsive interface.
    *   Light and Dark theme support.
    *   In-app Help Page to guide you through Homepage's configuration structure.
*   **Dockerized Deployment:**
    *   Easy to deploy as a Docker container alongside your existing Homepage setup.

---
## Screenshots

Here are some screenshots showcasing the features of the Homepage Config Editor:

**Light Mode Interface:**
![Light Mode Interface](https://github.com/bitsbeyond/homepage-config-editor/blob/main/img/lightmode.png?raw=true)

**Dark Mode Interface:**
![Dark Mode Interface](https://github.com/bitsbeyond/homepage-config-editor/blob/main/img/darkmode.png?raw=true)

**Services Management:**
![Services Management](https://github.com/bitsbeyond/homepage-config-editor/blob/main/img/services.png?raw=true)

**Editing a Service:**
![Editing a Service](https://github.com/bitsbeyond/homepage-config-editor/blob/main/img/services_edit.png?raw=true)

**Service Widget List:**
![Service Widget List](https://github.com/bitsbeyond/homepage-config-editor/blob/main/img/services_widgetlist.png?raw=true)

**Bookmarks Management:**
![Bookmarks Management](https://github.com/bitsbeyond/homepage-config-editor/blob/main/img/bookmarks.png?raw=true)

**Info Widgets Management:**
![Info Widgets Management](https://github.com/bitsbeyond/homepage-config-editor/blob/main/img/info_widgets.png?raw=true)

**Group Reordering:**
![Group Reordering](https://github.com/bitsbeyond/homepage-config-editor/blob/main/img/groupreorder.png?raw=true)

**General Settings:**
![General Settings](https://github.com/bitsbeyond/homepage-config-editor/blob/main/img/settings_general.png?raw=true)

**Group Layout Settings:**
![Group Layout Settings](https://github.com/bitsbeyond/homepage-config-editor/blob/main/img/settings_grouplayout.png?raw=true)

**Raw File Editor:**
![Raw File Editor](https://github.com/bitsbeyond/homepage-config-editor/blob/main/img/raweditor.png?raw=true)

**Environment Variables View:**
![Environment Variables View](https://github.com/bitsbeyond/homepage-config-editor/blob/main/img/env_variables.png?raw=true)

**Custom Images Management:**
![Custom Images Management](https://github.com/bitsbeyond/homepage-config-editor/blob/main/img/customimages.png?raw=true)

**User Profile:**
![User Profile](https://github.com/bitsbeyond/homepage-config-editor/blob/main/img/userprofile.png?raw=true)

---

## Getting Started

To get started with the Homepage Config Editor, you'll need Docker and Docker Compose installed on your system. You should also have an existing [Homepage](https://gethomepage.dev/) instance running or be prepared to set one up.

### Prerequisites

*   [Docker](https://docs.docker.com/get-docker/)
*   [Docker Compose](https://docs.docker.com/compose/install/)
*   An existing Homepage configuration directory that Homepage uses.

### Docker Compose Setup

Here's an example `docker-compose.yml` snippet to run the Homepage Config Editor alongside your Homepage instance. You'll need to adjust paths to your specific setup.

```yaml
version: '3.8'

services:
  homepage:
    image: ghcr.io/gethomepage/homepage:latest
    container_name: homepage
    environment:
      - PUID=1000 # Change to your user's PUID
      - PGID=1000 # Change to your user's PGID
      - TZ=Etc/UTC # Your timezone
    ports:
      - "3000:3000" # Or your preferred host port for Homepage
    volumes:
      - /path/to/your/homepage/config:/app/config # Mount your Homepage config directory
      - /path/to/your/homepage/images:/images # Mount your Homepage images directory
      # - /var/run/docker.sock:/var/run/docker.sock:ro # Optional: if using Docker integrations
    restart: unless-stopped

  homepage-editor:
    # Replace with the actual published image name once available:
    # image: ghcr.io/aicodebitsbeyond/homepage-editor:latest
    # For local builds (if you cloned the repository):
    image: ghcr.io/aicodebitsbeyond/homepage-editor:latest
    container_name: homepage-editor
    ports:
      - "3001:3000" # Host port 3001 mapped to container port 3000
    volumes:
      # IMPORTANT: Mount the *same* configuration and image directory used by your Homepage container
      - /path/to/your/homepage/config:/config
      - /path/to/your/homepage/images:/images 
      # Persistent data for the editor (user database, editor settings)
      - /path/to/your/editor_data:/data
      # Optional: Mount your .env file if Homepage uses it for {{HOMEPAGE_VAR_...}}
      # Ensure this .env file is in the root of your Docker Compose project or adjust path.
      - ./.env:/compose_root/.env:ro
    environment:
      # IMPORTANT: Set a strong, unique secret for JWT authentication!
      - JWT_SECRET=your_very_strong_and_unique_secret_key
      # Optional: Specify user and group IDs if needed, otherwise defaults should work.
      # - PUID=1000
      # - PGID=1000
    # user: "1000:1000" # If your image runs as non-root and needs specific UIDs
    restart: unless-stopped
    # depends_on:
    #   - homepage # Optional: if you want Homepage to start first

# Optional: Define named volumes if you prefer them over bind mounts
# volumes:
#   homepage_config:
#   editor_data:
```

**Key Configuration Points:**

*   **`/path/to/your/homepage/config`**: Replace this with the actual path on your host machine where your `services.yaml`, `bookmarks.yaml`, etc., for Homepage are stored. This volume **must be shared** between the `homepage` service and the `homepage-editor` service, pointing to the same host directory.
*   **`/path/to/your/editor_data`**: Replace this with a path on your host where the editor can store its own persistent data (like the user database).
*   **`./.env`**: If your Homepage setup relies on a `.env` file for `HOMEPAGE_VAR_` substitutions, make sure its path is correctly mounted. The example assumes it's in the same directory as your `docker-compose.yml`.
*   **`JWT_SECRET`**: **CRITICAL!** You **must** set a strong, unique `JWT_SECRET` environment variable for the `homepage-editor` service.
*   **Ports**: Adjust host ports (e.g., `3001`) if they conflict with other services on your system.

### Initial Setup

1.  Save the `docker-compose.yml` file.
2.  Open a terminal in the directory where you saved the file.
3.  Run `docker-compose up -d` (or `docker compose up -d` for newer Docker versions).
4.  Once the containers are running, access the Homepage Config Editor in your browser, typically at `http://localhost:3001` (or whichever host port you configured).
5.  On your first visit, if no admin user exists, you should be prompted to create one. Follow the on-screen instructions.

---
*(Further sections like Usage, Configuration, Development, etc., will follow)*

## Usage

Once the Homepage Config Editor is running and you've logged in, you'll be presented with a dashboard. The main navigation allows you to manage different aspects of your Homepage configuration:

*   **Services:** View, add, edit, and delete services. Configure service-specific widgets directly within the service forms. Reorder services within their groups and reorder entire groups.
*   **Bookmarks:** Manage your bookmark groups and individual bookmarks.
*   **Info Widgets:** Add, edit, delete, and reorder global information widgets (e.g., date/time, search bars).
*   **Settings:** Configure common Homepage settings such as title, theme, color palette, and basic layout options.
*   **Raw Editor:** For advanced users, directly edit the content of your `services.yaml`, `bookmarks.yaml`, `widgets.yaml`, `settings.yaml`, `custom.css`, and `custom.js` files. This section also provides access to file version history and rollback capabilities.
*   **Env Variables:** View a list of `HOMEPAGE_VAR_*` and `HOMEPAGE_FILE_*` variables found in your mounted `.env` file, useful for reference when configuring widgets.
*   **Item Order:** (If applicable, or covered by individual sections) Dedicated pages to reorder service groups and bookmark groups.
*   **User Management (Admins only):** Admins can add, remove, and manage roles for editor users.
*   **Profile/My Account:** All users can change their own password.
*   **Help:** Access the in-app Help Page for detailed explanations of Homepage's configuration files and how the editor helps you manage them.

The editor aims to be intuitive. Most actions involve filling out forms and saving. Changes are typically committed to the Git-based version history automatically.

## Configuration (Homepage Config Editor)

The Homepage Config Editor container can be configured using environment variables in your `docker-compose.yml` file:

*   `JWT_SECRET`: **(Required)** A strong, unique secret key used for signing authentication tokens. **You must set this to a secure random string.**
    *   Example: `JWT_SECRET=your_very_strong_and_unique_secret_key_please_change_me`
*   `PUID` / `PGID`: (Optional) If you need the editor process to run as a specific user/group ID to match file permissions on your mounted volumes, you can set these. Often, ensuring the Docker host directory permissions are appropriate is sufficient.
*   `TZ`: (Optional) Set the timezone for the container, e.g., `TZ=America/New_York`. This affects logging timestamps within the editor container.

The editor stores its own persistent data (user database, internal settings) in the volume mounted to `/data` inside the container.

---
*(Further sections like Development, Contributing, License, etc., will follow)*

## Development

Interested in contributing to the Homepage Config Editor? Here's how to get started with a local development environment:

### Prerequisites

*   [Node.js](https://nodejs.org/) (v20+ recommended, check `engines` in `package.json` for specific version if set)
*   `npm` (usually comes with Node.js) or `yarn`
*   [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) (for running a test Homepage instance and simulating the production environment)
*   Git

### Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/bitsbeyond/homepage-config-editor.git # Replace with actual repo URL
    cd homepage-editor
    ```

2.  **Install Frontend Dependencies:**
    ```bash
    cd editor-app/frontend
    npm install
    # or yarn install
    cd ../..
    ```

3.  **Install Backend Dependencies:**
    ```bash
    cd editor-app/backend
    npm install
    # or yarn install
    cd ../..
    ```

### Running Locally

You'll typically run the frontend and backend servers separately.

1.  **Run the Backend Server:**
    Open a terminal in the project root and run:
    ```bash
    # This command sets up a local data directory for the backend
    # (SQLite DB, etc.) outside of Docker for development.
    $env:EDITOR_DATA_DIR="./editor-app/backend/local_data"; node editor-app/backend/server.js
    ```
    (For PowerShell. For bash/zsh, use: `EDITOR_DATA_DIR=./editor-app/backend/local_data node editor-app/backend/server.js`)
    The backend will usually run on `http://localhost:3000`. Check the server logs for the exact port.
    Consider using `nodemon` for automatic restarts on changes: `nodemon editor-app/backend/server.js` (with the `EDITOR_DATA_DIR` prefix).

2.  **Run the Frontend Development Server:**
    Open another terminal, navigate to the frontend directory, and run:
    ```bash
    cd editor-app/frontend
    npm run dev
    ```
    The frontend development server (Vite) will typically run on `http://localhost:5173` (or another port if 5173 is busy). Check the terminal output. It will proxy API requests to the backend server (usually configured in `vite.config.js`).

3.  **Access the Application:**
    Open your browser and navigate to the frontend URL (e.g., `http://localhost:5173`).

### Project Structure

*   `editor-app/`: Contains the core application code.
    *   `frontend/`: React SPA (Vite).
    *   `backend/`: Node.js API server (Fastify).
        *   `schemas/`: JSON schema definitions for configuration files.
        *   `local_data/`: (Created during local dev) Contains local SQLite DB and example config files for development when `EDITOR_DATA_DIR` points here. **This directory should typically be in `.gitignore` for the `editor-app/backend` scope if not already.**
*   `docs/`: Project documentation, PRD, etc.
*   `Dockerfile` (inside `editor-app/`): Defines the production Docker image.
*   `docker-compose.yml`: Example for running the editor with Homepage.

## Contributing

Contributions are welcome! Whether it's bug reports, feature requests, documentation improvements, or code contributions, please feel free to:

1.  **Open an Issue:** For bugs, feature ideas, or discussions, please open an issue on the [GitHub Issues page](hthttps://github.com/bitsbeyond/homepage-config-editor/issues). (Replace with actual link)
2.  **Fork & Pull Request:** For code contributions:
    *   Fork the repository.
    *   Create a new branch for your feature or bug fix.
    *   Make your changes.
    *   Ensure your code adheres to any existing linting or formatting standards (if configured).
    *   Write tests for new functionality if applicable.
    *   Submit a Pull Request with a clear description of your changes.

Please try to keep PRs focused on a single issue or feature.

## License

This project is licensed under the terms of the **[GNU General Public License v3.0]**. Please see the [`LICENSE`](LICENSE:1) file in the root of the repository for full details.
*(Note: The `list_files` output showed a `LICENSE` file. Its type should be specified here, e.g., MIT License, Apache 2.0 License.)*
