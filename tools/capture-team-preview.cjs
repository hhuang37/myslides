/* Capture local review images without exporting or publishing the deck. */
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:900},deviceScaleFactor:1});
  await page.goto(process.env.DECK_URL||'http://127.0.0.1:8798/index.html');
  await page.evaluate(()=>document.fonts.ready);
  await page.addStyleTag({content:'.slide.active{animation:none!important}.controls{display:none!important}'});
  const dir=path.join(root,'qa','team-insights');fs.mkdirSync(dir,{recursive:true});
  const layout=[];const count=await page.locator('#deck > .slide').count();
  for(const lang of ['zh','en']){
   await page.evaluate(lang=>DeckI18n.setLanguage(lang),lang);
   for(let number=1;number<=count;number++){
    await page.evaluate(number=>{location.hash='#slide='+number},number);
    await page.waitForTimeout(100);
    const slide=page.locator('#deck > .slide.active');
    const measurements=await slide.evaluate(slide=>{
     const body=slide.querySelector('.kit-body'),footer=slide.querySelector('.slide-footer');
     const result={bodyToFooter:Math.round(footer.getBoundingClientRect().top-body.getBoundingClientRect().bottom),issues:[]};
     for(const parent of slide.querySelectorAll('.allowance-ratio,.allowance-token,.task-card,.task-example,.continuity-chain article,.continuity-panel,.continuity-takeaway')){
      const bounds=parent.getBoundingClientRect();
      for(const child of parent.children){
       const box=child.getBoundingClientRect();
       if(box.right>bounds.right+1||box.bottom>bounds.bottom+1)result.issues.push({container:parent.className,text:child.textContent,overflowX:box.right-bounds.right,overflowY:box.bottom-bounds.bottom});
      }
     }
     return result;
    });
    layout.push({language:lang,slide:number,...measurements});
    await slide.screenshot({path:path.join(dir,`slide-${number}-${lang}.png`)});
   }
  }
  fs.writeFileSync(path.join(dir,'layout.json'),JSON.stringify(layout,null,2)+'\n');
  console.log(JSON.stringify(layout));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
