const adminStatus=document.getElementById('adminStatus');
const adminRequests=document.getElementById('adminRequests');
function setAdminStatus(message,error=false){if(adminStatus){adminStatus.textContent=message;adminStatus.classList.toggle('error',error)}}
function adminRequestCard(request,profile){const contact=request.email||profile?.email||'No email provided';const phone=request.phone||'No phone provided';const service=request.service_type||request.package_name||'Editing request';const brief=request.requirements||'No brief provided';return `<article class="admin-request"><div class="admin-request-head"><div><span class="admin-index">${escapeHtml(request.project_name)}</span><h3>${escapeHtml(service)}</h3></div><select class="admin-status-select" data-request-id="${request.id}" aria-label="Update request status"><option value="NEW" ${request.status==='NEW'?'selected':''}>New</option><option value="REVIEWING" ${request.status==='REVIEWING'?'selected':''}>Reviewing</option><option value="QUOTED" ${request.status==='QUOTED'?'selected':''}>Quoted</option><option value="APPROVED" ${request.status==='APPROVED'?'selected':''}>Approved</option><option value="IN PROGRESS" ${request.status==='IN PROGRESS'?'selected':''}>In progress</option><option value="REVISION" ${request.status==='REVISION'?'selected':''}>Revision</option><option value="COMPLETED" ${request.status==='COMPLETED'?'selected':''}>Completed</option><option value="CANCELLED" ${request.status==='CANCELLED'?'selected':''}>Cancelled</option></select></div><div class="admin-request-grid"><div><span>CLIENT</span><strong>${escapeHtml(request.full_name||profile?.full_name||'Unknown')}</strong><small>${escapeHtml(contact)}<br>${escapeHtml(phone)}</small></div><div><span>SERVICE / PLATFORM</span><strong>${escapeHtml(service)}</strong><small>${escapeHtml(request.platform||'Platform not specified')} · ${escapeHtml(request.video_duration||'Duration not specified')}</small></div><div><span>BUDGET / DEADLINE</span><strong>${escapeHtml(request.budget||'Not specified')}</strong><small>${escapeHtml(request.deadline||'No deadline')} · ${request.created_at?new Date(request.created_at).toLocaleDateString('en-IN'):''}</small></div></div><div class="admin-brief"><span>PROJECT BRIEF</span><p>${escapeHtml(brief)}</p>${request.footage_link?`<a href="${escapeHtml(request.footage_link)}" target="_blank" rel="noopener">Open footage link ↗</a>`:''}${request.reference_link?`<a href="${escapeHtml(request.reference_link)}" target="_blank" rel="noopener">Open reference link ↗</a>`:''}</div><label class="admin-brief"><span>ADMIN MESSAGE</span><textarea data-admin-notes="${request.id}" rows="3" placeholder="Message visible in My Studio">${escapeHtml(request.admin_notes||'')}</textarea></label></article>`}async function loadAdminRequests(){if(!adminRequests||!db)return;setAdminStatus('Checking administrator access…');adminRequests.innerHTML='<div class="admin-empty">Loading requests…</div>';const {data:{session}}=await db.auth.getSession();if(!session?.user){location.href='login.html?returnTo=admin.html';return}const {data:isAdmin,error:adminError}=await db.rpc('project_request_admin_check');if(adminError||!isAdmin){setAdminStatus('Administrator access is required.',true);adminRequests.innerHTML='<div class="admin-empty">This account cannot view project requests.</div>';return}const {data:requests,error}=await db.from('project_requests').select('id,user_id,full_name,email,phone,project_name,service_type,video_duration,platform,editing_style,requirements,deadline,budget,footage_link,reference_link,additional_notes,status,admin_notes,created_at,updated_at,package_name,amount_inr,notes').order('created_at',{ascending:false});if(error){console.error('Project request load failed:',error);setAdminStatus(friendlyError(error),true);adminRequests.innerHTML='<div class="admin-empty">Requests could not be loaded.</div>';return}const ids=[...new Set((requests||[]).map(request=>request.user_id))];const {data:profiles}=ids.length?await db.from('profiles').select('id,full_name,email').in('id',ids):{data:[]};const profileMap=new Map((profiles||[]).map(profile=>[profile.id,profile]));adminRequests.innerHTML=requests?.length?requests.map(request=>adminRequestCard(request,profileMap.get(request.user_id))).join(''):'<div class="admin-empty">No editing requests yet.</div>';setAdminStatus(`${requests?.length||0} request${requests?.length===1?'':'s'} found.`)}
document.getElementById('adminRefresh')?.addEventListener('click',loadAdminRequests);
adminRequests?.addEventListener('change',async event=>{const select=event.target.closest('.admin-status-select');if(!select||!db)return;select.disabled=true;const {error}=await db.from('project_requests').update({status:select.value,updated_at:new Date().toISOString()}).eq('id',select.dataset.requestId);select.disabled=false;if(error){console.error('Project request status update failed:',error);setAdminStatus(friendlyError(error),true);return}setAdminStatus('Request status updated.')});adminRequests?.addEventListener('change',async event=>{const notes=event.target.closest('[data-admin-notes]');if(!notes||!db)return;const {error}=await db.from('project_requests').update({admin_notes:notes.value,updated_at:new Date().toISOString()}).eq('id',notes.dataset.adminNotes);if(error){console.error('Admin note update failed:',error);setAdminStatus(friendlyError(error),true);return}setAdminStatus('Admin message saved.')});
/* STAR VISUALS — shared UI, phone OTP authentication and Supabase data */
document.body.classList.toggle('services-page-active',Boolean(document.querySelector('.pricing-card')));
const menu=document.querySelector('.menu'), mobileNav=document.querySelector('.mobile-nav');
menu?.addEventListener('click',()=>{const open=mobileNav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));mobileNav.setAttribute('aria-hidden',String(!open));});
mobileNav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{mobileNav.classList.remove('open');menu?.setAttribute('aria-expanded','false');mobileNav?.setAttribute('aria-hidden','true');}));
const header=document.getElementById('siteHeader'); window.addEventListener('scroll',()=>header?.classList.toggle('scrolled',window.scrollY>25),{passive:true});
const revealObserver='IntersectionObserver' in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');revealObserver.unobserve(e.target)}}),{threshold:.08}):null; document.querySelectorAll('.reveal').forEach(e=>revealObserver?.observe(e));
const firstPortfolioVideo=document.querySelector('#portfolio .project-wide video');
if(firstPortfolioVideo){
  firstPortfolioVideo.poster='assets/asset-pack/star-visuals-showreel.jpg';
  const source=firstPortfolioVideo.querySelector('source[src="assets/project-01.mp4"]');
  if(source){source.src='assets/asset-pack/project-01.mp4';firstPortfolioVideo.load();}
}
const portfolioVideos=[...document.querySelectorAll('#portfolio video')];
const startPortfolioVideos=()=>portfolioVideos.forEach(video=>{video.muted=true;video.play().catch(()=>{});});
if(portfolioVideos.length){
  startPortfolioVideos();
  window.addEventListener('scroll',startPortfolioVideos,{passive:true});
  if('IntersectionObserver' in window){
    new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))startPortfolioVideos();},{threshold:.15}).observe(document.getElementById('portfolio'));
  }
}
let toastTimer; function toast(msg){const t=document.getElementById('toast')||(()=>{const x=document.createElement('div');x.id='toast';x.className='toast';document.body.appendChild(x);return x})();t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),3200)}
function initials(name){return (name||'SV').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'SV'}
function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function friendlyError(error){const m=error?.message||String(error||'Something went wrong.');if(/invalid login credentials/i.test(m))return'Email or password is incorrect.';if(/email not confirmed/i.test(m))return'Please confirm your email first, then log in.';if(/already registered|user already registered/i.test(m))return'An account with this email already exists. Try logging in.';if(/phone.*not enabled|sms.*provider/i.test(m))return'Phone OTP is not enabled in Supabase yet. Enable Phone auth and an SMS provider first.';return m}
const cfg=window.STAR_VISUALS_SUPABASE||{};
const validSupabaseUrl=typeof cfg.url==='string'&&/^https:\/\/[^/]+\.supabase\.co\/?$/.test(cfg.url)&&!cfg.url.includes('your-project-id');
const supabaseReady=Boolean(window.supabase?.createClient&&validSupabaseUrl&&cfg.publishableKey&&!cfg.publishableKey.includes('YOUR_SUPABASE'));
const db=supabaseReady?window.supabase.createClient(cfg.url,cfg.publishableKey):null;
const authUnavailableMessage='Supabase is not connected yet. Add your real project URL in supabase-config.js.';

