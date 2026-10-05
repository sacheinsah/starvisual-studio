/* STAR VISUALS — Admin payment gateway settings UI. Secrets are never stored here. */
(function(){
  const db=()=>window.db;
  function init(){
    if(!db()||!document.getElementById('assetAdminStats')||document.getElementById('svGatewayAdmin'))return;
    const host=document.getElementById('assetAdminStats').closest('.asset-admin-section')||document.querySelector('.asset-admin-section');
    if(!host)return;
    const section=document.createElement('section');section.id='svGatewayAdmin';section.className='asset-admin-box';
    section.innerHTML=`<div class="admin-toolbar"><div><p class="eyebrow">AUTOMATED PAYMENTS</p><h3>Razorpay premium checkout</h3></div><span class="auth-note">UPI / cards / other enabled checkout methods</span></div><form id="svGatewayForm" class="asset-admin-form admin-editor-form"><div class="form-grid"><label>Provider<select id="svGatewayProvider"><option value="manual_upi">Manual UPI fallback</option><option value="razorpay">Razorpay automatic verification</option></select></label><label>Razorpay Key ID<input id="svGatewayKeyId" placeholder="rzp_test_... or rzp_live_..."></label><label>Mode<select id="svGatewayMode"><option value="test">Test</option><option value="live">Live</option></select></label><label>Automatic payments<select id="svGatewayEnabled"><option value="false">Disabled</option><option value="true">Enabled</option></select></label></div><div class="asset-admin-actions"><button class="btn" type="submit">Save gateway settings</button></div><p class="auth-note" id="svGatewayStatus">The Razorpay secret and webhook secret must be stored as Supabase Edge Function secrets; they are never placed in this form.</p></form>`;
    host.appendChild(section);
    document.getElementById('svGatewayForm').addEventListener('submit',save);
    load();
  }
  async function load(){const {data,error}=await db().from('asset_payment_settings').select('payment_provider,provider_enabled,razorpay_key_id,mode').eq('id',1).maybeSingle();if(error)return;document.getElementById('svGatewayProvider').value=data?.payment_provider||'manual_upi';document.getElementById('svGatewayKeyId').value=data?.razorpay_key_id||'';document.getElementById('svGatewayMode').value=data?.mode||'test';document.getElementById('svGatewayEnabled').value=String(data?.provider_enabled===true)}
  async function save(e){e.preventDefault();const status=document.getElementById('svGatewayStatus');const provider=document.getElementById('svGatewayProvider').value;const keyId=document.getElementById('svGatewayKeyId').value.trim();const enabled=document.getElementById('svGatewayEnabled').value==='true';if(provider==='razorpay'&&enabled&&!/^rzp_(test|live)_[A-Za-z0-9]+$/.test(keyId)){status.textContent='Enter a valid Razorpay Key ID before enabling automatic payments.';status.classList.add('error');return}const {error}=await db().from('asset_payment_settings').upsert({id:1,payment_provider:provider,provider_enabled:enabled,razorpay_key_id:keyId,mode:document.getElementById('svGatewayMode').value,updated_at:new Date().toISOString()},{onConflict:'id'});if(error){status.textContent=error.message;status.classList.add('error');return}status.textContent='Gateway settings saved. Automatic checkout is ready once the Edge Function secrets are configured.';status.classList.remove('error')}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  const observer=new MutationObserver(init);observer.observe(document.body,{childList:true,subtree:true});
})();
