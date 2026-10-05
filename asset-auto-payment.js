/* STAR VISUALS — Automated premium asset payments
   Uses Razorpay Checkout + Supabase Edge Functions. The browser never receives the Razorpay secret.
   The existing manual UPI/UTR flow remains available when the gateway is disabled.
*/
(function(){
  const FN='https://gncihtlanzhbskdrvgbf.supabase.co/functions/v1/';
  let configPromise=null;
  let checkoutLoading=null;
  let busy=false;
  const db=()=>window.db;
  const session=async()=>{if(typeof window.getCurrentSession==='function')return window.getCurrentSession();if(!db())return null;return (await db().auth.getSession()).data?.session||null};
  const toast=msg=>{if(typeof window.toast==='function')window.toast(msg);else alert(msg)};
  const jsonHeaders=async()=>{const s=await session();return {'Content-Type':'application/json',Authorization:`Bearer ${s?.access_token||''}`,'apikey':window.STAR_VISUALS_SUPABASE?.publishableKey||''}};

  async function loadConfig(){
    if(configPromise)return configPromise;
    configPromise=(async()=>{try{const headers=await jsonHeaders();const r=await fetch(`${FN}asset-payment-config`,{method:'POST',headers,body:'{}'});return r.ok?await r.json():{enabled:false}}catch(e){console.warn('Automatic payment config unavailable',e);return {enabled:false}}})();
    return configPromise;
  }
  function loadRazorpay(){
    if(window.Razorpay)return Promise.resolve();
    if(checkoutLoading)return checkoutLoading;
    checkoutLoading=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://checkout.razorpay.com/v1/checkout.js';s.async=true;s.onload=resolve;s.onerror=()=>reject(new Error('Could not load secure payment checkout'));document.head.appendChild(s)});
    return checkoutLoading;
  }
  async function createOrder(assetId){
    const headers=await jsonHeaders();
    const r=await fetch(`${FN}create-asset-payment`,{method:'POST',headers,body:JSON.stringify({assetId})});
    const data=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(data.error||'Could not start payment');
    return data;
  }
  async function verify(orderId,response){
    const headers=await jsonHeaders();
    const r=await fetch(`${FN}verify-asset-payment`,{method:'POST',headers,body:JSON.stringify({orderId,razorpayPaymentId:response.razorpay_payment_id,razorpayOrderId:response.razorpay_order_id,razorpaySignature:response.razorpay_signature})});
    const data=await r.json().catch(()=>({}));
    if(!r.ok||!data.verified)throw new Error(data.error||'Payment could not be verified yet');
    return data;
  }
  async function waitForPaid(orderId){
    if(!db())return false;
    for(let i=0;i<30;i++){
      const {data}=await db().from('asset_orders').select('status').eq('id',orderId).maybeSingle();
      if(data?.status==='paid')return true;
      await new Promise(r=>setTimeout(r,1000));
    }
    return false;
  }
  async function openCheckout(assetId){
    if(busy)return;
    busy=true;
    try{
      const s=await session();
      if(!s?.user){location.href=`login.html?returnTo=${encodeURIComponent(location.pathname+location.search)}`;return}
      const cfg=await loadConfig();
      if(!cfg.enabled){return;}
      const order=await createOrder(assetId);
      if(order.alreadyPaid){location.href='dashboard.html';return}
      await loadRazorpay();
      const options={
        key:order.keyId,
        amount:order.amount,
        currency:order.currency||'INR',
        name:'STAR VISUALS',
        description:'Premium creator asset',
        order_id:order.providerOrderId,
        prefill:{email:order.email||s.user.email||''},
        theme:{color:'#00eaff'},
        method:{upi:true},
        modal:{ondismiss:()=>{busy=false;}},
        handler:async response=>{
          try{
            toast('Payment received. Verifying securely…');
            await verify(order.orderId,response);
            toast('Payment verified. Your premium asset is now unlocked.');
            setTimeout(()=>location.href='dashboard.html',500);
          }catch(error){
            const paid=await waitForPaid(order.orderId);
            if(paid){toast('Payment verified. Your premium asset is now unlocked.');setTimeout(()=>location.href='dashboard.html',500);}
            else toast(error.message||'Payment verification is still pending. Please check your Dashboard shortly.');
          }finally{busy=false;}
        }
      };
      const checkout=new window.Razorpay(options);
      checkout.on('payment.failed',response=>{console.warn('Razorpay payment failed',response?.error);toast(response?.error?.description||'Payment failed. You can try again.');busy=false;});
      checkout.open();
    }catch(error){console.error(error);toast(error.message||'Could not start payment.');busy=false;}
  }
  async function openDownload(assetId){
    try{
      const s=await session();if(!s?.user){location.href='login.html';return}
      const headers=await jsonHeaders();
      const r=await fetch(`${FN}asset-download`,{method:'POST',headers,body:JSON.stringify({assetId})});
      const data=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(data.error||'Download is not available');
      window.open(data.url,'_blank','noopener,noreferrer');
    }catch(error){console.error(error);toast(error.message||'Could not open the download.');}
  }
  async function captureClick(event){
    const purchase=event.target.closest?.('[data-purchase-asset]');
    if(purchase){
      const cfg=await loadConfig();
      if(!cfg.enabled)return;
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
      await openCheckout(purchase.dataset.purchaseAsset);return;
    }
    const download=event.target.closest?.('[data-download-asset]');
    if(download){
      const cfg=await loadConfig();
      if(!cfg.enabled)return;
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
      await openDownload(download.dataset.downloadAsset);
    }
  }
  document.addEventListener('click',captureClick,true);
  window.starVisualsAutomaticPayments={loadConfig,openCheckout,openDownload};
})();