function ensureAuthOverlay(){
  const existing=document.getElementById('authOverlay');
  if(existing)return existing;
  const host=document.createElement('div');
  host.innerHTML=`<div class="auth-overlay" id="authOverlay" aria-hidden="true"><div class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="authTitle"><button class="auth-close" type="button" aria-label="Close" data-close-auth>×</button><div class="auth-mark">✦</div><p class="eyebrow">WELCOME TO STAR VISUALS</p><h2 id="authTitle">Your creative<br><em>studio starts here.</em></h2><p class="auth-sub">Sign in or create your account with your email and password.</p><div class="auth-tabs"><button class="active" type="button" data-tab="email-login">Log in</button><button type="button" data-tab="email-signup">Sign up</button></div><div class="auth-method" id="emailMethod"><button class="google-auth-btn" type="button" data-google-auth><span class="google-mark">G</span><span>Continue with Google</span></button><div class="auth-divider"><span>or use email</span></div><form id="loginForm" class="auth-form"><label>Email<input id="loginEmail" type="email" autocomplete="email" placeholder="you@example.com" required></label><label>Password<input id="loginPassword" type="password" autocomplete="current-password" placeholder="Your password" required></label><button class="forgot-link" type="button" id="forgotPasswordBtn">Forgot password?</button><button class="auth-submit" type="submit">Log in with email <span>→</span></button></form><form id="signupForm" class="auth-form hidden"><label>Name<input id="signupName" type="text" autocomplete="name" placeholder="Your name" required></label><label>Email<input id="signupEmail" type="email" autocomplete="email" placeholder="you@example.com" required></label><label>Password<input id="signupPassword" type="password" autocomplete="new-password" minlength="6" placeholder="At least 6 characters" required></label><label>Confirm password<input id="signupPasswordConfirm" type="password" autocomplete="new-password" minlength="6" placeholder="Re-enter your password" required></label><button class="auth-submit" type="submit">Create account <span>→</span></button></form><form id="resetForm" class="auth-form hidden"><label>Email<input id="resetEmail" type="email" autocomplete="email" placeholder="you@example.com" required></label><button class="auth-submit" type="submit">Send reset link <span>→</span></button><button class="text-button auth-change" type="button" id="backToLoginBtn">Back to log in</button></form><form id="updatePasswordForm" class="auth-form hidden"><label>New password<input id="newPassword" type="password" autocomplete="new-password" minlength="6" placeholder="At least 6 characters" required></label><label>Confirm password<input id="newPasswordConfirm" type="password" autocomplete="new-password" minlength="6" placeholder="Re-enter your password" required></label><button class="auth-submit" type="submit">Update password <span>→</span></button></form></div><button class="guest-btn" type="button" data-close-auth>Continue browsing</button><p class="auth-note" id="authStatus">Secure authentication powered by Supabase.</p></div></div>`;
  document.body.appendChild(host.firstElementChild);
  return document.getElementById('authOverlay');
}

