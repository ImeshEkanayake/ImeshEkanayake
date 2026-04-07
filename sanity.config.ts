import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./src/sanity/schemaTypes";
import { dataset, projectId, studioBasePath, studioTitle } from "./src/lib/sanity/env";

export default defineConfig({
  name: "default",
  title: studioTitle,
  projectId: projectId || "demo-project",
  dataset,
  basePath: studioBasePath,
  plugins: [structureTool()],
  schema: {
    types: schemaTypes,
  },
});
