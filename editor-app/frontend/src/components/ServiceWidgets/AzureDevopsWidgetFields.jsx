import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import EnvVarAutocompleteInput from '../Common/EnvVarAutocompleteInput';

function AzureDevopsWidgetFields({ initialData, onChange: parentOnChange }) {
  // State for each field
  const [organization, setOrganization] = useState(initialData?.organization || '');
  const [project, setProject] = useState(initialData?.project || '');
  const [patKey, setPatKey] = useState(initialData?.key || ''); // 'key' in YAML
  const [definitionId, setDefinitionId] = useState(initialData?.definitionId || '');
  const [branchName, setBranchName] = useState(initialData?.branchName || '');
  const [userEmail, setUserEmail] = useState(initialData?.userEmail || '');
  const [repositoryId, setRepositoryId] = useState(initialData?.repositoryId || '');

  // Effect to update local state if initialData changes
  useEffect(() => {
    if (initialData) {
      setOrganization(initialData.organization || '');
      setProject(initialData.project || '');
      setPatKey(initialData.key || '');
      setDefinitionId(initialData.definitionId || '');
      setBranchName(initialData.branchName || '');
      setUserEmail(initialData.userEmail || '');
      setRepositoryId(initialData.repositoryId || '');
    } else {
      setOrganization('');
      setProject('');
      setPatKey('');
      setDefinitionId('');
      setBranchName('');
      setUserEmail('');
      setRepositoryId('');
    }
  }, [initialData]);

  // Effect to call parent onChange with validation status
  useEffect(() => {
    const currentWidgetData = {
      type: 'azuredevops',
      organization: organization || undefined,
      project: project || undefined,
      key: patKey || undefined,
      definitionId: definitionId || undefined,
      branchName: branchName || undefined,
      userEmail: userEmail || undefined,
      repositoryId: repositoryId || undefined,
    };

    const errors = {};
    if (!organization?.trim()) {
      errors.organization = 'Organization is required.';
    }
    if (!project?.trim()) {
      errors.project = 'Project is required.';
    }
    if (!patKey?.trim()) {
      errors.key = 'Personal Access Token (PAT) is required.';
    }
    // Optional fields (definitionId, branchName, userEmail, repositoryId) do not need explicit error checks here
    // unless they become conditionally required based on other selections (not the case here).

    const dataForParent = { type: 'azuredevops' };
    Object.keys(currentWidgetData).forEach(k => {
      if (k !== 'type' && currentWidgetData[k] !== undefined) {
        dataForParent[k] = currentWidgetData[k];
      }
    });
     if (Object.keys(dataForParent).length === 1 && dataForParent.type === 'azuredevops') {
        // All fields are empty or undefined
     }

    parentOnChange(dataForParent, errors);
  }, [organization, project, patKey, definitionId, branchName, userEmail, repositoryId, parentOnChange]);

  // Specific handlers for each input type
  const handleTextFieldChange = (setter) => (event) => {
    setter(event.target.value);
  };

  const handleAutocompleteChange = (setter) => (event) => {
    setter(event.target.value);
  };

  return (
    <Grid container spacing={2} sx={{ paddingTop: 2 }}>
      <Grid item xs={12} sm={6}>
        <TextField
          required
          fullWidth
          name="organization"
          label="Organization"
          value={organization}
          onChange={handleTextFieldChange(setOrganization)}
          helperText="Your Azure DevOps organization name."
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          required
          fullWidth
          name="project"
          label="Project"
          value={project}
          onChange={handleTextFieldChange(setProject)}
          helperText="The project name within the organization."
        />
      </Grid>
      <Grid item xs={12}>
        <EnvVarAutocompleteInput
          required
          fullWidth
          name="key"
          label="Personal Access Token (PAT)"
          type="password" // Enables visibility toggle
          value={patKey}
          onChange={handleAutocompleteChange(setPatKey)}
          helperText="Generate a PAT with appropriate permissions. Can use {{HOMEPAGE_VAR_...}}"
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Pipeline Fields (Optional)
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          name="definitionId"
          label="Pipeline Definition ID"
          value={definitionId}
          onChange={handleTextFieldChange(setDefinitionId)}
          helperText="Required if displaying pipeline status."
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          name="branchName"
          label="Branch Name"
          value={branchName}
          onChange={handleTextFieldChange(setBranchName)}
          helperText="Filter pipeline status by branch (leave empty for all)."
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Pull Request Fields (Optional)
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          name="userEmail"
          label="User Email"
          type="email"
          value={userEmail}
          onChange={handleTextFieldChange(setUserEmail)}
          helperText="Required if displaying pull request counts."
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          name="repositoryId"
          label="Repository ID"
          value={repositoryId}
          onChange={handleTextFieldChange(setRepositoryId)}
          helperText="Required if displaying pull request counts."
        />
      </Grid>
    </Grid>
  );
}

AzureDevopsWidgetFields.propTypes = {
  initialData: PropTypes.shape({
    type: PropTypes.string,
    organization: PropTypes.string,
    project: PropTypes.string,
    key: PropTypes.string,
    definitionId: PropTypes.string,
    branchName: PropTypes.string,
    userEmail: PropTypes.string,
    repositoryId: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
};

AzureDevopsWidgetFields.defaultProps = {
  initialData: null,
};

export default AzureDevopsWidgetFields;