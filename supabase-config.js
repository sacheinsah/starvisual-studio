/*
  STAR VISUALS — Supabase client configuration
  ------------------------------------------------
  Replace ONLY the two values below with your Supabase project's:
  1) Project URL
  2) Publishable key (sb_publishable_...)

  NEVER put a Supabase service_role/secret key in this file or in the browser.
*/
window.STAR_VISUALS_SUPABASE = {
  // Replace this with the URL shown in Supabase: Project Settings > API.
  url: 'https://gncihtlanzhbskdrvgbf.supabase.co',
  publishableKey: 'sb_publishable_uhJbULesquM3HLiap139Kg_WAxIQluO'
};

/* STAR VISUALS — live asset file metadata detection.
   Runs only when the Asset Library admin form exists. */
(function setupAssetFileMetadataDetection(){
  const formatBytes = bytes => {
    const value = Number(bytes);
    if (!Number.isFinite(value) || value < 0) return '';
    if (value < 1024) return `${value} B`;
    const units = ['KB','MB','GB','TB'];
    let size = value;
    let unitIndex = -1;
    do {
      size /= 1024;
      unitIndex += 1;
    } while (size >= 1024 && unitIndex < units.length - 1);
    const decimals = size >= 100 ? 0 : size >= 10 ? 1 : 2;
    return `${size.toFixed(decimals)} ${units[unitIndex]}`;
  };

  const init = () => {
    const fileInput = document.getElementById('assetUploadFile');
    const sizeInput = document.getElementById('assetFileSize');
    const typeInput = document.getElementById('assetFileType');
    if (!fileInput || !sizeInput || !typeInput || fileInput.dataset.sizeDetectionWired === '1') return;

    fileInput.dataset.sizeDetectionWired = '1';
    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (!file) return;

      sizeInput.value = formatBytes(file.size);
      const extension = file.name.includes('.')
        ? file.name.split('.').pop().trim().toUpperCase()
        : '';
      typeInput.value = extension || (file.type ? file.type.split('/').pop().toUpperCase() : 'FILE');
      sizeInput.dispatchEvent(new Event('input', {bubbles:true}));
      typeInput.dispatchEvent(new Event('input', {bubbles:true}));
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {once:true});
  } else {
    init();
  }
})();

/* STAR VISUALS — shared visual polish loader.
   Presentation only; no business logic or payment/auth behavior is changed. */
(function loadVisualPolish(){
  if (document.querySelector('link[data-star-visual-polish]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'visual-polish.css?v=20261006-1';
  link.dataset.starVisualPolish = '1';
  document.head.appendChild(link);
})();