const overlay=ensureAuthOverlay();
const isLoginPage=location.pathname.endsWith('/login.html')||location.pathname.endsWith('login.html');
if(isLoginPage){overlay?.classList.add('open');overlay?.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');}
else{overlay?.classList.remove('open');overlay?.setAttribute('aria-hidden','true');}
const loginForm=document.getElementById('loginForm');
const signupForm=document.getElementById('signupForm');
const resetForm=document.getElementById('resetForm');
const updatePasswordForm=document.getElementById('updatePasswordForm');
const forgotPasswordBtn=document.getElementById('forgotPasswordBtn');
const authStatus=document.getElementById('authStatus');
const phoneNameWrap=document.getElementById('phoneNameWrap');
const phoneMethod=document.getElementById('phoneAuthForm');
const emailMethod=document.getElementById('emailMethod');
const authMethodTitle=document.getElementById('authMethodTitle');
const authMethodHint=document.getElementById('authMethodHint');
const toggleAuthMethod=document.getElementById('toggleAuthMethod');
const sendOtpBtn=document.getElementById('sendOtpBtn');
const verifyOtpBtn=document.getElementById('verifyOtpBtn');
const otpStep=document.getElementById('otpStep');
let phoneMode='email-login', pendingPhone='', authMethod='email';
let authReturnTo='';

[loginForm,signupForm].forEach(form=>form?.addEventListener('invalid',()=>setAuthStatus('Please enter a valid email and complete all required fields.',true),true));

phoneMethod?.remove();
document.querySelector('.auth-sub')?.replaceChildren(document.createTextNode('Sign in or create your account with your email and password.'));
document.querySelectorAll('.auth-tabs button').forEach((button,index)=>{
  button.dataset.tab=index===0?'email-login':'email-signup';
  button.textContent=index===0?'Log in':'Sign up';
});

function setAuthStatus(m,err=false){if(authStatus){authStatus.textContent=m;authStatus.classList.toggle('error',err)}}
function setAuthBusy(form,busy,label){const button=form?.querySelector('button[type="submit"]');if(!button)return;button.disabled=busy;if(busy){button.dataset.defaultLabel=button.innerHTML;button.innerHTML=`${label} <span>...</span>`;}else if(button.dataset.defaultLabel){button.innerHTML=button.dataset.defaultLabel;delete button.dataset.defaultLabel;}}
async function withAuthTimeout(request){let timer;try{return await Promise.race([request,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Authentication is taking too long. Check your internet connection and try again.')),15000)})])}finally{clearTimeout(timer)}}
async function continueWithGoogle(){if(!db){setAuthStatus(authUnavailableMessage,true);return}const buttons=[...document.querySelectorAll('[data-google-auth]')];buttons.forEach(button=>{button.disabled=true});setAuthStatus('Connecting to Google…');try{const redirectTarget=authReturnTo||location.pathname;const redirectTo=location.origin==='null'?undefined:`${location.origin}${redirectTarget}`;const options=redirectTo?{redirectTo}:{};const {error}=await withAuthTimeout(db.auth.signInWithOAuth({provider:'google',options}));if(error)setAuthStatus(friendlyError(error),true)}catch(error){setAuthStatus(friendlyError(error),true)}finally{buttons.forEach(button=>{button.disabled=false})}}
function showPasswordUpdate(){
  overlay?.classList.add('open'); overlay?.setAttribute('aria-hidden','false'); document.body.classList.add('modal-open');
  loginForm?.classList.add('hidden'); signupForm?.classList.add('hidden'); resetForm?.classList.add('hidden'); updatePasswordForm?.classList.remove('hidden');
  document.querySelectorAll('.auth-tabs button').forEach(b=>b.classList.remove('active'));
  setAuthStatus('Choose a new password for your account.');
  document.getElementById('newPassword')?.focus();
}
function resetAuthModal(){
  [loginForm,signupForm,resetForm,updatePasswordForm].forEach(form=>{form?.reset();form?.classList.add('hidden');setAuthBusy(form,false);});
  loginForm?.classList.remove('hidden');
  document.querySelectorAll('[data-google-auth]').forEach(button=>{button.disabled=false;});
  document.querySelectorAll('.auth-tabs button').forEach((button,index)=>button.classList.toggle('active',index===0));
  phoneNameWrap?.classList.add('hidden');
  setAuthStatus('Your credentials are securely handled by Supabase.');
}
function openAuth(mode='email-login',returnTo=''){
  if(!overlay)return;
  if(mode==='phone-login')mode='email-login';
  if(mode==='phone-signup')mode='email-signup';
  authReturnTo=returnTo;
  resetAuthModal();
  overlay.classList.add('open'); overlay.setAttribute('aria-hidden','false'); document.body.classList.add('modal-open');
  switchAuthMode(mode);
}
function closeAuth(preserveReturn=false){overlay?.classList.remove('open');overlay?.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open');resetAuthModal();if(!preserveReturn)authReturnTo=''}
function updateHeaderAuth(session){
  const authLinks=document.querySelectorAll('.login-trigger, .mobile-nav a[href="login.html"]');
  authLinks.forEach(link=>{link.hidden=Boolean(session?.user);});
}
function switchAuthMode(mode){
  phoneMode=mode==='signup'?'email-signup':mode;
  document.querySelectorAll('.auth-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===mode));
  const signup=phoneMode==='email-signup';
  phoneNameWrap?.classList.toggle('hidden',!signup);
  signupForm?.classList.toggle('hidden',!signup);
  resetForm?.classList.add('hidden');
  updatePasswordForm?.classList.add('hidden');
  loginForm?.classList.toggle('hidden',signup);
  setAuthStatus('Your credentials are securely handled by Supabase.');
}
function navigateAfterAuth(defaultTarget='dashboard.html'){
  const target=authReturnTo;
  authReturnTo='';
  if(!target&&!isLoginPage)return;
  const destination=target?decodeURIComponent(target):defaultTarget;
  if(location.pathname.endsWith(destination))return;
  location.href=destination;
}
function setAuthMethod(method){
  authMethod=method;
  const email=method==='email';
  phoneMethod?.classList.toggle('hidden',email);
  emailMethod?.classList.toggle('hidden',!email);
  if(authMethodTitle)authMethodTitle.textContent=email?'Email authentication':'Mobile verification';
  if(authMethodHint)authMethodHint.textContent=email?'Private account access · password protected':'Recommended · secure one-time code';
  if(toggleAuthMethod)toggleAuthMethod.textContent=email?'Use mobile instead':'Use email instead';
  setAuthStatus(email?'Use your email and password to continue.':'We’ll send a one-time code to your mobile.');
}
document.querySelectorAll('[data-open-auth]').forEach(b=>b.addEventListener('click',()=>openAuth(b.dataset.openAuth||'phone-login')));
document.querySelectorAll('.login-trigger').forEach(link=>link.addEventListener('click',e=>{
  e.preventDefault();
  openAuth('email-login');
}));
document.querySelectorAll('.account-actions a').forEach(link=>link.addEventListener('click',e=>{
  e.preventDefault();
  openAuth(link.href.includes('mode=signup')?'email-signup':'email-login');
}));
document.querySelectorAll('[data-close-auth]').forEach(b=>b.addEventListener('click',closeAuth));
document.querySelectorAll('.auth-tabs button').forEach(b=>b.addEventListener('click',()=>switchAuthMode(b.dataset.tab)));
document.querySelectorAll('[data-google-auth]').forEach(button=>button.addEventListener('click',continueWithGoogle));
toggleAuthMethod?.addEventListener('click',()=>setAuthMethod(authMethod==='phone'?'email':'phone'));
overlay?.addEventListener('click',e=>{if(e.target===overlay)closeAuth()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAuth()});
if(isLoginPage){
  const params=new URLSearchParams(location.search);
  authReturnTo=params.get('returnTo')||'';
  switchAuthMode(params.get('mode')==='signup'?'email-signup':'email-login');
}

function normalizePhone(v){let s=v.trim().replace(/[\s()-]/g,'');if(/^\d{10}$/.test(s))s='+91'+s;return s}
async function sendOtp(){
  if(!db){setAuthStatus(authUnavailableMessage,true);return}
  const phone=normalizePhone(document.getElementById('phoneNumber')?.value||'');
  if(!/^\+[1-9]\d{7,14}$/.test(phone)){setAuthStatus('Enter a valid mobile number, for example +91 98765 43210.',true);return}
  pendingPhone=phone; setAuthStatus('Sending your secure one-time code…'); sendOtpBtn.disabled=true;
  const {error}=await db.auth.signInWithOtp({phone,options:{channel:'sms'}});
  sendOtpBtn.disabled=false;
  if(error){setAuthStatus(friendlyError(error),true);return}
  otpStep?.classList.remove('hidden'); setAuthStatus('Code sent. Enter the 6-digit code from your SMS.'); document.getElementById('phoneOtp')?.focus();
}
async function verifyOtp(){
  if(!db)return;
  const token=document.getElementById('phoneOtp')?.value.trim();
  if(!/^\d{6}$/.test(token)){setAuthStatus('Enter the 6-digit OTP.',true);return}
  setAuthStatus('Verifying your account…'); verifyOtpBtn.disabled=true;
  const {data,error}=await db.auth.verifyOtp({phone:pendingPhone,token,type:'sms'});
  verifyOtpBtn.disabled=false;
  if(error){setAuthStatus(friendlyError(error),true);return}
  const name=document.getElementById('phoneName')?.value.trim();
  if(name&&data.user){
    await db.auth.updateUser({data:{full_name:name}});
    await db.from('profiles').update({full_name:name}).eq('id',data.user.id);
  }
  localStorage.setItem('starVisualsAuthPrompted','1'); closeAuth(true); toast('Welcome to STAR VISUALS — your studio is ready.');
  await loadStudio();
  navigateAfterAuth();
}
document.getElementById('sendOtpBtn')?.addEventListener('click',sendOtp);
document.getElementById('verifyOtpBtn')?.addEventListener('click',verifyOtp);
document.getElementById('changePhoneBtn')?.addEventListener('click',()=>{otpStep?.classList.add('hidden');document.getElementById('phoneNumber')?.focus();setAuthStatus('Enter your mobile number again.')});

loginForm?.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!db){setAuthStatus(authUnavailableMessage,true);return}
  const email=document.getElementById('loginEmail').value.trim(),password=document.getElementById('loginPassword').value;
  setAuthBusy(loginForm,true,'Signing in');setAuthStatus('Signing you in…');
  try{
    const {error}=await withAuthTimeout(db.auth.signInWithPassword({email,password}));
    if(error){setAuthStatus(friendlyError(error),true);return}
  }catch(error){setAuthStatus(friendlyError(error),true);return}
  finally{setAuthBusy(loginForm,false)}
  localStorage.setItem('starVisualsAuthPrompted','1'); closeAuth(true); toast('Signed in — your My Studio is connected.'); await loadStudio();
  navigateAfterAuth();
});
forgotPasswordBtn?.addEventListener('click',()=>{
  loginForm?.classList.add('hidden');
  signupForm?.classList.add('hidden');
  resetForm?.classList.remove('hidden');
  const email=document.getElementById('loginEmail')?.value.trim();
  const resetEmail=document.getElementById('resetEmail');
  if(resetEmail&&email)resetEmail.value=email;
  setAuthStatus('Enter your email and we will send a password reset link.');
  resetEmail?.focus();
});
document.getElementById('backToLoginBtn')?.addEventListener('click',()=>switchAuthMode('email-login'));
resetForm?.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!db){setAuthStatus(authUnavailableMessage,true);return}
  const email=document.getElementById('resetEmail').value.trim();
  setAuthStatus('Sending your password reset link…');
  try{
    const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:`${location.origin}${location.pathname}`});
    if(error){setAuthStatus(friendlyError(error),true);return}
  }catch(error){setAuthStatus(friendlyError(error),true);return}
  setAuthStatus('Check your email for a link to create a new password.');
});
updatePasswordForm?.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!db){setAuthStatus(authUnavailableMessage,true);return}
  const password=document.getElementById('newPassword').value,confirmation=document.getElementById('newPasswordConfirm').value;
  if(password.length<6){setAuthStatus('Your password must be at least 6 characters.',true);return}
  if(password!==confirmation){setAuthStatus('Your passwords do not match.',true);return}
  setAuthStatus('Updating your password…');
  try{
    const {error}=await db.auth.updateUser({password});
    if(error){setAuthStatus(friendlyError(error),true);return}
  }catch(error){setAuthStatus(friendlyError(error),true);return}
  updatePasswordForm.reset(); closeAuth(); toast('Your password has been updated.');
});
signupForm?.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!db){setAuthStatus(authUnavailableMessage,true);return}
  const name=document.getElementById('signupName').value.trim(),email=document.getElementById('signupEmail').value.trim(),password=document.getElementById('signupPassword').value,confirmation=document.getElementById('signupPasswordConfirm').value;
  if(!name){setAuthStatus('Please enter your full name.',true);return}
  if(password.length<6){setAuthStatus('Your password must be at least 6 characters.',true);return}
  if(password!==confirmation){setAuthStatus('Your passwords do not match.',true);return}
  setAuthBusy(signupForm,true,'Creating account');setAuthStatus('Creating your secure account…');
  let data,error;
  try{
    const emailRedirectTo=location.origin==='null'?undefined:`${location.origin}${location.pathname}`;
    ({data,error}=await withAuthTimeout(db.auth.signUp({email,password,options:{data:{full_name:name},...(emailRedirectTo?{emailRedirectTo}: {})}})));
  }catch(requestError){setAuthStatus(friendlyError(requestError),true);return}
  finally{setAuthBusy(signupForm,false)}
  if(error){setAuthStatus(friendlyError(error),true);return}
  if(data.session){
    localStorage.setItem('starVisualsAuthPrompted','1'); closeAuth(true); toast('Account created. Welcome to STAR VISUALS.'); await loadStudio();
    navigateAfterAuth();
  }else setAuthStatus('Account created. Check your inbox and spam folder for the Supabase confirmation email, then return here to log in.');
});

