/* STAR VISUALS — Free asset download guard
   Free assets must never be blocked by premium purchase/order checks.
   Premium assets are left to the existing purchase/download flow.
*/
(function(){
  const db=()=>window.db;

  function getId(button){
    return button?.dataset?.assetDownload
      || button?.dataset?.downloadAsset
      || button?.dataset?.assetId
      || button?.closest('.asset-card-v2,[data-asset-id]')?.dataset?.assetId
      || null;
  }

  async function session(){
    if(typeof window.getCurrentSession==='function') return window.getCurrentSession();
    if(!db()) return null;
    return (await db().auth.getSession()).data?.session||null;
  }

  async function downloadFree(button){
    if(!db()) return;
    const assetId=getId(button);
    if(!assetId) return;

    const {data:asset,error:assetError}=await db()
      .from('asset_library')
      .select('id,name,access_type,published,file_url,external_download_url')
      .eq('id',assetId)
      .maybeSingle();

    if(assetError||!asset) return;

    // Never interfere with premium purchases/downloads.
    if(String(asset.access_type||'').toLowerCase()!=='free') return;

    const current=await session();
    if(!current?.user){
      location.href=`login.html?returnTo=${encodeURIComponent('assets.html')}`;
      return;
    }

    const {data,result,error}=await db().rpc('record_asset_download',{p_asset_id:asset.id});
    if(error){
      console.error('Free asset download failed:',error);
      if(typeof window.toast==='function') window.toast(error.message||'This free asset could not be downloaded.');
      else alert(error.message||'This free asset could not be downloaded.');
      return;
    }

    const target=data?.file_url||result?.file_url||asset.external_download_url||asset.file_url;
    if(!target){
      if(typeof window.toast==='function') window.toast('The asset download is not configured yet.');
      return;
    }

    window.open(target,'_blank','noopener,noreferrer');
  }

  function wire(){
    if(window.__starVisualsFreeDownloadFixWired)return;
    window.__starVisualsFreeDownloadFixWired=true;

    document.addEventListener('click',async event=>{
      const button=event.target.closest('[data-asset-download],[data-download-asset]');
      if(!button)return;

      const assetId=getId(button);
      if(!assetId)return;

      // Check the asset before allowing the older delegated download/premium handler to run.
      const {data:asset}=await db()?.from('asset_library')
        .select('access_type')
        .eq('id',assetId)
        .maybeSingle() || {data:null};
      if(!asset||String(asset.access_type||'').toLowerCase()!=='free')return;

      event.preventDefault();
      event.stopImmediatePropagation();
      await downloadFree(button);
    },true);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',wire,{once:true});
  else wire();
})();
