export const portfolioQuery = `{
  "profile": *[_type == "personProfile"][0]{
    name,
    role,
    intro,
    location,
    futureTeaser,
    note,
    socialLinks[]{
      label,
      url
    }
  },
  "events": *[_type == "timelineEvent" && coalesce(visibility, "public") != "private"] | order(dateStart asc, priority asc){
    "id": _id,
    "slug": coalesce(slug.current, _id),
    title,
    tabs,
    dateStart,
    dateEnd,
    displayDate,
    lane,
    summary,
    details,
    tags,
    links[]{
      label,
      url
    },
    "media": media[]{
      "type": "image",
      "url": asset->url,
      "alt": coalesce(alt, "")
    },
    priority,
    status,
    location,
    visibility
  },
  "publicationGroups": *[_type == "publicationYearGroup" && coalesce(visibility, "public") != "private"] | order(dateStart asc, priority asc){
    "id": _id,
    "slug": coalesce(slug.current, _id),
    title,
    tabs,
    dateStart,
    dateEnd,
    displayDate,
    lane,
    summary,
    details,
    tags,
    links[]{
      label,
      url
    },
    priority,
    status,
    visibility,
    "children": publications[]{
      "_key": _key,
      title,
      subtitle,
      detail,
      url
    }
  }
}`;