document.querySelectorAll('video.showreel').forEach(v=>v.addEventListener('error',()=>{v.hidden=true;v.nextElementSibling?.removeAttribute('hidden')}));
async function loadCoursesFromDatabase(){
  if(!db)return;
  const {data,error}=await db.from('courses').select('id,title,description,duration,delivery,price_inr').eq('published',true).order('sort_order');
  if(error||!data?.length)return;
  const buttons=[...document.querySelectorAll('.course-action')];
  data.forEach((c,i)=>{
    const b=buttons.find(x=>x.dataset.courseId===c.id)||buttons[i];
    if(!b)return;
    b.dataset.courseId=c.id;b.dataset.course=c.title;
    const card=b.closest('.course-card');if(!card)return;
    const h=card.querySelector('h3');
    if(h){const w=c.title.split(' ');h.innerHTML=`${escapeHtml(w.shift()||c.title)}<br><em>${escapeHtml(w.join(' '))}</em>`}
    if(c.description)card.querySelector('p')?.replaceChildren(document.createTextNode(c.description));
    const m=card.querySelectorAll('.course-meta span');
    if(m[0]&&c.duration)m[0].textContent=c.duration;
    if(m[1]&&c.delivery)m[1].textContent=c.delivery;
  });
}
const courseModal=document.getElementById('courseModal');let selectedCourse=null;const fallback={'Editing From Scratch':'A complete foundation for creators: project setup, clean cuts, pacing, music, dialogue, colour basics and export.','Cinematic Editing':'Learn to create mood with rhythm, music, composition, sound design, colour and intentional transitions.','Motion & VFX':'Explore motion graphics, visual effects, compositing and post-production techniques that add impact without clutter.'};
function openCourse(c){selectedCourse=c;if(!courseModal)return;document.getElementById('courseModalTitle').textContent=c.title;document.getElementById('courseModalText').textContent=c.description||fallback[c.title]||'Practical lessons and projects from STAR VISUALS.';courseModal.classList.add('open');courseModal.setAttribute('aria-hidden','false');document.body.classList.add('modal-open')}
function closeCourse(){courseModal?.classList.remove('open');courseModal?.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open')}
document.querySelector('[data-close-course]')?.addEventListener('click',closeCourse);courseModal?.addEventListener('click',e=>{if(e.target===courseModal)closeCourse()});document.querySelectorAll('.course-action').forEach(b=>b.addEventListener('click',async()=>{const c={id:b.dataset.courseId,title:b.dataset.course||'Course'};if(db&&c.id){const {data}=await db.from('courses').select('*').eq('id',c.id).maybeSingle();if(data)Object.assign(c,data)}openCourse(c)}));
document.querySelector('[data-course-signup]')?.addEventListener('click',()=>{closeCourse();openAuth('phone-signup')});
function animateSocialCounters(){document.querySelectorAll('.social-count').forEach((node)=>{const target=Number(node.dataset.base||0);const format=(value)=>{if(value>=1000000)return `${(value/1000000).toFixed(1)}M+`;if(value>=1000)return `${(value/1000).toFixed(value>=100000?0:1)}K+`;return `${Math.round(value)}+`};const started=performance.now();const duration=1400;const step=(now)=>{const progress=Math.min(1,(now-started)/duration);const eased=1-Math.pow(1-progress,3);node.textContent=format(target*eased);if(progress<1)requestAnimationFrame(step)};requestAnimationFrame(step);});}
async function loadStudio(){if(!db)return;const {data:{session}}=await db.auth.getSession();updateHeaderAuth(session);const locked=document.getElementById('accountLocked'),dash=document.getElementById('accountDashboard');if(!locked&&!dash)return;if(!session?.user){locked?.classList.remove('hidden');dash?.classList.add('hidden');return}locked?.classList.add('hidden');dash?.classList.remove('hidden');const u=session.user;const {data:profile}=await db.from('profiles').select('full_name,email,created_at').eq('id',u.id).maybeSingle();const name=profile?.full_name||u.user_metadata?.full_name||'Creator';const contact=u.phone||profile?.email||u.email||'—';document.getElementById('dashAvatar').textContent=initials(name);document.getElementById('dashName').textContent=name;document.getElementById('dashContact').textContent=contact;document.getElementById('profileName').textContent=name;document.getElementById('profileContact').textContent=contact;document.getElementById('profileDate').textContent=profile?.created_at?new Date(profile.created_at).toLocaleDateString('en-IN'):'—';const pr=await db.from('course_purchases').select('id,status,progress,purchased_at,course:courses(title,duration,delivery)').eq('user_id',u.id).in('status',['paid']).order('created_at',{ascending:false});const box=document.getElementById('coursePurchases');if(pr.error)box.innerHTML='<span>!</span><p>Could not load your courses right now.</p>';else if(!pr.data?.length)box.innerHTML='<span>✦</span><p>No purchased courses yet.</p><a class="text-button" href="courses.html">Explore courses →</a>';else box.innerHTML=pr.data.map(i=>`<div class="purchased-course"><strong>${escapeHtml(i.course?.title||'Course')}</strong><span>${escapeHtml(i.course?.duration||'STAR VISUALS course')}</span><div class="progress"><i style="width:${Math.max(0,Math.min(100,Number(i.progress||0)))}%"></i></div><small>${Number(i.progress||0)}% complete · ${escapeHtml(i.status)}</small></div>`).join('');const dr=await db.from('project_requests').select('project_name,service_type,package_name,amount_inr,status,deadline,admin_notes,updated_at').eq('user_id',u.id).order('updated_at',{ascending:false}).limit(1).maybeSingle();const d=dr.data;document.getElementById('dealStatus').textContent=d?.status?d.status.replace('_',' '):'No active deal';document.getElementById('dealProject').textContent=d?.project_name||'—';document.getElementById('dealPackage').textContent=d?.service_type||d?.package_name||'—';document.getElementById('dealAmount').textContent=d?.amount_inr!=null?`₹${Number(d.amount_inr).toLocaleString('en-IN')}`:'—'}
document.getElementById('logoutBtn')?.addEventListener('click',async()=>{
  const button=document.getElementById('logoutBtn');
  if(!db||button?.disabled)return;
  if(button)button.disabled=true;
  try{
    await withAuthTimeout(db.auth.signOut({scope:'local'}));
    localStorage.removeItem('starVisualsAuthPrompted');
    updateHeaderAuth(null);
    document.getElementById('accountLocked')?.classList.remove('hidden');
    document.getElementById('accountDashboard')?.classList.add('hidden');
    closeAuth();
    location.href='login.html?logged-out=1';
  }catch(error){
    if(button)button.disabled=false;
    toast(friendlyError(error));
  }
});

const projectForm=document.getElementById('projectForm');
const projectStatus=document.getElementById('projectStatus');
function setProjectStatus(m,err=false){if(projectStatus){projectStatus.textContent=m;projectStatus.classList.toggle('error',err)}}
projectForm?.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!db){setProjectStatus('Your request could not be submitted. Please try again.',true);console.error('Project request submission unavailable: Supabase configuration is missing or invalid.');return}
  setProjectStatus('Checking your account…');
  const {data:{session}}=await db.auth.getSession();
  if(!session?.user){
    openAuth('email-signup','project.html');
    return;
  }
  const fd=new FormData(projectForm);
  const projectName=String(fd.get('project_name')||'').trim();
  const packageName=String(fd.get('service_type')||'').trim();
  const budgetRaw=String(fd.get('budget')||'').trim();
  const amount=budgetRaw?Number(budgetRaw):null;
  const details={
    full_name:String(fd.get('full_name')||'').trim(),
    email:String(fd.get('email')||'').trim(),
    phone:String(fd.get('phone')||'').trim(),
    service_type:packageName,
    video_duration:String(fd.get('video_duration')||'').trim(),
    platform:String(fd.get('platform')||'').trim(),
    style:String(fd.get('style')||'').trim(),
    deadline:String(fd.get('deadline')||'').trim(),
    footage_link:String(fd.get('footage_link')||'').trim(),
    reference_link:String(fd.get('reference_link')||'').trim(),
    budget:budgetRaw,
    brief:String(fd.get('brief')||'').trim(),
    submitted_at:new Date().toISOString()
  };
  if(!projectName||!packageName||!details.full_name||!details.phone||!details.brief){setProjectStatus('Please complete the required fields marked *.',true);return}
  const {error}=await db.from('project_requests').insert({user_id:session.user.id,full_name:details.full_name,email:details.email||session.user.email||'',phone:details.phone,project_name:projectName,service_type:packageName,video_duration:details.video_duration,platform:details.platform,editing_style:details.style,requirements:details.brief,deadline:details.deadline||null,budget:budgetRaw,footage_link:details.footage_link,reference_link:details.reference_link,additional_notes:'',status:'NEW',package_name:packageName,amount_inr:Number.isFinite(amount)?amount:null,notes:JSON.stringify(details)});
  if(error){console.error('Project request submission failed:',error);setProjectStatus('Your request could not be submitted. Please try again.',true);return}
  projectForm.reset();
  setProjectStatus('Project enquiry submitted. You can track the deal from My Studio.');
  toast('Project enquiry sent to STAR VISUALS.');
});

