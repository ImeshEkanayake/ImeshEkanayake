import { defineCliConfig } from "sanity/cli";
import { dataset, projectId } from "./src/lib/sanity/env";

export default defineCliConfig({
  api: {
    projectId: projectId || "demo-project",
    dataset,
  },
});
