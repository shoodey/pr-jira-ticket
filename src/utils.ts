import { getInput } from "@actions/core";
import { context } from "@actions/github";
import type { WebhookPayload } from "@actions/github/lib/interfaces";

// TODO: Use either @octokit/types or @octokit/webhooks-types to get the correct types
type PullRequest = (WebhookPayload["pull_request"] & { title: string }) | undefined;

export const parseInputs = () => {
    const githubToken = getInput("GITHUB_TOKEN", { required: true });
    const jiraProjectKey = getInput("JIRA_PROJECT_KEY", { required: true });
    const jiraTicketPlaceholder = getInput("JIRA_TICKET_PLACEHOLDER");

    return {
        githubToken,
        jiraProjectKey,
        jiraTicketPlaceholder,
    };
};

export const parsePullRequest = () => {
    const pullRequest = context.payload.pull_request as PullRequest;

    if (!pullRequest) {
        throw new Error("This action can only be run on pull_request events");
    }

    return pullRequest;
};
