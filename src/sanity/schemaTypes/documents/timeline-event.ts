import { defineArrayMember, defineField, defineType } from "sanity";

const tabOptions = [
  { title: "Full Story", value: "full_story" },
  { title: "Education", value: "education" },
  { title: "Experience", value: "experience" },
  { title: "Research", value: "research" },
  { title: "Other Activities", value: "other_activities" },
];

export const timelineEvent = defineType({
  name: "timelineEvent",
  title: "Timeline Event",
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
      of: [defineArrayMember({ type: "string", options: { list: tabOptions } })],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "dateStart",
      title: "Start Date",
      type: "string",
      description: "Use YYYY-MM for the cleanest ordering.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "dateEnd",
      title: "End Date",
      type: "string",
      description: "Optional. Use YYYY-MM or leave blank for single points.",
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
      validation: (rule) => rule.required(),
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
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "priority",
      title: "Priority",
      type: "number",
      initialValue: 1,
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "string",
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
    }),
    defineField({
      name: "links",
      title: "Links",
      type: "array",
      of: [defineArrayMember({ type: "externalLink" })],
    }),
    defineField({
      name: "media",
      title: "Media",
      type: "array",
      of: [
        defineArrayMember({
          type: "image",
          options: {
            hotspot: true,
          },
          fields: [
            defineField({
              name: "alt",
              title: "Alt Text",
              type: "string",
            }),
          ],
        }),
      ],
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
