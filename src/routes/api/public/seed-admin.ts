import { createFileRoute } from "@tanstack/react-router";
import { seedAdmin } from "@/lib/admin.functions";

// Simple wrapper so we can invoke the seed via HTTP from tooling.
export const Route = createFileRoute("/api/seed-admin")({
  server: {
    handlers: {
      POST: async () => {
        const result = await seedAdmin();
        return Response.json(result);
      },
    },
  },
});
