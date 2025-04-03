import { z } from 'zod';

export const PodcastSegmentSchema = z.object({
    title: z.string(),
    content: z.string()
});

export type PodcastSegment = z.infer<typeof PodcastSegmentSchema>;

export const PodcastOutlineSchema = z.object({
    title: z.string(),
    overview: z.string(),
    introduction: z.string(),
    segments: z.array(PodcastSegmentSchema),
    conclusion: z.string(),
    callToAction: z.string(),
    outro: z.string()
});

export type PodcastOutline = z.infer<typeof PodcastOutlineSchema>;

export function getPodcastOutlineSchema() {
    return {
        type: "object",
        additionalProperties: false,
        properties: Object.fromEntries(
            Object.entries(PodcastOutlineSchema.shape).map(([key, value]) => {
                if (key === 'segments') {
                    return [key, {
                        type: "array",
                        items: {
                            type: "object",
                            additionalProperties: false,
                            properties: Object.fromEntries(
                                Object.entries(PodcastSegmentSchema.shape).map(([k, v]) => [k, { type: "string" }])
                            ),
                            required: Object.keys(PodcastSegmentSchema.shape)
                        }
                    }];
                }
                return [key, { type: "string" }];
            })
        ),
        required: Object.keys(PodcastOutlineSchema.shape)
    };
}

export function isPodcastOutline(data: any): data is PodcastOutline {
    return PodcastOutlineSchema.safeParse(data).success;
} 