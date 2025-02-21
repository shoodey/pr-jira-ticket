import { getInput } from "@actions/core";
import { context } from "@actions/github";

const run = () => {
    const githubToken = getInput("GITHUB_TOKEN", { required: true });
    const jiraProjectKey = getInput("JIRA_PROJECT_KEY", { required: true });
    const jiraTicketPlaceholder = getInput("JIRA_TICKET_PLACEHOLDER");

    const payload = context.payload;

    console.debug({
        githubToken,
        jiraProjectKey,
        jiraTicketPlaceholder,
        payload,
    });
};

run();
