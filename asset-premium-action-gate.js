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
      const result=new Set();
      paidIds=result;
      if(!db())return result;
      const s=await session();
      if(!s?.user)return result;

      try{
        const {data:orders,error}=await db().from('asset_orders').select('asset_id').eq('user_id',s.user.id).eq('status','paid');
        if(error)console.warn('Premium asset order lookup failed:',error);
        (orders||[]).forEach(row=>{if(row.asset_id)result.add(String(row.asset_id));});
      }catch(error){console.warn('Premium asset order lookup failed:',error);}

      try{
        const {data:access,error}=await db().from('user_asset_access').select('asset_id').eq('user_id',s.user.id).in('status',['available','purchased','downloaded']);
        if(error)console.warn('Premium asset access lookup failed:',error);
        (access||[]).forEach(row=>{if(row.asset_id)result.add(String(row.asset_id));});
      }catch(error){console.warn('Premium asset access lookup failed:',error);}

      return result;
    })().finally(()=>{paidPromise=null;});
    return paidPromise;
  }

  function assetIdFromCard(card){
    return card?.dataset?.assetOpen
      ||card?.querySelector('[data-asset-download]')?.dataset.assetDownload
      ||card?.querySelector('[data-purchase-asset]')?.dataset.purchaseAsset
      ||null;
  }

  function assetFromId(id){
    const catalog=Array.isArray(window.STAR_VISUALS_ASSET_CATALOG)?window.STAR_VISUALS_ASSET_CATALOG:[];
    return catalog.map(asset=>typeof window.normalizeAsset==='function'?window.normalizeAsset(asset):asset).find(a=>String(a.id)===String(id))||null;
  }

  function actionHost(card){
    return card?.querySelector('.asset-card-v2-foot > div')||card?.querySelector('.asset-card-v2-foot')||null;
  }

  function isPremiumCard(card){
    if(!card)return false;
    if(card.classList.contains('premium'))return true;
    return Boolean(card.querySelector('.asset-card-v2-badges .asset-badge.premium'));
  }

  async function updateCard(card){
    if(!isPremiumCard(card))return;
    const id=assetIdFromCard(card);
    if(!id)return;
    const asset=assetFromId(id);
    if(!asset||String(asset.access_type).toLowerCase()!=='premium')return;

    const paid=(await loadPaidIds()).has(String(id));
    const host=actionHost(card);
    if(!host)return;

    const existing=host.querySelector('[data-purchase-asset],[data-download-asset],[data-asset-download]');
    const wanted=paid?'download':'purchase';
    if(wanted==='download'&&existing?.matches('[data-download-asset]'))return;
    if(wanted==='purchase'&&existing?.matches('[data-purchase-asset]'))return;

    host.querySelectorAll('[data-purchase-asset],[data-download-asset],[data-asset-download]').forEach(el=>el.remove());

    const button=document.createElement('button');
    button.type='button';
    button.className='outline-btn';

    if(paid){
      button.dataset.downloadAsset=String(id);
      button.textContent='Download';
      button.setAttribute('aria-label',`Download ${asset.name}`);
    }else{
      button.dataset.purchaseAsset=String(id);
      button.textContent=`Buy ${money(asset.price)}`;
      button.setAttribute('aria-label',`Buy ${asset.name} for ${money(asset.price)}`);
    }
    host.appendChild(button);
  }

  async function updateCards(root=document){
    const cards=[...root.querySelectorAll('.asset-card-v2')].filter(isPremiumCard);
    if(root.matches?.('.asset-card-v2')&&isPremiumCard(root))cards.unshift(root);
    await Promise.all(cards.map(updateCard));
  }

  function updateDetail(){
    const modal=document.getElementById('assetDetailModal');
    if(!modal?.classList.contains('open'))return;
    const button=modal.querySelector('[data-asset-download],[data-purchase-asset],[data-download-asset]');
    if(!button)return;
    const id=button.dataset.assetDownload||button.dataset.purchaseAsset||button.dataset.downloadAsset;
    const asset=assetFromId(id);
    if(!asset||String(asset.access_type).toLowerCase()!=='premium')return;

    loadPaidIds().then(ids=>{
      if(!button.isConnected)return;
      const paid=ids.has(String(id));
      if(paid&&button.matches('[data-download-asset]'))return;
      if(!paid&&button.matches('[data-purchase-asset]'))return;
      const replacement=button.cloneNode(false);
      replacement.className=button.className;
      replacement.textContent=paid?'Download':`Buy ${money(asset.price)}`;
      if(paid)replacement.dataset.downloadAsset=String(id);
      else replacement.dataset.purchaseAsset=String(id);
      button.replaceWith(replacement);
    });
  }

  function refresh(){
    paidIds=null;
    paidPromise=null;
    updateCards();
    updateDetail();
  }

  function schedule(){
    if(wired)return;
    wired=true;
    const observer=new MutationObserver(mutations=>{
      let relevant=false;
      for(const mutation of mutations){
        if(mutation.type==='childList'&&mutation.addedNodes.length){relevant=true;break;}
      }
      if(relevant){updateCards();updateDetail();}
    });
    observer.observe(document.body,{childList:true,subtree:true});
    updateCards();
    updateDetail();
    window.addEventListener('focus',refresh);
    window.addEventListener('star-visuals-asset-catalog-updated',refresh);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});
  else schedule();

  window.starVisualsPremiumActionGate={refresh};
})();
