const adminStatus=document.getElementById('adminStatus');
const adminRequests=document.getElementById('adminRequests');
function setAdminStatus(message,error=false){if(adminStatus){adminStatus.textContent=message;adminStatus.classList.toggle('error',error)}}
function adminRequestCard(request,profile){const contact=request.email||profile?.email||'No email provided';const phone=request.phone||'No phone provided';const service=request.service_type||request.package_name||'Editing request';const brief=request.requirements||'No brief provided';return `<article class="admin-request"><div class="admin-request-head"><div><span class="admin-index">${escapeHtml(request.project_name)}</span><h3>${escapeHtml(service)}</h3></div><select class="admin-status-select" data-request-id="${request.id}" aria-label="Update request status"><option value="NEW" ${request.status==='NEW'?'selected':''}>New</option><option value="REVIEWING" ${request.status==='REVIEWING'?'selected':''}>Reviewing</option><option value="QUOTED" ${request.status==='QUOTED'?'selected':''}>Quoted</option><option value="APPROVED" ${request.status==='APPROVED'?'selected':''}>Approved</option><option value="IN PROGRESS" ${request.status==='IN PROGRESS'?'selected':''}>In progress</option><option value="REVISION" ${request.status==='REVISION'?'selected':''}>Revision</option><option value="COMPLETED" ${request.status==='COMPLETED'?'selected':''}>Completed</option><option value="CANCELLED" ${request.status==='CANCELLED'?'selected':''}>Cancelled</option></select></div><div class="admin-request-grid"><div><span>CLIENT</span><strong>${escapeHtml(request.full_name||profile?.full_name||'Unknown')}</strong><small>${escapeHtml(contact)}<br>${escapeHtml(phone)}</small></div><div><span>SERVICE / PLATFORM</span><strong>${escapeHtml(service)}</strong><small>${escapeHtml(request.platform||'Platform not specified')} · ${escapeHtml(request.video_duration||'Duration not specified')}</small></div><div><span>BUDGET / DEADLINE</span><strong>${escapeHtml(request.budget||'Not specified')}</strong><small>${escapeHtml(request.deadline||'No deadline')} · ${request.created_at?new Date(request.created_at).toLocaleDateString('en-IN'):''}</small></div></div><div class="admin-brief"><span>PROJECT BRIEF</span><p>${escapeHtml(brief)}</p>${request.footage_link?`<a href="${escapeHtml(request.footage_link)}" target="_blank" rel="noopener">Open footage link ↗</a>`:''}${request.reference_link?`<a href="${escapeHtml(request.reference_link)}" target="_blank" rel="noopener">Open reference link ↗</a>`:''}</div><label class="admin-brief"><span>ADMIN MESSAGE</span><textarea data-admin-notes="${request.id}" rows="3" placeholder="Message visible in My Studio">${escapeHtml(request.admin_notes||'')}</textarea></label></article>`}async function loadAdminRequests(){if(!adminRequests||!db)return;setAdminStatus('Checking administrator access…');adminRequests.innerHTML='<div class="admin-empty">Loading requests…</div>';const {data:{session}}=await db.auth.getSession();if(!session?.user){location.href='login.html?returnTo=admin.html';return}const {data:isAdmin,error:adminError}=await db.rpc('project_request_admin_check');if(adminError||!isAdmin){location.href='dashboard.html';return}const {data:requests,error}=await db.from('project_requests').select('id,user_id,full_name,email,phone,project_name,service_type,video_duration,platform,editing_style,requirements,deadline,budget,footage_link,reference_link,additional_notes,status,admin_notes,created_at,updated_at,package_name,amount_inr,notes').order('created_at',{ascending:false});if(error){console.error('Project request load failed:',error);setAdminStatus(friendlyError(error),true);adminRequests.innerHTML='<div class="admin-empty">Requests could not be loaded.</div>';return}const ids=[...new Set((requests||[]).map(request=>request.user_id))];const {data:profiles}=ids.length?await db.from('profiles').select('id,full_name,email').in('id',ids):{data:[]};const profileMap=new Map((profiles||[]).map(profile=>[profile.id,profile]));adminRequests.innerHTML=requests?.length?requests.map(request=>adminRequestCard(request,profileMap.get(request.user_id))).join(''):'<div class="admin-empty">No editing requests yet.</div>';setAdminStatus(`${requests?.length||0} request${requests?.length===1?'':'s'} found.`)}
document.getElementById('adminRefresh')?.addEventListener('click',loadAdminRequests);
adminRequests?.addEventListener('change',async event=>{const select=event.target.closest('.admin-status-select');if(!select||!db)return;select.disabled=true;const {error}=await db.from('project_requests').update({status:select.value,updated_at:new Date().toISOString()}).eq('id',select.dataset.requestId);select.disabled=false;if(error){console.error('Project request status update failed:',error);setAdminStatus(friendlyError(error),true);return}setAdminStatus('Request status updated.')});adminRequests?.addEventListener('change',async event=>{const notes=event.target.closest('[data-admin-notes]');if(!notes||!db)return;const {error}=await db.from('project_requests').update({admin_notes:notes.value,updated_at:new Date().toISOString()}).eq('id',notes.dataset.adminNotes);if(error){console.error('Admin note update failed:',error);setAdminStatus(friendlyError(error),true);return}setAdminStatus('Admin message saved.')});
/* STAR VISUALS — shared UI, email/password + Google authentication and Supabase data */
document.body.classList.toggle('services-page-active',Boolean(document.querySelector('.pricing-card')));
/* STAR VISUALS — mobile bottom navigation */
function ensureBottomNavigation(){
  if(document.getElementById('starBottomNav'))return;
  const nav=document.createElement('nav');
  nav.id='starBottomNav';
  nav.className='star-bottom-nav';
  nav.setAttribute('aria-label','Mobile primary navigation');
  nav.innerHTML=`
    <a class="star-bottom-nav__item" data-bottom-route="index.html" href="index.html">
      <span class="star-bottom-nav__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M3.5 10.8 12 3.8l8.5 7v8.7a1 1 0 0 1-1 1h-5.2v-6.1H9.7v6.1H4.5a1 1 0 0 1-1-1v-8.7Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg></span><span class="star-bottom-nav__label">Home</span>
    </a>
    <a class="star-bottom-nav__item" data-bottom-route="services.html" href="services.html">
      <span class="star-bottom-nav__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="m19.2 15 .8 2.5 2.5.8-2.5.8-.8 2.5-.8-2.5-2.5-.8 2.5-.8.8-2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg></span><span class="star-bottom-nav__label">Services</span>
    </a>
    <a class="star-bottom-nav__item" data-bottom-route="courses.html" href="courses.html">
      <span class="star-bottom-nav__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="m3.5 8 8.5-4 8.5 4-8.5 4-8.5-4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M6.2 10.1v5.2c2.1 2 9.5 2 11.6 0v-5.2M20.5 8v7.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span><span class="star-bottom-nav__label">Courses</span>
    </a>
    <a class="star-bottom-nav__item" data-bottom-account href="dashboard.html">
      <span class="star-bottom-nav__icon" aria-hidden="true"><svg class="star-bottom-nav__dashboard-icon" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="3.5" width="7" height="7" rx="1.2" stroke="currentColor" stroke-width="1.7"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.2" stroke="currentColor" stroke-width="1.7"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.2" stroke="currentColor" stroke-width="1.7"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.2" stroke="currentColor" stroke-width="1.7"/></svg></span><span class="star-bottom-nav__label">Dashboard</span>
    </a>`;
  document.body.appendChild(nav);
  nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>nav.classList.add('is-navigating')));
  syncBottomNavigation(false);
}
function syncBottomNavigation(isAdmin=false){
  const nav=document.getElementById('starBottomNav');
  if(!nav)return;
  const current=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  nav.querySelectorAll('.star-bottom-nav__item').forEach(item=>item.classList.remove('is-active'));
  nav.querySelectorAll('[data-bottom-route]').forEach(item=>{
    const route=item.dataset.bottomRoute;
    const active=(current===route)||(!current&&route==='index.html');
    item.classList.toggle('is-active',active);
  });
  const account=nav.querySelector('[data-bottom-account]');
  if(account){
    const adminPage=current==='admin.html';
    const adminMode=Boolean(isAdmin)||adminPage;
    account.href=adminMode?'admin.html':'dashboard.html';
    account.querySelector('.star-bottom-nav__label').textContent=adminMode?'Admin Panel':'Dashboard';
    account.setAttribute('aria-label',adminMode?'Open Admin Panel':'Open Dashboard');
    account.classList.toggle('is-active',adminMode?adminPage:current==='dashboard.html');
    const icon=account.querySelector('svg');
    if(icon)icon.outerHTML=adminMode
      ? '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3.5 20 6.8v5.1c0 4.2-2.9 7.3-8 8.6-5.1-1.3-8-4.4-8-8.6V6.8l8-3.3Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="m9.2 12 1.9 1.9 3.8-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none"><rect x="3.5" y="3.5" width="7" height="7" rx="1.2" stroke="currentColor" stroke-width="1.7"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.2" stroke="currentColor" stroke-width="1.7"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.2" stroke="currentColor" stroke-width="1.7"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.2" stroke="currentColor" stroke-width="1.7"/></svg>';
  }
  nav.classList.remove('is-navigating');
}
ensureBottomNavigation();
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
function friendlyError(error){const m=error?.message||String(error||'Something went wrong.');if(/invalid login credentials/i.test(m))return'Email or password is incorrect.';if(/email not confirmed/i.test(m))return'Please confirm your email first, then log in.';if(/already registered|user already registered/i.test(m))return'An account with this email already exists. Try logging in.';return m}
const cfg=window.STAR_VISUALS_SUPABASE||{};
const validSupabaseUrl=typeof cfg.url==='string'&&/^https:\/\/[^/]+\.supabase\.co\/?$/.test(cfg.url)&&!cfg.url.includes('your-project-id');
const supabaseReady=Boolean(window.supabase?.createClient&&validSupabaseUrl&&cfg.publishableKey&&!cfg.publishableKey.includes('YOUR_SUPABASE'));
const db=supabaseReady?window.supabase.createClient(cfg.url,cfg.publishableKey):null;
window.db=db;
const authUnavailableMessage='Supabase is not connected yet. Add your real project URL in supabase-config.js.';

