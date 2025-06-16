import React from 'react';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';

const HelpPage = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Homepage Editor Help
        </Typography>
        <Typography variant="body1" paragraph>
          Welcome to the Homepage Editor help section. Here you will find information on how to configure your Homepage instance.
        </Typography>

        {/* Section for Official Configuration */}
        <Box sx={{ my: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Official Configuration Information
          </Typography>
          <Typography variant="body1" paragraph>
            For detailed and official documentation on configuring Homepage, please refer to the official guide: <a href="https://gethomepage.dev/configs/" target="_blank" rel="noopener noreferrer">https://gethomepage.dev/configs/</a>.
          </Typography>
        </Box>

        {/* Section for Services */}
        <Box sx={{ my: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Understanding Services, Service Widgets, and Grouping
          </Typography>
          <Typography variant="body1" paragraph>
            Your Homepage is organized using a file called <code>services.yaml</code>. This is where you define all the applications and links you want to see on your dashboard.
          </Typography>
          <Typography variant="subtitle1" component="h3" gutterBottom>
            What are Groups?
          </Typography>
          <Typography variant="body1" paragraph>
            Think of groups as categories. You can create groups like "Media", "Downloads", or "Work Tools". This helps keep your services organized. You can even have groups inside other groups (nested groups) for more detailed organization!
          </Typography>
          <Typography variant="subtitle1" component="h3" gutterBottom>
            What are Services?
          </Typography>
          <Typography variant="body1" paragraph>
            Services are the individual items within your groups. Each service is essentially a link to an application or website. For example, under your "Media" group, you might have services like "Plex", "Netflix", or "Spotify".
          </Typography>
          <Typography variant="body1" paragraph>
            For each service, you define its name, the web address (<code>href</code>), an optional icon, and a description.
          </Typography>
          <Typography variant="subtitle1" component="h3" gutterBottom>
            What are Service Widgets?
          </Typography>
          <Typography variant="body1" paragraph>
            Service widgets are special add-ons that can display live information from your services directly on your Homepage. For example, a Sonarr widget can show you how many TV shows are downloading, or a Pi-hole widget can display your network ad-blocking stats.
          </Typography>
          <Typography variant="body1" paragraph>
            You can add one or even multiple widgets to a single service. Each widget has its own specific settings, like the URL of the service it connects to and any necessary API keys. You can also choose which specific pieces of information (fields) from a widget you want to see.
          </Typography>
          <Typography variant="body1" paragraph>
            Other cool things you can do with services include:
          </Typography>
          <ul>
            <li><strong>Descriptions:</strong> Add a short note about what each service is for.</li>
            <li>
              <strong>Icons:</strong> Services may have an icon attached to them.
              <ul>
                <li>You can use icons from <a href="https://github.com/walkxcode/dashboard-icons/tree/main/png" target="_blank" rel="noopener noreferrer">Dashboard Icons</a> automatically by passing the name of the icon, with or without <code>.png</code>, <code>.webp</code>, or <code>.svg</code> to specify the desired version.</li>
                <li>You can also specify prefixed icons from:
                  <ul>
                    <li>Material Design Icons with <code>mdi-XX</code></li>
                    <li><a href="https://simpleicons.org/" target="_blank" rel="noopener noreferrer">Simple Icons</a> with <code>si-XX</code></li>
                    <li><a href="https://selfh.st/icons/" target="_blank" rel="noopener noreferrer">selfh.st/icons</a> with <code>sh-XX</code> to use the png version or <code>sh-XX.svg/png/webp</code> for a specific version.</li>
                  </ul>
                </li>
              </ul>
            </li>
            <li><strong>Ping/Site Monitor:</strong> Check if your services are online and how fast they respond.</li>
            <li><strong>Docker Integration:</strong> If your services run in Docker containers, Homepage can show you their status and stats like CPU and memory usage.</li>
          </ul>
        </Box>

        {/* Section for Bookmarks */}
        <Box sx={{ my: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Managing Your Bookmarks
          </Typography>
          <Typography variant="body1" paragraph>
            Bookmarks are simple links, similar to services but much more basic. They are configured in a file called <code>bookmarks.yaml</code>.
          </Typography>
          <Typography variant="body1" paragraph>
            Like services, bookmarks are organized into groups. For each bookmark, you can set:
          </Typography>
          <ul>
            <li><strong>Abbreviation (<code>abbr</code>):</strong> A short (usually 2-letter) code for the bookmark.</li>
            <li><strong>Icon:</strong> You can use an icon instead of an abbreviation. If you provide both, the icon will be shown.</li>
            <li><strong>Link (<code>href</code>):</strong> The web address the bookmark points to.</li>
            <li><strong>Description:</strong> A custom description. If you don't provide one, Homepage will use the website's name.</li>
          </ul>
          <Typography variant="body1" paragraph>
            Bookmarks are great for quick access to frequently visited websites that don't need complex widgets.
          </Typography>
        </Box>

        {/* Section for Information Widgets */}
        <Box sx={{ my: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Using Information Widgets
          </Typography>
          <Typography variant="body1" paragraph>
            Information widgets display general information at the top of your Homepage, like the current date and time, a greeting message, or a search bar. These are configured in the <code>widgets.yaml</code> file.
          </Typography>
          <Typography variant="body1" paragraph>
            Each info widget has its own set of options. For example, you can customize the search provider for the search widget or the format for the date and time widget.
          </Typography>
          <Typography variant="body1" paragraph>
            The order in which you list them in <code>widgets.yaml</code> determines their display order on the page, though some (like weather, search, and time) tend to stick to the right side. You can also add links to some info widgets, like making your logo clickable.
          </Typography>
        </Box>

        {/* Section for Settings Page */}
        <Box sx={{ my: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Customizing Homepage via the Settings File
          </Typography>
          <Typography variant="body1" paragraph>
            The <code>settings.yaml</code> file is where you control the overall look and behavior of your Homepage. Any changes here require you to refresh the page (usually by clicking a refresh icon in the editor or on the Homepage itself) to see them.
          </Typography>
          <Typography variant="body1" paragraph>
            Here are some key things you can configure:
          </Typography>
          <ul>
            <li><strong>Title & Description:</strong> Change the browser tab title and meta description for your page.</li>
            <li><strong>Background:</strong> Set a custom background image (from a URL or a local file) and adjust its blur, saturation, brightness, and opacity. You can also blur the service/bookmark cards.</li>
            <li><strong>Favicon:</strong> Use your own icon for the browser tab.</li>
            <li><strong>Theme & Color Palette:</strong> Choose a light or dark theme and a specific color scheme (e.g., 'slate', 'blue', 'green').</li>
            <li><strong>Layout:</strong>
              <ul>
                <li>Arrange service and bookmark groups in columns or rows.</li>
                <li>Set the number of columns for row-based layouts.</li>
                <li>Create an "icons-only" look for bookmarks.</li>
                <li>Define the order of your groups (mixing service and bookmark groups).</li>
                <li>Apply settings to nested groups.</li>
                <li>Hide group headers.</li>
                <li>Add icons to group categories.</li>
                <li>Use tabs to organize groups into different views.</li>
                <li>Make the Homepage use the full width of your screen.</li>
                <li>Control how many columns groups can span on large screens.</li>
                <li>Disable the ability to collapse groups or set them to be collapsed by default.</li>
                <li>Make all service cards in a row the same height.</li>
              </ul>
            </li>
            <li><strong>Header Style:</strong> Choose from different styles for your group headers (e.g., underlined, boxed).</li>
            <li><strong>Language:</strong> Set the display language for Homepage.</li>
            <li><strong>Link Target:</strong> Decide if links open in the same tab (<code>_self</code>) or a new tab (<code>_blank</code>).</li>
            <li><strong>Providers:</strong> Store API keys and other credentials for services like OpenWeatherMap in one place.</li>
            <li><strong>Quick Launch:</strong> Enable a feature to quickly search your services or the web just by typing on the page.</li>
            <li><strong>Version Display:</strong> Hide the Homepage version number or disable update checks.</li>
            <li><strong>Docker Stats:</strong> Show Docker container stats (CPU, memory) expanded by default.</li>
            <li><strong>Status Style:</strong> Change how the online/offline status of services is displayed (e.g., a simple dot or "UP"/"DOWN" text).</li>
            <li><strong>Hide Errors:</strong> Prevent API error messages from widgets from being shown on the page.</li>
          </ul>
          <Typography variant="body1" paragraph>
            This file gives you a lot of power to make your Homepage look and work exactly how you want it!
          </Typography>
        </Box>

        {/* Section for Raw File Viewing and Versioning */}
        <Box sx={{ my: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Raw File Editor & Version History
          </Typography>
          <Typography variant="body1" paragraph>
            The Homepage Editor provides a "Raw Editor" section. This powerful tool allows you to directly view and edit the content of your Homepage configuration files (like <code>services.yaml</code>, <code>bookmarks.yaml</code>, <code>widgets.yaml</code>, and <code>settings.yaml</code>) in their raw text format.
          </Typography>
          <Typography variant="body1" paragraph>
            This is useful for:
          </Typography>
          <ul>
            <li>Making advanced changes that might not be available through the graphical interface.</li>
            <li>Copying and pasting configurations.</li>
            <li>Troubleshooting issues by seeing the exact file content.</li>
          </ul>
          <Typography variant="subtitle1" component="h3" gutterBottom>
            Tracking Changes and Reverting
          </Typography>
          <Typography variant="body1" paragraph>
            A key feature of the editor is its ability to keep track of changes you make to these configuration files. Every time you save a file through the editor (either via the graphical interface or the Raw Editor), a backup of the previous version is created.
          </Typography>
          <Typography variant="body1" paragraph>
            In the Raw Editor section for each file, you will find a history of these changes. This allows you to:
          </Typography>
          <ul>
            <li>See when a file was last modified.</li>
            <li>View previous versions of the file.</li>
            <li>Compare different versions to see what changed.</li>
            <li>Revert the file back to an older version if you made a mistake or want to undo changes.</li>
          </ul>
          <Typography variant="body1" paragraph>
            This version history provides a safety net, making it easier to experiment with your configuration without fear of losing your work or breaking things permanently.
          </Typography>
        </Box>

        {/* Section for .env values */}
        <Box sx={{ my: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Managing Environment Variables for Your Homepage
          </Typography>
          <Typography variant="body1" paragraph>
            Homepage allows you to use environment variables in your configuration files (<code>services.yaml</code>, <code>widgets.yaml</code>, etc.) to keep sensitive information like API keys or passwords out of your main config files. This is a good security practice.
          </Typography>
          <Typography variant="subtitle1" component="h3" gutterBottom>
            How Homepage Uses Environment Variables
          </Typography>
          <Typography variant="body1" paragraph>
            When Homepage loads your configuration, it looks for placeholders like <code>{'{{HOMEPAGE_VAR_YOUR_KEY_NAME}}'}</code>. It then replaces these placeholders with the actual values of environment variables that are available to the Homepage Docker container when it starts.
          </Typography>
          <Typography variant="body1" paragraph>
            For this to work, the environment variables you define in your Docker setup (e.g., in your <code>docker-compose.yml</code> or a separate <code>.env</code> file used by Docker) MUST start with the prefix <code>HOMEPAGE_VAR_</code>. For example, if you want to use an API key, you might define an environment variable in your Docker setup called <code>HOMEPAGE_VAR_MY_API_KEY</code> and set its value. Then, in your <code>services.yaml</code>, you could use <code>{'{{HOMEPAGE_VAR_MY_API_KEY}}'}</code> where the key is needed.
          </Typography>
          <Typography variant="subtitle1" component="h3" gutterBottom>
            How the Homepage Editor Helps
          </Typography>
          <Typography variant="body1" paragraph>
            The "Env Variables" section in this Homepage Editor is designed to help you manage and visualize these <code>HOMEPAGE_VAR_</code> values.
          </Typography>
          <Typography variant="body1" paragraph>
            <strong>Important:</strong> This editor page <em>does not</em> directly set the environment variables for your running Homepage Docker container. You still need to define those in your Docker environment (e.g., your <code>docker-compose.yml</code> file or an associated <code>.env</code> file that Docker uses).
          </Typography>
          <Typography variant="body1" paragraph>
            What this editor page <em>does</em> do is allow you to:
          </Typography>
          <ul>
            <li><strong>List and define the <code>HOMEPAGE_VAR_</code> keys</strong> that your Homepage configuration files will use as placeholders (e.g., <code>HOMEPAGE_VAR_MY_API_KEY</code>).</li>
            <li><strong>Provide temporary or placeholder values</strong> for these keys *within the editor's context*. This can be helpful for seeing how your configuration *would* look with those values filled in, or for easily copying the correct placeholder string (<code>{'{{HOMEPAGE_VAR_XXX}}'}</code>) into your YAML files.</li>
            <li><strong>Keep track of which variables your configuration expects.</strong></li>
          </ul>
          <Typography variant="body1" paragraph>
            Think of the "Env Variables" page in the editor as a way to manage the *placeholders* and their intended meanings. The actual secret values must still be supplied to the Homepage Docker container through its own environment variable mechanisms. When the editor saves your YAML files, it saves them with the <code>{'{{HOMEPAGE_VAR_XXX}}'}</code> placeholders. Homepage itself then does the substitution when it runs.
          </Typography>
        </Box>

      </Paper>
    </Container>
  );
};

export default HelpPage;