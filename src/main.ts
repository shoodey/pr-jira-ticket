import { setFailed } from "@actions/core";
import { parsePullRequest, parseInputs } from "~/utils";

const run = () => {
    try {
        const { number, title, body } = parsePullRequest();
        const { githubToken, jiraProjectKey, jiraTicketPlaceholder } = parseInputs();

        console.debug({
            number,
            title,
            body,
            githubToken,
            jiraProjectKey,
            jiraTicketPlaceholder,
        });
    } catch (error) {
        setFailed(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
};

run();
