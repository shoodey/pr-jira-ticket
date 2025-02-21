import { getInput } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import type { WebhookPayload } from "@actions/github/lib/interfaces";

// TODO: Maybe use either @octokit/types or @octokit/webhooks-types to get the missing properties
type PullRequest = (WebhookPayload["pull_request"] & { title: string }) | undefined;

export const logMessages = {
    placeholderFound: (placeholder: string, ticket: string) =>
        `✅ Placeholder "${placeholder}" found in description, replacing with "${ticket}"`,
    placeholderMissing: (placeholder: string, ticket: string) =>
        `⚠️ Placeholder "${placeholder}" not found in description, prepending "${ticket}" to description`,
    pullRequestAmended: (pullNumber: number, ticket: string) =>
        `✅ Successfully updated pull request #${pullNumber}'s description with JIRA ticket ${ticket}`,
};

export const inputs = {
    GITHUB_TOKEN: "GITHUB_TOKEN",
    JIRA_PROJECT_KEY: "JIRA_PROJECT_KEY",
    JIRA_TICKET_PLACEHOLDER: "JIRA_TICKET_PLACEHOLDER",
};

export const parseInputs = () => {
    const token = getInput(inputs.GITHUB_TOKEN, { required: true });
    const projectKey = getInput(inputs.JIRA_PROJECT_KEY, { required: true });
    const placeholder = getInput(inputs.JIRA_TICKET_PLACEHOLDER);

    return {
        token,
        projectKey,
        placeholder,
    };
};

export const parsePullRequest = () => {
    const pullRequest = context.payload.pull_request as PullRequest;

    if (!pullRequest) {
        throw new Error("This action can only run on pull request events");
    }

    return {
        pullNumber: pullRequest.number,
        title: pullRequest.title,
        body: pullRequest.body,
    };
};

export const extractTicket = (title: string, projectKey: string) => {
    const regex = new RegExp(`\\b${projectKey}-\\d+\\b`, "i");
    const match = title.match(regex);

    if (!match) {
        throw new Error(`Could not find JIRA ticket for "${projectKey}" in pull request title: "${title}"`);
    }

    return match[0];
};

export const getAmendedBody = (body: string | undefined, ticket: string, placeholder: string) => {
    if (body?.includes(placeholder)) {
        console.debug(logMessages.placeholderFound(placeholder, ticket));
        return body.replaceAll(placeholder, ticket);
    }

    console.debug(logMessages.placeholderMissing(placeholder, ticket));
    return `${ticket}\n\n${body}`;
};

export const setBody = async (token: string, pullNumber: number, body: string, ticket: string) => {
    const octokit = getOctokit(token);

    await octokit.rest.pulls.update({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: pullNumber,
        body,
    });

    console.debug(logMessages.pullRequestAmended(pullNumber, ticket));
};
