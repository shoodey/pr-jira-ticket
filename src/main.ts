import { setFailed } from "@actions/core";
import { parsePullRequest, parseInputs, extractTicket, getAmendedBody, setBody } from "~/utils";

const run = async () => {
    try {
        const { pullNumber, title, body } = parsePullRequest();
        const { token, projectKey, placeholder } = parseInputs();

        const ticket = extractTicket(title, projectKey);
        const amendedBody = getAmendedBody(body, ticket, placeholder);

        await setBody(token, pullNumber, amendedBody, ticket);
    } catch (error) {
        setFailed(`❌ ${error instanceof Error ? error.message : String(error)}`);
    }
};

void run();
