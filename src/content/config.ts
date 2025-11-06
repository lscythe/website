import { defineCollection, z } from "astro:content";

const baseScema = z.object({
  title: z.string(),
  description: z.string(),
  tag: z.array(z.string()).optional(),
  heroImage: z.string().optional(),
});

const blog = defineCollection({
  type: "content",
  schema: baseScema.extend({
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().optional().default(false),
  }),
});

const projects = defineCollection({
  type: "content",
  schema: baseScema.extend({
    liveUrl: z.string().url().optional(),
  }),
});

export const collections = { blog, projects };
