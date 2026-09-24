/* STAR VISUALS — individual lecture player + materials */
(() => {
  const lessonId = new URLSearchParams(location.search).get('id');
  const titleEl = document.getElementById('lessonTitle');
  const descEl = document.getElementById('lessonDescription');
  const courseLabel = document.getElementById('lessonCourseLabel');
  const statusEl = document.getElementById('lessonStatus');
  const mediaEl = document.getElementById('lessonMedia');
  const materialsEl = document.getElementById('lessonMaterials');
  const backLink = document.getElementById('backToCourse');

  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const isVideo = (lesson, url) => lesson.content_type === 'video' || /\.(mp4|m4v|mov|webm|ogg)(?:\?|#|$)/i.test(url || '');
  const isPdf = (url, name='') => /\.pdf(?:\?|#|$)/i.test(url || '') || /\.pdf$/i.test(name || '');

  function status(msg, error=false){ if(statusEl){statusEl.textContent=msg;statusEl.classList.toggle('error',error);} }
  function state(host, msg, error=false){ if(host)host.innerHTML=`<div class="course-lesson-state${error?' error':''}">${esc(msg)}</div>`; }

  async function session(){
    if(!window.db) return null;
    const {data,error}=await window.db.auth.getSession();
    if(error) console.error('Lecture auth error:',error);
    return data?.session || null;
  }

  async function signedUrl(path){
    if(!path || !window.db) return null;
    const {data,error}=await window.db.storage.from('course-files').createSignedUrl(path, 7200);
    if(error){console.error('Course file signed URL error:',error);return null;}
    return data?.signedUrl || null;
  }

  function videoMarkup(url, title){
    return `<div class="lecture-player" id="lecturePlayer"><video id="lectureVideo" preload="metadata" playsinline controls src="${esc(url)}"></video><div class="lecture-extra-controls"><button type="button" class="outline-btn" id="lecturePlay">Play / Pause</button><label>Speed <select id="lectureSpeed"><option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2×</option></select></label><button type="button" class="outline-btn" id="lecturePiP">Picture in picture</button><button type="button" class="outline-btn" id="lectureFullscreen">Fullscreen</button></div></div><p class="lesson-player-hint">Use the player controls for play/pause, seeking, volume, captions when provided, playback speed, Picture-in-Picture and fullscreen.</p>`;
  }

  function setupPlayer(){
    const video=document.getElementById('lectureVideo');
    if(!video)return;
    document.getElementById('lecturePlay')?.addEventListener('click',()=>video.paused?video.play():video.pause());
    document.getElementById('lectureSpeed')?.addEventListener('change',e=>{video.playbackRate=Number(e.target.value||1);});
    document.getElementById('lectureFullscreen')?.addEventListener('click',async()=>{try{if(video.requestFullscreen)await video.requestFullscreen();else if(document.getElementById('lecturePlayer')?.requestFullscreen)await document.getElementById('lecturePlayer').requestFullscreen();}catch(e){console.warn(e)}});
    document.getElementById('lecturePiP')?.addEventListener('click',async()=>{try{if(document.pictureInPictureEnabled && !video.disablePictureInPicture){if(document.pictureInPictureElement)await document.exitPictureInPicture();else await video.requestPictureInPicture();}}catch(e){console.warn(e)}});
  }

  async function materialMarkup(material){
    const url=material.external_url || await signedUrl(material.file_path);
    const title=esc(material.title || 'Course material');
    if(!url)return `<article class="lesson-material-card"><div><span class="lesson-material-type">MATERIAL</span><h3>${title}</h3><p>File is currently unavailable.</p></div></article>`;
    const pdf=isPdf(url,material.title);
    const preview=pdf?`<div class="material-preview"><iframe src="${esc(url)}#toolbar=1&navpanes=0" title="${title} PDF preview" loading="lazy"></iframe></div>`:'';
    return `<article class="lesson-material-card"><div class="lesson-material-card-head"><div><span class="lesson-material-type">${pdf?'PDF':'DOWNLOAD'}</span><h3>${title}</h3></div><a class="outline-btn" href="${esc(url)}" target="_blank" rel="noopener">Open ↗</a></div>${preview}<div class="lesson-material-actions"><a class="btn small-btn" href="${esc(url)}" target="_blank" rel="noopener" download>Download material <span>↓</span></a></div></article>`;
  }

  async function load(){
    if(!lessonId){state(mediaEl,'Missing lecture ID.',true);state(materialsEl,'No lecture selected.',true);status('Missing lecture ID.',true);return;}
    if(!window.db){state(mediaEl,'Supabase is not connected.',true);status('Supabase is not connected.',true);return;}
    const s=await session();
    if(!s?.user){
      status('Please log in to access this enrolled course lecture.',true);
      state(mediaEl,'This lecture is available to enrolled students. Log in and return to this lecture.');
      state(materialsEl,'Log in to access the course materials.');
      return;
    }

    status('Checking your course access…');
    const {data:lesson,error:lessonError}=await window.db.from('course_lessons').select('id,course_id,title,lesson_order,content_type,file_path,external_url,published,created_at').eq('id',lessonId).eq('published',true).maybeSingle();
    if(lessonError || !lesson){console.error('Lecture load error:',lessonError);status(lessonError?.message||'Lecture not found.',true);state(mediaEl,'This lecture is unavailable or you do not have access.',true);state(materialsEl,'Materials unavailable.',true);return;}

    const {data:enrollment,error:enrollError}=await window.db.from('enrollments').select('id').eq('user_id',s.user.id).eq('course_id',lesson.course_id).maybeSingle();
    if(enrollError || !enrollment){status('Join this course to unlock the lecture.',true);state(mediaEl,'You are not enrolled in this course. Go back to the course page and join it first.');state(materialsEl,'Course materials are locked until enrollment.');return;}

    const {data:course}=await window.db.from('courses').select('id,title,description').eq('id',lesson.course_id).maybeSingle();
    const url=lesson.external_url || await signedUrl(lesson.file_path);
    titleEl.textContent=lesson.title || 'Course lecture';
    descEl.textContent=course?.description || 'Course lecture and materials from STAR VISUALS.';
    courseLabel.textContent=`STAR VISUALS / ${course?.title || 'COURSE'} / LECTURE ${String(lesson.lesson_order || 1).padStart(2,'0')}`;
    document.title=`STAR VISUALS — ${lesson.title || 'Lecture'}`;
    if(course?.id)backLink.href=`course-detail.html?id=${encodeURIComponent(course.id)}`;

    if(url && isVideo(lesson,url)){
      mediaEl.innerHTML=videoMarkup(url,lesson.title||'Course lecture');
      setupPlayer();
    }else if(url){
      mediaEl.innerHTML=`<div class="lesson-file-viewer"><a class="btn" href="${esc(url)}" target="_blank" rel="noopener">Open lesson content ↗</a><a class="outline-btn" href="${esc(url)}" target="_blank" rel="noopener" download>Download ↧</a></div>`;
    }else{
      state(mediaEl,'The lecture file has not been uploaded yet.',true);
    }

    const {data:materials,error:materialsError}=await window.db.from('course_lesson_materials').select('id,title,material_type,file_path,external_url,sort_order').eq('lesson_id',lesson.id).order('sort_order').order('created_at');
    if(materialsError){console.error('Materials load error:',materialsError);state(materialsEl,materialsError.message||'Could not load materials.',true);}
    else if(!materials?.length){state(materialsEl,'No additional materials have been uploaded for this lecture yet.');}
    else{const cards=[];for(const m of materials)cards.push(await materialMarkup(m));materialsEl.innerHTML=cards.join('');}
    status('Lecture unlocked. You are enrolled in this course.');
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});
  else load();
})();
