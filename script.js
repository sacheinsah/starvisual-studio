const adminStatus=document.getElementById('adminStatus');
const adminRequests=document.getElementById('adminRequests');
function setAdminStatus(message,error=false){if(adminStatus){adminStatus.textContent=message;adminStatus.classList.toggle('error',error)}}
function adminRequestCard(request,profile){const contact=request.email||profile?.email||'No email provided';const phone=request.phone||'No phone provided';const service=request.service_type||request.package_name||'Editing request';const brief=request.requirements||'No brief provided';return `<article class="admin-request"><div class="admin-request-head"><div><span class="admin-index">${escapeHtml(request.project_name)}</span><h3>${escapeHtml(service)}</h3></div><select class="admin-status-select" data-request-id="${request.id}" aria-label="Update request status"><option value="NEW" ${request.status==='NEW'?'selected':''}>New</option><option value="REVIEWING" ${request.status==='REVIEWING'?'selected':''}>Reviewing</option><option value="QUOTED" ${request.status==='QUOTED'?'selected':''}>Quoted</option><option value="APPROVED" ${request.status==='APPROVED'?'selected':''}>Approved</option><option value="IN PROGRESS" ${request.status==='IN PROGRESS'?'selected':''}>In progress</option><option value="REVISION" ${request.status==='REVISION'?'selected':''}>Revision</option><option value="COMPLETED" ${request.status==='COMPLETED'?'selected':''}>Completed</option><option value="CANCELLED" ${request.status==='CANCELLED'?'selected':''}>Cancelled</option></select></div><div class="admin-request-grid"><div><span>CLIENT</span><strong>${escapeHtml(request.full_name||profile?.full_name||'Unknown')}</strong><small>${escapeHtml(contact)}<br>${escapeHtml(phone)}</small></div><div><span>SERVICE / PLATFORM</span><strong>${escapeHtml(service)}</strong><small>${escapeHtml(request.platform||'Platform not specified')} · ${escapeHtml(request.video_duration||'Duration not specified')}</small></div><div><span>BUDGET / DEADLINE</span><strong>${escapeHtml(request.budget||'Not specified')}</strong><small>${escapeHtml(request.deadline||'No deadline')} · ${request.created_at?new Date(request.created_at).toLocaleDateString('en-IN'):''}</small></div></div><div class="admin-brief"><span>PROJECT BRIEF</span><p>${escapeHtml(brief)}</p>${request.footage_link?`<a href="${escapeHtml(request.footage_link)}" target="_blank" rel="noopener">Open footage link ↗</a>`:''}${request.reference_link?`<a href="${escapeHtml(request.reference_link)}" target="_blank" rel="noopener">Open reference link ↗</a>`:''}</div><label class="admin-brief"><span>ADMIN MESSAGE</span><textarea data-admin-notes="${request.id}" rows="3" placeholder="Message visible in My Studio">${escapeHtml(request.admin_notes||'')}</textarea></label></article>`}async function loadAdminRequests(){if(!adminRequests||!db)return;setAdminStatus('Checking administrator access…');adminRequests.innerHTML='<div class="admin-empty">Loading requests…</div>';const {data:{session}}=await db.auth.getSession();if(!session?.user){location.href='login.html?returnTo=admin.html';return}const {data:isAdmin,error:adminError}=await db.rpc('project_request_admin_check');if(adminError||!isAdmin){location.href='dashboard.html';return}const {data:requests,error}=await db.from('project_requests').select('id,user_id,full_name,email,phone,project_name,service_type,video_duration,platform,editing_style,requirements,deadline,budget,footage_link,reference_link,additional_notes,status,admin_notes,created_at,updated_at,package_name,amount_inr,notes').order('created_at',{ascending:false});if(error){console.error('Project request load failed:',error);setAdminStatus(friendlyError(error),true);adminRequests.innerHTML='<div class="admin-empty">Requests could not be loaded.</div>';return}const ids=[...new Set((requests||[]).map(request=>request.user_id))];const {data:profiles}=ids.length?await db.from('profiles').select('id,full_name,email').in('id',ids):{data:[]};const profileMap=new Map((profiles||[]).map(profile=>[profile.id,profile]));adminRequests.innerHTML=requests?.length?requests.map(request=>adminRequestCard(request,profileMap.get(request.user_id))).join(''):'<div class="admin-empty">No editing requests yet.</div>';setAdminStatus(`${requests?.length||0} request${requests?.length===1?'':'s'} found.`)}
document.getElementById('adminRefresh')?.addEventListener('click',loadAdminRequests);
adminRequests?.addEventListener('change',async event=>{const select=event.target.closest('.admin-status-select');if(!select||!db)return;select.disabled=true;const {error}=await db.from('project_requests').update({status:select.value,updated_at:new Date().toISOString()}).eq('id',select.dataset.requestId);select.disabled=false;if(error){console.error('Project request status update failed:',error);setAdminStatus(friendlyError(error),true);return}setAdminStatus('Request status updated.')});adminRequests?.addEventListener('change',async event=>{const notes=event.target.closest('[data-admin-notes]');if(!notes||!db)return;const {error}=await db.from('project_requests').update({admin_notes:notes.value,updated_at:new Date().toISOString()}).eq('id',notes.dataset.adminNotes);if(error){console.error('Admin note update failed:',error);setAdminStatus(friendlyError(error),true);return}setAdminStatus('Admin message saved.')});
/* STAR VISUALS — shared UI, email/password + Google authentication and Supabase data */
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
if(isLoginPage){overlay?.classList.add('open');overlay?.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');}
else{overlay?.classList.remove('open');overlay?.setAttribute('aria-hidden','true');}
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
async function continueWithGoogle(){if(!db){setAuthStatus(authUnavailableMessage,true);return}const buttons=[...document.querySelectorAll('[data-google-auth]')];buttons.forEach(button=>{button.disabled=true});setAuthStatus('Connecting to Google…');try{const redirectTarget=sanitizeReturnTarget(authReturnTo)||location.pathname.split('/').pop()||'index.html';const redirectTo=location.origin==='null'?undefined:`${location.origin}/${redirectTarget.replace(/^\/+/, '')}`;const options=redirectTo?{redirectTo}:{};const {error}=await withAuthTimeout(db.auth.signInWithOAuth({provider:'google',options}));if(error)setAuthStatus(friendlyError(error),true)}catch(error){setAuthStatus(friendlyError(error),true)}finally{buttons.forEach(button=>{button.disabled=false})}}
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

const DEFAULT_ASSET_CATEGORIES=[
  {id:'cinematic-reel-pack',name:'Cinematic Reel Pack',description:'Cinematic reel templates and storytelling resources.',thumbnail_url:'assets/asset-pack/asset-library-cover.svg'},
  {id:'premium-motion-pack',name:'Premium Motion Pack',description:'Premium motion graphics, presets and animation resources.',thumbnail_url:'assets/asset-pack/asset-library-cover.svg'},
  {id:'thumbnail-formula-pack',name:'Thumbnail Formula Pack',description:'Thumbnail systems and visual formulas for creators.',thumbnail_url:'assets/asset-pack/asset-library-cover.svg'},
  {id:'reel-transition-pack',name:'Reel Transition Pack',description:'Transitions and finishing assets for short-form edits.',thumbnail_url:'assets/asset-pack/asset-library-cover.svg'},
  {id:'cinematic-lut-pack',name:'Cinematic LUT Pack',description:'Cinematic colour presets and LUT resources.',thumbnail_url:'assets/asset-pack/asset-library-cover.svg'},
  {id:'creator-sfx-bundle',name:'Creator SFX Bundle',description:'Impacts, whooshes, ambience and creator sound effects.',thumbnail_url:'assets/asset-pack/asset-library-cover.svg'},
  {id:'creator-asset-pack',name:'Creator Asset Pack',description:'General creator resources, overlays and production assets.',thumbnail_url:'assets/asset-pack/asset-library-cover.svg'}
];
let ASSET_LIBRARY_CATEGORIES=DEFAULT_ASSET_CATEGORIES.map(c=>c.name);
let ASSET_LIBRARY_CATEGORY_META=Object.fromEntries(DEFAULT_ASSET_CATEGORIES.map(c=>[c.name,c.description]));
let ASSET_LIBRARY_CATEGORY_OBJECTS=DEFAULT_ASSET_CATEGORIES.map(c=>({...c}));

const assetCatalogFallback=[];
window.STAR_VISUALS_ASSET_CATEGORIES=window.STAR_VISUALS_ASSET_CATEGORIES||DEFAULT_ASSET_CATEGORIES;

function setAssetCategories(categories){
  const cleaned=(categories||[]).map((c)=>({
    id:c.id||String(c.name||'category').toLowerCase().replace(/[^a-z0-9]+/g,'-'),
    name:String(c.name||'').trim(),
    description:String(c.description||'').trim()||'Creative assets for this category.',
    thumbnail_url:c.thumbnail_url||'assets/asset-pack/asset-library-cover.svg'
  })).filter(c=>c.name);
  const seen=new Set();
  ASSET_LIBRARY_CATEGORY_OBJECTS=cleaned.filter(c=>{const key=c.name.toLowerCase();if(seen.has(key))return false;seen.add(key);return true;});
  ASSET_LIBRARY_CATEGORIES=ASSET_LIBRARY_CATEGORY_OBJECTS.map(c=>c.name);
  ASSET_LIBRARY_CATEGORY_META=Object.fromEntries(ASSET_LIBRARY_CATEGORY_OBJECTS.map(c=>[c.name,c.description]));
  window.STAR_VISUALS_ASSET_CATEGORIES=ASSET_LIBRARY_CATEGORY_OBJECTS;
}
setAssetCategories(window.STAR_VISUALS_ASSET_CATEGORIES);

function dedupeAssets(assets){
  const seen=new Set();
  return (assets||[]).map(normalizeAsset).filter(item=>{
    const signature=[item.name,item.category,item.file_url||item.external_download_url||'',item.thumbnail_url||''].map(v=>String(v).trim().toLowerCase()).join('|');
    if(seen.has(signature))return false;
    seen.add(signature);return true;
  });
}

function normalizeAsset(asset){
  const item={...asset};
  item.id=item.id||String(item.name||'asset').toLowerCase().replace(/[^a-z0-9]+/g,'-');
  item.category=String(item.category||'').trim()||ASSET_LIBRARY_CATEGORIES[0]||'Creator Asset Pack';
  item.access_type=(item.access_type||item.accessType||'free').toLowerCase();
  item.price=Number(item.price||0);
  item.file_size=item.file_size||item.fileSize||'—';
  item.software=item.software||'Any';
  item.thumbnail_url=item.thumbnail_url||'assets/asset-pack/asset-library-cover.svg';
  item.published=item.published!==false;
  item.external_download_url=item.external_download_url||item.externalDownloadUrl||'';
  return item;
}
function formatAssetPrice(asset){const item=normalizeAsset(asset);return item.access_type==='free'?'FREE':`₹${Number(item.price||0).toLocaleString('en-IN')}`;}
function assetLockLabel(asset){const item=normalizeAsset(asset);return item.access_type==='premium' ? '<span class="asset-lock">Premium access</span>' : '<span class="asset-lock">Free</span>'}
function findAssetById(assetId){const catalog=window.STAR_VISUALS_ASSET_CATALOG||[];return [...catalog].map(normalizeAsset).find((asset)=>String(asset.id)===String(assetId))||null;}
function setAssetStatus(message,error=false){const el=document.getElementById('assetStatus');if(!el)return;el.textContent=message;el.classList.toggle('error',Boolean(error));}

async function handleAssetDownload(asset){
  const item=normalizeAsset(asset);
  if(!db){toast('Connect Supabase in supabase-config.js to unlock asset downloads.');return;}
  const {data:{session}}=await db.auth.getSession();
  if(item.access_type==='premium'&&!session?.user){openAuth('email-login');toast('Log in to unlock premium assets.');return;}
  const directUrl=item.external_download_url||item.file_url||item.preview_url;
  if(!directUrl){toast('This asset is not available yet.');return;}
  if(item.access_type==='premium'&&session?.user&&/^[0-9a-f-]{36}$/i.test(String(item.id))){
    const {data:accessRecord}=await db.from('user_asset_access').select('id').eq('user_id',session.user.id).eq('asset_id',item.id).maybeSingle();
    if(!accessRecord){
      const {error}=await db.from('user_asset_access').insert({user_id:session.user.id,asset_id:item.id,access_type:'premium',status:'downloaded'});
      if(error){toast(friendlyError(error));return;}
    }
  }
  if(typeof window!=='undefined'&&/^https?:\/\//i.test(directUrl)){window.open(directUrl,'_blank','noopener');toast(item.access_type==='premium'?'Premium asset unlocked.':'Asset downloaded.');return;}
  if(db.storage&&item.file_url&&!/^https?:\/\//i.test(item.file_url)){
    const {data,error}=await assetStorage().createSignedUrl(item.file_url,3600);
    if(error){toast(friendlyError(error));return;}
    if(data?.signedUrl){window.open(data.signedUrl,'_blank','noopener');toast(item.access_type==='premium'?'Premium asset unlocked.':'Asset downloaded.');return;}
  }
  toast('This asset is not available yet.');
}

function assetCardsMarkup(assets){
  return (assets||[]).map((asset)=>{
    const item=normalizeAsset(asset);
    return `<article class="asset-card ${item.access_type==='premium'?'premium':''}"><div class="asset-thumb" style="background-image:url('${escapeHtml(item.thumbnail_url)}')"><span class="asset-badge ${item.access_type==='premium'?'premium':''}">${item.access_type==='premium'?'Premium':'Free'}</span></div><div class="asset-content"><div class="asset-meta-top"><span class="asset-category">${escapeHtml(item.category)}</span>${item.access_type==='premium'?'<span class="asset-lock">Premium</span>':'<span class="asset-lock">Free</span>'}</div><h4>${escapeHtml(item.name)}</h4><p>${escapeHtml(item.description||'Creative asset for faster editing workflows.')}</p><div class="asset-specs"><div>Software<strong>${escapeHtml(item.software)}</strong></div><div>Type<strong>${escapeHtml(item.file_type||'ZIP')}</strong></div><div>Size<strong>${escapeHtml(item.file_size||'—')}</strong></div><div>Price<strong>${formatAssetPrice(item)}</strong></div></div><div class="asset-price">${formatAssetPrice(item)}</div><div class="asset-actions"><button class="asset-button" type="button" data-asset-id="${escapeHtml(String(item.id))}" data-asset-action="preview">Preview</button><button class="asset-button primary" type="button" data-asset-id="${escapeHtml(String(item.id))}" data-asset-action="download">${item.access_type==='premium'?'Get Asset':'Download'}</button></div></div></article>`;
  }).join('');
}

function renderAssetCards(containerId, assets){
  const list=document.getElementById(containerId); if(!list)return;
  const catalog=(assets||window.STAR_VISUALS_ASSET_CATALOG||[]).map(normalizeAsset);
  window.STAR_VISUALS_ASSET_CATALOG=catalog;
  if(!catalog.length){list.innerHTML='<div class="asset-empty">No published assets yet. Try again soon.</div>';return;}
  list.innerHTML=assetCardsMarkup(catalog);
}

function assetCategorySlug(name){return encodeURIComponent(String(name||'').trim());}
function renderAssetCategoryCards(hostId, assets){
  const host=document.getElementById(hostId); if(!host)return;
  const counts=new Map();
  dedupeAssets(assets||[]).forEach(a=>counts.set(a.category,(counts.get(a.category)||0)+1));
  host.innerHTML=ASSET_LIBRARY_CATEGORY_OBJECTS.map(category=>`<a class="asset-category-card" href="assets.html?category=${assetCategorySlug(category.name)}" data-asset-category="${escapeHtml(category.name)}">
    <div class="asset-category-card-thumb" style="background-image:url('${escapeHtml(category.thumbnail_url)}')"></div>
    <div class="asset-category-card-body"><span class="eyebrow">ASSET CATEGORY</span><h4>${escapeHtml(category.name)}</h4><p>${escapeHtml(category.description)}</p><strong>${counts.get(category.name)||0} asset${counts.get(category.name)===1?'':'s'} · View pack →</strong></div>
  </a>`).join('');
}

function renderAssetCategorySections(hostId, assets, selectedCategory=''){
  const host=document.getElementById(hostId); if(!host)return;
  const catalog=dedupeAssets(assets||[]);
  const sections=ASSET_LIBRARY_CATEGORY_OBJECTS
    .map(category=>({category:category.name,assets:catalog.filter(asset=>asset.category===category.name)}))
    .filter(section=>section.assets.length && (!selectedCategory||section.category===selectedCategory));
  host.innerHTML=sections.length?sections.map(section=>`<section class="service-asset-group" id="asset-category-${escapeHtml(section.category).replace(/[^a-z0-9]+/gi,'-')}"><div class="service-asset-group-head"><div><p class="eyebrow">CATEGORY</p><h4>${escapeHtml(section.category)}</h4><p>${escapeHtml(ASSET_LIBRARY_CATEGORY_META[section.category]||'')}</p></div><strong>${section.assets.length} asset${section.assets.length===1?'':'s'}</strong></div><div class="asset-grid">${assetCardsMarkup(section.assets)}</div></section>`).join(''):'<div class="asset-empty">No published assets are available in this category yet.</div>';
}

function renderAssetCategorySelect(){
  const select=document.getElementById('assetCategory'); if(!select)return;
  const current=select.value;
  select.innerHTML=ASSET_LIBRARY_CATEGORIES.map(category=>`<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('');
  if(current&&ASSET_LIBRARY_CATEGORIES.includes(current))select.value=current;
}

async function loadAssetCategories(){
  if(!db){setAssetCategories(DEFAULT_ASSET_CATEGORIES);renderAssetCategorySelect();return;}
  const {data,error}=await db.from('asset_categories').select('*').eq('published',true).order('sort_order').order('created_at');
  if(error){
    console.warn('Asset categories table unavailable; using default categories.',error);
    setAssetCategories(DEFAULT_ASSET_CATEGORIES);
  }else if(data?.length){
    setAssetCategories(data);
  }else{
    setAssetCategories(DEFAULT_ASSET_CATEGORIES);
  }
  renderAssetCategorySelect();
}

async function loadAssetCatalog(){
  const catalogElement=document.getElementById('assetLibraryGrid');
  const categoryHost=document.getElementById('assetLibrarySections')||document.getElementById('servicesAssetSections');
  const categoryCards=document.getElementById('assetCategoryCards');
  if(!catalogElement&&!categoryHost&&!categoryCards)return;
  await loadAssetCategories();
  let assets=[];
  if(db){
    const {data,error}=await db.from('asset_library').select('*').eq('published',true).order('created_at',{ascending:false});
    if(error){console.error('Public Asset Library load failed:',error);}
    else assets=data||[];
  }
  assets=dedupeAssets(assets);
  window.STAR_VISUALS_ASSET_CATALOG=assets;
  const params=new URLSearchParams(location.search);
  const requestedCategory=params.get('category')||'';
  const validCategory=ASSET_LIBRARY_CATEGORIES.find(name=>name.toLowerCase()===requestedCategory.trim().toLowerCase())||'';
  if(categoryCards)renderAssetCategoryCards('assetCategoryCards',assets);
  if(categoryHost)renderAssetCategorySections(categoryHost.id,assets,validCategory);
  if(catalogElement)renderAssetCards('assetLibraryGrid',validCategory?assets.filter(a=>a.category===validCategory):assets);

  const selection=document.getElementById('assetCategorySelection');
  if(selection)selection.textContent=validCategory||'All categories';
  const showAll=document.getElementById('assetShowAll');
  if(showAll&&!showAll.dataset.wired){
    showAll.dataset.wired='1';
    showAll.addEventListener('click',()=>{
      history.pushState({},'',location.pathname+'#asset-library');
      if(selection)selection.textContent='All categories';
      if(categoryHost)renderAssetCategorySections(categoryHost.id,window.STAR_VISUALS_ASSET_CATALOG||[]);
      if(catalogElement)renderAssetCards('assetLibraryGrid',window.STAR_VISUALS_ASSET_CATALOG||[]);
      categoryHost?.scrollIntoView({behavior:'smooth',block:'start'});
    });
  }

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

const STAR_VISUALS_ASSET_BUCKET='star-assets';
const STAR_VISUALS_ASSET_FOLDER='asset-pack';
const STAR_VISUALS_THUMBNAIL_FOLDER='asset-pack/thumbnails';

function assetStorage(bucket=STAR_VISUALS_ASSET_BUCKET){
  if(!db?.storage)throw new Error('Supabase Storage is not available. Check supabase-config.js.');
  return db.storage.from(bucket);
}
function assetStorageError(error){
  const message=error?.message||String(error||'Unknown storage error.');
  if(/bucket.*not found/i.test(message))return `Storage bucket "${STAR_VISUALS_ASSET_BUCKET}" was not found. Run the included supabase-asset-library-separation-fix.sql migration in Supabase SQL Editor.`;
  if(/row-level security|permission denied|not authorized|unauthorized/i.test(message))return `Storage permission denied. Make sure your signed-in account is an admin and the Asset Library storage policies are installed.`;
  return message;
}

async function loadAdminAssets(){
  const list=document.getElementById('adminAssetList');
  if(!list||!db)return;
  const {data,error}=await db.from('asset_library').select('*').order('created_at',{ascending:false});
  if(error){
    console.error('Asset library database load failed:',error);
    const assetDbMessage=error?.message&&/external_download_url.*asset_library.*schema cache|asset_library.*external_download_url.*schema cache/i.test(error.message)
      ? `The Asset Library table exists, but its external_download_url column is missing from Supabase. Run supabase-asset-library-column-fix.sql in Supabase SQL Editor, then refresh this page.`
      : error?.message&&/asset_library.*schema cache|relation .*asset_library.*does not exist/i.test(error.message)
        ? `The Asset Library table is missing from Supabase. Run supabase-asset-library-separation-fix.sql in Supabase SQL Editor, then refresh this page.`
        : friendlyError(error);
    list.innerHTML=`<div class="admin-empty">Assets could not be loaded: ${escapeHtml(assetDbMessage)}</div>`;
    setAssetStatus(assetDbMessage,true);
    return;
  }
  if(!data?.length){list.innerHTML='<div class="admin-empty">No assets yet. Add your first resource above.</div>';return;}
  list.innerHTML=data.map((asset)=>`<article class="admin-request"><div class="admin-request-head"><div><span class="admin-index">${escapeHtml(asset.published?'Published':'Draft')}</span><h3>${escapeHtml(asset.name)}</h3></div><div class="asset-admin-actions compact"><button class="outline-btn" type="button" data-asset-edit="${escapeHtml(asset.id)}">Edit</button><button class="outline-btn" type="button" data-asset-delete="${escapeHtml(asset.id)}">Delete</button></div></div><div class="admin-request-grid"><div><span>Asset Library category</span><strong>${escapeHtml(asset.category||'Cinematic Reel Pack')}</strong></div><div><span>Access</span><strong>${escapeHtml(asset.access_type||'free')}</strong></div><div><span>Download</span><strong>${asset.external_download_url?'External link':asset.file_url?'Storage file':'Not set'}</strong></div></div><div class="admin-brief"><span>DETAILS</span><p>${escapeHtml(asset.description||'No description yet.')}</p></div></article>`).join('');
}

async function loadAdminAssetCategories(){
  const list=document.getElementById('adminAssetCategoryList');
  if(!db||(!list&&!document.getElementById('assetCategory')))return;
  await loadAssetCategories();
  if(list){
    list.innerHTML=ASSET_LIBRARY_CATEGORY_OBJECTS.map(category=>{
      const count=(window.STAR_VISUALS_ASSET_CATALOG||[]).filter(a=>a.category===category.name).length;
      return `<article class="asset-category-admin-card"><div class="asset-category-card-thumb" style="background-image:url('${escapeHtml(category.thumbnail_url)}')"></div><div><span class="eyebrow">${count} ASSETS</span><h4>${escapeHtml(category.name)}</h4><p>${escapeHtml(category.description)}</p></div><div class="asset-admin-actions compact"><button class="outline-btn" type="button" data-asset-category-edit="${escapeHtml(String(category.id))}">Edit</button>${!DEFAULT_ASSET_CATEGORIES.some(c=>c.name===category.name)?`<button class="outline-btn" type="button" data-asset-category-delete="${escapeHtml(String(category.id))}">Delete</button>`:''}<button class="btn" type="button" data-asset-category-upload="${escapeHtml(category.name)}">Upload asset</button></div></article>`;
    }).join('');
  }
  renderAssetCategorySelect();
}

function setAssetCategoryStatus(message,error=false){
  const el=document.getElementById('assetCategoryStatus');if(el){el.textContent=message;el.classList.toggle('error',Boolean(error));}
}
document.getElementById('assetCategoryForm')?.addEventListener('submit',async(event)=>{
  event.preventDefault(); if(!db){setAssetCategoryStatus('Connect Supabase before managing categories.',true);return;}
  const id=document.getElementById('assetCategoryEditId')?.value||'';
  const name=document.getElementById('assetCategoryName')?.value.trim();
  const description=document.getElementById('assetCategoryDescription')?.value.trim();
  let thumbnail=document.getElementById('assetCategoryThumbnail')?.value.trim()||'assets/asset-pack/asset-library-cover.svg';
  const thumbFile=document.getElementById('assetCategoryUploadThumbnail')?.files?.[0];
  try{
    if(!name){setAssetCategoryStatus('Category name is required.',true);return;}
    if(thumbFile){
      const uploaded=await uploadAdminFile(STAR_VISUALS_ASSET_BUCKET,thumbFile,STAR_VISUALS_THUMBNAIL_FOLDER);
      thumbnail=assetStorage().getPublicUrl(uploaded.path).data.publicUrl;
    }
    const payload={name,description,thumbnail_url:thumbnail,published:true,sort_order:ASSET_LIBRARY_CATEGORY_OBJECTS.length,updated_at:new Date().toISOString()};
    const result=id?await db.from('asset_categories').update(payload).eq('id',id):await db.from('asset_categories').insert(payload);
    if(result.error)throw result.error;
    document.getElementById('assetCategoryForm').reset();document.getElementById('assetCategoryEditId').value='';
    setAssetCategoryStatus('Category saved. You can now upload assets into it.');
    await loadAssetCategories();await loadAdminAssetCategories();await loadAssetCatalog();
  }catch(error){console.error(error);setAssetCategoryStatus(friendlyError(error),true);}
});
document.getElementById('assetCategoryReset')?.addEventListener('click',()=>{
  document.getElementById('assetCategoryForm')?.reset();document.getElementById('assetCategoryEditId').value='';setAssetCategoryStatus('Ready to create a new category.');
});
document.getElementById('adminAssetCategoryList')?.addEventListener('click',async(event)=>{
  const upload=event.target.closest('[data-asset-category-upload]');
  if(upload){
    const select=document.getElementById('assetCategory'); if(select){select.value=upload.dataset.assetCategory;document.getElementById('assetName')?.focus();}
    document.getElementById('assetForm')?.scrollIntoView({behavior:'smooth',block:'start'});setAssetStatus(`Ready to upload an asset into ${upload.dataset.assetCategory}.`);return;
  }
  const edit=event.target.closest('[data-asset-category-edit]');
  if(edit&&db){
    const {data,error}=await db.from('asset_categories').select('*').eq('id',edit.dataset.assetCategoryEdit).maybeSingle();
    if(error||!data){setAssetCategoryStatus('This category is one of the built-in categories and can be changed by editing its assets.',true);return;}
    document.getElementById('assetCategoryEditId').value=data.id;document.getElementById('assetCategoryName').value=data.name||'';document.getElementById('assetCategoryDescription').value=data.description||'';document.getElementById('assetCategoryThumbnail').value=data.thumbnail_url||'';setAssetCategoryStatus('Category loaded for editing.');return;
  }
  const del=event.target.closest('[data-asset-category-delete]');
  if(del&&db&&confirm('Delete this category? Assets inside it will remain but need to be moved to another category.')){
    const {error}=await db.from('asset_categories').delete().eq('id',del.dataset.assetCategoryDelete);
    if(error){setAssetCategoryStatus(friendlyError(error),true);return;}
    await loadAssetCategories();await loadAdminAssetCategories();await loadAssetCatalog();setAssetCategoryStatus('Category deleted.');
  }
});

const assetForm=document.getElementById('assetForm');
const assetEditId=document.getElementById('assetEditId');
async function uploadAdminFile(bucket,file,folder){
  if(!db||!file)return null;
  const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,'-');
  const path=`${folder}/${Date.now()}-${safe}`;
  const storage=assetStorage(bucket);
  const {data,error}=await storage.upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type||undefined});
  if(error)throw new Error(assetStorageError(error));
  return {path:data.path};
}
assetForm?.addEventListener('submit',async(event)=>{
  event.preventDefault();
  if(!db){setAssetStatus('Connect Supabase before managing assets.',true);return;}
  const file=document.getElementById('assetUploadFile')?.files?.[0]||null;
  const thumbnailFile=document.getElementById('assetUploadThumbnail')?.files?.[0]||null;
  try{
    setAssetStatus(file||thumbnailFile?'Uploading asset files…':'Saving asset…');
    let fileUrl=String(document.getElementById('assetFileUrl')?.value||'').trim();
    let thumbnailUrl=String(document.getElementById('assetThumbnail')?.value||'').trim();
    let fileSize=String(document.getElementById('assetFileSize')?.value||'').trim();
    let fileType=String(document.getElementById('assetFileType')?.value||'').trim();
    if(file){
      const uploaded=await uploadAdminFile(STAR_VISUALS_ASSET_BUCKET,file,STAR_VISUALS_ASSET_FOLDER);
      fileUrl=assetStorage().getPublicUrl(uploaded.path).data.publicUrl;
      fileSize=fileSize||`${(file.size/1024/1024).toFixed(1)} MB`;
      fileType=fileType||file.name.split('.').pop()?.toUpperCase()||'FILE';
    }
    if(thumbnailFile){
      const uploadedThumb=await uploadAdminFile(STAR_VISUALS_ASSET_BUCKET,thumbnailFile,STAR_VISUALS_THUMBNAIL_FOLDER);
      thumbnailUrl=assetStorage().getPublicUrl(uploadedThumb.path).data.publicUrl;
    }
    const externalDownloadUrl=String(document.getElementById('assetExternalDownload')?.value||'').trim();
    const payload={
      name:String(document.getElementById('assetName')?.value||'').trim(),
      description:String(document.getElementById('assetDescription')?.value||'').trim(),
      category:String(document.getElementById('assetCategory')?.value||'Cinematic Reel Pack').trim(),
      software:String(document.getElementById('assetSoftware')?.value||'').trim(),
      file_type:fileType||'FILE',
      file_size:fileSize||'—',
      thumbnail_url:thumbnailUrl||'assets/asset-pack/asset-library-cover.svg',
      preview_url:String(document.getElementById('assetPreview')?.value||'').trim(),
      file_url:fileUrl,
      external_download_url:externalDownloadUrl||null,
      access_type:String(document.getElementById('assetAccessType')?.value||'free').trim(),
      price:Number(document.getElementById('assetPrice')?.value||0),
      published:String(document.getElementById('assetPublished')?.value||'true')==='true',
      updated_at:new Date().toISOString()
    };
    if(!ASSET_LIBRARY_CATEGORIES.includes(payload.category)){setAssetStatus('Choose a valid Asset Library category.',true);return;}
    if(!payload.name||(!payload.file_url&&!payload.external_download_url)){setAssetStatus('Asset name and either an uploaded/storage file, File URL, or External Download Link are required.',true);return;}
    let result;
    const savedAssetId=assetEditId?.value||'';
    if(savedAssetId){
      result=await db.from('asset_library').update(payload).eq('id',savedAssetId).select('id').single();
    }else{
      result=await db.from('asset_library').insert(payload).select('id').single();
    }
    if(result.error)throw result.error;
    if(!result.data?.id&&!savedAssetId)throw new Error('Asset was saved but its database ID could not be returned.');
    assetForm.reset();
    if(assetEditId)assetEditId.value='';
    document.getElementById('assetCategory').value='Cinematic Reel Pack';
    document.getElementById('assetThumbnail').value='assets/asset-pack/asset-library-cover.svg';
    setAssetStatus(payload.published?'Asset saved and published.':'Asset saved as draft.');
    await loadAdminAssets();
    await loadAssetCatalog();
  }catch(error){
    console.error('Asset save failed:',error);
    const message=error?.message||friendlyError(error);
    if(/external_download_url.*asset_library.*schema cache|asset_library.*external_download_url.*schema cache/i.test(message)){
      setAssetStatus('The Asset Library table exists, but external_download_url is missing. Run supabase-asset-library-column-fix.sql in Supabase SQL Editor, then refresh this page.',true);
    }else{
      setAssetStatus(message,true);
    }
  }
});

document.getElementById('assetResetForm')?.addEventListener('click',()=>{
  assetForm?.reset();
  if(assetEditId)assetEditId.value='';
  const category=document.getElementById('assetCategory'); if(category)category.value='Cinematic Reel Pack';
  const thumb=document.getElementById('assetThumbnail'); if(thumb)thumb.value='assets/asset-pack/asset-library-cover.svg';
  setAssetStatus('Ready to add a new Asset Library resource.');
});

document.getElementById('adminAssetList')?.addEventListener('click',async(event)=>{
  const editButton=event.target.closest('[data-asset-edit]');
  if(editButton&&db){
    const {data,error}=await db.from('asset_library').select('*').eq('id',editButton.dataset.assetEdit).maybeSingle();
    if(error||!data){setAssetStatus(friendlyError(error||'Asset not found.'),true);return;}
    document.getElementById('assetEditId').value=data.id;
    document.getElementById('assetName').value=data.name||'';
    document.getElementById('assetDescription').value=data.description||'';
    document.getElementById('assetCategory').value=ASSET_LIBRARY_CATEGORIES.includes(data.category)?data.category:'Cinematic Reel Pack';
    document.getElementById('assetSoftware').value=data.software||'';
    document.getElementById('assetFileType').value=data.file_type||'ZIP';
    document.getElementById('assetFileSize').value=data.file_size||'';
    document.getElementById('assetAccessType').value=data.access_type||'free';
    document.getElementById('assetPrice').value=Number(data.price||0);
    document.getElementById('assetThumbnail').value=data.thumbnail_url||'';
    document.getElementById('assetPreview').value=data.preview_url||'';
    document.getElementById('assetFileUrl').value=data.file_url||'';
    document.getElementById('assetExternalDownload').value=data.external_download_url||'';
    document.getElementById('assetPublished').value=data.published?'true':'false';
    setAssetStatus('Asset loaded for editing. Editing Service data is not modified.');
    return;
  }
  const deleteButton=event.target.closest('[data-asset-delete]');
  if(deleteButton&&db){
    const assetId=deleteButton.dataset.assetDelete;
    const {error}=await db.from('asset_library').delete().eq('id',assetId);
    if(error){setAssetStatus(friendlyError(error),true);return;}
    setAssetStatus('Asset deleted from the Asset Library.');
    await loadAdminAssets();
    await loadAssetCatalog();
  }
});


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
  wireStaticServiceRows();
  await loadCoursesFromDatabase();
  await loadAssetCatalog();
  await loadPublicServices();
  await loadStudio();
  if(document.getElementById('myAssetList'))await loadMyAssets();
  if(adminRequests)await loadAdminRequests();
  if(document.getElementById('adminAssetList')){await loadAssetCategories();await loadAdminAssets();}
  if(document.getElementById('adminServiceList'))await loadAdminStudio();
  if(db)db.auth.onAuthStateChange(async(event)=>{
    if(event==='PASSWORD_RECOVERY')showPasswordUpdate();
    if(event==='SIGNED_IN'&&isLoginPage)await navigateAfterAuth();
    await loadStudio();
    if(adminRequests)await loadAdminRequests();
    if(document.getElementById('adminAssetList')){await loadAssetCategories();await loadAdminAssets();}
    if(document.getElementById('adminServiceList'))await loadAdminStudio();
    await loadPublicServices();
    if(document.getElementById('myAssetList'))await loadMyAssets();
  });
}
init();