const assetCatalogFallback=[
  {id:'cinematic-reel-pack',name:'Cinematic Reel Pack',description:'12 layouts built for fast reel storytelling and hero cuts.',category:'Layout Templates',thumbnail_url:'assets/asset-pack/asset-library-cover.svg',preview_url:'https://example.com/preview/cinematic-reel-pack',file_url:'https://example.com/downloads/cinematic-reel-pack.zip',file_type:'ZIP',file_size:'48 MB',software:'Premiere Pro',access_type:'free',price:0},
  {id:'premium-motion-pack',name:'Premium Motion Pack',description:'25 motion preset animations for transitions, reveals and text movement.',category:'After Effects Templates',thumbnail_url:'assets/asset-pack/asset-library-cover.svg',preview_url:'https://example.com/preview/premium-motion-pack',file_url:'https://example.com/downloads/premium-motion-pack.zip',file_type:'ZIP',file_size:'96 MB',software:'After Effects',access_type:'premium',price:199},
  {id:'thumbnail-templates',name:'Thumbnail Formula Pack',description:'High-contrast thumbnail layouts for content and shorts growth.',category:'Thumbnail Templates',thumbnail_url:'assets/asset-pack/asset-library-cover.svg',preview_url:'https://example.com/preview/thumbnail-formula-pack',file_url:'https://example.com/downloads/thumbnail-formula-pack.zip',file_type:'PSD',file_size:'32 MB',software:'Photoshop',access_type:'premium',price:149},
  {id:'reels-transitions',name:'Reels Transition Pack',description:'Fast-moving transitions and sparkle moments for social media edits.',category:'Transition Packs',thumbnail_url:'assets/asset-pack/asset-library-cover.svg',preview_url:'https://example.com/preview/reels-transition-pack',file_url:'https://example.com/downloads/reels-transition-pack.zip',file_type:'ZIP',file_size:'52 MB',software:'Premiere Pro',access_type:'free',price:0},
  {id:'cinematic-luts',name:'Cinematic LUT Pack',description:'Warm contrast and highlight balancing presets for reels and interviews.',category:'LUTs / Color Presets',thumbnail_url:'assets/asset-pack/asset-library-cover.svg',preview_url:'https://example.com/preview/cinematic-lut-pack',file_url:'https://example.com/downloads/cinematic-lut-pack.zip',file_type:'CUBE',file_size:'14 MB',software:'DaVinci Resolve',access_type:'premium',price:99},
  {id:'sfx-bundle',name:'Creator SFX Bundle',description:'Clean cinematic impacts, whooshes and ambience pack for edit finishing.',category:'SFX / Audio Packs',thumbnail_url:'assets/asset-pack/asset-library-cover.svg',preview_url:'https://example.com/preview/creator-sfx-bundle',file_url:'https://example.com/downloads/creator-sfx-bundle.zip',file_type:'ZIP',file_size:'70 MB',software:'Premiere Pro / Audition',access_type:'free',price:0}
];
window.STAR_VISUALS_ASSET_CATALOG=(window.STAR_VISUALS_ASSET_CATALOG||assetCatalogFallback).length?window.STAR_VISUALS_ASSET_CATALOG||assetCatalogFallback:assetCatalogFallback;