function ensureAuthOverlay(){
  const existing=document.getElementById('authOverlay');
  const isComplete=existing
    && existing.querySelector('#emailMethod')
    && existing.querySelector('#loginEmail')
    && existing.querySelector('#loginPassword')
    && existing.querySelector('#signupEmail')
    && existing.querySelector('#signupPassword')
    && existing.querySelector('#signupPasswordConfirm')
    && existing.querySelector('[data-google-auth]');
  if(existing && isComplete)return existing;
  if(existing)existing.remove();
  const host=document.createElement('div');
  host.innerHTML=`<div class="auth-overlay" id="authOverlay" aria-hidden="true"><div class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="authTitle"><button class="auth-close" type="button" aria-label="Close" data-close-auth>×</button><div class="auth-mark">✦</div><p class="eyebrow">WELCOME TO STAR VISUALS</p><h2 id="authTitle">Your creative<br><em>studio starts here.</em></h2><p class="auth-sub">Sign in or create your account with your email and password.</p><div class="auth-tabs"><button class="active" type="button" data-tab="email-login">Log in</button><button type="button" data-tab="email-signup">Sign up</button></div><div class="auth-method" id="emailMethod"><button class="google-auth-btn" type="button" data-google-auth><span class="google-mark">G</span><span>Continue with Google</span></button><div class="auth-divider"><span>or use email</span></div><form id="loginForm" class="auth-form"><label>Email<input id="loginEmail" type="email" autocomplete="email" placeholder="you@example.com" required></label><label>Password<input id="loginPassword" type="password" autocomplete="current-password" placeholder="Your password" required></label><button class="forgot-link" type="button" id="forgotPasswordBtn">Forgot password?</button><button class="auth-submit" type="submit">Log in with email <span>→</span></button></form><form id="signupForm" class="auth-form hidden"><label>Name<input id="signupName" type="text" autocomplete="name" placeholder="Your name" required></label><label>Email<input id="signupEmail" type="email" autocomplete="email" placeholder="you@example.com" required></label><label>Password<input id="signupPassword" type="password" autocomplete="new-password" minlength="6" placeholder="At least 6 characters" required></label><label>Confirm password<input id="signupPasswordConfirm" type="password" autocomplete="new-password" minlength="6" placeholder="Re-enter your password" required></label><button class="auth-submit" type="submit">Create account <span>→</span></button></form><form id="resetForm" class="auth-form hidden"><label>Email<input id="resetEmail" type="email" autocomplete="email" placeholder="you@example.com" required></label><button class="auth-submit" type="submit">Send reset link <span>→</span></button><button class="text-button auth-change" type="button" id="backToLoginBtn">Back to log in</button></form><form id="updatePasswordForm" class="auth-form hidden"><label>New password<input id="newPassword" type="password" autocomplete="new-password" minlength="6" placeholder="At least 6 characters" required></label><label>Confirm password<input id="newPasswordConfirm" type="password" autocomplete="new-password" minlength="6" placeholder="Re-enter your password" required></label><button class="auth-submit" type="submit">Update password <span>→</span></button></form></div><button class="guest-btn" type="button" data-close-auth>Continue browsing</button><p class="auth-note" id="authStatus">Secure authentication powered by Supabase.</p></div></div>`;
  document.body.appendChild(host.firstElementChild);
  return document.getElementById('authOverlay');
}

const overlay=ensureAuthOverlay();
const isLoginPage=location.pathname.endsWith('/login.html')||location.pathname.endsWith('login.html');
const hasOAuthCallback=location.search.includes('code=')||location.hash.includes('access_token=');
if(isLoginPage){
  overlay?.classList.add('open');overlay?.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');
  if(hasOAuthCallback)setAuthStatus('Finishing Google sign-in…');
}else{overlay?.classList.remove('open');overlay?.setAttribute('aria-hidden','true');}
const loginForm=document.getElementById('loginForm');
const signupForm=document.getElementById('signupForm');
const resetForm=document.getElementById('resetForm');
const updatePasswordForm=document.getElementById('updatePasswordForm');
const forgotPasswordBtn=document.getElementById('forgotPasswordBtn');
const authStatus=document.getElementById('authStatus');
const emailMethod=document.getElementById('emailMethod');
let authReturnTo='';

[loginForm,signupForm].forEach(form=>form?.addEventListener('invalid',()=>setAuthStatus('Please enter a valid email and complete all required fields.',true),true));


document.querySelectorAll('.auth-sub').forEach(el=>el.textContent='Sign in or create your account with your email and password.');
document.querySelectorAll('.auth-tabs button').forEach((button,index)=>{
  button.dataset.tab=index===0?'email-login':'email-signup';
  button.textContent=index===0?'Log in':'Sign up';
});

