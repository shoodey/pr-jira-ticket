import { getInput } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import type { WebhookPayload } from "@actions/github/lib/interfaces";

// TODO: Maybe use either @octokit/types or @octokit/webhooks-types to get the missing properties
type PullRequest = (WebhookPayload["pull_request"] & { title: string }) | undefined;

export const parseInputs = () => {
    const token = getInput("GITHUB_TOKEN", { required: true });
    const projectKey = getInput("JIRA_PROJECT_KEY", { required: true });
    const placeholder = getInput("JIRA_TICKET_PLACEHOLDER");

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

    return pullRequest;
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
        console.debug(`✅ Placeholder "${placeholder}" found in description, replacing with "${ticket}"`);
        return body.replace(placeholder, ticket);
    }

    console.debug(`⚠️ Placeholder "${placeholder}" not found in description, prepending "${ticket}" to description`);
    return `${ticket}\n\n${body}`;
};

export const setBody = async (token: string, pullNumber: number, body: string, ticket: string) => {
    const octokit = getOctokit(token);

    // TODO: Sanity check, remove this
    console.debug({ body });

    await octokit.rest.pulls.update({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: pullNumber,
        body,
    });

    console.debug(`✅ Successfully updated pull request #${pullNumber}'s description with JIRA ticket ${ticket}`);
};
