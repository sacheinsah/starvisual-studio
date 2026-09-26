/* STAR VISUALS — enrolled course detail / lesson library */
(() => {
  const courseId = new URLSearchParams(location.search).get('id');
  const titleEl = document.getElementById('courseDetailTitle');
  const descriptionEl = document.getElementById('courseDetailDescription');
  const statusEl = document.getElementById('courseDetailStatus');
  const lessonsEl = document.getElementById('courseLessons');
  const introEl = document.getElementById('lessonIntro');
  const enrollBtn = document.getElementById('courseEnrollBtn');
  let course = null;
  let currentSession = null;
  let enrolled = false;

  const escape = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  function setStatus(message, error = false) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.toggle('error', error);
  }

  function showState(message, error = false) {
    if (!lessonsEl) return;
    lessonsEl.innerHTML = `<div class="course-lesson-state${error ? ' error' : ''}">${escape(message)}</div>`;
  }

  async function getSession() {
    if (!window.db) return null;
    const { data, error } = await window.db.auth.getSession();
    if (error) console.error('Course auth session error:', error);
    return data?.session || null;
  }

  function openLesson(lessonId) {
    const url = new URL('lesson.html', location.href);
    url.searchParams.set('id', lessonId);
    location.href = url.href;
  }

  function lessonMarkup(lesson, index) {
    const title = escape(lesson.title || `Lesson ${index + 1}`);
    const order = String(Number(lesson.lesson_order || index + 1)).padStart(2, '0');
    const type = escape(lesson.content_type === 'video' ? 'Video lecture' : (lesson.content_type || 'Lesson'));
    const hasVideo = lesson.content_type === 'video' || Boolean(lesson.file_path && /\.(mp4|m4v|mov|webm|ogg)$/i.test(lesson.file_path));
    const label = hasVideo ? 'Watch lecture →' : 'Open lesson →';
    return `<article class="course-lesson-card course-lesson-card-clickable" data-lesson-id="${escape(lesson.id)}"><div class="course-lesson-head"><div><span class="lesson-number">${order}</span><div><span class="lesson-type">${type}</span><h3>${title}</h3></div></div><span class="lesson-arrow">↗</span></div><p class="lesson-card-note">${hasVideo ? 'Video lecture with course materials.' : 'Lesson content and downloadable materials.'}</p><button class="outline-btn lesson-open-btn" type="button" data-open-lesson="${escape(lesson.id)}">${label}</button></article>`;
  }

  async function updateEnrollmentState() {
    currentSession = await getSession();
    if (!enrollBtn) return false;
    if (!currentSession?.user) {
      enrolled = false;
      enrollBtn.textContent = 'Log in to join →';
      enrollBtn.dataset.enrolled = 'false';
      return false;
    }
    const { data, error } = await window.db.from('enrollments').select('id').eq('user_id', currentSession.user.id).eq('course_id', course.id).maybeSingle();
    if (error) {
      console.error('Enrollment check error:', error);
      enrolled = false;
      enrollBtn.textContent = 'Join course →';
      enrollBtn.dataset.enrolled = 'false';
      return false;
    }
    enrolled = Boolean(data);
    enrollBtn.textContent = enrolled ? 'Enrolled ✓' : 'Join course →';
    enrollBtn.dataset.enrolled = enrolled ? 'true' : 'false';
    return enrolled;
  }

  async function enrollCourse() {
    if (!course || !window.db) return;
    currentSession = await getSession();
    if (!currentSession?.user) {
      const returnTo = `${location.pathname}${location.search}`;
      location.href = `login.html?returnTo=${encodeURIComponent(returnTo)}`;
      return;
    }
    if (enrollBtn.dataset.enrolled === 'true') {
      enrolled = true;
      await loadLessons();
      return;
    }
    enrollBtn.disabled = true;
    enrollBtn.textContent = 'Joining…';
    const { error } = await window.db.from('enrollments').insert({ user_id: currentSession.user.id, course_id: course.id });
    enrollBtn.disabled = false;
    if (error && !/duplicate|unique/i.test(error.message || '')) {
      console.error('Enrollment error:', error);
      setStatus(error.message || 'Could not enroll in this course.', true);
      enrollBtn.textContent = 'Join course →';
      return;
    }
    enrolled = true;
    enrollBtn.dataset.enrolled = 'true';
    enrollBtn.textContent = 'Enrolled ✓';
    setStatus('Enrollment successful. Your course content is now unlocked.');
    await loadLessons();
  }

  async function loadLessons() {
    if (!course || !window.db) return;
    if (!enrolled) {
      showState('Join this course to unlock its lectures and materials.');
      return;
    }
    showState('Loading your lessons…');
    const { data, error } = await window.db.from('course_lessons')
      .select('id,title,lesson_order,content_type,file_path,external_url,published,created_at')
      .eq('course_id', course.id)
      .eq('published', true)
      .order('lesson_order', { ascending: true })
      .order('created_at', { ascending: true });
    console.log('COURSE LESSONS:', data);
    console.log('LESSON ERROR:', error);
    if (error) {
      console.error('Lesson query failed:', error);
      showState(error.message || 'Unable to load your lessons.', true);
      setStatus('Course loaded, but your lessons could not be read.', true);
      return;
    }
    if (!data?.length) {
      showState('No lessons have been published for this course yet.');
      setStatus('No published lessons yet.');
      return;
    }
    lessonsEl.innerHTML = data.map(lessonMarkup).join('');
    setStatus(`${data.length} published lesson${data.length === 1 ? '' : 's'} available.`);
  }

  async function loadCourse() {
    if (!courseId) {
      titleEl.textContent = 'Course not found';
      descriptionEl.textContent = 'This page needs a course ID in the URL.';
      setStatus('Missing course ID.', true);
      showState('Go back to Courses and choose a course.', true);
      if (enrollBtn) enrollBtn.hidden = true;
      return;
    }
    if (!window.db) {
      setStatus('Supabase is not connected.', true);
      showState('Connect Supabase before loading course content.', true);
      return;
    }

    setStatus('Loading course…');
    const { data, error } = await window.db.from('courses')
      .select('id,title,description,duration,delivery,price_inr,slug,category')
      .eq('id', courseId).maybeSingle();
    if (error) {
      console.error('Course load error:', error);
      setStatus('Could not load this course.', true);
      showState(error.message || 'Supabase could not load the course.', true);
      return;
    }
    if (!data) {
      setStatus('Course not found.', true);
      titleEl.textContent = 'Course not found';
      descriptionEl.textContent = 'The course ID in this URL does not match a course.';
      showState('Return to Courses and choose another course.', true);
      if (enrollBtn) enrollBtn.hidden = true;
      return;
    }

    course = data;
    document.title = `STAR VISUALS — ${course.title}`;
    titleEl.textContent = course.title;
    descriptionEl.textContent = course.description || 'Practical lessons and projects from STAR VISUALS.';
    introEl.textContent = `${course.duration || 'Course'} · ${course.delivery || 'STAR VISUALS'} — join the course to unlock its lectures and materials.`;
    await updateEnrollmentState();
    await loadLessons();
  }

  lessonsEl?.addEventListener('click', event => {
    const button = event.target.closest('[data-open-lesson]');
    const card = event.target.closest('[data-lesson-id]');
    const id = button?.dataset.openLesson || card?.dataset.lessonId;
    if (id && enrolled) openLesson(id);
  });

  enrollBtn?.addEventListener('click', enrollCourse);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',loadCourse,{once:true});
  else loadCourse();
})();
