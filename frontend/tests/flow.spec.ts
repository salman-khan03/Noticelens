import {test,expect} from '@playwright/test';
test('sample → evidence → reject claim → checklist → export',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Load sample notice'}).click();
 await expect(page.getByRole('heading',{name:'What happened'})).toBeVisible();
 await expect(page.getByText('66.7%')).toBeVisible();
 await page.getByText('Try to break it',{exact:false}).click();
 await page.getByRole('button',{name:'Run Proof Gate'}).click();
 await expect(page.getByRole('status')).toContainText('UNVERIFIED');
 await page.locator('.timeline input').first().check();
 await expect(page.getByText('1 of 4 complete')).toBeVisible();
 const download=page.waitForEvent('download');
 await page.getByRole('button',{name:'Download evidence packet'}).click();
 expect((await download).suggestedFilename()).toBe('noticelens-evidence-packet.json');
});
test('mobile layout has no horizontal overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 await page.getByRole('button',{name:'Load sample notice'}).click();
 await expect(page.getByRole('heading',{name:'What happened'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
