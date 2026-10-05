/* STAR VISUALS — Premium asset purchases via UPI
   Manual UPI flow: create order -> open UPI app -> customer submits UTR -> admin verifies -> asset appears in Dashboard.
   No client-side payment success is ever trusted as proof of payment.
*/
(function(){
  const state={assets:[],orders:[],settings:null};
  const db=()=>window.db;
  const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const money=v=>`₹${Number(v||0).toLocaleString('en-IN',{maximumFractionDigits:2})}`;
  const session=async()=>{if(typeof window.getCurrentSession==='function')return window.getCurrentSession();if(!db())return null;return (await db().auth.getSession()).data?.session||null};
  const toastSafe=msg=>{if(typeof window.toast==='function')window.toast(msg);else alert(msg)};
  const statusText={pending:'Payment not submitted',submitted:'Payment verification pending',paid:'Paid — download available',rejected:'Payment rejected',cancelled:'Cancelled'};

  async function loadSettings(){
    if(!db())return null;
    const {data,error}=await db().from('asset_payment_settings').select('id,upi_id,payee_name,enabled').eq('id',1).maybeSingle();
    if(error){console.warn('UPI settings load failed:',error);return null}
    state.settings=data;return data;
  }

  function upiLink(asset,settings,orderId){
    const params=new URLSearchParams({pa:settings.upi_id,pn:settings.payee_name||'STAR VISUALS',am:Number(asset.price||0).toFixed(2),cu:'INR',tn:`STAR VISUALS - ${asset.name}`.slice(0,80),tr:orderId});
    return `upi://pay?${params.toString()}`;
  }

  function ensureModal(){
    let modal=document.getElementById('assetPurchaseModal');
    if(modal)return modal;
    modal=document.createElement('div');modal.id='assetPurchaseModal';modal.className='sv-purchase-modal';modal.hidden=true;
    modal.innerHTML=`<div class="sv-purchase-backdrop" data-close-purchase></div><section class="sv-purchase-dialog" role="dialog" aria-modal="true" aria-labelledby="svPurchaseTitle"><button class="sv-purchase-close" type="button" data-close-purchase aria-label="Close">×</button><div class="eyebrow">STAR VISUALS / SECURE PURCHASE</div><h2 id="svPurchaseTitle">Unlock this premium asset.</h2><p id="svPurchaseAsset" class="sv-purchase-asset"></p><div class="sv-purchase-price" id="svPurchasePrice">₹0</div><div id="svPurchaseBody"></div></section>`;
    document.body.appendChild(modal);
    modal.addEventListener('click',e=>{if(e.target.closest('[data-close-purchase]'))closeModal()});
    return modal;
  }
  function closeModal(){const m=document.getElementById('assetPurchaseModal');if(m){m.hidden=true;document.body.classList.remove('sv-modal-open')}}
  function openModal(asset,order){
    const m=ensureModal();m.hidden=false;document.body.classList.add('sv-modal-open');
    m.querySelector('#svPurchaseAsset').textContent=asset.name;
    m.querySelector('#svPurchasePrice').textContent=money(asset.price);
    const body=m.querySelector('#svPurchaseBody');
    if(order?.status==='paid'){body.innerHTML=`<div class="sv-purchase-success"><strong>Purchase complete.</strong><p>This asset is already unlocked in your Dashboard.</p><button class="btn" type="button" data-open-dashboard>Open Dashboard →</button></div>`;body.querySelector('[data-open-dashboard]')?.addEventListener('click',()=>location.href='dashboard.html');return}
    if(order?.status==='submitted'){body.innerHTML=`<div class="sv-purchase-pending"><strong>Payment submitted.</strong><p>Your UTR has been received. We will verify the payment and unlock the asset in your Dashboard.</p><button class="outline-btn" type="button" data-close-purchase>Close</button></div>`;return}
    if(!state.settings?.enabled||!state.settings?.upi_id){body.innerHTML=`<div class="sv-purchase-pending"><strong>UPI payment is temporarily unavailable.</strong><p>The store owner has not configured the payment UPI yet.</p></div>`;return}
    const link=upiLink(asset,state.settings,order?.id||'');
    body.innerHTML=`<div class="sv-purchase-steps"><div><span>01</span><p>Tap <b>Pay with UPI</b>. On Android this opens the installed UPI payment app.</p></div><div><span>02</span><p>Complete the payment for <b>${money(asset.price)}</b> to <b>${esc(state.settings.upi_id)}</b>.</p></div><div><span>03</span><p>Return here and enter the UTR / transaction ID so the payment can be verified.</p></div></div><a class="btn sv-upi-pay" href="${esc(link)}">Pay with UPI ↗</a><form id="svUtrForm" class="sv-utr-form"><label>UPI transaction / UTR number<input id="svUtr" required maxlength="80" autocomplete="off" placeholder="Enter UTR after payment"></label><label>Optional note<textarea id="svUtrNote" rows="2" maxlength="300" placeholder="Anything the admin should know?"></textarea></label><button class="outline-btn" type="submit">I have paid — submit for verification</button><p class="sv-purchase-note">Payment is manually verified before the download is unlocked.</p></form>`;
    body.querySelector('#svUtrForm')?.addEventListener('submit',e=>submitUtr(e,asset,order));
  }

  async function createOrder(asset){
    const s=await session();if(!s?.user){location.href=`login.html?returnTo=${encodeURIComponent('assets.html')}`;return null}
    const {data,error}=await db().from('asset_orders').upsert({user_id:s.user.id,asset_id:asset.id,amount_inr:Number(asset.price||0),currency:'INR',status:'pending',updated_at:new Date().toISOString()},{onConflict:'user_id,asset_id'}).select('*').single();
    if(error){console.error(error);toastSafe(error.message||'Could not start purchase.');return null}return data;
  }
  async function submitUtr(e,asset,order){
    e.preventDefault();const utr=document.getElementById('svUtr')?.value.trim();const note=document.getElementById('svUtrNote')?.value.trim()||null;
    if(!utr||!order?.id)return;
    const {error}=await db().from('asset_orders').update({status:'submitted',utr,customer_note:note,updated_at:new Date().toISOString()}).eq('id',order.id).eq('user_id',(await session()).user.id);
    if(error){toastSafe(error.message||'Could not submit payment proof.');return}
    openModal(asset,{...order,status:'submitted'});
  }

  async function startPurchase(asset){
    const s=await session();if(!s?.user){location.href=`login.html?returnTo=${encodeURIComponent('assets.html')}`;return}
    await loadSettings();
    const {data:existing}=await db().from('asset_orders').select('*').eq('user_id',s.user.id).eq('asset_id',asset.id).maybeSingle();
    const order=existing||await createOrder(asset);if(!order)return;
    if(order.status==='paid'||order.status==='submitted'){openModal(asset,order);return}
    openModal(asset,order);
  }

  function assetIdFromCard(card){return card.dataset.assetId||card.dataset.id||card.getAttribute('data-asset')||card.querySelector('[data-asset-id]')?.dataset.assetId||null}
  function cardName(card){return (card.querySelector('.asset-card-name,.asset-name,h3,h4,[data-asset-name]')?.textContent||'').trim()}
  function decorateCards(){
    document.querySelectorAll('.asset-card,[data-asset-id]').forEach(card=>{
      if(card.dataset.svPurchaseWired==='1')return;
      let id=assetIdFromCard(card);let asset=id?state.assets.find(a=>a.id===id):null;
      if(!asset){const name=cardName(card).toLowerCase();asset=state.assets.find(a=>a.name.toLowerCase()===name)||state.assets.find(a=>name&&name.includes(a.name.toLowerCase()));if(asset){id=asset.id;card.dataset.assetId=id}}
      if(!asset||asset.access_type!=='premium')return;
      card.dataset.svPurchaseWired='1';
      const host=card.querySelector('.asset-card-actions,.asset-actions,.asset-card-footer')||card;
      if(host.querySelector('[data-purchase-asset]'))return;
      const button=document.createElement('button');button.type='button';button.className='btn sv-purchase-btn';button.dataset.purchaseAsset=asset.id;button.textContent=`Purchase ${money(asset.price)}`;host.appendChild(button);
    });
  }

  async function initAssetsPage(){
    if(!document.getElementById('assetLibraryGrid'))return;
    if(!db())return;
    const {data,error}=await db().from('asset_library').select('id,name,access_type,price,external_download_url,file_url,file_type,file_size,description,thumbnail_url').eq('published',true).eq('access_type','premium');
    if(error){console.warn('Premium asset catalog unavailable:',error);return}
    state.assets=data||[];decorateCards();
    const observer=new MutationObserver(decorateCards);observer.observe(document.getElementById('assetLibraryGrid')||document.body,{childList:true,subtree:true});
    window.addEventListener('load',decorateCards,{once:true});
  }

  async function loadDashboard(){
    const list=document.getElementById('myAssetList');if(!list||!db())return;
    const s=await session();if(!s?.user)return;
    const {data:orders,error}=await db().from('asset_orders').select('id,asset_id,amount_inr,status,utr,created_at,paid_at,admin_note,asset_library(id,name,description,thumbnail_url,file_url,external_download_url,file_type,file_size)').eq('user_id',s.user.id).order('created_at',{ascending:false});
    if(error){list.innerHTML='<span>✦</span><p>Asset purchases could not be loaded.</p>';return}
    state.orders=orders||[];
    if(!orders?.length){list.innerHTML='<span>✦</span><p>No premium asset purchases yet.</p><a class="text-button" href="assets.html">Explore Asset Library →</a>';return}
    list.innerHTML=orders.map(o=>{const a=o.asset_library||{};const action=o.status==='paid'?`<button class="btn small-btn" data-download-asset="${esc(o.asset_id)}">Open download ↗</button>`:o.status==='submitted'?'<span class="sv-order-state submitted">Payment verification pending</span>':o.status==='rejected'?'<span class="sv-order-state rejected">Payment rejected</span>':'<span class="sv-order-state">Payment not submitted</span>';return `<article class="sv-dashboard-asset"><div class="sv-dashboard-asset-thumb">${a.thumbnail_url?`<img src="${esc(a.thumbnail_url)}" alt="">`:''}</div><div><span class="dash-label">${esc(o.status.toUpperCase())}</span><h4>${esc(a.name||'Premium asset')}</h4><p>${esc(a.file_type||'Asset')} · ${esc(a.file_size||'')}</p>${action}</div></article>`}).join('');
  }

  async function openPurchasedAsset(assetId){
    const s=await session();if(!s?.user){location.href='login.html';return}
    const {data:order,error:oe}=await db().from('asset_orders').select('id,status,asset_id').eq('user_id',s.user.id).eq('asset_id',assetId).eq('status','paid').maybeSingle();
    if(oe||!order){toastSafe('This asset is not unlocked for your account.');return}
    const {data:asset,error}=await db().from('asset_library').select('id,name,file_url,external_download_url,access_type').eq('id',assetId).single();
    if(error||!asset){toastSafe('Asset file could not be found.');return}
    const target=asset.external_download_url||asset.file_url;
    if(!target){toastSafe('The asset download is not configured yet.');return}
    let url=target;
    if(/^https:\/\/.*supabase\.co\/storage\/v1\/object\//i.test(target)===false && !/^https?:\/\//i.test(target)){
      const path=target.replace(/^\/+/, '').replace(/^assets\//,'');
      const {data:signed,error:signedError}=await db().storage.from('assets').createSignedUrl(path,300);
      if(!signedError&&signed?.signedUrl)url=signed.signedUrl;
    }
    window.open(url,'_blank','noopener,noreferrer');
  }

  function injectAdmin(){
    if(!document.getElementById('assetAdminStats')||document.getElementById('assetPurchaseAdmin'))return;
    const section=document.createElement('section');section.id='assetPurchaseAdmin';section.className='section admin-section';section.innerHTML=`<div class="admin-toolbar"><div><p class="eyebrow">PAYMENTS</p><h2>Premium asset payments</h2></div><button class="outline-btn" type="button" id="svRefreshOrders">Refresh payments</button></div><form class="asset-admin-form admin-editor-form" id="svUpiSettingsForm"><div class="form-grid"><label>UPI ID<input id="svAdminUpi" placeholder="yourname@upi" required></label><label>Payee name<input id="svAdminPayee" value="STAR VISUALS" required></label><label>Payments enabled<select id="svAdminUpiEnabled"><option value="true">Enabled</option><option value="false">Disabled</option></select></label></div><div class="asset-admin-actions"><button class="btn" type="submit">Save UPI settings</button></div><p class="auth-note" id="svAdminUpiStatus">Configure the UPI ID users will pay.</p></form><div class="admin-request-list" id="svPaymentOrders"><div class="admin-empty">Loading payments…</div></div>`;
    document.getElementById('assetAdminStats').closest('.section')?.after(section);
    document.getElementById('svUpiSettingsForm')?.addEventListener('submit',saveAdminSettings);document.getElementById('svRefreshOrders')?.addEventListener('click',loadAdminOrders);loadAdminSettings();loadAdminOrders();
  }
  async function isAdmin(){const {data,error}=await db().rpc('project_request_admin_check');return !error&&data===true}
  async function loadAdminSettings(){await loadSettings();if(!state.settings)return;document.getElementById('svAdminUpi').value=state.settings.upi_id||'';document.getElementById('svAdminPayee').value=state.settings.payee_name||'STAR VISUALS';document.getElementById('svAdminUpiEnabled').value=String(state.settings.enabled)}
  async function saveAdminSettings(e){e.preventDefault();const el=document.getElementById('svAdminUpiStatus');const payload={id:1,upi_id:document.getElementById('svAdminUpi').value.trim(),payee_name:document.getElementById('svAdminPayee').value.trim()||'STAR VISUALS',enabled:document.getElementById('svAdminUpiEnabled').value==='true',updated_at:new Date().toISOString()};const {error}=await db().from('asset_payment_settings').upsert(payload,{onConflict:'id'});if(error){el.textContent=error.message;el.classList.add('error');return}el.textContent='UPI payment settings saved.';el.classList.remove('error');state.settings=payload}
  async function loadAdminOrders(){const list=document.getElementById('svPaymentOrders');if(!list)return;const {data:orders,error}=await db().from('asset_orders').select('id,user_id,asset_id,amount_inr,status,utr,customer_note,admin_note,created_at,paid_at,asset_library(name)').order('created_at',{ascending:false}).limit(100);if(error){list.innerHTML=`<div class="admin-empty">${esc(error.message)}</div>`;return}list.innerHTML=orders?.length?orders.map(o=>`<article class="admin-request"><div class="admin-request-head"><div><span class="admin-index">${esc(o.status.toUpperCase())}</span><h3>${esc(o.asset_library?.name||'Asset')}</h3></div><strong>${money(o.amount_inr)}</strong></div><div class="admin-request-grid"><div><span>USER ID</span><strong>${esc(o.user_id)}</strong><small>${o.created_at?new Date(o.created_at).toLocaleString('en-IN'):''}</small></div><div><span>UTR</span><strong>${esc(o.utr||'Not submitted')}</strong><small>${esc(o.customer_note||'')}</small></div><div><span>STATUS</span><strong>${esc(statusText[o.status]||o.status)}</strong><small>${o.paid_at?`Paid ${new Date(o.paid_at).toLocaleString('en-IN')}`:''}</small></div></div><label class="admin-brief"><span>ADMIN NOTE</span><textarea data-payment-note="${esc(o.id)}" rows="2" placeholder="Optional verification note">${esc(o.admin_note||'')}</textarea></label><div class="asset-admin-actions">${o.status!=='paid'?`<button class="btn" type="button" data-mark-paid="${esc(o.id)}">Mark payment verified</button>`:''}${o.status!=='rejected'&&o.status!=='paid'?`<button class="outline-btn" type="button" data-reject-payment="${esc(o.id)}">Reject</button>`:''}</div></article>`).join(''):'<div class="admin-empty">No premium asset payments yet.</div>'}

  document.addEventListener('click',async e=>{
    const purchase=e.target.closest('[data-purchase-asset]');if(purchase){e.preventDefault();const asset=state.assets.find(a=>a.id===purchase.dataset.purchaseAsset);if(asset)startPurchase(asset);return}
    const dl=e.target.closest('[data-download-asset]');if(dl){e.preventDefault();openPurchasedAsset(dl.dataset.downloadAsset);return}
    const paid=e.target.closest('[data-mark-paid]');if(paid){const note=document.querySelector(`[data-payment-note="${CSS.escape(paid.dataset.markPaid)}"]`)?.value||null;paid.disabled=true;const {error}=await db().rpc('asset_order_mark_paid',{order_id:paid.dataset.markPaid,admin_note_value:note});paid.disabled=false;if(error)toastSafe(error.message);else{toastSafe('Payment verified and asset unlocked.');loadAdminOrders()}return}
    const reject=e.target.closest('[data-reject-payment]');if(reject){const note=document.querySelector(`[data-payment-note="${CSS.escape(reject.dataset.rejectPayment)}"]`)?.value||null;reject.disabled=true;const {error}=await db().rpc('asset_order_reject',{order_id:reject.dataset.rejectPayment,admin_note_value:note});reject.disabled=false;if(error)toastSafe(error.message);else{toastSafe('Payment rejected.');loadAdminOrders()}return}
  });

  async function init(){
    if(!db())return;
    if(document.getElementById('assetLibraryGrid'))initAssetsPage();
    if(document.getElementById('myAssetList'))loadDashboard();
    if(document.getElementById('assetAdminStats')){if(await isAdmin())injectAdmin();}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
