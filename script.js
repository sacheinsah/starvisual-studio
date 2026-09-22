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

const overlay=document.getElementById('authOverlay');
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

phoneMethod?.remove();
document.querySelector('.auth-divider')?.remove();
document.querySelector('.auth-sub')?.replaceChildren(document.createTextNode('Sign in or create your account with your email and password.'));
document.querySelectorAll('.auth-tabs button').forEach((button,index)=>{
  button.dataset.tab=index===0?'email-login':'email-signup';
  button.textContent=index===0?'Log in':'Sign up';
});

function setAuthStatus(m,err=false){if(authStatus){authStatus.textContent=m;authStatus.classList.toggle('error',err)}}
function setAuthBusy(form,busy,label){const button=form?.querySelector('button[type="submit"]');if(!button)return;button.disabled=busy;if(busy){button.dataset.defaultLabel=button.innerHTML;button.innerHTML=`${label} <span>...</span>`;}else if(button.dataset.defaultLabel){button.innerHTML=button.dataset.defaultLabel;delete button.dataset.defaultLabel;}}
async function withAuthTimeout(request){let timer;try{return await Promise.race([request,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Authentication is taking too long. Check your internet connection and try again.')),15000)})])}finally{clearTimeout(timer)}}
function showPasswordUpdate(){
  overlay?.classList.add('open'); overlay?.setAttribute('aria-hidden','false'); document.body.classList.add('modal-open');
  loginForm?.classList.add('hidden'); signupForm?.classList.add('hidden'); resetForm?.classList.add('hidden'); updatePasswordForm?.classList.remove('hidden');
  document.querySelectorAll('.auth-tabs button').forEach(b=>b.classList.remove('active'));
  setAuthStatus('Choose a new password for your account.');
  document.getElementById('newPassword')?.focus();
}
function openAuth(mode='email-login'){
  if(!overlay)return;
  if(mode==='phone-login')mode='email-login';
  if(mode==='phone-signup')mode='email-signup';
  overlay.classList.add('open'); overlay.setAttribute('aria-hidden','false'); document.body.classList.add('modal-open');
  switchAuthMode(mode);
}
function closeAuth(){overlay?.classList.remove('open');overlay?.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open')}
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
  if(!overlay)return;
  e.preventDefault();
  openAuth('email-login');
}));
document.querySelectorAll('.account-actions a').forEach(link=>link.addEventListener('click',e=>{
  if(!overlay)return;
  e.preventDefault();
  openAuth(link.href.includes('mode=signup')?'email-signup':'email-login');
}));
document.querySelectorAll('[data-close-auth]').forEach(b=>b.addEventListener('click',closeAuth));
document.querySelectorAll('.auth-tabs button').forEach(b=>b.addEventListener('click',()=>switchAuthMode(b.dataset.tab)));
toggleAuthMethod?.addEventListener('click',()=>setAuthMethod(authMethod==='phone'?'email':'phone'));
overlay?.addEventListener('click',e=>{if(e.target===overlay)closeAuth()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAuth()});

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
  localStorage.setItem('starVisualsAuthPrompted','1'); closeAuth(); toast('Welcome to STAR VISUALS — your studio is ready.');
  await loadStudio();
  if(location.pathname.endsWith('login.html')){
    const r=new URLSearchParams(location.search).get('returnTo');
    location.href=r?decodeURIComponent(r):'dashboard.html';
  }
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
  localStorage.setItem('starVisualsAuthPrompted','1'); closeAuth(); toast('Signed in — your My Studio is connected.'); await loadStudio();
  if(location.pathname.endsWith('login.html')){const r=new URLSearchParams(location.search).get('returnTo');location.href=r?decodeURIComponent(r):'dashboard.html';}
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
    ({data,error}=await withAuthTimeout(db.auth.signUp({email,password,options:{data:{full_name:name}}})));
  }catch(requestError){setAuthStatus(friendlyError(requestError),true);return}
  finally{setAuthBusy(signupForm,false)}
  if(error){setAuthStatus(friendlyError(error),true);return}
  if(data.session){
    localStorage.setItem('starVisualsAuthPrompted','1'); closeAuth(); toast('Account created. Welcome to STAR VISUALS.'); await loadStudio();
    if(location.pathname.endsWith('login.html'))location.href='dashboard.html';
  }else setAuthStatus('Account created. Check your email to confirm it, then log in.');
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
async function loadStudio(){if(!db)return;const {data:{session}}=await db.auth.getSession();updateHeaderAuth(session);const locked=document.getElementById('accountLocked'),dash=document.getElementById('accountDashboard');if(!locked&&!dash)return;if(!session?.user){locked?.classList.remove('hidden');dash?.classList.add('hidden');return}locked?.classList.add('hidden');dash?.classList.remove('hidden');const u=session.user;const {data:profile}=await db.from('profiles').select('full_name,email,created_at').eq('id',u.id).maybeSingle();const name=profile?.full_name||u.user_metadata?.full_name||'Creator';const contact=u.phone||profile?.email||u.email||'—';document.getElementById('dashAvatar').textContent=initials(name);document.getElementById('dashName').textContent=name;document.getElementById('dashContact').textContent=contact;document.getElementById('profileName').textContent=name;document.getElementById('profileContact').textContent=contact;document.getElementById('profileDate').textContent=profile?.created_at?new Date(profile.created_at).toLocaleDateString('en-IN'):'—';const pr=await db.from('course_purchases').select('id,status,progress,purchased_at,course:courses(title,duration,delivery)').eq('user_id',u.id).in('status',['paid']).order('created_at',{ascending:false});const box=document.getElementById('coursePurchases');if(pr.error)box.innerHTML='<span>!</span><p>Could not load your courses right now.</p>';else if(!pr.data?.length)box.innerHTML='<span>✦</span><p>No purchased courses yet.</p><a class="text-button" href="courses.html">Explore courses →</a>';else box.innerHTML=pr.data.map(i=>`<div class="purchased-course"><strong>${escapeHtml(i.course?.title||'Course')}</strong><span>${escapeHtml(i.course?.duration||'STAR VISUALS course')}</span><div class="progress"><i style="width:${Math.max(0,Math.min(100,Number(i.progress||0)))}%"></i></div><small>${Number(i.progress||0)}% complete · ${escapeHtml(i.status)}</small></div>`).join('');const dr=await db.from('editing_deals').select('project_name,package_name,amount_inr,status,updated_at').eq('user_id',u.id).order('updated_at',{ascending:false}).limit(1).maybeSingle();const d=dr.data;document.getElementById('dealStatus').textContent=d?.status?d.status.replace('_',' '):'No active deal';document.getElementById('dealProject').textContent=d?.project_name||'—';document.getElementById('dealPackage').textContent=d?.package_name||'—';document.getElementById('dealAmount').textContent=d?.amount_inr!=null?`₹${Number(d.amount_inr).toLocaleString('en-IN')}`:'—'}
document.getElementById('logoutBtn')?.addEventListener('click',async()=>{if(db){await db.auth.signOut();toast('You have been signed out.');await loadStudio()}});

const projectForm=document.getElementById('projectForm');
const projectStatus=document.getElementById('projectStatus');
function setProjectStatus(m,err=false){if(projectStatus){projectStatus.textContent=m;projectStatus.classList.toggle('error',err)}}
projectForm?.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!db){setProjectStatus('Connect Supabase in supabase-config.js first.',true);return}
  setProjectStatus('Checking your account…');
  const {data:{session}}=await db.auth.getSession();
  if(!session?.user){
    const returnTo=encodeURIComponent('project.html');
    location.href=`login.html?mode=signup&returnTo=${returnTo}`;
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
  const {error}=await db.from('editing_deals').insert({user_id:session.user.id,project_name:projectName,package_name:packageName,amount_inr:Number.isFinite(amount)?amount:null,status:'enquiry',notes:JSON.stringify(details)});
  if(error){setProjectStatus(friendlyError(error),true);return}
  projectForm.reset();
  setProjectStatus('Project enquiry submitted. You can track the deal from My Studio.');
  toast('Project enquiry sent to STAR VISUALS.');
});
async function init(){animateSocialCounters();await loadCoursesFromDatabase();await loadStudio();if(!db)return;db.auth.onAuthStateChange((event)=>{if(event==='PASSWORD_RECOVERY')showPasswordUpdate();loadStudio()});}
init();
