# Confluence MCP Server

A Model Context Protocol (MCP) server that provides Confluence search functionality for LexisNexis internal systems:
1. **Confluence Search** - Search and retrieve content from LexisNexis Confluence

## Overview

This MCP server is built using the [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) and provides seamless integration with LexisNexis Confluence through standardized MCP protocols. It enables AI assistants and other MCP clients to search Confluence documentation.

## Features

### 🔍 Confluence Search Tool
- Search across LexisNexis Confluence spaces, pages, blog posts, and attachments
- Retrieve detailed content from search results
- Support for CQL (Confluence Query Language) queries
- Configurable search result limits
- Bearer token authentication

## Prerequisites

- Node.js 18+ 
- npm or pnpm package manager
- TypeScript 5.3+
- Access to LexisNexis internal networks (for Confluence services)

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd confluence_mcp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Build the project:**
   ```bash
   npm run build
   ```

## Configuration

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Confluence Configuration
CONFLUENCE_BEARER_TOKEN=your_confluence_bearer_token_here
LIMIT=5  # Optional: Number of search results to return (default: 2)
```

### Bearer Token Setup

To use the Confluence search functionality, you'll need a valid bearer token:

1. Log into LexisNexis Confluence
2. Generate an API token 
3. Set the `CONFLUENCE_BEARER_TOKEN` environment variable

## Usage

### Starting the Server

```bash
npm start
```

The server runs on stdio transport and will output:
```
Confluence MCP Server running on stdio
```

### Tool Usage

#### Confluence Search

**Tool Name:** `confluence-search`

**Description:** Search Confluence using a search string. Input must start with 'confluence' (case-insensitive) followed by the search string.

**Input Format:**
```
confluence <your search terms>
```

**Examples:**
```
confluence API documentation
confluence deployment guide
confluence troubleshooting
```

**Response:** Returns the full content of matching Confluence pages, including HTML markup.

## Technical Architecture

### MCP Protocol Implementation

This server implements the Model Context Protocol (MCP) specification:

- **Transport Layer:** Uses stdio transport for communication
- **Message Format:** JSON-RPC 2.0 protocol
- **Tool Registration:** Dynamic tool registration with schema validation
- **Error Handling:** Structured error responses with proper HTTP status codes

### Request/Response Flow

1. **Client Request:** MCP client sends tool invocation request
2. **Validation:** Input parameters validated using Zod schemas
3. **Processing:** Tool-specific logic executed (API calls, authentication)
4. **Response:** Structured response returned with content array

### Rate Limiting & Performance

- **Confluence API:** Built-in 1-second delay between content detail requests
- **Concurrent Requests:** Handles multiple tool invocations safely
- **Memory Management:** Streaming responses for large content retrieval

## API Endpoints

### Confluence API
- **Base URL:** `https://confluence.lexisnexis.dev`
- **Search Endpoint:** `/rest/api/search`
- **Content Endpoint:** `/rest/api/content/{id}`

## Project Structure

```
confluence_mcp/
├── src/
│   └── confluence.ts          # Main MCP server implementation
├── build/                     # Compiled JavaScript output
│   └── confluence.js         # Confluence search functionality
├── package.json              # Project dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── jest.config.js            # Jest testing configuration
└── manifest.xml              # Office add-in manifest (legacy)
```

## Development

### Building

```bash
npm run build
```

This compiles TypeScript files from `src/` to `build/` directory.

### Testing

```bash
npm test
```

Note: Tests are currently not implemented (returns "Error: no test specified").

### Code Structure

The server uses the MCP SDK to:

1. **Create an MCP Server instance** for Confluence search functionality
2. **Register tools** using `server.tool()` method
3. **Handle stdio transport** for communication
4. **Implement async tool handlers** with proper error handling

### Key Dependencies

- `@modelcontextprotocol/sdk` - Core MCP functionality
- `node-fetch` - HTTP requests to APIs
- `zod` - Runtime type validation and schema validation

### Advanced Configuration

#### Confluence Search Customization

You can customize the search behavior by modifying the CQL query in `src/confluence.ts`:

```typescript
const cqlQuery = `siteSearch ~ "${searchString}" AND type in ("space","user","page","blogpost")`;
```

#### Environment-Specific Settings

Different environments may require different configurations:

```env
# Development
CONFLUENCE_BEARER_TOKEN=dev_token_here
LIMIT=2

# Production  
CONFLUENCE_BEARER_TOKEN=prod_token_here
LIMIT=10
```

### Error Handling

The server implements comprehensive error handling:

- **Network Errors:** Automatic retry logic for transient failures
- **Authentication Errors:** Clear error messages for invalid credentials
- **Rate Limiting:** Graceful handling of API rate limits
- **Input Validation:** Schema-based validation with detailed error messages

## Security Considerations

⚠️ **Important Security Notes:**

1. **Credentials:** Never commit bearer tokens or passwords to version control
2. **Environment Variables:** Use `.env` files or secure environment variable management
3. **Network Access:** This server requires access to internal LexisNexis networks
4. **Token Handling:** Session tokens should be handled securely and not logged

## Troubleshooting

### Common Issues

1. **"Invalid input" errors:**
   - Ensure Confluence queries start with "confluence"

2. **Authentication failures:**
   - Check bearer token validity for Confluence
   - Ensure network connectivity to LexisNexis services

3. **No search results:**
   - Try broader search terms
   - Check if you have access to the Confluence spaces
   - Verify the LIMIT environment variable is set appropriately

4. **Rate limiting errors:**
   - The server implements 1-second delays between requests
   - For high-volume usage, consider implementing exponential backoff
   - Monitor API rate limits in your environment

5. **Memory issues with large responses:**
   - Reduce the LIMIT environment variable
   - Filter search results more specifically
   - Consider implementing response streaming for very large content

### Debug Logging

The server outputs debug information to stderr:
- Search queries and bearer tokens
- API response statuses
- Error messages and stack traces

Enable verbose logging by setting:
```bash
export DEBUG=confluence-mcp:*
```

### Performance Monitoring

Monitor key metrics:
- Response times for Confluence searches
- Memory usage during large content retrieval
- Error rates for search operations

## Integration Examples

### Using with MCP Clients

#### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "confluence-mcp": {
      "command": "node",
      "args": ["c:/dev/confluence_mcp/build/confluence.js"],
      "env": {
        "CONFLUENCE_BEARER_TOKEN": "your_token_here",
        "LIMIT": "5"
      }
    }
  }
}
```

#### Custom MCP Client

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['./build/confluence.js']
});

const client = new Client({
  name: "confluence-client",
  version: "1.0.0"
}, {
  capabilities: {}
});

await client.connect(transport);
```

## License

ISC License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests (when test framework is implemented)
5. Submit a pull request

## Changelog

### Version 1.0.0
- Initial release with Confluence search tool
- MCP SDK integration
- TypeScript implementation
- Basic error handling and logging

---

For more information about the Model Context Protocol, visit: https://modelcontextprotocol.io/
