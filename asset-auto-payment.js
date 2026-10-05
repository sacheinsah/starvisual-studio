/* STAR VISUALS — Automated premium asset payments
   Direct Razorpay Checkout for premium assets.
   The browser never receives the Razorpay secret and no UTR/manual-payment flow is used on the storefront.
*/
(function(){
  const checkoutLoadingPromise={value:null};
  let configPromise=null;
  let busy=false;
  const db=()=>window.db;
  const session=async()=>{
    if(typeof window.getCurrentSession==='function')return window.getCurrentSession();
    if(!db())return null;
    return (await db().auth.getSession()).data?.session||null;
  };
  const toast=msg=>{if(typeof window.toast==='function')window.toast(msg);else alert(msg)};

  async function invokeFunction(name,body={}){
    const client=db();
    if(!client?.functions?.invoke)throw new Error('Payment service is not initialized. Please refresh the page.');
    const result=await client.functions.invoke(name,{body});
    if(result.error){
      let message=result.error.message||'Payment service request failed';
      try{
        const response=result.error.context;
        if(response && typeof response.json==='function'){
          const payload=await response.clone().json().catch(()=>null);
          if(payload?.error)message=payload.error;
        }
      }catch(_){ }
      throw new Error(message);
    }
    return result.data||{};
  }

  async function loadConfig(){
    if(configPromise)return configPromise;
    configPromise=(async()=>{
      try{return await invokeFunction('asset-payment-config',{});}
      catch(e){
        console.warn('Automatic payment config unavailable',e);
        return {enabled:false,error:e.message||'Automatic payments are unavailable'};
      }
    })();
    return configPromise;
  }

  function loadRazorpay(){
    if(window.Razorpay)return Promise.resolve();
    if(checkoutLoadingPromise.value)return checkoutLoadingPromise.value;
    checkoutLoadingPromise.value=new Promise((resolve,reject)=>{
      const existing=document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if(existing){
        existing.addEventListener('load',resolve,{once:true});
        existing.addEventListener('error',()=>reject(new Error('Could not load secure Razorpay checkout')),{once:true});
        return;
      }
      const s=document.createElement('script');
      s.src='https://checkout.razorpay.com/v1/checkout.js';
      s.async=true;
      s.onload=resolve;
      s.onerror=()=>reject(new Error('Could not load secure Razorpay checkout'));
      document.head.appendChild(s);
    });
    return checkoutLoadingPromise.value;
  }

  async function createOrder(assetId){
    if(!assetId)throw new Error('This premium asset has no valid asset ID.');
    return invokeFunction('create-asset-payment',{assetId:String(assetId)});
  }

  async function verify(orderId,response){
    return invokeFunction('verify-asset-payment',{
      orderId,
      razorpayPaymentId:response.razorpay_payment_id,
      razorpayOrderId:response.razorpay_order_id,
      razorpaySignature:response.razorpay_signature
    });
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
      if(!s?.user){location.href=`login.html?returnTo=${encodeURIComponent(location.pathname+location.search)}`;return;}
      const cfg=await loadConfig();
      if(!cfg.enabled)throw new Error(cfg.error||'Razorpay payments are not enabled yet. Please configure the Razorpay credentials in Supabase.');
      const order=await createOrder(assetId);
      if(order.alreadyPaid){
        toast('This asset is already unlocked.');
        if(window.starVisualsPremiumActionGate?.refresh)window.starVisualsPremiumActionGate.refresh();
        return;
      }
      if(!order.providerOrderId||!order.keyId||!order.amount)throw new Error('Payment order was not created correctly. Please try again.');
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
        modal:{ondismiss:()=>{busy=false;}},
        handler:async response=>{
          try{
            toast('Payment received. Verifying securely…');
            await verify(order.orderId,response);
            toast('Payment verified. Your premium asset is now unlocked.');
            if(window.starVisualsPremiumActionGate?.refresh)window.starVisualsPremiumActionGate.refresh();
            setTimeout(()=>location.href='dashboard.html',500);
          }catch(error){
            const paid=await waitForPaid(order.orderId);
            if(paid){
              toast('Payment verified. Your premium asset is now unlocked.');
              if(window.starVisualsPremiumActionGate?.refresh)window.starVisualsPremiumActionGate.refresh();
              setTimeout(()=>location.href='dashboard.html',500);
            }else{
              toast(error.message||'Payment verification is still pending. Please check your Dashboard shortly.');
            }
          }finally{busy=false;}
        }
      };
      const checkout=new window.Razorpay(options);
      checkout.on('payment.failed',response=>{
        console.warn('Razorpay payment failed',response?.error);
        toast(response?.error?.description||'Payment failed. You can try again.');
        busy=false;
      });
      checkout.open();
    }catch(error){
      console.error('Premium asset checkout failed',error);
      toast(error.message||'Could not start payment.');
      busy=false;
    }
  }

  async function openDownload(assetId){
    try{
      const s=await session();
      if(!s?.user){location.href='login.html';return;}
      const data=await invokeFunction('asset-download',{assetId:String(assetId)});
      if(!data.url)throw new Error('Download is not available');
      window.open(data.url,'_blank','noopener,noreferrer');
    }catch(error){console.error(error);toast(error.message||'Could not open the download.');}
  }

  async function captureClick(event){
    const purchase=event.target.closest?.('[data-purchase-asset]');
    if(purchase){
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
      await openCheckout(purchase.dataset.purchaseAsset);return;
    }
    const download=event.target.closest?.('[data-download-asset]');
    if(download){
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
      await openDownload(download.dataset.downloadAsset);
    }
  }

  document.addEventListener('click',captureClick,true);
  window.starVisualsAutomaticPayments={loadConfig,openCheckout,openDownload};
})();
