import { z } from 'zod';
export const sourceSchema=z.object({id:z.string(),title:z.string(),url:z.string().url(),jurisdiction:z.string(),passage:z.string(),retrievedAt:z.string(),sha256:z.string()});
export const claimSchema=z.object({id:z.string(),claim:z.string(),jurisdiction:z.string().nullable(),category:z.string(),ruleId:z.string().nullable(),sourceId:z.string().nullable(),sourceUrl:z.string().nullable(),supportingPassage:z.string().nullable(),verificationStatus:z.enum(['VERIFIED','PARTIALLY_SUPPORTED','UNVERIFIED','CONTRADICTED','HUMAN_REVIEW_REQUIRED']),reason:z.string(),source:sourceSchema.nullable(),confidence:z.number().nullable()});
export const analysisSchema=z.object({id:z.string(),noticeType:z.string(),jurisdiction:z.string().nullable(),synthetic:z.boolean(),provider:z.string(),extractionMethod:z.string(),facts:z.array(z.object({label:z.string(),value:z.string(),passage:z.string()})),summary:z.string(),claims:z.array(claimSchema),metrics:z.object({claimsChecked:z.number(),supported:z.number(),blocked:z.number(),citationCoverage:z.number(),verifiedClaimRate:z.number(),sourcesUsed:z.number(),humanReviewRequired:z.boolean()}),actions:z.array(z.string()),draft:z.string(),warnings:z.array(z.string()),text:z.string(),elapsedMs:z.number(),analyzedAt:z.string()});
export const evaluationSchema=z.object({available:z.boolean(),runAt:z.string().optional(),passed:z.number().optional(),total:z.number().optional(),unsupportedRejectionRate:z.number().optional(),citationCoverage:z.number().optional(),retrievalSuccessRate:z.number().optional(),elapsedMs:z.number().optional(),scope:z.string().optional(),cases:z.array(z.object({scenario:z.string(),expected:z.string(),actual:z.string(),passed:z.boolean()})).optional()});
export type Analysis=z.infer<typeof analysisSchema>;
export type Claim=z.infer<typeof claimSchema>;
export type Evaluation=z.infer<typeof evaluationSchema>;
export async function request(path:string,init?:RequestInit):Promise<unknown> {
 const response=await fetch(`/api${path}`,{...init,signal:AbortSignal.timeout(120000)});
 const data=await response.json().catch(()=>null);
 if(!response.ok) throw new Error(typeof data?.detail==='string'?data.detail:`Request failed (${response.status}). Check your input and try again.`);
 return data;
}
