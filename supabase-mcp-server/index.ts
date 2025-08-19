import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "supabase-mcp-server",
  version: "0.0.1",
});

// Tool to test Supabase connection
server.tool(
  "test_supabase_connection",
  "Test the connection to a Supabase instance.",
  {
    supabaseUrl: z.string().url(),
    supabaseKey: z.string(),
  },
  async ({ supabaseUrl, supabaseKey }) => {
    try {
      // Simple test to check if Supabase URL is accessible
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });

      if (response.ok) {
        return {
          content: [
            {
              type: "text",
              text: `✅ Successfully connected to Supabase at ${supabaseUrl}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `❌ Failed to connect to Supabase. Status: ${response.status}`,
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error connecting to Supabase: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
      };
    }
  },
);

// Tool to get table information
server.tool(
  "get_supabase_tables",
  "Get information about tables in a Supabase database.",
  {
    supabaseUrl: z.string().url(),
    supabaseKey: z.string(),
  },
  async ({ supabaseUrl, supabaseKey }) => {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          content: [
            {
              type: "text",
              text: `✅ Available tables in Supabase: ${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `❌ Failed to get tables. Status: ${response.status}`,
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error getting tables: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
      };
    }
  },
);

// Tool to query data from a table
server.tool(
  "query_supabase_table",
  "Query data from a specific table in Supabase.",
  {
    supabaseUrl: z.string().url(),
    supabaseKey: z.string(),
    tableName: z.string(),
    select: z.string().optional(),
    limit: z.number().optional(),
  },
  async ({ supabaseUrl, supabaseKey, tableName, select = "*", limit = 10 }) => {
    try {
      const url = new URL(`${supabaseUrl}/rest/v1/${tableName}`);
      if (select !== "*") {
        url.searchParams.set("select", select);
      }
      url.searchParams.set("limit", limit.toString());

      const response = await fetch(url.toString(), {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          content: [
            {
              type: "text",
              text: `✅ Query results from ${tableName}: ${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `❌ Failed to query table ${tableName}. Status: ${response.status}`,
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Error querying table: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
      };
    }
  },
);

const transport = new StdioServerTransport();

await server.connect(transport);
