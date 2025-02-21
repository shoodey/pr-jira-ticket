import { setFailed } from "@actions/core";
import { parsePullRequest, parseInputs, parsePullRequestTitle } from "~/utils";

const run = () => {
    try {
        const { number, title, body } = parsePullRequest();
        const { githubToken, jiraProjectKey, jiraTicketPlaceholder } = parseInputs();

        const jiraTicket = parsePullRequestTitle(title, jiraProjectKey);

        console.debug({
            number,
            title,
            body,
            githubToken,
            jiraProjectKey,
            jiraTicketPlaceholder,
            jiraTicket,
        });
    } catch (error) {
        setFailed(error instanceof Error ? error.message : String(error));
    }
};

run();
