/* STAR VISUALS — Premium asset action gate
   Keeps the existing Asset Library renderer and payment modules intact.
   Premium assets show Purchase until the signed-in user has a paid order/access.
   After purchase they show Download. Free assets keep Download.
*/
(function(){
  const db=()=>window.db;
  let wired=false;
  let paidIds=null;
  let paidPromise=null;

  const session=async()=>{
    if(typeof window.getCurrentSession==='function')return window.getCurrentSession();
    if(!db())return null;
    return (await db().auth.getSession()).data?.session||null;
  };
  const money=v=>`₹${Number(v||0).toLocaleString('en-IN',{maximumFractionDigits:2})}`;

  async function loadPaidIds(){
    if(paidIds)return paidIds;
    if(paidPromise)return paidPromise;
    paidPromise=(async()=>{
      paidIds=new Set();
      if(!db())return paidIds;
      const s=await session();
      if(!s?.user)return paidIds;
      const {data:orders}=await db().from('asset_orders').select('asset_id').eq('user_id',s.user.id).eq('status','paid');
      (orders||[]).forEach(row=>{if(row.asset_id)paidIds.add(String(row.asset_id));});
      const {data:access}=await db().from('user_asset_access').select('asset_id').eq('user_id',s.user.id).in('status',['available','purchased','downloaded']);
      (access||[]).forEach(row=>{if(row.asset_id)paidIds.add(String(row.asset_id));});
      return paidIds;
    })().finally(()=>{paidPromise=null;});
    return paidPromise;
  }

  function assetIdFromCard(card){
    return card?.querySelector('[data-asset-download]')?.dataset.assetDownload||card?.querySelector('[data-asset-open]')?.dataset.assetOpen||null;
  }
  function assetFromId(id){
    return (window.STAR_VISUALS_ASSET_CATALOG||[]).find(a=>String(a.id)===String(id))||null;
  }
  function actionHost(card){return card?.querySelector('.asset-card-v2-foot > div')||card?.querySelector('.asset-card-v2-foot')||null;}

  async function updateCard(card){
    if(!card?.classList.contains('premium'))return;
    const id=assetIdFromCard(card);
    if(!id)return;
    const asset=assetFromId(id);
    if(!asset)return;
    const paid=(await loadPaidIds()).has(String(id));
    const host=actionHost(card);if(!host)return;
    const existing=host.querySelector('[data-purchase-asset],[data-download-asset],[data-asset-download]');
    const shouldDownload=paid;
    if(shouldDownload&&existing?.matches('[data-download-asset]'))return;
    if(!shouldDownload&&existing?.matches('[data-purchase-asset]'))return;
    host.querySelectorAll('[data-purchase-asset],[data-download-asset],[data-asset-download]').forEach(el=>el.remove());
    const button=document.createElement('button');
    button.type='button';button.className='outline-btn';
    if(shouldDownload){button.dataset.downloadAsset=String(id);button.textContent='Download';button.setAttribute('aria-label',`Download ${asset.name}`);}
    else{button.dataset.purchaseAsset=String(id);button.textContent=`Purchase ${money(asset.price)}`;button.setAttribute('aria-label',`Purchase ${asset.name} for ${money(asset.price)}`);}
    host.appendChild(button);
  }

  async function updateCards(root=document){
    const cards=[...root.querySelectorAll('.asset-card-v2.premium')];
    if(root.matches?.('.asset-card-v2.premium'))cards.unshift(root);
    await Promise.all(cards.map(updateCard));
  }

  function updateDetail(){
    const modal=document.getElementById('assetDetailModal');
    if(!modal?.classList.contains('open'))return;
    const button=modal.querySelector('[data-asset-download],[data-purchase-asset],[data-download-asset]');
    if(!button)return;
    const id=button.dataset.assetDownload||button.dataset.purchaseAsset||button.closest('[data-asset-open]')?.dataset.assetOpen;
    const asset=assetFromId(id);if(!asset||asset.access_type!=='premium')return;
    loadPaidIds().then(ids=>{
      if(!button.isConnected)return;
      const wantsDownload=ids.has(String(id));
      if(wantsDownload&&button.matches('[data-download-asset]'))return;
      if(!wantsDownload&&button.matches('[data-purchase-asset]'))return;
      const replacement=button.cloneNode(false);
      replacement.className=button.className;
      replacement.textContent=wantsDownload?'Download':`Purchase ${money(asset.price)}`;
      if(wantsDownload)replacement.dataset.downloadAsset=String(id);
      else replacement.dataset.purchaseAsset=String(id);
      button.replaceWith(replacement);
    });
  }

  function schedule(){
    if(wired)return;
    wired=true;
    const observer=new MutationObserver(mutations=>{
      let relevant=false;
      for(const m of mutations){
        if(m.type==='childList'&&m.addedNodes.length){relevant=true;break;}
      }
      if(relevant){updateCards();updateDetail();}
    });
    observer.observe(document.body,{childList:true,subtree:true});
    updateCards();
    updateDetail();
    window.addEventListener('focus',()=>{paidIds=null;paidPromise=null;updateCards();updateDetail();});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
  window.starVisualsPremiumActionGate={refresh:async()=>{paidIds=null;paidPromise=null;await updateCards();updateDetail();}};
})();