function setAuthStatus(m,err=false){if(authStatus){authStatus.textContent=m;authStatus.classList.toggle('error',err)}}
function setAuthBusy(form,busy,label){const button=form?.querySelector('button[type="submit"]');if(!button)return;button.disabled=busy;if(busy){button.dataset.defaultLabel=button.innerHTML;button.innerHTML=`${label} <span>...</span>`;}else if(button.dataset.defaultLabel){button.innerHTML=button.dataset.defaultLabel;delete button.dataset.defaultLabel;}}
async function withAuthTimeout(request){let timer;try{return await Promise.race([request,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Authentication is taking too long. Check your internet connection and try again.')),15000)})])}finally{clearTimeout(timer)}}
async function continueWithGoogle(){
  if(!db){setAuthStatus(authUnavailableMessage,true);return}
  const buttons=[...document.querySelectorAll('[data-google-auth]')];
  buttons.forEach(button=>{button.disabled=true});
  setAuthStatus('Connecting to Google…');
  try{
    /* Return to login.html first so OAuth never builds a bad/404 route. */
    const callbackUrl=(location.protocol==='http:'||location.protocol==='https:')
      ? new URL('login.html',location.href).href
      : undefined;
    const options=callbackUrl?{redirectTo:callbackUrl}:{};
    const {data,error}=await withAuthTimeout(
      db.auth.signInWithOAuth({provider:'google',options})
    );
    if(error){setAuthStatus(friendlyError(error),true);return}
    if(data?.url)setAuthStatus('Redirecting to Google…');
  }catch(error){
    setAuthStatus(friendlyError(error),true);
  }finally{
    buttons.forEach(button=>{button.disabled=false});
  }
}
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
  setAuthStatus('Your credentials are securely handled by Supabase.');
}
function openAuth(mode='email-login',returnTo=''){
  if(!overlay)return;
  authReturnTo=returnTo;
  resetAuthModal();
  overlay.classList.add('open'); overlay.setAttribute('aria-hidden','false'); document.body.classList.add('modal-open');
  switchAuthMode(mode);
}
function closeAuth(preserveReturn=false){overlay?.classList.remove('open');overlay?.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open');resetAuthModal();if(!preserveReturn)authReturnTo=''}
function updateHeaderAuth(session,isAdmin=false){
  const loggedIn=Boolean(session?.user);
  syncBottomNavigation(isAdmin);
  document.querySelectorAll('.login-trigger, .mobile-nav a[href="login.html"]').forEach(link=>{link.hidden=loggedIn;});
  document.querySelectorAll('.desktop-nav a,.mobile-nav a').forEach(link=>{
    const href=link.getAttribute('href');
    if(href==='dashboard.html'||href==='admin.html'){
      link.href=isAdmin?'admin.html':'dashboard.html';
      link.textContent=isAdmin?'Admin Panel':'My Studio';
    }
  });
}
function switchAuthMode(mode){
  const signup=mode==='email-signup';
  document.querySelectorAll('.auth-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===mode));
  signupForm?.classList.toggle('hidden',!signup);
  resetForm?.classList.add('hidden');
  updatePasswordForm?.classList.add('hidden');
  loginForm?.classList.toggle('hidden',signup);
  setAuthStatus('Your credentials are securely handled by Supabase.');
}
function sanitizeReturnTarget(value){
  if(!value)return '';
  try{
    const raw=decodeURIComponent(value);
    if(raw.startsWith('http://')||raw.startsWith('https://')||raw.startsWith('//'))return '';
    const clean=raw.split('#')[0].split('?')[0].replace(/^\/+/, '');
    const allowed=['index.html','services.html','courses.html','assets.html','dashboard.html','project.html','admin.html','course-detail.html','lesson.html'];
    return allowed.includes(clean)?raw:'';
  }catch(_){return ''}
}
async function navigateAfterAuth(defaultTarget='dashboard.html'){
  const target=sanitizeReturnTarget(authReturnTo);
  authReturnTo='';
  if(target){ location.href=target; return; }
  if(!isLoginPage)return;
  let destination=defaultTarget;
  if(db){
    const {data:{session}}=await db.auth.getSession();
    if(session?.user){
      const {data:profile}=await db.from('profiles').select('role,is_admin').eq('id',session.user.id).maybeSingle();
      if(profile?.role==='admin'||profile?.is_admin===true) destination='admin.html';
    }
  }
  location.replace(destination);
}

document.querySelectorAll('[data-open-auth]').forEach(b=>b.addEventListener('click',()=>openAuth(b.dataset.openAuth||'email-login')));
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
overlay?.addEventListener('click',e=>{if(e.target===overlay)closeAuth()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAuth()});
if(isLoginPage){
  const params=new URLSearchParams(location.search);
  if(params.get('logged-out')==='1')setAuthStatus('You have been logged out successfully.');
  authReturnTo=sanitizeReturnTarget(params.get('returnTo')||'');
  switchAuthMode(params.get('mode')==='signup'?'email-signup':'email-login');
}

loginForm?.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!db){setAuthStatus(authUnavailableMessage,true);return}
  const email=document.getElementById('loginEmail').value.trim(),password=document.getElementById('loginPassword').value;
  setAuthBusy(loginForm,true,'Signing in');setAuthStatus('Signing you in…');
  try{
    const {data,error}=await withAuthTimeout(db.auth.signInWithPassword({email,password}));
     if(error){setAuthStatus(friendlyError(error),true);return}
     if(!data?.session){setAuthStatus('Login succeeded but no session was returned. Please try again.',true);return}
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
  const grid=document.getElementById('courseCatalog')||document.querySelector('.modern-courses');
  if(!grid)return;
  if(!db){
    grid.innerHTML='<div class="course-lesson-state error">Supabase is not connected. Courses cannot be loaded.</div>';
    return;
  }

  grid.innerHTML='<div class="course-lesson-state">Loading courses…</div>';
  const {data,error}=await db.from('courses')
    .select('id,title,description,duration,delivery,price_inr,slug,category,sort_order,published,created_at')
    .eq('published',true)
    .order('sort_order',{ascending:true})
    .order('created_at',{ascending:true});

  if(error){
    console.error('Course catalog load failed:',error);
    grid.innerHTML=`<div class="course-lesson-state error">${escapeHtml(friendlyError(error))}</div>`;
    return;
  }
  if(!data?.length){
    grid.innerHTML='<div class="course-lesson-state">No published courses are available yet.</div>';
    return;
  }

  grid.innerHTML=data.map((course,index)=>{
    const title=escapeHtml(course.title||'Course');
    const description=escapeHtml(course.description||'Explore the lessons, lectures and downloadable course materials.');
    const duration=escapeHtml(course.duration||'SELF-PACED');
    const delivery=escapeHtml(course.delivery||'LESSONS + PROJECTS');
    const category=escapeHtml((course.category||'COURSE').toUpperCase());
    const badge=index===0?'FEATURED':'AVAILABLE';
    const price=Number(course.price_inr||0);
    const priceText=price>0?`₹${price.toLocaleString('en-IN')}`:'ENQUIRE';
    return `<article class="course-card${index===0?' featured':''}" data-course-id="${escapeHtml(course.id)}" data-course-title="${title}" tabindex="0" role="link" aria-label="Open ${title}">
      <div class="course-top"><span>${String(index+1).padStart(2,'0')} / ${category}</span><b>${badge}</b></div>
      <div class="course-icon">✦</div>
      <h3>${title}</h3>
      <p>${description}</p>
      <div class="course-meta"><span>${duration}</span><span>${delivery}</span></div>
      <div class="course-meta"><span>${priceText}</span><span>COURSE CONTENT</span></div>
      <button class="course-action" type="button" data-course="${title}" data-course-id="${escapeHtml(course.id)}">View course <span>↗</span></button>
    </article>`;
  }).join('');
}

function openCourseById(courseId){
  if(!courseId){toast('This course is not connected to a Supabase course record yet.');return;}
  const url=new URL('course-detail.html',location.href);
  url.searchParams.set('id',courseId);
  location.href=url.href;
}

// Event delegation keeps course cards working even when the database replaces their content.
const courseGrid=document.querySelector('.modern-courses');
courseGrid?.addEventListener('click',event=>{
  const button=event.target.closest('.course-action');
  const card=event.target.closest('.course-card');
  const courseId=button?.dataset.courseId||card?.dataset.courseId;
  if(!courseId)return;
  event.preventDefault();
  openCourseById(courseId);
});
courseGrid?.addEventListener('keydown',event=>{
  if(event.key!=='Enter'&&event.key!==' ')return;
  const card=event.target.closest('.course-card');
  if(!card?.dataset.courseId)return;
  event.preventDefault();
  openCourseById(card.dataset.courseId);
});

function animateSocialCounters(){document.querySelectorAll('.social-count').forEach((node)=>{const target=Number(node.dataset.base||0);const format=(value)=>{if(value>=1000000)return `${(value/1000000).toFixed(1)}M+`;if(value>=1000)return `${(value/1000).toFixed(value>=100000?0:1)}K+`;return `${Math.round(value)}+`};const started=performance.now();const duration=1400;const step=(now)=>{const progress=Math.min(1,(now-started)/duration);const eased=1-Math.pow(1-progress,3);node.textContent=format(target*eased);if(progress<1)requestAnimationFrame(step)};requestAnimationFrame(step);});}
async function handleUserLogout(){
  if(!db){toast(authUnavailableMessage);return;}
  const button=document.getElementById('logoutBtn');
  if(button){button.disabled=true;button.dataset.defaultLabel=button.innerHTML;button.textContent='Logging out…';}
  try{
    const {error}=await withAuthTimeout(db.auth.signOut({scope:'local'}));
    if(error)throw error;
    try{localStorage.removeItem('starVisualsAuthPrompted');}catch(_){}
    location.href='index.html?logged-out=1';
  }catch(error){
    console.error('User logout failed:',error);
    if(button){button.disabled=false;button.innerHTML=button.dataset.defaultLabel||'Log out';delete button.dataset.defaultLabel;}
    toast(friendlyError(error));
  }
}
document.getElementById('logoutBtn')?.addEventListener('click',handleUserLogout);

async function loadStudio(){
  if(!db)return;
  const {data:{session}}=await db.auth.getSession();
  const locked=document.getElementById('accountLocked'),dash=document.getElementById('accountDashboard');
  if(!session?.user){updateHeaderAuth(null,false);locked?.classList.remove('hidden');dash?.classList.add('hidden');return}
  const u=session.user;
  const {data:profile}=await db.from('profiles').select('full_name,email,created_at,role,is_admin').eq('id',u.id).maybeSingle();
  const isAdmin=profile?.role==='admin'||profile?.is_admin===true;
  updateHeaderAuth(session,isAdmin);
  if(isAdmin && /dashboard\.html$/.test(location.pathname)){location.href='admin.html';return}
  if(/admin\.html$/.test(location.pathname) && !isAdmin){return}
  if(!locked&&!dash)return;
  locked?.classList.add('hidden');dash?.classList.remove('hidden');
  const name=profile?.full_name||u.user_metadata?.full_name||'Creator';
  const contact=profile?.email||u.email||'—';
  document.getElementById('dashAvatar')?.replaceChildren(document.createTextNode(initials(name)));
  document.getElementById('dashName')?.replaceChildren(document.createTextNode(name));
  document.getElementById('dashContact')?.replaceChildren(document.createTextNode(contact));
  document.getElementById('profileName')?.replaceChildren(document.createTextNode(name));
  document.getElementById('profileContact')?.replaceChildren(document.createTextNode(contact));
  document.getElementById('profileDate')?.replaceChildren(document.createTextNode(profile?.created_at?new Date(profile.created_at).toLocaleDateString('en-IN'):'—'));
  const {data:enrollments,error:enrollError}=await db.from('enrollments').select('id,enrolled_at,course_id,course:courses(title,duration,delivery,price_inr)').eq('user_id',u.id).order('enrolled_at',{ascending:false});
  const box=document.getElementById('coursePurchases');
  if(enrollError){
    box.innerHTML='<span>!</span><p>Could not load your enrolled courses right now.</p>';
  }else if(!enrollments?.length){
    box.innerHTML='<span>✦</span><p>No enrolled courses yet.</p><a class="text-button" href="courses.html">Explore courses →</a>';
  }else{
    box.innerHTML=enrollments.map(i=>{const courseId=i.course_id;return `<div class="purchased-course"><strong>${escapeHtml(i.course?.title||'Course')}</strong><span>${escapeHtml(i.course?.duration||'STAR VISUALS course')}</span><div class="progress"><i style="width:0%"></i></div><small>Enrolled ${i.enrolled_at?new Date(i.enrolled_at).toLocaleDateString('en-IN'):''}</small>${courseId?`<a class="text-button" href="course-detail.html?id=${encodeURIComponent(courseId)}">Continue learning →</a>`:''}</div>`}).join('');
  }
  const dr=await db.from('project_requests').select('project_name,service_type,package_name,amount_inr,status,deadline,admin_notes,updated_at').eq('user_id',u.id).order('updated_at',{ascending:false}).limit(1).maybeSingle();
  const d=dr.data;
  document.getElementById('dealStatus').textContent=d?.status?d.status.replace('_',' '):'No active deal';
  document.getElementById('dealProject').textContent=d?.project_name||'—';
  document.getElementById('dealPackage').textContent=d?.service_type||d?.package_name||'—';
  document.getElementById('dealAmount').textContent=d?.amount_inr!=null?`₹${Number(d.amount_inr).toLocaleString('en-IN')}`:'—';
}

const projectForm=document.getElementById('projectForm');
const serviceQuery=new URLSearchParams(location.search).get('service');
if(serviceQuery&&projectForm){
  const serviceSelect=projectForm.querySelector('[name="service_type"]');
  if(serviceSelect){
    const match=[...serviceSelect.options].find(o=>o.textContent.trim().toLowerCase()===serviceQuery.trim().toLowerCase());
    if(match)serviceSelect.value=match.value;
  }
}

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


/* ============================================================
   STAR VISUALS — CANONICAL ASSET LIBRARY V2
   One catalog, one detail experience, secure downloads.
   ============================================================ */
const DEFAULT_ASSET_CATEGORIES=[
  {id:'templates',name:'Templates',description:'Editable project templates and creator-ready production systems.',thumbnail_url:'assets/asset-pack/asset-library-cover.svg'},
  {id:'luts',name:'LUTs',description:'Cinematic colour grading LUTs for modern editing workflows.',thumbnail_url:'assets/asset-pack/asset-library-cover.svg'},
  {id:'presets',name:'Presets',description:'Reusable editing presets for speed and consistency.',thumbnail_url:'assets/asset-pack/asset-library-cover.svg'},
  {id:'sfx',name:'SFX',description:'Impacts, whooshes, ambience and creator sound effects.',thumbnail_url:'assets/asset-pack/asset-library-cover.svg'},
  {id:'music',name:'Music',description:'Music beds and creator-friendly audio resources.',thumbnail_url:'assets/asset-pack/asset-library-cover.svg'},
  {id:'overlays',name:'Overlays',description:'Light leaks, particles, textures and visual overlays.',thumbnail_url:'assets/asset-pack/asset-library-cover.svg'},
  {id:'transitions',name:'Transitions',description:'Transitions for short-form, long-form and cinematic edits.',thumbnail_url:'assets/asset-pack/asset-library-cover.svg'},
  {id:'graphics',name:'Graphics',description:'Titles, icons, social graphics and creator visuals.',thumbnail_url:'assets/asset-pack/asset-library-cover.svg'},
  {id:'fonts',name:'Fonts',description:'Typography resources for editing and design workflows.',thumbnail_url:'assets/asset-pack/asset-library-cover.svg'},
  {id:'3d',name:'3D',description:'3D assets and production-ready elements.',thumbnail_url:'assets/asset-pack/asset-library-cover.svg'},
  {id:'stock',name:'Stock',description:'Stock footage, images and supporting production assets.',thumbnail_url:'assets/asset-pack/asset-library-cover.svg'}
];
let ASSET_LIBRARY_CATEGORIES=DEFAULT_ASSET_CATEGORIES.map(c=>c.name);
let ASSET_LIBRARY_CATEGORY_META=Object.fromEntries(DEFAULT_ASSET_CATEGORIES.map(c=>[c.name,c.description]));
let ASSET_LIBRARY_CATEGORY_OBJECTS=DEFAULT_ASSET_CATEGORIES.map(c=>({...c}));
window.STAR_VISUALS_ASSET_CATEGORIES=window.STAR_VISUALS_ASSET_CATEGORIES||DEFAULT_ASSET_CATEGORIES;

function setAssetCategories(categories){
  const cleaned=(categories||[]).map(c=>({
    id:c.id||String(c.name||'category').toLowerCase().replace(/[^a-z0-9]+/g,'-'),
    name:String(c.name||'').trim(),
    description:String(c.description||'').trim()||'Creative assets for this category.',
    thumbnail_url:c.thumbnail_url||'assets/asset-pack/asset-library-cover.svg',
    sort_order:Number(c.sort_order||0)
  })).filter(c=>c.name);
  const seen=new Set();
  ASSET_LIBRARY_CATEGORY_OBJECTS=cleaned.filter(c=>{
    const key=c.name.toLowerCase();if(seen.has(key))return false;seen.add(key);return true;
  }).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
  ASSET_LIBRARY_CATEGORIES=ASSET_LIBRARY_CATEGORY_OBJECTS.map(c=>c.name);
  ASSET_LIBRARY_CATEGORY_META=Object.fromEntries(ASSET_LIBRARY_CATEGORY_OBJECTS.map(c=>[c.name,c.description]));
  window.STAR_VISUALS_ASSET_CATEGORIES=ASSET_LIBRARY_CATEGORY_OBJECTS;
}
setAssetCategories(window.STAR_VISUALS_ASSET_CATEGORIES);

const STAR_VISUALS_ASSET_BUCKET='star-assets';
const STAR_VISUALS_ASSET_FOLDER='asset-pack/files';
const STAR_VISUALS_THUMBNAIL_FOLDER='asset-pack/thumbnails';
const STAR_VISUALS_PREVIEW_FOLDER='asset-pack/previews';
const ASSET_PAGE_SIZE=24;
let assetLibraryState={assets:[],collections:[],favorites:new Set(),page:1,loading:false,hasMore:false,search:'',category:'',access:'',format:'',software:'',sort:'newest',collection:'',featured:false,trending:false};

function assetStorage(bucket=STAR_VISUALS_ASSET_BUCKET){
  if(!db?.storage)throw new Error('Supabase Storage is not available. Check supabase-config.js.');
  return db.storage.from(bucket);
}
function assetStorageError(error){
  const message=error?.message||String(error||'Unknown storage error.');
  if(/bucket.*not found/i.test(message))return `Storage bucket "${STAR_VISUALS_ASSET_BUCKET}" was not found. Run supabase-asset-library-v2-secure.sql in Supabase SQL Editor.`;
  if(/row-level security|permission denied|not authorized|unauthorized/i.test(message))return 'Storage permission denied. Verify the Asset Library RLS policies and administrator access.';
  return message;
}
function normalizeAsset(asset){
  const item={...asset};
  item.id=item.id||String(item.name||'asset').toLowerCase().replace(/[^a-z0-9]+/g,'-');
  item.category=String(item.category||ASSET_LIBRARY_CATEGORIES[0]||'Templates').trim();
  item.subcategory=String(item.subcategory||'').trim();
  item.access_type=(item.access_type||'free').toLowerCase()==='premium'?'premium':'free';
  item.price=Number(item.price||0);
  item.file_size=item.file_size||'—';
  item.file_type=item.file_type||'FILE';
  item.software=item.software||'Any';
  item.software_compatibility=Array.isArray(item.software_compatibility)?item.software_compatibility:(item.software?String(item.software).split(',').map(v=>v.trim()).filter(Boolean):[]);
  item.tags=Array.isArray(item.tags)?item.tags:(item.tags?String(item.tags).split(',').map(v=>v.trim()).filter(Boolean):[]);
  item.thumbnail_url=item.thumbnail_url||'assets/asset-pack/asset-library-cover.svg';
  item.published=item.published!==false;
  item.featured=item.featured===true;
  item.trending=item.trending===true;
  item.downloads_count=Number(item.downloads_count||0);
  return item;
}
function dedupeAssets(assets){
  const seen=new Set();
  return (assets||[]).map(normalizeAsset).filter(item=>{
    const signature=String(item.id);
    if(seen.has(signature))return false;seen.add(signature);return true;
  });
}
function formatAssetPrice(asset){return normalizeAsset(asset).access_type==='free'?'FREE':`₹${Number(normalizeAsset(asset).price||0).toLocaleString('en-IN')}`;}
function assetCategorySlug(name){return encodeURIComponent(String(name||'').trim());}
function setAssetStatus(message,error=false){
  const el=document.getElementById('assetStatus');if(el){el.textContent=message;el.classList.toggle('error',Boolean(error));}
}
function getStoragePath(value){
  const raw=String(value||'').trim();
  if(!raw)return '';
  if(/^https?:\/\//i.test(raw)){
    try{
      const u=new URL(raw);
      const marker='/storage/v1/object/public/star-assets/';
      const marker2='/storage/v1/object/sign/star-assets/';
      const marker3='/storage/v1/object/authenticated/star-assets/';
      for(const markerValue of [marker,marker2,marker3]){
        const idx=u.pathname.indexOf(markerValue);
        if(idx>=0)return decodeURIComponent(u.pathname.slice(idx+markerValue.length));
      }
    }catch(_){}
    return '';
  }
  if(raw.startsWith('asset-pack/'))return raw;
  return '';
}
async function resolveAssetMediaUrl(value,expires=900){
  const raw=String(value||'').trim();
  if(!raw)return '';
  if(/^https?:\/\//i.test(raw)){
    const storagePath=getStoragePath(raw);
    if(!storagePath)return raw;
    try{
      const {data,error}=await assetStorage().createSignedUrl(storagePath,expires);
      return error?'':data?.signedUrl||'';
    }catch(_){return '';}
  }
  if(raw.startsWith('asset-pack/')){
    try{
      const {data,error}=await assetStorage().createSignedUrl(raw,expires);
      return error?'':data?.signedUrl||'';
    }catch(_){return '';}
  }
  return raw;
}
async function resolveAssetPreview(asset){
  const item=normalizeAsset(asset);
  const preview=item.preview_url||item.thumbnail_url;
  return await resolveAssetMediaUrl(preview);
}
function assetMimeKind(asset){
  const type=String(normalizeAsset(asset).file_type||'').toLowerCase();
  if(/(mp4|mov|m4v|webm|video)/.test(type))return 'video';
  if(/(mp3|wav|ogg|m4a|audio)/.test(type))return 'audio';
  if(/(jpg|jpeg|png|webp|gif|image|svg)/.test(type))return 'image';
  return 'file';
}
function assetMatchesFilters(asset){
  const item=normalizeAsset(asset), state=assetLibraryState;
  const haystack=[item.name,item.description,item.category,item.subcategory,item.file_type,item.software,...item.software_compatibility,...item.tags].join(' ').toLowerCase();
  if(state.search&&!haystack.includes(state.search.toLowerCase()))return false;
  if(state.category&&item.category!==state.category)return false;
  if(state.access&&item.access_type!==state.access)return false;
  if(state.format&&String(item.file_type).toLowerCase()!==state.format.toLowerCase())return false;
  if(state.software&&!(item.software_compatibility||[]).some(s=>String(s).toLowerCase()===state.software.toLowerCase())&&!String(item.software).toLowerCase().includes(state.software.toLowerCase()))return false;
  if(state.collection&&!(item.collection_ids||[]).includes(state.collection))return false;
  if(state.featured&&!item.featured)return false;
  if(state.trending&&!item.trending)return false;
  return true;
}
function sortAssets(assets){
  const list=[...assets], mode=assetLibraryState.sort;
  if(mode==='az')return list.sort((a,b)=>a.name.localeCompare(b.name));
  if(mode==='popular')return list.sort((a,b)=>Number(b.downloads_count||0)-Number(a.downloads_count||0));
  return list.sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
}
function assetCardsMarkup(assets){
  return (assets||[]).map(asset=>{
    const item=normalizeAsset(asset),saved=assetLibraryState.favorites.has(String(item.id));
    const tags=item.tags?.slice(0,2).map(tag=>`<span>${escapeHtml(tag)}</span>`).join('')||'';
    return `<article class="asset-card-v2 ${item.access_type==='premium'?'premium':''}" tabindex="0" data-asset-open="${escapeHtml(String(item.id))}">
      <div class="asset-card-v2-media">
        <img src="${escapeHtml(item.thumbnail_url||'assets/asset-pack/asset-library-cover.svg')}" alt="${escapeHtml(item.name)} preview" loading="lazy" data-asset-media="${escapeHtml(String(item.id))}">
        <div class="asset-card-v2-badges"><span class="asset-badge ${item.access_type==='premium'?'premium':''}">${item.access_type==='premium'?'Premium':'Free'}</span>${item.featured?'<span class="asset-badge accent">Featured</span>':''}${item.trending?'<span class="asset-badge">Trending</span>':''}</div>
        <button class="asset-favorite-v2 ${saved?'is-saved':''}" type="button" data-asset-favorite="${escapeHtml(String(item.id))}" aria-label="${saved?'Remove from favorites':'Save to favorites'}" aria-pressed="${saved?'true':'false'}">♡</button>
      </div>
      <div class="asset-card-v2-body">
        <div class="asset-card-v2-meta"><span>${escapeHtml(item.category)}</span><span>${escapeHtml(item.file_type)}</span></div>
        <h3>${escapeHtml(item.name)}</h3>
        <p>${escapeHtml(item.description||'Creator-ready resource for faster production.')}</p>
        <div class="asset-card-v2-tags">${tags}</div>
        <div class="asset-card-v2-foot"><strong>${formatAssetPrice(item)}</strong><div style="display:flex;gap:7px"><button class="outline-btn" type="button" data-asset-open="${escapeHtml(String(item.id))}">View</button><button class="outline-btn" type="button" data-asset-download="${escapeHtml(String(item.id))}">Download</button></div></div>
      </div>
    </article>`;
  }).join('');
}
async function hydrateAssetMedia(container=document){
  const images=[...container.querySelectorAll('[data-asset-media]')];
  await Promise.all(images.map(async img=>{
    const asset=findAssetById(img.dataset.assetMedia);
    if(!asset)return;
    const url=await resolveAssetMediaUrl(asset.thumbnail_url);
    if(url)img.src=url;
  }));
}
function findAssetById(id){return (window.STAR_VISUALS_ASSET_CATALOG||[]).map(normalizeAsset).find(a=>String(a.id)===String(id))||null;}

function renderAdminAssetCategorySelect(){
  const select=document.getElementById('assetCategory');if(!select)return;
  const current=select.value;
  select.innerHTML='<option value="">Select category</option>'+ASSET_LIBRARY_CATEGORIES.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  if(current&&ASSET_LIBRARY_CATEGORIES.includes(current))select.value=current;
}
async function loadAssetCategories(){
  setAssetCategories(DEFAULT_ASSET_CATEGORIES);
  renderAdminAssetCategorySelect();
}
async function loadAssetCollections(includeAdmin=false){
  if(!db)return [];
  const {data,error}=await db.from('asset_collections').select('*').order('sort_order').order('created_at');
  if(error)return [];
  const collections=data||[];
  assetLibraryState.collections=collections;
  const ids=collections.map(c=>c.id);
  if(ids.length){
    const {data:items}=await db.from('asset_collection_items').select('collection_id,asset_id').in('collection_id',ids);
    const map=new Map(collections.map(c=>[String(c.id),[]]));
    (items||[]).forEach(row=>map.get(String(row.collection_id))?.push(String(row.asset_id)));
    collections.forEach(c=>c.asset_ids=map.get(String(c.id))||[]);
  }
  return collections;
}
async function loadAssetFavorites(){
  assetLibraryState.favorites=new Set();
  if(!db)return;
  const {data:{session}}=await db.auth.getSession();
  if(!session?.user)return;
  const {data}=await db.from('asset_favorites').select('asset_id').eq('user_id',session.user.id);
  (data||[]).forEach(row=>assetLibraryState.favorites.add(String(row.asset_id)));
}
async function loadAssetCatalog(){
  const grid=document.getElementById('assetLibraryGrid');
  const sections=document.getElementById('assetLibrarySections')||document.getElementById('servicesAssetSections');
  const categoryCards=document.getElementById('assetCategoryCards');
  if(!grid&&!sections&&!categoryCards)return;
  if(assetLibraryState.loading)return;
  assetLibraryState.loading=true;
  await loadAssetCategories();
  const requestedCategory=new URLSearchParams(location.search).get('category')||'';
  const matchedCategory=ASSET_LIBRARY_CATEGORIES.find(c=>c.toLowerCase()===requestedCategory.trim().toLowerCase());
  if(matchedCategory)assetLibraryState.category=matchedCategory;
  await loadAssetCollections();
  await loadAssetFavorites();
  if(db){
    const {data,error}=await db.from('asset_library').select('*').eq('published',true).order('created_at',{ascending:false});
    if(error){console.error('Public Asset Library load failed:',error);assetLibraryState.assets=[];}
    else assetLibraryState.assets=dedupeAssets(data||[]);
  }else assetLibraryState.assets=[];
  // Attach collection IDs without creating duplicate asset records.
  const collectionMap=new Map();
  assetLibraryState.collections.forEach(c=>(c.asset_ids||[]).forEach(id=>{
    if(!collectionMap.has(id))collectionMap.set(id,[]);
    collectionMap.get(id).push(String(c.id));
  }));
  assetLibraryState.assets.forEach(a=>a.collection_ids=collectionMap.get(String(a.id))||[]);
  window.STAR_VISUALS_ASSET_CATALOG=assetLibraryState.assets;
  assetLibraryState.loading=false;
  updateAssetFilterOptions();
  renderAssetLibrary();
  renderServiceAssetLibrary();
}
function renderAssetCategoryCards(){
  const host=document.getElementById('assetCategoryCards');if(!host)return;
  const counts=new Map();
  assetLibraryState.assets.forEach(a=>counts.set(a.category,(counts.get(a.category)||0)+1));
  host.innerHTML=`<a class="asset-category-card-v2 ${assetLibraryState.category?'':'active'}" href="assets.html"><span class="asset-category-card-v2-name">All</span><span>${assetLibraryState.assets.length}</span></a>`+
    ASSET_LIBRARY_CATEGORY_OBJECTS.map(c=>`<a class="asset-category-card-v2 ${assetLibraryState.category===c.name?'active':''}" href="assets.html?category=${assetCategorySlug(c.name)}"><span class="asset-category-card-v2-name">${escapeHtml(c.name)}</span><span>${counts.get(c.name)||0}</span></a>`).join('');
}
function renderAssetLibrary(){
  const categoryMode=Boolean(assetLibraryState.category);
  const categoryName=assetLibraryState.category||'';
  const categoryHero=document.querySelector('.asset-library-hero-v2');
  if(categoryHero){
    const eyebrow=categoryHero.querySelector('.eyebrow');
    const title=categoryHero.querySelector('h1');
    const copy=categoryHero.querySelector('p');
    if(categoryMode){
      if(eyebrow)eyebrow.textContent=`STAR VISUALS / ASSET LIBRARY / ${categoryName.toUpperCase()}`;
      if(title)title.innerHTML=`<span>${escapeHtml(categoryName)} Assets</span><br><em>Ready to download.</em>`;
      if(copy)copy.textContent=`Browse every published ${categoryName} asset uploaded by the STAR VISUALS admin.`;
    }else{
      if(eyebrow)eyebrow.textContent='STAR VISUALS / SERVICES / ASSET LIBRARY';
      if(title)title.innerHTML='Everything you need to<br><em>create better content.</em>';
      if(copy)copy.textContent='Find production-ready assets for editing, motion, colour, sound and design — all managed from one creator library.';
    }
  }
  const featuredSection=document.getElementById('assetFeaturedGrid')?.closest('.asset-library-section-v2');
  const collectionsSection=document.getElementById('assetCollectionsGrid')?.closest('.asset-library-section-v2');
  if(featuredSection)featuredSection.hidden=categoryMode;
  if(collectionsSection)collectionsSection.hidden=categoryMode;
  const resultSection=document.getElementById('assetResults');
  const resultTitle=resultSection?.querySelector('.asset-section-title-v2 h3');
  const resultEyebrow=resultSection?.querySelector('.asset-section-title-v2 .eyebrow');
  if(resultTitle)resultTitle.textContent=categoryMode?`${categoryName} — All Uploaded Assets`:'Explore the library';
  if(resultEyebrow)resultEyebrow.textContent=categoryMode?'CATEGORY LIBRARY':'ALL ASSETS';
  const categorySelect=document.getElementById('assetCategoryFilter');
  if(categorySelect)categorySelect.value=assetLibraryState.category||'';
  const accessSelect=document.getElementById('assetAccessFilter');
  if(accessSelect)accessSelect.value=assetLibraryState.access||'';
  const formatSelect=document.getElementById('assetFormatFilter');
  if(formatSelect)formatSelect.value=assetLibraryState.format||'';
  const softwareSelect=document.getElementById('assetSoftwareFilter');
  if(softwareSelect)softwareSelect.value=assetLibraryState.software||'';
  const sortSelect=document.getElementById('assetSortFilter');
  if(sortSelect)sortSelect.value=assetLibraryState.sort||'newest';
  renderAssetCategoryCards();
  document.querySelectorAll('[data-asset-category-filter]').forEach(btn=>btn.classList.toggle('active',btn.dataset.assetCategoryFilter===assetLibraryState.category));
  const visible=sortAssets(assetLibraryState.assets.filter(assetMatchesFilters));
  const grid=document.getElementById('assetLibraryGrid');
  const resultCount=document.getElementById('assetResultCount');
  if(resultCount)resultCount.textContent=`${visible.length} asset${visible.length===1?'':'s'} found`;
  if(grid){
    const end=assetLibraryState.page*ASSET_PAGE_SIZE;
    const pageItems=categoryMode?visible:visible.slice(0,end);
    grid.innerHTML=pageItems.length?assetCardsMarkup(pageItems):'<div class="asset-empty-v2"><strong>No assets found</strong><span>Try another search, category or filter.</span></div>';
    hydrateAssetMedia(grid);
    const more=document.getElementById('assetLoadMore');
    if(more){more.hidden=categoryMode||end>=visible.length;more.textContent=categoryMode?'':'Load more assets';}
  }
  const featured=document.getElementById('assetFeaturedGrid');
  if(featured){
    const featuredAssets=assetLibraryState.assets.filter(a=>a.featured).slice(0,6);
    featured.innerHTML=featuredAssets.length?assetCardsMarkup(featuredAssets):'<div class="asset-empty-v2"><strong>Featured collection is being curated.</strong><span>Check back soon for new releases.</span></div>';
    hydrateAssetMedia(featured);
  }
  const collections=document.getElementById('assetCollectionsGrid');
  if(collections){
    collections.innerHTML=assetLibraryState.collections.filter(c=>c.published!==false).map(c=>`<button class="asset-collection-card-v2" type="button" data-asset-collection="${escapeHtml(c.id)}"><img src="${escapeHtml(c.thumbnail_url||'assets/asset-pack/asset-library-cover.svg')}" alt="" loading="lazy" data-collection-media="${escapeHtml(c.id)}"><span class="eyebrow">COLLECTION</span><h3>${escapeHtml(c.name)}</h3><p>${escapeHtml(c.description||'Curated creator assets.')}</p><strong>${(c.asset_ids||[]).length} assets →</strong></button>`).join('')||'<div class="asset-empty-v2"><strong>No collections yet.</strong></div>';
    collections.querySelectorAll('[data-collection-media]').forEach(async img=>{const c=assetLibraryState.collections.find(x=>String(x.id)===String(img.dataset.collectionMedia));if(c){const url=await resolveAssetMediaUrl(c.thumbnail_url);if(url)img.src=url;}});
  }
}
function updateAssetFilterOptions(){
  const format=document.getElementById('assetFormatFilter'),software=document.getElementById('assetSoftwareFilter'),category=document.getElementById('assetCategoryFilter');
  if(category)category.innerHTML='<option value="">All categories</option>'+ASSET_LIBRARY_CATEGORIES.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  const formats=[...new Set(assetLibraryState.assets.map(a=>String(a.file_type||'').trim()).filter(Boolean))].sort();
  if(format)format.innerHTML='<option value="">All formats</option>'+formats.map(f=>`<option value="${escapeHtml(f)}">${escapeHtml(f)}</option>`).join('');
  const softwares=[...new Set(assetLibraryState.assets.flatMap(a=>a.software_compatibility||[]).concat(assetLibraryState.assets.map(a=>a.software)).map(s=>String(s||'').trim()).filter(Boolean))].sort();
  if(software)software.innerHTML='<option value="">All software</option>'+softwares.map(s=>`<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
}
function resetAssetLibraryFilters(){
  assetLibraryState={...assetLibraryState,page:1,search:'',category:'',access:'',format:'',software:'',sort:'newest',collection:'',featured:false,trending:false};
  {const el=document.getElementById('assetSearch');if(el)el.value='';}
  document.querySelectorAll('[data-asset-filter]').forEach(el=>el.value=el.dataset.assetFilterDefault||'');
  renderAssetLibrary();
}
function openAssetDetail(assetId){
  const asset=findAssetById(assetId);if(!asset)return;
  let modal=document.getElementById('assetDetailModal');
  if(!modal){
    modal=document.createElement('div');modal.id='assetDetailModal';modal.className='asset-detail-modal';modal.innerHTML=`<div class="asset-detail-backdrop" data-asset-detail-close></div><section class="asset-detail-panel" role="dialog" aria-modal="true" aria-labelledby="assetDetailTitle"><button class="asset-detail-close" type="button" aria-label="Close asset detail" data-asset-detail-close>×</button><div id="assetDetailContent"></div></section>`;
    document.body.appendChild(modal);
  }
  const saved=assetLibraryState.favorites.has(String(asset.id));
  const tags=(asset.tags||[]).map(t=>`<span>${escapeHtml(t)}</span>`).join('');
  const compat=(asset.software_compatibility||[]).length?asset.software_compatibility:[asset.software].filter(Boolean);
  const kind=assetMimeKind(asset);
  const content=document.getElementById('assetDetailContent');
  content.innerHTML=`<div class="asset-detail-preview" id="assetDetailPreview"><div class="asset-preview-loading">Loading preview…</div></div>
    <div class="asset-detail-copy"><div class="asset-detail-badges"><span class="asset-badge ${asset.access_type==='premium'?'premium':''}">${asset.access_type==='premium'?'Premium':'Free'}</span>${asset.featured?'<span class="asset-badge accent">Featured</span>':''}${asset.trending?'<span class="asset-badge">Trending</span>':''}</div>
    <p class="eyebrow">${escapeHtml(asset.category)}${asset.subcategory?` / ${escapeHtml(asset.subcategory)}`:''}</p><h2 id="assetDetailTitle">${escapeHtml(asset.name)}</h2><p class="asset-detail-description">${escapeHtml(asset.description||'Creator-ready asset for faster production.')}</p>
    <div class="asset-detail-specs"><div><span>FORMAT</span><strong>${escapeHtml(asset.file_type)}</strong></div><div><span>SIZE</span><strong>${escapeHtml(asset.file_size)}</strong></div><div><span>SOFTWARE</span><strong>${escapeHtml(compat.join(', ')||'Any')}</strong></div><div><span>ACCESS</span><strong>${formatAssetPrice(asset)}</strong></div></div>
    <div class="asset-card-v2-tags">${tags}</div><div class="asset-detail-actions"><button class="outline-btn ${saved?'is-saved':''}" type="button" data-asset-favorite="${escapeHtml(String(asset.id))}" aria-pressed="${saved?'true':'false'}">${saved?'♥ Saved':'♡ Save'}</button><button class="btn" type="button" data-asset-download="${escapeHtml(String(asset.id))}">${asset.access_type==='premium'?'Download Premium':'Download'}</button></div><p class="asset-detail-note" id="assetDetailStatus"></p></div>`;
  modal.classList.add('open');document.body.classList.add('modal-open');
  const preview=document.getElementById('assetDetailPreview');
  resolveAssetPreview(asset).then(url=>{
    if(!url){preview.innerHTML='<div class="asset-preview-empty">Preview unavailable.</div>';return;}
    if(kind==='video')preview.innerHTML=`<video src="${escapeHtml(url)}" controls playsinline preload="metadata"></video>`;
    else if(kind==='audio')preview.innerHTML=`<audio src="${escapeHtml(url)}" controls></audio>`;
    else preview.innerHTML=`<img src="${escapeHtml(url)}" alt="${escapeHtml(asset.name)} preview">`;
  });
}
function closeAssetDetail(){document.getElementById('assetDetailModal')?.classList.remove('open');document.body.classList.remove('modal-open');}
async function toggleAssetFavorite(assetId){
  if(!db){openAuth('email-login','assets.html');return;}
  const {data:{session}}=await db.auth.getSession();
  if(!session?.user){openAuth('email-login','assets.html');return;}
  const key=String(assetId),isSaved=assetLibraryState.favorites.has(key);
  if(isSaved){
    const {error}=await db.from('asset_favorites').delete().eq('user_id',session.user.id).eq('asset_id',assetId);
    if(error){toast(friendlyError(error));return;}
    assetLibraryState.favorites.delete(key);toast('Removed from My Library.');
  }else{
    const {error}=await db.from('asset_favorites').insert({user_id:session.user.id,asset_id:assetId});
    if(error){toast(friendlyError(error));return;}
    assetLibraryState.favorites.add(key);toast('Saved to My Library.');
  }
  renderAssetLibrary();
  const detailButton=document.querySelector(`#assetDetailModal [data-asset-favorite="${CSS.escape(key)}"]`);
  if(detailButton){detailButton.textContent=assetLibraryState.favorites.has(key)?'♥ Saved':'♡ Save';detailButton.setAttribute('aria-pressed',String(assetLibraryState.favorites.has(key)));}
}
async function handleAssetDownload(asset){
  const item=normalizeAsset(asset);
  if(!item.published){toast('This asset is not published.');return;}
  if(item.access_type==='premium'){
    if(!db){openAuth('email-login','assets.html');return;}
    const {data:{session}}=await db.auth.getSession();
    if(!session?.user){openAuth('email-login','assets.html');toast('Log in to access premium assets.');return;}
    const {data:access}=await db.from('user_asset_access').select('id').eq('user_id',session.user.id).eq('asset_id',item.id).in('status',['available','purchased','downloaded']).maybeSingle();
    if(!access){toast('This premium asset is not unlocked for your account.');return;}
  }
  const storagePath=getStoragePath(item.file_url);
  const external=item.external_download_url;
  try{
    if(db&&item.id&&/^[0-9a-f-]{36}$/i.test(String(item.id))){
      const {data:recorded,error}=await db.rpc('record_asset_download',{p_asset_id:item.id});
      if(error||recorded!==true){toast(error?friendlyError(error):'This asset is not available for your account.');return;}
    }
    let url='';
    if(external&&/^https:\/\//i.test(external))url=external;
    else if(storagePath){
      const {data,error}=await assetStorage().createSignedUrl(storagePath,600);
      if(error)throw error;
      url=data?.signedUrl||'';
    }else if(item.file_url&&/^(https?:\/\/|assets\/)/i.test(item.file_url))url=item.file_url;
    if(!url){toast('This asset is not available yet.');return;}
    window.open(url,'_blank','noopener,noreferrer');
    toast(item.access_type==='premium'?'Secure download ready.':'Download ready.');
  }catch(error){console.error('Asset download failed:',error);toast(friendlyError(error));}
}
function wireAssetLibraryUI(){
  if(window.__starVisualsAssetV2Wired)return;
  if(!document.getElementById('assetLibraryGrid')&&!document.getElementById('servicesAssetSections'))return;
  window.__starVisualsAssetV2Wired=true;
  const search=document.getElementById('assetSearch');
  search?.addEventListener('input',()=>{clearTimeout(search._assetTimer);search._assetTimer=setTimeout(()=>{assetLibraryState.search=search.value.trim();assetLibraryState.page=1;renderAssetLibrary();},220);});
  ['assetCategoryFilter','assetAccessFilter','assetFormatFilter','assetSoftwareFilter','assetSortFilter'].forEach(id=>{
    document.getElementById(id)?.addEventListener('change',e=>{
      const key=id.replace('asset','').replace('Filter','').toLowerCase();
      const map={category:'category',access:'access',format:'format',software:'software',sort:'sort'};
      assetLibraryState[map[key]]=e.target.value;assetLibraryState.page=1;renderAssetLibrary();
    });
  });
  document.getElementById('assetResetFilters')?.addEventListener('click',resetAssetLibraryFilters);
  document.getElementById('assetLoadMore')?.addEventListener('click',()=>{assetLibraryState.page++;renderAssetLibrary();});
  document.getElementById('assetCollectionsGrid')?.addEventListener('click',e=>{
    const btn=e.target.closest('[data-asset-collection]');if(!btn)return;
    assetLibraryState.collection=btn.dataset.assetCollection;assetLibraryState.page=1;renderAssetLibrary();
    document.getElementById('assetLibraryGrid')?.scrollIntoView({behavior:'smooth',block:'start'});
  });
  document.addEventListener('click',async e=>{
    const favorite=e.target.closest('[data-asset-favorite]');
    if(favorite){e.stopPropagation();await toggleAssetFavorite(favorite.dataset.assetFavorite);return;}
    const download=e.target.closest('[data-asset-download]');
    if(download){e.stopPropagation();const a=findAssetById(download.dataset.assetDownload);if(a)await handleAssetDownload(a);return;}
    const open=e.target.closest('[data-asset-open]');
    if(open){openAssetDetail(open.dataset.assetOpen);return;}
    if(e.target.closest('[data-asset-detail-close]'))closeAssetDetail();
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape')closeAssetDetail();
    const card=e.target.closest?.('[data-asset-open]');
    if(card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openAssetDetail(card.dataset.assetOpen);}
  });
}
function renderServiceAssetLibrary(){
  const host=document.getElementById('servicesAssetSections');if(!host)return;
  const groups=ASSET_LIBRARY_CATEGORY_OBJECTS.map(c=>({category:c.name,assets:assetLibraryState.assets.filter(a=>a.category===c.name).slice(0,4)})).filter(g=>g.assets.length);
  host.innerHTML=groups.length?groups.map(g=>`<section class="service-asset-group-v2"><div class="service-asset-group-head-v2"><div><p class="eyebrow">ASSET CATEGORY</p><h3>${escapeHtml(g.category)}</h3></div><a class="quiet-link" href="assets.html?category=${assetCategorySlug(g.category)}">Explore all →</a></div><div class="asset-grid">${assetCardsMarkup(g.assets)}</div></section>`).join(''):'<div class="asset-empty-v2"><strong>Asset Library is ready for new releases.</strong><span>Admin uploads will appear here automatically.</span></div>';
  hydrateAssetMedia(host);
}
async function loadMyAssets(){
  const host=document.getElementById('myAssetList');if(!host)return;
  if(!db){host.innerHTML='<div class="asset-empty-v2">Connect your account to view My Library.</div>';return;}
  const {data:{session}}=await db.auth.getSession();
  if(!session?.user){host.innerHTML='<div class="asset-empty-v2"><strong>Your saved assets live here.</strong><span>Log in to view favorites and unlocked downloads.</span></div>';return;}
  const {data:favs}=await db.from('asset_favorites').select('asset_id,created_at').eq('user_id',session.user.id).order('created_at',{ascending:false}).limit(12);
  const ids=(favs||[]).map(r=>r.asset_id);
  if(!ids.length){host.innerHTML='<div class="asset-empty-v2"><strong>No saved assets yet.</strong><span>Tap ♡ on any asset to build your library.</span></div>';return;}
  const {data:assets}=await db.from('asset_library').select('*').in('id',ids).eq('published',true);
  host.innerHTML=assetCardsMarkup((assets||[]).map(normalizeAsset));hydrateAssetMedia(host);
}
async function uploadAdminFile(bucket,file,folder){
  if(!db||!file)throw new Error('Supabase Storage is not available.');
  const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'')||'asset-file';
  const path=`${folder}/${crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`}-${safe}`;
  const allowedExt=/\.(zip|7z|rar|cube|prfpset|mogrt|aep|prproj|wav|mp3|ogg|m4a|mp4|mov|m4v|webm|png|jpg|jpeg|webp|gif|psd|ai|svg|otf|ttf|woff|woff2)$/i;
  const blocked=/\.(exe|dll|bat|cmd|com|msi|scr|ps1|sh|bash|php|jsp|asp|aspx|cgi|html?)$/i;
  if(blocked.test(file.name)||!allowedExt.test(file.name))throw new Error('Unsupported asset file type. Upload a supported creative format.');
  if(file.size>524288000)throw new Error('Asset file exceeds the 500 MB limit.');
  const {data,error}=await assetStorage(bucket).upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type||'application/octet-stream'});
  if(error)throw new Error(assetStorageError(error));
  return {path:data.path,size:file.size,type:file.type||'application/octet-stream'};
}
function adminAssetStoragePath(accessType,file){return `${STAR_VISUALS_ASSET_FOLDER}/${accessType==='premium'?'premium':'free'}`;}
function parseAdminTags(value){return String(value||'').split(',').map(v=>v.trim()).filter(Boolean).slice(0,30);}
async function loadAdminAssetCollections(){
  const select=document.getElementById('assetCollection');if(!select||!db)return;
  const {data,error}=await db.from('asset_collections').select('*').order('sort_order').order('created_at');
  if(error){select.innerHTML='<option value="">No collections available</option>';return;}
  select.innerHTML='<option value="">No collection</option>'+(data||[]).map(c=>`<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`).join('');
}
async function loadAdminAssets(){
  const list=document.getElementById('adminAssetList');if(!list||!db)return;
  const {data,error}=await db.from('asset_library').select('*').order('created_at',{ascending:false});
  if(error){list.innerHTML=`<div class="admin-empty">Assets could not be loaded: ${escapeHtml(friendlyError(error))}</div>`;return;}
  list.innerHTML=(data||[]).map(asset=>`<article class="admin-request asset-admin-row-v2"><div class="admin-request-head"><div><span class="admin-index">${asset.published?'Published':'Draft'} · ${asset.access_type==='premium'?'Premium':'Free'}</span><h3>${escapeHtml(asset.name)}</h3></div><div class="asset-admin-actions compact"><button class="outline-btn" type="button" data-asset-edit="${escapeHtml(asset.id)}">Edit</button><button class="outline-btn" type="button" data-asset-delete="${escapeHtml(asset.id)}">Delete</button></div></div><div class="admin-request-grid"><div><span>CATEGORY</span><strong>${escapeHtml(asset.category||'—')}</strong></div><div><span>FORMAT</span><strong>${escapeHtml(asset.file_type||'—')}</strong></div><div><span>DOWNLOADS</span><strong>${Number(asset.downloads_count||0)}</strong></div><div><span>FLAGS</span><strong>${[asset.featured&&'Featured',asset.trending&&'Trending'].filter(Boolean).join(' · ')||'—'}</strong></div></div></article>`).join('')||'<div class="admin-empty">No assets have been uploaded yet.</div>';
}
async function deleteAssetAndOwnedFiles(assetId){
  const {data:asset,error}=await db.from('asset_library').select('*').eq('id',assetId).maybeSingle();
  if(error||!asset)throw error||new Error('Asset not found.');
  const paths=[asset.file_url,asset.thumbnail_url,asset.preview_url].map(getStoragePath).filter(Boolean);
  const refs=[];
  if(paths.length){
    const {data:others}=await db.from('asset_library').select('file_url,thumbnail_url,preview_url').neq('id',assetId);
    (others||[]).forEach(o=>refs.push(getStoragePath(o.file_url),getStoragePath(o.thumbnail_url),getStoragePath(o.preview_url)));
  }
  const unique=paths.filter(p=>p&&!refs.includes(p));
  const {error:delError}=await db.from('asset_library').delete().eq('id',assetId);
  if(delError)throw delError;
  if(unique.length){const {error:storageError}=await assetStorage().remove(unique);if(storageError)console.warn('Some owned asset files could not be removed:',storageError);}
}
function setupAdminAssetLibrary(){
  if(window.__starVisualsAdminAssetV2)return;
  const form=document.getElementById('assetForm');if(!form)return;
  window.__starVisualsAdminAssetV2=true;
  loadAdminAssetCollections();
  document.getElementById('assetCollectionRefresh')?.addEventListener('click',loadAdminAssetCollections);
  form.addEventListener('submit',async e=>{
    e.preventDefault();if(!db){setAssetStatus('Connect Supabase before managing assets.',true);return;}
    const id=document.getElementById('assetEditId')?.value||'';
    const file=document.getElementById('assetUploadFile')?.files?.[0]||null;
    const thumb=document.getElementById('assetUploadThumbnail')?.files?.[0]||null;
    const preview=document.getElementById('assetUploadPreview')?.files?.[0]||null;
    const access=document.getElementById('assetAccessType')?.value==='premium'?'premium':'free';
    let uploadedPaths=[];
    try{
      setAssetStatus(file||thumb||preview?'Validating and uploading files…':'Saving asset…');
      const existing=id?(await db.from('asset_library').select('*').eq('id',id).maybeSingle()).data:null;
      let fileUrl=String(document.getElementById('assetFileUrl')?.value||'').trim();
      let thumbnailUrl=String(document.getElementById('assetThumbnail')?.value||'').trim()||'assets/asset-pack/asset-library-cover.svg';
      let previewUrl=String(document.getElementById('assetPreview')?.value||'').trim();
      if(file){const u=await uploadAdminFile(STAR_VISUALS_ASSET_BUCKET,file,adminAssetStoragePath(access,file));fileUrl=u.path;uploadedPaths.push(u.path);}
      if(thumb){const u=await uploadAdminFile(STAR_VISUALS_ASSET_BUCKET,thumb,STAR_VISUALS_THUMBNAIL_FOLDER);thumbnailUrl=u.path;uploadedPaths.push(u.path);}
      if(preview){const u=await uploadAdminFile(STAR_VISUALS_ASSET_BUCKET,preview,STAR_VISUALS_PREVIEW_FOLDER);previewUrl=u.path;uploadedPaths.push(u.path);}
      const software=String(document.getElementById('assetSoftware')?.value||'').trim();
      const compatibility=String(document.getElementById('assetCompatibility')?.value||software).split(',').map(v=>v.trim()).filter(Boolean);
      const payload={
        name:String(document.getElementById('assetName')?.value||'').trim(),
        description:String(document.getElementById('assetDescription')?.value||'').trim(),
        category:String(document.getElementById('assetCategory')?.value||'').trim(),
        subcategory:String(document.getElementById('assetSubcategory')?.value||'').trim()||null,
        tags:parseAdminTags(document.getElementById('assetTags')?.value),
        software,
        software_compatibility:compatibility,
        file_type:String(document.getElementById('assetFileType')?.value||file?.name.split('.').pop()?.toUpperCase()||'FILE').trim(),
        file_size:String(document.getElementById('assetFileSize')?.value||file?`${(file.size/1024/1024).toFixed(1)} MB`:'—').trim(),
        thumbnail_url:thumbnailUrl,
        preview_url:previewUrl||null,
        file_url:fileUrl||null,
        external_download_url:String(document.getElementById('assetExternalDownload')?.value||'').trim()||null,
        access_type:access,
        price:Number(document.getElementById('assetPrice')?.value||0),
        published:document.getElementById('assetPublished')?.value==='true',
        featured:document.getElementById('assetFeatured')?.checked===true,
        trending:document.getElementById('assetTrending')?.checked===true,
        updated_at:new Date().toISOString()
      };
      if(!payload.name||!payload.category){throw new Error('Asset name and category are required.');}
      if(!payload.file_url&&!payload.external_download_url){throw new Error('Add an asset file or a trusted external download link.');}
      if(payload.access_type==='premium'&&payload.external_download_url){throw new Error('Premium assets must use private Supabase Storage. Do not attach a public external download URL.');}
      if(payload.access_type==='premium'&&payload.file_url&&!getStoragePath(payload.file_url)){throw new Error('Premium assets must use a private Supabase Storage file path.');}
      if(!ASSET_LIBRARY_CATEGORIES.includes(payload.category))throw new Error('Choose a valid Asset Library category.');
      const result=id?await db.from('asset_library').update(payload).eq('id',id).select('id').single():await db.from('asset_library').insert(payload).select('id').single();
      if(result.error)throw result.error;
      const assetId=result.data?.id||id;
      const collectionId=document.getElementById('assetCollection')?.value||'';
      if(assetId&&collectionId){
        await db.from('asset_collection_items').upsert({collection_id:collectionId,asset_id:assetId,sort_order:0},{onConflict:'collection_id,asset_id'});
      }
      form.reset();document.getElementById('assetEditId').value='';
      setAssetStatus(payload.published?'Asset saved and published.':'Asset saved as draft.');
      await loadAdminAssets();await loadAssetCatalog();updateAssetFilterOptions();
    }catch(error){
      console.error('Asset save failed:',error);
      if(uploadedPaths.length){const {error:cleanupError}=await assetStorage().remove(uploadedPaths);if(cleanupError)console.warn('Upload cleanup failed:',cleanupError);}
      setAssetStatus(friendlyError(error),true);
    }
  });
  document.getElementById('assetResetForm')?.addEventListener('click',()=>{form.reset();document.getElementById('assetEditId').value='';setAssetStatus('Ready to add a new Asset Library resource.');});
  document.getElementById('adminAssetList')?.addEventListener('click',async e=>{
    const edit=e.target.closest('[data-asset-edit]');
    if(edit){
      const {data,error}=await db.from('asset_library').select('*').eq('id',edit.dataset.assetEdit).maybeSingle();
      if(error||!data){setAssetStatus(friendlyError(error||'Asset not found.'),true);return;}
      document.getElementById('assetEditId').value=data.id;
      document.getElementById('assetName').value=data.name||'';
      document.getElementById('assetDescription').value=data.description||'';
      document.getElementById('assetCategory').value=data.category||'';
      document.getElementById('assetSubcategory').value=data.subcategory||'';
      document.getElementById('assetTags').value=(data.tags||[]).join(', ');
      document.getElementById('assetSoftware').value=data.software||'';
      document.getElementById('assetCompatibility').value=(data.software_compatibility||[]).join(', ');
      document.getElementById('assetFileType').value=data.file_type||'FILE';
      document.getElementById('assetFileSize').value=data.file_size||'';
      document.getElementById('assetAccessType').value=data.access_type||'free';
      document.getElementById('assetPrice').value=Number(data.price||0);
      document.getElementById('assetThumbnail').value=data.thumbnail_url||'';
      document.getElementById('assetPreview').value=data.preview_url||'';
      document.getElementById('assetFileUrl').value=data.file_url||'';
      document.getElementById('assetExternalDownload').value=data.external_download_url||'';
      document.getElementById('assetPublished').value=data.published?'true':'false';
      document.getElementById('assetFeatured').checked=data.featured===true;
      document.getElementById('assetTrending').checked=data.trending===true;
      setAssetStatus('Asset loaded for editing. Uploading a replacement file will update its storage path.');
      document.getElementById('assetForm')?.scrollIntoView({behavior:'smooth',block:'start'});return;
    }
    const del=e.target.closest('[data-asset-delete]');
    if(del){
      if(!confirm('Delete this asset? The database record will be removed and unreferenced storage files owned by it will also be removed.'))return;
      try{await deleteAssetAndOwnedFiles(del.dataset.assetDelete);setAssetStatus('Asset deleted safely.');await loadAdminAssets();await loadAssetCatalog();}
      catch(error){setAssetStatus(friendlyError(error),true);}
    }
  });
}

/* ============================================================
   ADMIN STUDIO — services, courses, lessons, storage
   ============================================================ */
async function isCurrentUserAdmin(){
  if(!db)return false;
  const {data:{session}}=await db.auth.getSession();
  if(!session?.user)return false;
  const {data:profile}=await db.from('profiles').select('role,is_admin').eq('id',session.user.id).maybeSingle();
  return profile?.role==='admin'||profile?.is_admin===true;
}

function setAdminFeatureStatus(id,message,error=false){
  const el=document.getElementById(id);
  if(el){el.textContent=message;el.classList.toggle('error',error);}
}

async function loadPublicServices(){
  const host=document.getElementById('servicesPricing');
  if(!host){return;}
  if(!db){wireStaticServiceRows();return;}
  const {data,error}=await db.from('service_packages').select('*').eq('published',true).order('sort_order');
  if(error||!data?.length)return;
  host.innerHTML=`<div class="pricing-head"><span>✦ EDITING SERVICE / PACKAGE</span><span>STARTING PRICE</span></div>`+
    data.map((service,index)=>`<button class="price-row service-price-row" type="button" data-service-name="${escapeHtml(service.name)}"><div><span class="price-index">${String(index+1).padStart(2,'0')}</span><strong>${escapeHtml(service.name)}</strong><small>${escapeHtml(service.description||'Professional editing service')}</small></div><b>${escapeHtml(service.price_display||'Contact for quote')}</b></button>`).join('');
  wireStaticServiceRows();
}

function wireStaticServiceRows(){
  document.querySelectorAll('#servicesPricing .service-price-row').forEach(button=>{
    if(button.dataset.serviceWired==='1')return;
    button.dataset.serviceWired='1';
    button.addEventListener('click',()=>{
      const service=button.dataset.serviceName||'';
      location.href=`project.html?service=${encodeURIComponent(service)}`;
    });
  });
}

async function loadAdminServices(){
  const list=document.getElementById('adminServiceList');
  if(!list||!db)return;
  const {data,error}=await db.from('service_packages').select('*').order('sort_order');
  if(error){list.innerHTML='<div class="admin-empty">Services could not be loaded. Run the admin migration SQL first.</div>';return;}
  list.innerHTML=(data||[]).map(s=>`<article class="admin-request"><div class="admin-request-head"><div><span class="admin-index">${s.published?'Published':'Draft'}</span><h3>${escapeHtml(s.name)}</h3></div><div class="asset-admin-actions compact"><button class="outline-btn" type="button" data-service-edit="${s.id}">Edit price</button><button class="outline-btn" type="button" data-service-delete="${s.id}">Delete</button></div></div><div class="admin-request-grid"><div><span>PRICE</span><strong>${escapeHtml(s.price_display)}</strong></div><div><span>ORDER</span><strong>${Number(s.sort_order||0)}</strong></div><div><span>STATUS</span><strong>${s.published?'LIVE':'DRAFT'}</strong></div></div><div class="admin-brief"><span>DESCRIPTION</span><p>${escapeHtml(s.description||'')}</p></div></article>`).join('')||'<div class="admin-empty">No services yet.</div>';
}

async function saveServiceForm(event){
  event.preventDefault();
  if(!db)return;
  const id=document.getElementById('serviceEditId')?.value;
  const payload={
    name:document.getElementById('serviceName')?.value.trim(),
    description:document.getElementById('serviceDescription')?.value.trim(),
    price_display:document.getElementById('servicePrice')?.value.trim(),
    sort_order:Number(document.getElementById('serviceSort')?.value||0),
    published:document.getElementById('servicePublished')?.value==='true',
    updated_at:new Date().toISOString()
  };
  if(!payload.name||!payload.price_display){setAdminFeatureStatus('serviceStatus','Service name and price are required.',true);return;}
  const result=id?await db.from('service_packages').update(payload).eq('id',id):await db.from('service_packages').insert(payload);
  if(result.error){setAdminFeatureStatus('serviceStatus',friendlyError(result.error),true);return;}
  document.getElementById('serviceForm')?.reset();document.getElementById('serviceEditId').value='';
  setAdminFeatureStatus('serviceStatus','Service saved. Public pricing has been updated.');
  await loadAdminServices();await loadPublicServices();
}

async function loadAdminCourses(){
  const list=document.getElementById('adminCourseList');
  const select=document.getElementById('lessonCourseId');
  if(!db||(!list&&!select))return;
  const {data,error}=await db.from('courses').select('*').order('sort_order').order('created_at');
  if(error){if(list)list.innerHTML='<div class="admin-empty">Courses could not be loaded.</div>';return;}
  if(select)select.innerHTML='<option value="">Select course</option>'+(data||[]).map(c=>`<option value="${escapeHtml(c.id)}">${escapeHtml(c.title)}</option>`).join('');
  if(list)list.innerHTML=(data||[]).map(c=>`<article class="admin-request"><div class="admin-request-head"><div><span class="admin-index">${c.published?'Published':'Draft'}</span><h3>${escapeHtml(c.title)}</h3></div><div class="asset-admin-actions compact"><button class="outline-btn" type="button" data-course-edit="${c.id}">Edit</button><button class="outline-btn" type="button" data-course-delete="${c.id}">Delete</button></div></div><div class="admin-request-grid"><div><span>PRICE</span><strong>₹${Number(c.price_inr||0).toLocaleString('en-IN')}</strong></div><div><span>DURATION</span><strong>${escapeHtml(c.duration||'—')}</strong></div><div><span>ID</span><strong>${escapeHtml(c.id)}</strong></div></div><div class="admin-brief"><span>DESCRIPTION</span><p>${escapeHtml(c.description||'')}</p></div></article>`).join('')||'<div class="admin-empty">No courses yet.</div>';
}

async function saveCourseForm(event){
  event.preventDefault();if(!db)return;
  const id=document.getElementById('courseEditId')?.value;
  const title=document.getElementById('adminCourseTitle')?.value.trim();
  const slug=document.getElementById('adminCourseSlug')?.value.trim()||title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const payload={title,slug,category:document.getElementById('adminCourseCategory')?.value.trim(),description:document.getElementById('adminCourseDescription')?.value.trim(),duration:document.getElementById('adminCourseDuration')?.value.trim(),delivery:document.getElementById('adminCourseDelivery')?.value.trim(),price_inr:Number(document.getElementById('adminCoursePrice')?.value||0),sort_order:Number(document.getElementById('adminCourseSort')?.value||0),published:document.getElementById('adminCoursePublished')?.value==='true'};
  if(!title){setAdminFeatureStatus('courseAdminStatus','Course title is required.',true);return;}
  const result=id?await db.from('courses').update(payload).eq('id',id):await db.from('courses').insert(payload);
  if(result.error){setAdminFeatureStatus('courseAdminStatus',friendlyError(result.error),true);return;}
  document.getElementById('courseAdminForm')?.reset();document.getElementById('courseEditId').value='';
  setAdminFeatureStatus('courseAdminStatus','Course saved successfully.');await loadAdminCourses();await loadCoursesFromDatabase();
}

async function loadAdminLessons(courseId){
  const list=document.getElementById('adminLessonList');if(!list||!db)return;
  if(!courseId){list.innerHTML='<div class="admin-empty">Select a course to view lessons.</div>';return;}
  const {data,error}=await db.from('course_lessons').select('*').eq('course_id',courseId).order('lesson_order');
  if(error){list.innerHTML='<div class="admin-empty">Lessons could not be loaded.</div>';return;}
  const lessonIds=(data||[]).map(l=>l.id);
  const {data:materialRows}=lessonIds.length?await db.from('course_lesson_materials').select('lesson_id').in('lesson_id',lessonIds):{data:[]};
  const materialCounts=new Map();(materialRows||[]).forEach(row=>materialCounts.set(row.lesson_id,(materialCounts.get(row.lesson_id)||0)+1));
  list.innerHTML=(data||[]).map(l=>`<article class="admin-request"><div class="admin-request-head"><div><span class="admin-index">${l.published?'Published':'Draft'} · ${escapeHtml(l.content_type||'file')}</span><h3>${escapeHtml(l.title)}</h3></div><button class="outline-btn" type="button" data-lesson-delete="${l.id}">Delete</button></div><div class="admin-request-grid"><div><span>ORDER</span><strong>${Number(l.lesson_order||0)}</strong></div><div><span>VIDEO</span><strong>${escapeHtml(l.file_path||'External URL')}</strong></div><div><span>MATERIALS</span><strong>${materialCounts.get(l.id)||0}</strong></div><div><span>STATUS</span><strong>${l.published?'LIVE':'DRAFT'}</strong></div></div></article>`).join('')||'<div class="admin-empty">No lessons attached to this course yet.</div>';
}

async function saveLessonForm(event){
  event.preventDefault();if(!db)return;
  const courseId=document.getElementById('lessonCourseId')?.value;
  const file=document.getElementById('lessonFile')?.files?.[0]||null;
  const materialFiles=[...(document.getElementById('lessonMaterials')?.files||[])];
  const externalUrl=document.getElementById('lessonExternalUrl')?.value.trim()||'';
  const materialUrls=String(document.getElementById('lessonMaterialUrls')?.value||'').split(/\r?\n/).map(v=>v.trim()).filter(Boolean);
  if(!courseId){setAdminFeatureStatus('lessonStatus','Select a course first.',true);return;}
  if(!file&&!externalUrl){setAdminFeatureStatus('lessonStatus','Choose a video or provide an external lecture URL.',true);return;}
  try{
    setAdminFeatureStatus('lessonStatus',file||materialFiles.length?'Uploading lecture and materials…':'Saving lecture…');
    let filePath=null, contentType=file?.type||'file';
    if(file){
      const uploaded=await uploadAdminFile('course-files',file,courseId);
      filePath=uploaded.path;
      contentType='video';
    }
    const {data:lesson,error}=await db.from('course_lessons').insert({course_id:courseId,title:document.getElementById('lessonTitle')?.value.trim(),lesson_order:Number(document.getElementById('lessonOrder')?.value||1),content_type:contentType,file_path:filePath,external_url:externalUrl||null,published:document.getElementById('lessonPublished')?.value==='true'}).select('id').single();
    if(error)throw error;
    const materialRows=[];
    for(let i=0;i<materialFiles.length;i++){
      const material=materialFiles[i];
      const uploaded=await uploadAdminFile('course-files',material,`${courseId}/materials`);
      materialRows.push({lesson_id:lesson.id,title:material.name,material_type:material.type||'file',file_path:uploaded.path,external_url:null,sort_order:i});
    }
    materialUrls.forEach((url,i)=>materialRows.push({lesson_id:lesson.id,title:`External material ${i+1}`,material_type:'external',file_path:null,external_url:url,sort_order:materialFiles.length+i}));
    if(materialRows.length){const {error:materialError}=await db.from('course_lesson_materials').insert(materialRows);if(materialError)throw materialError;}
    document.getElementById('lessonForm')?.reset();
    setAdminFeatureStatus('lessonStatus',`Lecture uploaded${materialRows.length?` with ${materialRows.length} material${materialRows.length===1?'':'s'}`:''}.`);
    await loadAdminLessons(courseId);
  }catch(error){console.error('Lesson upload failed:',error);setAdminFeatureStatus('lessonStatus',friendlyError(error),true);}
}


async function loadAdminAssetStats(){
  const host=document.getElementById('assetAdminStats');if(!host||!db)return;
  const {data:assets}=await db.from('asset_library').select('id,access_type,downloads_count');
  const rows=assets||[];
  const total=rows.length,free=rows.filter(a=>a.access_type==='free').length,premium=rows.filter(a=>a.access_type==='premium').length;
  const downloads=rows.reduce((sum,a)=>sum+Number(a.downloads_count||0),0);
  const values=[total,free,premium,downloads];
  host.querySelectorAll('div strong').forEach((el,i)=>el.textContent=Number(values[i]||0).toLocaleString('en-IN'));
}

function setupAdminStudio(){
  if(window.__starVisualsAdminStudioSetup)return;
  if(!document.getElementById('adminServiceList'))return;
  window.__starVisualsAdminStudioSetup=true;
  document.getElementById('adminLogoutBtn')?.addEventListener('click',async()=>{
    await db?.auth.signOut({scope:'local'});location.href='login.html?logged-out=1';
  });
  document.getElementById('adminMobileLogout')?.addEventListener('click',async()=>{
    await db?.auth.signOut({scope:'local'});location.href='login.html?logged-out=1';
  });
  document.getElementById('serviceForm')?.addEventListener('submit',saveServiceForm);
  document.getElementById('serviceRefresh')?.addEventListener('click',loadAdminServices);
  document.getElementById('serviceReset')?.addEventListener('click',()=>{document.getElementById('serviceForm')?.reset();document.getElementById('serviceEditId').value='';});
  document.getElementById('adminServiceList')?.addEventListener('click',async e=>{
    const edit=e.target.closest('[data-service-edit]'),del=e.target.closest('[data-service-delete]');
    if(edit){const {data}=await db.from('service_packages').select('*').eq('id',edit.dataset.serviceEdit).maybeSingle();if(data){document.getElementById('serviceEditId').value=data.id;document.getElementById('serviceName').value=data.name;document.getElementById('serviceDescription').value=data.description||'';document.getElementById('servicePrice').value=data.price_display;document.getElementById('serviceSort').value=data.sort_order;document.getElementById('servicePublished').value=String(data.published);}}
    if(del){if(!confirm('Delete this service?'))return;await db.from('service_packages').delete().eq('id',del.dataset.serviceDelete);await loadAdminServices();await loadPublicServices();}
  });
  document.getElementById('courseAdminForm')?.addEventListener('submit',saveCourseForm);
  document.getElementById('courseRefresh')?.addEventListener('click',loadAdminCourses);
  document.getElementById('courseReset')?.addEventListener('click',()=>{document.getElementById('courseAdminForm')?.reset();document.getElementById('courseEditId').value='';});
  document.getElementById('adminCourseList')?.addEventListener('click',async e=>{
    const edit=e.target.closest('[data-course-edit]'),del=e.target.closest('[data-course-delete]');
    if(edit){const {data}=await db.from('courses').select('*').eq('id',edit.dataset.courseEdit).maybeSingle();if(data){document.getElementById('courseEditId').value=data.id;document.getElementById('adminCourseTitle').value=data.title||'';document.getElementById('adminCourseSlug').value=data.slug||'';document.getElementById('adminCourseCategory').value=data.category||'';document.getElementById('adminCoursePrice').value=Number(data.price_inr||0);document.getElementById('adminCourseDuration').value=data.duration||'';document.getElementById('adminCourseDelivery').value=data.delivery||'';document.getElementById('adminCourseSort').value=Number(data.sort_order||0);document.getElementById('adminCoursePublished').value=String(data.published);document.getElementById('adminCourseDescription').value=data.description||'';window.scrollTo({top:document.getElementById('courseAdminForm').offsetTop-100,behavior:'smooth'});}}
    if(del){if(!confirm('Delete this course?'))return;const r=await db.from('courses').delete().eq('id',del.dataset.courseDelete);if(r.error){setAdminFeatureStatus('courseAdminStatus',friendlyError(r.error),true);return;}await loadAdminCourses();}
  });
  document.getElementById('lessonCourseId')?.addEventListener('change',e=>loadAdminLessons(e.target.value));
  document.getElementById('lessonForm')?.addEventListener('submit',saveLessonForm);
  document.getElementById('lessonReset')?.addEventListener('click',()=>{document.getElementById('lessonForm')?.reset();document.getElementById('adminLessonList').innerHTML='<div class="admin-empty">Select a course to view lessons.</div>';});
  setupAdminAssetLibrary();
}

async function loadAdminStudio(){
  if(!document.getElementById('adminServiceList')||!db)return;
  const admin=await isCurrentUserAdmin();
  if(!admin){location.href='dashboard.html';return;}
  await Promise.all([loadAdminServices(),loadAdminCourses(),loadAdminLessons(document.getElementById('lessonCourseId')?.value||''),loadAssetCategories()]);
  setupAdminStudio();
}

async function init(){
  animateSocialCounters();
  wireAssetLibraryUI();
  wireStaticServiceRows();
  await loadCoursesFromDatabase();
  await loadAssetCatalog();
  await loadPublicServices();
  await loadStudio();
  if(document.getElementById('myAssetList'))await loadMyAssets();
  if(adminRequests)await loadAdminRequests();
  if(document.getElementById('adminAssetList')){await loadAssetCategories();await loadAssetCollections();await loadAdminAssets();await loadAdminAssetStats();}
  if(document.getElementById('adminServiceList'))await loadAdminStudio();
  if(db)db.auth.onAuthStateChange(async(event)=>{
    if(event==='PASSWORD_RECOVERY')showPasswordUpdate();
    if(event==='SIGNED_IN'&&isLoginPage)await navigateAfterAuth();
    await loadStudio();
    if(adminRequests)await loadAdminRequests();
    if(document.getElementById('adminAssetList')){await loadAssetCategories();await loadAssetCollections();await loadAdminAssets();await loadAdminAssetStats();}
    if(document.getElementById('adminServiceList'))await loadAdminStudio();
    await loadPublicServices();
    if(document.getElementById('myAssetList'))await loadMyAssets();
  });
}
init();
