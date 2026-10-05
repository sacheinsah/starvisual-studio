/* STAR VISUALS — Free asset download guard
   Free assets must never be blocked by premium purchase/order checks.
   Premium assets are left to the existing purchase/download flow.
*/
(function(){
  const db=()=>window.db;

  function getId(button){
    return button?.dataset?.assetDownload
      ||button?.dataset?.downloadAsset
      ||button?.dataset?.assetId
      ||button?.closest('.asset-card-v2,[data-asset-id]')?.dataset?.assetId
      ||null;
  }

  function catalogAsset(id){
    const catalog=Array.isArray(window.STAR_VISUALS_ASSET_CATALOG)?window.STAR_VISUALS_ASSET_CATALOG:[];
    return catalog.map(asset=>typeof window.normalizeAsset==='function'?window.normalizeAsset(asset):asset)
      .find(asset=>String(asset.id)===String(id))||null;
  }

  async function session(){
    if(typeof window.getCurrentSession==='function') return window.getCurrentSession();
    if(!db()) return null;
    return (await db().auth.getSession()).data?.session||null;
  }

  async function downloadFree(button,knownAsset=null){
    if(!db()) return;
    const assetId=getId(button);
    if(!assetId) return;

    let asset=knownAsset;
    if(!asset){
      const result=await db().from('asset_library')
        .select('id,name,access_type,published,file_url,external_download_url')
        .eq('id',assetId)
        .maybeSingle();
      asset=result.data;
      if(result.error||!asset) return;
    }

    if(String(asset.access_type||'').toLowerCase()!=='free') return;

    const current=await session();
    if(!current?.user){
      location.href=`login.html?returnTo=${encodeURIComponent('assets.html')}`;
      return;
    }

    const {data,error}=await db().rpc('record_asset_download',{p_asset_id:asset.id});
    if(error){
      console.error('Free asset download failed:',error);
      if(typeof window.toast==='function') window.toast(error.message||'This free asset could not be downloaded.');
      else alert(error.message||'This free asset could not be downloaded.');
      return;
    }

    const target=data?.file_url||asset.external_download_url||asset.file_url;
    if(!target){
      if(typeof window.toast==='function') window.toast('The asset download is not configured yet.');
      return;
    }

    window.open(target,'_blank','noopener,noreferrer');
  }

  function wire(){
    if(window.__starVisualsFreeDownloadFixWired)return;
    window.__starVisualsFreeDownloadFixWired=true;

    // Use the already-rendered catalog synchronously so the existing delegated
    // download handler cannot run first. Database work happens only after the
    // event has been stopped.
    document.addEventListener('click',event=>{
      const button=event.target.closest('[data-asset-download],[data-download-asset]');
      if(!button)return;

      const assetId=getId(button);
      if(!assetId)return;

      const asset=catalogAsset(assetId);
      if(!asset||String(asset.access_type||'').toLowerCase()!=='free')return;

      event.preventDefault();
      event.stopImmediatePropagation();
      void downloadFree(button,asset);
    },true);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',wire,{once:true});
  else wire();
})();
