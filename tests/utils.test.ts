import { getInput } from "@actions/core";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, it } from "vitest";
import { vi } from "vitest";
import {
    extractTicket,
    getAmendedBody,
    inputs,
    logMessages,
    parseInputs,
    parsePullRequest,
    setBody,
} from "../src/utils";
import { context, getOctokit } from "@actions/github";
import dedent from "dedent";

vi.mock("@actions/core", () => ({
    getInput: vi.fn(),
}));

vi.mock("@actions/github", () => ({
    context: {
        payload: {
            pull_request: {
                number: 1,
                title: "Mock pull request title",
                body: undefined,
            },
        },
        repo: {
            owner: "MockOwner",
            repo: "MockRepo",
        },
    },
    getOctokit: vi.fn(),
}));

const mockInputs = {
    [inputs.GITHUB_TOKEN]: "MOCK_GITHUB_TOKEN",
    [inputs.JIRA_PROJECT_KEY]: "MOCK_JIRA_PROJECT_KEY",
    [inputs.JIRA_TICKET_PLACEHOLDER]: "MOCK_JIRA_TICKET_PLACEHOLDER",
};

beforeEach(() => {
    vi.restoreAllMocks();
});

it("Parses action inputs", () => {
    (getInput as Mock).mockReturnValueOnce(mockInputs.GITHUB_TOKEN);
    (getInput as Mock).mockReturnValueOnce(mockInputs.JIRA_PROJECT_KEY);
    (getInput as Mock).mockReturnValueOnce(mockInputs.JIRA_TICKET_PLACEHOLDER);

    const { token, projectKey, placeholder } = parseInputs();

    expect(getInput).toHaveBeenCalledWith(inputs.GITHUB_TOKEN, { required: true });
    expect(getInput).toHaveBeenCalledWith(inputs.JIRA_PROJECT_KEY, { required: true });
    expect(getInput).toHaveBeenCalledWith(inputs.JIRA_TICKET_PLACEHOLDER);

    expect(token).toBe(mockInputs.GITHUB_TOKEN);
    expect(projectKey).toBe(mockInputs.JIRA_PROJECT_KEY);
    expect(placeholder).toBe(mockInputs.JIRA_TICKET_PLACEHOLDER);
});

it("Parses pull request from context", () => {
    const pullRequest = parsePullRequest();

    const expectedPayload = {
        number: 1,
        title: "Mock pull request title",
        body: undefined,
    };

    expect(context.payload.pull_request).toEqual(expectedPayload);

    const { number, ...rest } = expectedPayload;
    expect(pullRequest).toEqual({
        pullNumber: number,
        ...rest,
    });
});

it("Throws an error when pull request is not available", () => {
    vi.spyOn(context, "payload", "get").mockReturnValueOnce({
        pull_request: undefined,
    });
    expect(parsePullRequest).toThrowError("This action can only run on pull request events");
});

describe("Pull Request Title", () => {
    it.each([
        ["PROJ-1234: Mock pull request title"],
        ["PROJ-1234 - Mock pull request title"],
        ["Mock pull request title - PROJ-1234"],
        ["[PROJ-1234] Mock pull request title"],
        ["Mock pull request title (PROJ-1234)"],
        ["(PROJ-1234) Mock pull request title"],
    ])("Extracts JIRA ticket from PR title (%#): %s", (title) => {
        const projectKey = "PROJ";
        const ticket = extractTicket(title, projectKey);
        expect(ticket).toBe("PROJ-1234");
    });

    it("Throws an error when JIRA ticket is not found in PR title", () => {
        const projectKey = "PROJ";
        const title = "Mock pull request title";
        expect(() => extractTicket(title, projectKey)).toThrowError(
            `Could not find JIRA ticket for "${projectKey}" in pull request title: "${title}"`,
        );
    });
});

describe("Pull Request Body", () => {
    it("Amends PR's body with JIRA ticket when placeholder is set explicitly", () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const consoleSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

        const body = dedent`
            JIRA Ticket: {{JIRA_TICKET}}

            ### Description
            This is a test description
        `;
        const amendedBody = getAmendedBody(body, "PROJ-1234", "{{JIRA_TICKET}}");
        expect(amendedBody).toBe(dedent`
            JIRA Ticket: PROJ-1234

            ### Description
            This is a test description
        `);

        expect(consoleSpy).toHaveBeenCalledWith(logMessages.placeholderFound("{{JIRA_TICKET}}", "PROJ-1234"));
    });

    it("Amends PR's body with JIRA ticket when placeholder is set multiple times", () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const consoleSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

        const body = dedent`
            JIRA Ticket: {{JIRA_TICKET}}

            ### Description
            This is a test description for {{JIRA_TICKET}}
        `;
        const amendedBody = getAmendedBody(body, "PROJ-1234", "{{JIRA_TICKET}}");
        expect(amendedBody).toBe(dedent`
            JIRA Ticket: PROJ-1234
            
            ### Description
            This is a test description for PROJ-1234
        `);

        expect(consoleSpy).toHaveBeenCalledWith(logMessages.placeholderFound("{{JIRA_TICKET}}", "PROJ-1234"));
    });

    it("Prepends PR's body with JIRA ticket when placeholder is missing", () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const consoleSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

        const body = dedent`
            ### Description
            This is a test description
        `;
        const amendedBody = getAmendedBody(body, "PROJ-1234", "{{JIRA_TICKET}}");
        expect(amendedBody).toBe(dedent`
            PROJ-1234
            
            ### Description
            This is a test description
        `);

        expect(consoleSpy).toHaveBeenCalledWith(logMessages.placeholderMissing("{{JIRA_TICKET}}", "PROJ-1234"));
    });
});

it("Update the PR body with the amended body", async () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const consoleSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

    const mockOctokitRest = {
        rest: {
            pulls: {
                update: vi.fn(),
            },
        },
    };

    (getOctokit as Mock).mockReturnValueOnce(mockOctokitRest);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await setBody(mockInputs.GITHUB_TOKEN!, 1, "Amended Body", "PROJ-1234");

    expect(getOctokit).toHaveBeenCalledWith(mockInputs.GITHUB_TOKEN);
    expect(mockOctokitRest.rest.pulls.update).toHaveBeenCalledWith({
        owner: context.repo.owner,
        repo: context.repo.repo,
        pull_number: 1,
        body: "Amended Body",
    });

    expect(consoleSpy).toHaveBeenCalledWith(logMessages.pullRequestAmended(1, "PROJ-1234"));
});
