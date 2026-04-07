import { defineArrayMember, defineField, defineType } from "sanity";

export const publicationYearGroup = defineType({
  name: "publicationYearGroup",
  title: "Publication Year Group",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "tabs",
      title: "Tabs",
      type: "array",
      initialValue: ["full_story", "research"],
      of: [
        defineArrayMember({
          type: "string",
          options: {
            list: [
              { title: "Full Story", value: "full_story" },
              { title: "Research", value: "research" },
            ],
          },
        }),
      ],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "dateStart",
      title: "Date Start",
      type: "string",
      description: "Use YYYY-01 to keep research groups chronological.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "dateEnd",
      title: "Date End",
      type: "string",
    }),
    defineField({
      name: "displayDate",
      title: "Display Date",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "lane",
      title: "Lane",
      type: "string",
      options: {
        list: [
          { title: "Top", value: "top" },
          { title: "Bottom", value: "bottom" },
        ],
        layout: "radio",
      },
      initialValue: "top",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "summary",
      title: "Summary",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "details",
      title: "Details",
      type: "text",
      rows: 6,
    }),
    defineField({
      name: "publications",
      title: "Publications",
      type: "array",
      of: [defineArrayMember({ type: "timelineChild" })],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "links",
      title: "Links",
      type: "array",
      of: [defineArrayMember({ type: "externalLink" })],
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
    }),
    defineField({
      name: "priority",
      title: "Priority",
      type: "number",
      initialValue: 1,
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      initialValue: "past",
      options: {
        list: [
          { title: "Past", value: "past" },
          { title: "Current", value: "current" },
          { title: "Future", value: "future" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "visibility",
      title: "Visibility",
      type: "string",
      initialValue: "public",
      options: {
        list: [
          { title: "Public", value: "public" },
          { title: "Private", value: "private" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "displayDate",
    },
  },
});
