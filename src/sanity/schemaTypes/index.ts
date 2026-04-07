import { personProfile } from "./documents/person-profile";
import { publicationYearGroup } from "./documents/publication-year-group";
import { timelineEvent } from "./documents/timeline-event";
import { externalLink } from "./objects/external-link";
import { timelineChild } from "./objects/timeline-child";

export const schemaTypes = [
  personProfile,
  timelineEvent,
  publicationYearGroup,
  externalLink,
  timelineChild,
];
