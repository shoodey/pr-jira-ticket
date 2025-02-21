import { setFailed } from "@actions/core";
import { parsePullRequest, parseInputs, extractTicket, insertTicket, setBody } from "~/utils";

const run = async () => {
    try {
        const { number: pullNumber, title, body } = parsePullRequest();
        const { token, projectKey, placeholder } = parseInputs();

        const ticket = extractTicket(title, projectKey);
        const amendedBody = insertTicket(body, ticket, placeholder);

        await setBody(token, pullNumber, amendedBody, ticket);
    } catch (error) {
        setFailed(`❌ ${error instanceof Error ? error.message : String(error)}`);
    }
};

void run();
