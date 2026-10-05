/* STAR VISUALS — Asset upload safety patch
   Fixes external-file saves with no local File selected, preserves existing storage paths,
   and supports trusted cloud-drive URLs for premium packs.
*/
(function(){
  function init(){
    const form=document.getElementById('assetForm');
    if(!form||form.dataset.assetUploadFix==='1')return;
    form.dataset.assetUploadFix='1';
    const fileInput=document.getElementById('assetUploadFile');
    const sizeInput=document.getElementById('assetFileSize');
    const typeInput=document.getElementById('assetFileType');

    fileInput?.addEventListener('change',()=>{
      const file=fileInput.files?.[0]||null;
      if(!file)return;
      if(sizeInput)sizeInput.value=formatSize(file.size);
      if(typeInput){
        const ext=file.name.includes('.')?file.name.split('.').pop().toUpperCase():'';
        typeInput.value=ext||file.type||'FILE';
      }
    });

    form.addEventListener('submit',async event=>{
      const file=fileInput?.files?.[0]||null;
      if(file)return;
      const fileUrl=String(document.getElementById('assetFileUrl')?.value||'').trim();
      const externalDownload=String(document.getElementById('assetExternalDownload')?.value||'').trim();
      const access=document.getElementById('assetAccessType')?.value==='premium'?'premium':'free';
      const needsSafeHandler=Boolean(fileUrl||externalDownload||sizeInput?.value);
      if(!needsSafeHandler)return;

      event.preventDefault();
      event.stopImmediatePropagation();
      await saveWithoutLocalFile(form,{fileUrl,externalDownload,access});
    },true);
  }

  function formatSize(bytes){
    const n=Number(bytes)||0;
    if(n<1024)return `${n} B`;
    if(n<1024**2)return `${(n/1024).toFixed(1)} KB`;
    if(n<1024**3)return `${(n/1024**2).toFixed(1)} MB`;
    if(n<1024**4)return `${(n/1024**3).toFixed(2)} GB`;
    return `${(n/1024**4).toFixed(2)} TB`;
  }

  function trustedExternalUrl(value){
    try{
      const u=new URL(String(value||'').trim());
      if(u.protocol!=='https:')return false;
      const host=u.hostname.toLowerCase();
      return host==='drive.google.com'||host==='docs.google.com'||host==='dropbox.com'||host.endsWith('.dropbox.com')||host==='onedrive.live.com'||host==='1drv.ms';
    }catch(_){return false;}
  }

  function status(message,error=false){
    const el=document.getElementById('assetStatus');
    if(el){el.textContent=message;el.classList.toggle('error',Boolean(error));}
  }
  function tags(value){return String(value||'').split(',').map(v=>v.trim()).filter(Boolean).slice(0,30);}
  function friendly(error){return typeof window.friendlyError==='function'?window.friendlyError(error):(error?.message||String(error||'Something went wrong.'));}

  async function saveWithoutLocalFile(form,opts){
    const db=window.db;
    if(!db){status('Connect Supabase before managing assets.',true);return;}
    const id=document.getElementById('assetEditId')?.value||'';
    const existingUrl=opts.fileUrl;
    const externalDownload=opts.externalDownload;
    if(!existingUrl&&!externalDownload){status('Add an existing storage/file URL or select an original asset file.',true);return;}

    const chosenExternal=existingUrl||externalDownload;
    const isStoragePath=typeof window.getStoragePath==='function' && Boolean(window.getStoragePath(existingUrl));
    const isExternal=Boolean(existingUrl&&!isStoragePath) || Boolean(externalDownload);
    if(isExternal&&!trustedExternalUrl(chosenExternal)){
      status('Trusted external asset URLs must use HTTPS Google Drive, Dropbox, OneDrive, or 1drv.ms links.',true);return;
    }

    const software=String(document.getElementById('assetSoftware')?.value||'').trim();
    const compatibility=String(document.getElementById('assetCompatibility')?.value||software).split(',').map(v=>v.trim()).filter(Boolean);
    const sizeValue=String(document.getElementById('assetFileSize')?.value||'').trim();
    const typeValue=String(document.getElementById('assetFileType')?.value||'').trim()||'FILE';
    const payload={
      name:String(document.getElementById('assetName')?.value||'').trim(),
      description:String(document.getElementById('assetDescription')?.value||'').trim(),
      category:String(document.getElementById('assetCategory')?.value||'').trim(),
      subcategory:String(document.getElementById('assetSubcategory')?.value||'').trim()||null,
      tags:tags(document.getElementById('assetTags')?.value),
      software,
      software_compatibility:compatibility,
      file_type:typeValue,
      file_size:sizeValue||'External file',
      thumbnail_url:String(document.getElementById('assetThumbnail')?.value||'').trim()||'assets/asset-pack/asset-library-cover.svg',
      preview_url:String(document.getElementById('assetPreview')?.value||'').trim()||null,
      file_url:existingUrl||null,
      external_download_url:externalDownload||null,
      access_type:opts.access,
      price:Number(document.getElementById('assetPrice')?.value||0),
      published:document.getElementById('assetPublished')?.value==='true',
      featured:document.getElementById('assetFeatured')?.checked===true,
      trending:document.getElementById('assetTrending')?.checked===true,
      updated_at:new Date().toISOString()
    };
    if(!payload.name||!payload.category){status('Asset name and category are required.',true);return;}

    try{
      status('Saving asset…');
      const result=id
        ?await db.from('asset_library').update(payload).eq('id',id).select('id').single()
        :await db.from('asset_library').insert(payload).select('id').single();
      if(result.error)throw result.error;

      const assetId=result.data?.id||id;
      const collectionId=document.getElementById('assetCollection')?.value||'';
      if(assetId&&collectionId){
        const {error:collectionError}=await db.from('asset_collection_items').upsert({collection_id:collectionId,asset_id:assetId,sort_order:0},{onConflict:'collection_id,asset_id'});
        if(collectionError)console.warn('Asset collection assignment failed:',collectionError);
      }
      form.reset();
      document.getElementById('assetEditId').value='';
      status(payload.published?'Asset saved and published.':'Asset saved as draft.');
      if(typeof window.loadAdminAssets==='function')await window.loadAdminAssets();
      if(typeof window.loadAssetCatalog==='function')await window.loadAssetCatalog();
      if(typeof window.updateAssetFilterOptions==='function')window.updateAssetFilterOptions();
    }catch(error){
      console.error('Safe asset save failed:',error);
      status(friendly(error),true);
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();

  // Admin payment controls are kept separate from the upload handler so the
  // existing asset management logic is not replaced or duplicated.
  function loadPurchaseAdmin(){
    if(!location.pathname.toLowerCase().endsWith('/admin.html')&&!location.pathname.toLowerCase().endsWith('admin.html'))return;
    if(document.querySelector('script[data-star-purchases]'))return;
    const s=document.createElement('script');s.src='asset-purchases.js?v=20261005-upi-purchases-1';s.dataset.starPurchases='1';document.body.appendChild(s);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadPurchaseAdmin,{once:true});else loadPurchaseAdmin();
})();
