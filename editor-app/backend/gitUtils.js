const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { CONFIG_DIR } = require('./configUtils'); // Import the CONFIG_DIR constant directly

const configDir = CONFIG_DIR; // Use the imported constant

/**
 * Executes a shell command asynchronously.
 * @param {string} command The command to execute.
 * @param {string} cwd The working directory for the command.
 * @returns {Promise<{stdout: string, stderr: string}>} A promise that resolves with stdout and stderr.
 */
function executeGitCommand(command, cwd) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command "${command}": ${stderr}`);
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

/**
 * Checks if Git is installed and available.
 * Logs the version or an error.
 * @returns {Promise<boolean>} True if Git is available, false otherwise.
 */
async function checkGitAvailability() {
  try {
    const { stdout } = await executeGitCommand('git --version', configDir);
    console.log(`Git found: ${stdout.trim()}`);
    return true;
  } catch (error) {
    console.error('Git command failed. Git might not be installed or accessible in PATH.', error);
    return false;
  }
}

/**
 * Checks if the specified directory is a Git repository.
 * @param {string} dirPath The path to the directory.
 * @returns {Promise<boolean>} True if it's a Git repository, false otherwise.
 */
async function isGitRepository(dirPath) {
  try {
    await fs.access(path.join(dirPath, '.git'));
    console.log(`Directory "${dirPath}" is already a Git repository.`);
    return true;
  } catch (error) {
    console.log(`Directory "${dirPath}" is not a Git repository.`);
    return false;
  }
}

/**
 * Initializes a Git repository in the specified directory.
 * Configures a default user for commits.
 * @param {string} dirPath The path to the directory.
 * @returns {Promise<void>}
 */
async function initializeRepository(dirPath) {
  try {
    console.log(`Initializing Git repository in "${dirPath}"...`);
    await executeGitCommand('git init', dirPath);
    console.log('Git repository initialized.');

    // Configure default user for editor commits
    await executeGitCommand('git config user.name "Homepage Editor"', dirPath);
    await executeGitCommand('git config user.email "editor@local.host"', dirPath); // Use a non-real domain
    console.log('Git user configured for editor commits.');

    // Optional: Add a .gitignore? Or an initial commit?
    // For now, just init and configure.
  } catch (error) {
    console.error(`Failed to initialize Git repository in "${dirPath}":`, error);
    throw error; // Re-throw the error to propagate it
  }
}

/**
 * Commits changes for a specific file.
 * @param {string} relativeFilePath Path relative to the config directory.
 * @param {string} userEmail Email of the user making the change.
 * @param {string} userName Name of the user making the change.
 * @param {string} message Commit message.
 * @returns {Promise<void>}
 */
async function commitFile(relativeFilePath, userEmail, userName, message) {
  const fullPath = path.join(configDir, relativeFilePath);
  const author = `${userName} <${userEmail}>`;
  const commitMessage = message || `Configuration updated via Editor: ${relativeFilePath}`;

  try {
    console.log(`Staging changes for "${relativeFilePath}"...`);
    await executeGitCommand(`git add "${relativeFilePath}"`, configDir); // Use relative path for git add

    console.log(`Committing changes for "${relativeFilePath}" by ${author}...`);
    // Use --author flag to set the correct author for the commit
    await executeGitCommand(`git commit -m "${commitMessage.replace(/"/g, '\\"')}" --author="${author.replace(/"/g, '\\"')}"`, configDir);
    console.log(`Successfully committed changes for "${relativeFilePath}".`);
  } catch (error) {
    // Handle cases where there might be nothing to commit (e.g., file saved without changes)
    if (error.stderr && error.stderr.includes('nothing to commit')) {
      console.log(`No changes detected for "${relativeFilePath}", skipping commit.`);
    } else {
      console.error(`Failed to commit changes for "${relativeFilePath}":`, error);
      // Decide if this should throw or just log
    }
  }
}
 
 /**
  * Retrieves the commit history for a specific file.
  * @param {string} relativeFilePath Path relative to the config directory.
  * @returns {Promise<Array<object>>} A promise that resolves with an array of commit objects
  *                                   (e.g., [{ hash, authorName, authorEmail, timestamp, subject }]).
  * @throws {Error} If git log fails.
  */
 async function getFileHistory(relativeFilePath) {
   // Use a specific format for easy parsing. Using pipes | as delimiters.
   // %H: commit hash, %an: author name, %ae: author email, %at: author date (unix timestamp), %s: subject (commit message)
   const logFormat = "--pretty=format:\"%H|%an|%ae|%at|%s\""; // Changed to double quotes
   // Need to escape the relativeFilePath for the shell command, especially if it contains spaces.
   // Using JSON.stringify adds quotes and escapes internal quotes/backslashes.
   const escapedFilePath = JSON.stringify(relativeFilePath);
   const command = `git log ${logFormat} -- ${escapedFilePath}`;

   try {
     console.log(`Fetching history for "${relativeFilePath}"...`);
     const { stdout } = await executeGitCommand(command, configDir);
 
     if (!stdout.trim()) {
       console.log(`No history found for "${relativeFilePath}".`);
       return []; // Return empty array if no history
     }
 
     // Parse the output
     const history = stdout.trim().split('\n').map(line => {
       // Remove surrounding single quotes if present (git log might add them)
       const cleanLine = line.startsWith("'") && line.endsWith("'") ? line.slice(1, -1) : line;
       const [hash, authorName, authorEmail, timestampStr, subject] = cleanLine.split('|');
       const timestamp = parseInt(timestampStr, 10); // Convert timestamp string to number
       return {
         hash,
         authorName,
         authorEmail,
         timestamp: isNaN(timestamp) ? null : timestamp, // Handle potential parsing errors
         subject
       };
     });
 
     console.log(`Successfully fetched ${history.length} history entries for "${relativeFilePath}".`);
     return history;
 
   } catch (error) {
     console.error(`Failed to get history for "${relativeFilePath}":`, error);
     // Check if the error indicates the file is not known to Git yet
     if (error.stderr && error.stderr.includes('fatal: path') && error.stderr.includes('does not exist in')) {
        console.warn(`File "${relativeFilePath}" not found in Git history.`);
        return []; // Return empty array if file not tracked
     }
     throw new Error(`Failed to get Git history for ${relativeFilePath}.`); // Re-throw other errors
   }
 }
 
 /**
  * Reverts a file to a specific commit hash and creates a new commit recording the revert.
  * @param {string} relativeFilePath Path relative to the config directory.
  * @param {string} commitHash The hash of the commit to revert to.
  * @param {string} userEmail Email of the user performing the revert.
  * @param {string} userName Name of the user performing the revert.
  * @returns {Promise<void>}
  * @throws {Error} If checkout or commit fails.
  */
 async function revertToCommit(relativeFilePath, commitHash, userEmail, userName) {
   const checkoutCommand = `git checkout ${commitHash} -- ${JSON.stringify(relativeFilePath)}`;
   const commitMessage = `Revert ${relativeFilePath} to commit ${commitHash.substring(0, 7)}`;
 
   try {
     console.log(`Reverting "${relativeFilePath}" to commit ${commitHash}...`);
     await executeGitCommand(checkoutCommand, configDir);
     console.log(`Successfully checked out version ${commitHash} for "${relativeFilePath}".`);
 
     // Stage the reverted file and commit the revert action
     await commitFile(relativeFilePath, userEmail, userName, commitMessage);
     console.log(`Successfully committed revert action for "${relativeFilePath}".`);
 
   } catch (error) {
     console.error(`Failed to revert "${relativeFilePath}" to commit ${commitHash}:`, error);
     throw new Error(`Failed to revert ${relativeFilePath} to commit ${commitHash}.`);
   }
 }
 
 module.exports = {
  checkGitAvailability,
  isGitRepository,
  initializeRepository,
  commitFile,
  getFileHistory, // Export new function
  revertToCommit, // Export new function
  configDir // Export configDir for potential use elsewhere if needed
};