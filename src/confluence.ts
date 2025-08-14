import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from "node-fetch";

// Create server instance
const server = new McpServer({
    name: "Confluence Search Tool",
    version: "1.0.0",
    capabilities: {
        resources: {},
        tools: {},
    },
});

// Helper function for making NWS API requests
interface SearchResult {
    content?: {
        id: string;
    };
}

interface SearchResponse {
    results: SearchResult[];
}

interface DetailResponse {
    body?: {
        view?: {
            value?: string;
        };
    };
}

async function confluenceSearch(searchString: string, token: string): Promise<string> {
    const baseSearchUrl = "https://confluence.lexisnexis.dev/rest/api/search";
    const cqlQuery = `siteSearch ~ "${searchString}" AND type in ("space","user","com.atlassian.confluence.plugins.confluence-questions:question","com.atlassian.confluence.extra.team-calendars:calendar-content-type","com.atlassian.confluence.plugins.confluence-questions:answer","attachment","page","com.atlassian.confluence.extra.team-calendars:space-calendars-view-content-type","blogpost")`;
    const LIMIT = process.env.LIMIT || "2";
    const params = new URLSearchParams({
        cql: cqlQuery,
        start: "0",
        limit: LIMIT,
        excerpt: "highlight",
        expand: "space.icon",
        includeArchivedSpaces: "false",
        src: "next.ui.search",
    });
    const searchUrl = `${baseSearchUrl}?${params.toString()}`;

    const headers = {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
    };

    try {
        const searchResponse = await fetch(searchUrl, { headers });
        console.log("Search response data:", searchResponse);
        if (!searchResponse.ok) {
            const errMsg = await searchResponse.text();
            throw new Error(`Search request failed: ${searchResponse.status}, message: ${errMsg}`);
        }
        const searchData = (await searchResponse.json()) as SearchResponse; // Explicitly cast to SearchResponse
        const results = searchData.results || [];
        if (results.length === 0) return "No results found.";

        let combinedContent = "";
        for (const result of results) {
            const contentId = result.content?.id;
            if (!contentId) continue;
            console.log("Search response data:", contentId);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const detailUrl = `https://confluence.lexisnexis.dev/rest/api/content/${contentId}?expand=space,body.view,version,container`;
            const detailResponse = await fetch(detailUrl, { headers });
            if (!detailResponse.ok) {
                const errMsg = await detailResponse.text();
                console.error(`Failed to fetch content ${contentId}: ${detailResponse.status} - ${errMsg}`);
                continue;
            }
            const detailData = (await detailResponse.json()) as DetailResponse; // Explicitly cast to DetailResponse
            const detailValue = detailData.body?.view?.value;
            if (detailValue) {
                combinedContent += detailValue + "\n";
            }
        }
        return combinedContent || "No detailed content available.";
    } catch (error) {
        console.error("Error in confluenceSearch:", error);
        return `Error during confluence search: ${error}`;
    }
}

// Register the new Confluence search tool
server.tool(
    "confluence-search",
    "Search Confluence using a search string. Input must start with 'confluence' (case-insensitive) followed by the search string.",
    {
        state: z.string().refine(
            (input) => input.toLowerCase().startsWith("confluence"),
            { message: "Input must start with 'confluence'" }
        ),
    },
    async ({ state }) => {
        // Remove "confluence" (case-insensitive) from the input
        const searchString = state.replace(/^\s*confluence\s*/i, "").trim();
        const token = process.env.CONFLUENCE_BEARER_TOKEN;
        console.error("Confluence search string:", searchString, "Bearer token:", token);
        if (!searchString || !token) {
            return {
                content: [
                    {
                        type: "text",
                        text: "Invalid input. Please provide both a search string and a bearer token.",
                    },
                ],
            };
        }

        const result = await confluenceSearch(searchString, token);
        return {
            content: [
                {
                    type: "text",
                    text: result,
                },
            ],
        };
    }
);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("WAM MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});