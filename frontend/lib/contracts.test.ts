import {describe,it,expect} from 'vitest';
import {claimSchema,analysisSchema} from './contracts';
describe('API trust boundary',()=>{
 it('rejects unsupported verification status',()=>{expect(claimSchema.safeParse({id:'x',claim:'bad',verificationStatus:'TRUST_ME'}).success).toBe(false)});
 it('rejects a truncated analysis instead of rendering misleading metrics',()=>{expect(analysisSchema.safeParse({noticeType:'vacate',metrics:{supported:9}}).success).toBe(false)});
});
