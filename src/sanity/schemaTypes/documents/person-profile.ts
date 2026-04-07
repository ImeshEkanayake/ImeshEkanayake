import { defineArrayMember, defineField, defineType } from "sanity";

export const personProfile = defineType({
  name: "personProfile",
  title: "Person Profile",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "role",
      title: "Role",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "intro",
      title: "Intro",
      type: "text",
      rows: 5,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "string",
    }),
    defineField({
      name: "futureTeaser",
      title: "Future Teaser",
      type: "string",
      initialValue: "More to come when time catches up.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "note",
      title: "Editorial Note",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "socialLinks",
      title: "Social Links",
      type: "array",
      of: [defineArrayMember({ type: "externalLink" })],
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "role",
    },
  },
});