function normalizeAsset(asset){const item={...asset};item.id=item.id||String(item.name||'asset').toLowerCase().replace(/[^a-z0-9]+/g,'-');item.category=item.category||'Other Creative Assets';item.access_type=(item.access_type||item.accessType||'free').toLowerCase();item.price=Number(item.price||0);item.file_size=item.file_size||item.fileSize||'—';item.software=item.software||'Any';item.thumbnail_url=item.thumbnail_url||'assets/asset-pack/asset-library-cover.svg';item.published=item.published!==false;return item;}
function formatAssetPrice(asset){const item=normalizeAsset(asset);return item.access_type==='free'?'FREE':`₹${Number(item.price||0).toLocaleString('en-IN')}`;}
function assetLockLabel(asset){const item=normalizeAsset(asset);return item.access_type==='premium' ? '<span class=\'asset-lock\'>Premium access</span>' : '<span class=\'asset-lock\'>Free</span>'}
function findAssetById(assetId){const catalog=window.STAR_VISUALS_ASSET_CATALOG||[];return [...catalog].map(normalizeAsset).find((asset)=>String(asset.id)===String(assetId))||null;}
function setAssetStatus(message,error=false){const el=document.getElementById('assetStatus');if(!el)return;el.textContent=message;el.classList.toggle('error',Boolean(error));}

async function handleAssetDownload(asset){
  const item=normalizeAsset(asset);
  if(!db){toast('Connect Supabase in supabase-config.js to unlock asset downloads.');return;}
  const {data:{session}}=await db.auth.getSession();
  if(item.access_type==='premium'&&!session?.user){openAuth('email-login');toast('Log in to unlock premium assets.');return;}
  const directUrl=item.file_url||item.preview_url;
  if(!directUrl){toast('This asset is not available yet.');return;}
  if(item.access_type==='premium'&&session?.user){
    const {data:accessRecord}=await db.from('user_asset_access').select('id').eq('user_id',session.user.id).eq('asset_id',item.id).maybeSingle();
    if(!accessRecord){
      const {error}=await db.from('user_asset_access').insert({user_id:session.user.id,asset_id:item.id,access_type:'premium',status:'downloaded'});
      if(error){toast(friendlyError(error));return;}
    }
  }
  if(typeof window !== 'undefined' && /^https?:\/\//i.test(directUrl)){window.open(directUrl,'_blank','noopener');toast(item.access_type==='premium'?'Premium asset unlocked.':'Asset downloaded.');return;}
  if(db.storage && item.file_url && !/^https?:\/\//i.test(item.file_url)){
    const {data,error}=await db.storage.from('asset-library').createSignedUrl(item.file_url,3600);
    if(error){toast(friendlyError(error));return;}
    if(data?.signedUrl){window.open(data.signedUrl,'_blank','noopener');toast(item.access_type==='premium'?'Premium asset unlocked.':'Asset downloaded.');return;}
  }
  toast('This asset is not available yet.');
}

function renderAssetCards(containerId, assets){
  const list=document.getElementById(containerId);
  if(!list)return;
  const catalog=(assets||window.STAR_VISUALS_ASSET_CATALOG||[]).map(normalizeAsset);
  window.STAR_VISUALS_ASSET_CATALOG = catalog;
  if(!catalog.length){list.innerHTML='<div class="asset-empty">No published assets yet. Try again soon.</div>';return;}
  list.innerHTML=catalog.map((asset)=>`<article class="asset-card ${asset.access_type==='premium'?'premium':''}"><div class="asset-thumb" style="background-image:url('${escapeHtml(asset.thumbnail_url)}')"><span class="asset-badge ${asset.access_type==='premium'?'premium':''}">${asset.access_type==='premium'?'Premium':'Free'}</span></div><div class="asset-content"><div class="asset-meta-top"><span class="asset-category">${escapeHtml(asset.category)}</span>${asset.access_type==='premium'?'<span class="asset-lock">Premium</span>':'<span class="asset-lock">Free</span>'}</div><h4>${escapeHtml(asset.name)}</h4><p>${escapeHtml(asset.description||'Creative asset for faster editing workflows.')}</p><div class="asset-specs"><div>Software<strong>${escapeHtml(asset.software)}</strong></div><div>Type<strong>${escapeHtml(asset.file_type||'ZIP')}</strong></div><div>Size<strong>${escapeHtml(asset.file_size||'—')}</strong></div><div>Price<strong>${formatAssetPrice(asset)}</strong></div></div><div class="asset-price">${formatAssetPrice(asset)}</div><div class="asset-actions"><button class="asset-button" type="button" data-asset-id="${escapeHtml(String(asset.id))}" data-asset-action="preview">Preview</button><button class="asset-button primary" type="button" data-asset-id="${escapeHtml(String(asset.id))}" data-asset-action="download">${asset.access_type==='premium'?'Get Asset':'Download'}</button></div></div></article>`).join('');
}

async function loadAssetCatalog(){
  const catalogElement=document.getElementById('assetLibraryGrid')||document.getElementById('servicesAssetGrid');
  if(!catalogElement)return;
  let assets = [...assetCatalogFallback];
  if(db){
    const {data,error}=await db.from('asset_library').select('*').eq('published',true).order('created_at',{ascending:false});
    if(!error && data?.length){assets=data.map(normalizeAsset);} 
  }
  window.STAR_VISUALS_ASSET_CATALOG = assets.map(normalizeAsset);
  renderAssetCards(catalogElement.id, assets);
}

async function loadMyAssets(){
  const myAssetList=document.getElementById('myAssetList');
  if(!myAssetList)return;
  if(!db){myAssetList.innerHTML='<div class="asset-empty">Connect Supabase to view your asset access.</div>';return;}
  const {data:{session}}=await db.auth.getSession();
  if(!session?.user){myAssetList.innerHTML='<div class="asset-empty">Log in to see downloaded and premium assets.</div>';return;}
  const {data:accessRows,error:accessError}=await db.from('user_asset_access').select('*').eq('user_id',session.user.id).order('created_at',{ascending:false});
  if(accessError){myAssetList.innerHTML='<div class="asset-empty">Could not load your assets right now.</div>';return;}
  const allowedIds=(accessRows||[]).map(row=>row.asset_id);
  const {data:assetsData}=allowedIds.length?await db.from('asset_library').select('*').in('id',allowedIds).eq('published',true):{data:[]};
  const accessMap=new Map((accessRows||[]).map(row=>[String(row.asset_id),row]));
  const assets=(assetsData||[]).map(normalizeAsset).slice(0,4);
  if(!assets.length){myAssetList.innerHTML='<div class="asset-empty">No assets unlocked yet.</div>';return;}
  myAssetList.innerHTML=assets.map((asset)=>`<div class="purchased-course"><strong>${escapeHtml(asset.name)}</strong><span>${escapeHtml(accessMap.get(String(asset.id))?.status==='downloaded'?'Downloaded':'Purchased')}</span><button class="asset-button primary" type="button" data-asset-id="${escapeHtml(String(asset.id))}" data-asset-action="download">${accessMap.get(String(asset.id))?.status==='downloaded'?'Download Again':'Download'}</button></div>`).join('');
}

document.addEventListener('click',async (event)=>{
  const target=event.target.closest('[data-asset-action]');
  if(!target)return;
  const assetId=target.dataset.assetId;
  const assetAction=target.dataset.assetAction;
  const asset=findAssetById(assetId);
  if(!asset)return;
  if(assetAction==='preview'){if(asset.preview_url){window.open(asset.preview_url,'_blank','noopener');}else toast('Preview is coming soon.');return;}
  if(assetAction==='download'){await handleAssetDownload(asset);}
});

async function loadAdminAssets(){
  const list=document.getElementById('adminAssetList');
  if(!list||!db)return;
  const {data,error}=await db.from('asset_library').select('*').order('created_at',{ascending:false});
  if(error){list.innerHTML='<div class="admin-empty">Assets could not be loaded.</div>';return;}
  if(!data?.length){list.innerHTML='<div class="admin-empty">No assets yet. Add your first resource above.</div>';return;}
  list.innerHTML=data.map((asset)=>`<article class="admin-request"><div class="admin-request-head"><div><span class="admin-index">${escapeHtml(asset.access_type||'free')}</span><h3>${escapeHtml(asset.name)}</h3></div><div class="asset-admin-actions compact"><button class="outline-btn" type="button" data-asset-edit="${asset.id}">Edit</button><button class="outline-btn" type="button" data-asset-delete="${asset.id}">Delete</button></div></div><div class="admin-request-grid"><div><span>Category</span><strong>${escapeHtml(asset.category||'Other Creative Assets')}</strong></div><div><span>Downloads</span><strong>${Number(asset.downloads_count||0)}</strong></div><div><span>Purchases</span><strong>${Number(asset.purchases_count||0)}</strong></div></div><div class="admin-brief"><span>DETAILS</span><p>${escapeHtml(asset.description||'No description yet.')}</p></div></article>`).join('');
}

const assetForm=document.getElementById('assetForm');
const assetEditId=document.getElementById('assetEditId');
assetForm?.addEventListener('submit',async (event)=>{
  event.preventDefault();
  if(!db){setAssetStatus('Connect Supabase before managing assets.',true);return;}
  const payload={
    name:String(document.getElementById('assetName')?.value||'').trim(),
    description:String(document.getElementById('assetDescription')?.value||'').trim(),
    category:String(document.getElementById('assetCategory')?.value||'Other Creative Assets').trim(),
    software:String(document.getElementById('assetSoftware')?.value||'').trim(),
    file_type:String(document.getElementById('assetFileType')?.value||'ZIP').trim(),
    file_size:String(document.getElementById('assetFileSize')?.value||'—').trim(),
    thumbnail_url:String(document.getElementById('assetThumbnail')?.value||'assets/asset-pack/asset-library-cover.svg').trim(),
    preview_url:String(document.getElementById('assetPreview')?.value||'').trim(),
    file_url:String(document.getElementById('assetFileUrl')?.value||'').trim(),
    access_type:String(document.getElementById('assetAccessType')?.value||'free').trim(),
    price:Number(document.getElementById('assetPrice')?.value||0),
    published:String(document.getElementById('assetPublished')?.value||'true')==='true',
    updated_at:new Date().toISOString()
  };
  if(!payload.name||!payload.file_url){setAssetStatus('Asset name and file URL are required.',true);return;}
  setAssetStatus('Saving asset…');
  let result;
  if(assetEditId && assetEditId.value){
    result=await db.from('asset_library').update(payload).eq('id',assetEditId.value);
  }else{
    result=await db.from('asset_library').insert(payload);
  }
  if(result.error){setAssetStatus(friendlyError(result.error),true);return;}
  assetForm.reset(); if(assetEditId)assetEditId.value=''; setAssetStatus('Asset saved. The library has been updated.'); await loadAdminAssets(); await loadAssetCatalog();
});

document.getElementById('assetResetForm')?.addEventListener('click',()=>{
  assetForm?.reset(); if(assetEditId)assetEditId.value=''; setAssetStatus('Ready to add a new resource.');
});

document.getElementById('adminAssetList')?.addEventListener('click',async (event)=>{
  const editButton=event.target.closest('[data-asset-edit]');
  if(editButton && db){
    const {data,error}=await db.from('asset_library').select('*').eq('id',editButton.dataset.assetEdit).maybeSingle();
    if(error||!data){setAssetStatus(friendlyError(error||'Asset not found.'),true);return;}
    document.getElementById('assetEditId').value=data.id;
    document.getElementById('assetName').value=data.name||'';
    document.getElementById('assetDescription').value=data.description||'';
    document.getElementById('assetCategory').value=data.category||'Other Creative Assets';
    document.getElementById('assetSoftware').value=data.software||'';
    document.getElementById('assetFileType').value=data.file_type||'ZIP';
    document.getElementById('assetFileSize').value=data.file_size||'';
    document.getElementById('assetAccessType').value=data.access_type||'free';
    document.getElementById('assetPrice').value=Number(data.price||0);
    document.getElementById('assetThumbnail').value=data.thumbnail_url||'';
    document.getElementById('assetPreview').value=data.preview_url||'';
    document.getElementById('assetFileUrl').value=data.file_url||'';
    document.getElementById('assetPublished').value=data.published ? 'true' : 'false';
    setAssetStatus('Asset loaded for editing.');
    return;
  }
  const deleteButton=event.target.closest('[data-asset-delete]');
  if(deleteButton && db){
    const assetId=deleteButton.dataset.assetDelete;
    const {error}=await db.from('asset_library').delete().eq('id',assetId);
    if(error){setAssetStatus(friendlyError(error),true);return;}
    setAssetStatus('Asset deleted from the library.');
    await loadAdminAssets();
  }
});

async function init(){animateSocialCounters();await loadCoursesFromDatabase();await loadAssetCatalog();await loadStudio();if(document.getElementById('myAssetList'))await loadMyAssets();if(adminRequests)await loadAdminRequests();if(document.getElementById('adminAssetList'))await loadAdminAssets();if(!db)return;db.auth.onAuthStateChange((event)=>{if(event==='PASSWORD_RECOVERY')showPasswordUpdate();if(event==='SIGNED_IN'&&isLoginPage)navigateAfterAuth();loadStudio();if(adminRequests)loadAdminRequests();if(document.getElementById('adminAssetList'))loadAdminAssets();if(document.getElementById('myAssetList'))loadMyAssets();});}
init();
