/**
 * Academic Homepage — app.js
 *
 * Fetches data.json and renders the entire page.
 * Language toggle switches between _en / _zh fields.
 */

(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────
  let currentLang = 'en';
  let siteData = null;

  // ── Boot ───────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    setupMobileMenu();
    setupLangToggle();
    setupScrollSpy();
  });

  // ── Data loading ───────────────────────────────────────
  function fetchData() {
    Promise.all([
      fetch('data/profile.json').then(function (r) {
        if (!r.ok) throw new Error('profile.json: HTTP ' + r.status);
        return r.json();
      }),
      fetch('data/papers.json').then(function (r) {
        if (!r.ok) throw new Error('papers.json: HTTP ' + r.status);
        return r.json();
      }),
      fetch('data/lectures.json').then(function (r) {
        if (!r.ok) throw new Error('lectures.json: HTTP ' + r.status);
        return r.json();
      })
    ])
    .then(function (results) {
      var data = {
        profile:       results[0],
        papers:        results[1],
        lecture_notes: results[2]
      };
      siteData = data;
      try {
        renderAll(data);
      } catch (err) {
        showError('Render error: ' + err.message);
      } finally {
        hideLoading();
        showSections();
        applyLang(currentLang);
      }
    })
    .catch(function (err) {
      hideLoading();
      showError(err.message);
    });
  }

  function hideLoading() {
    var el = document.getElementById('loading');
    if (el) el.hidden = true;
  }

  function showSections() {
    document.querySelectorAll('.section').forEach(function (s) {
      s.hidden = false;
    });
  }

  function showError(msg) {
    var banner = document.getElementById('error-banner');
    var msgEl  = document.getElementById('error-message');
    if (banner) banner.hidden = false;
    if (msgEl) {
      msgEl.textContent = ' ' + msg + '. Please check that data.json is valid JSON and accessible.';
    }
  }

  // ── Render all ─────────────────────────────────────────
  function renderAll(data) {
    renderProfile(data.profile || {});
    renderPapers(data.papers || []);
    renderLectures(data.lecture_notes || []);
    updatePageTitle(data.profile || {});
  }

  function updatePageTitle(p) {
    var name = p.name_en || p.name_zh || 'Academic Homepage';
    document.title = name + ' — Academic Homepage';
  }

  // ── Profile / Sidebar ──────────────────────────────────
  function renderProfile(p) {
    // Photo
    var photo = document.getElementById('profile-photo');
    if (photo) {
      if (p.photo) {
        photo.src = p.photo;
        photo.alt = p.name_en || p.name_zh || 'Profile photo';
        photo.onerror = function () {
          // Hide broken image gracefully (placeholder file not yet replaced)
          photo.style.display = 'none';
        };
      } else {
        photo.style.display = 'none';
      }
    }

    // Name (both langs stored as data attrs for switching)
    setDualText('sidebar-name', p.name_en, p.name_zh);
    setDualText('sidebar-title', p.title_en, p.title_zh);
    setDualText('sidebar-dept', p.department_en, p.department_zh);
    setDualText('sidebar-institution', p.institution_en, p.institution_zh);

    // Mobile header
    setDualText('mobile-name', p.name_en, p.name_zh);
    setDualText('mobile-title', p.title_en, p.title_zh);

    // Email
    var emailEl   = document.getElementById('sidebar-email');
    var emailText = document.getElementById('sidebar-email-text');
    if (p.email) {
      if (emailEl) emailEl.href = 'mailto:' + p.email;
      if (emailText) emailText.textContent = p.email;
    } else {
      if (emailEl) emailEl.style.display = 'none';
    }

    // CV
    var cvEl = document.getElementById('sidebar-cv');
    if (p.cv) {
      if (cvEl) cvEl.href = p.cv;
    } else {
      if (cvEl) cvEl.style.display = 'none';
    }

    // External links
    renderExternalLinks(p.links || {});

    // Bio
    var bioEl = document.getElementById('bio-text');
    if (bioEl) {
      bioEl.setAttribute('data-en', p.bio_en || '');
      bioEl.setAttribute('data-zh', p.bio_zh || '');
      bioEl.textContent = p.bio_en || '';
    }

    // Research fields
    renderFields(p.fields || []);
  }

  function renderFields(fields) {
    var wrap = document.getElementById('fields-wrap');
    var list = document.getElementById('fields-list');
    if (!wrap || !list) return;
    if (!fields.length) { wrap.style.display = 'none'; return; }
    list.textContent = fields.join(' · ');
  }

  function renderExternalLinks(links) {
    var container = document.getElementById('sidebar-links');
    if (!container) return;
    container.innerHTML = '';

    var defs = [
      {
        key: 'google_scholar',
        label: 'Google Scholar',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 24a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm0-24L0 9.5l4.838 3.94A8 8 0 0 1 12 9a8 8 0 0 1 7.162 4.44L24 9.5 12 0z"/></svg>'
      },
      {
        key: 'ssrn',
        label: 'SSRN',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M6.5 5C5.119 5 4 6.119 4 7.5S5.119 10 6.5 10 9 8.881 9 7.5 7.881 5 6.5 5ZM2 7.5A4.5 4.5 0 0 1 11 7.5a4.47 4.47 0 0 1-.928 2.727L14.5 14.657l-1.414 1.414-4.427-4.427A4.5 4.5 0 1 1 2 7.5Z"/></svg>'
      },
      {
        key: 'twitter',
        label: 'Twitter / X',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>'
      }
    ];

    defs.forEach(function (def) {
      var url = links[def.key];
      if (!url) return;
      var a = document.createElement('a');
      a.href = url;
      a.className = 'ext-link';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.innerHTML = def.icon + '<span>' + def.label + '</span>';
      container.appendChild(a);
    });
  }

  // ── Papers ─────────────────────────────────────────────
  var STATUS_LABELS = {
    job_market_paper: { en: 'Job Market Paper', zh: '求职论文', cls: 'badge-jmp' },
    working_paper:    { en: 'Working Paper',     zh: '工作论文', cls: 'badge-wp'  },
    published:        { en: 'Published',          zh: '已发表',  cls: 'badge-pub' },
    revise_resubmit:  { en: 'R&R',               zh: '修改重投', cls: 'badge-wp'  },
    forthcoming:      { en: 'Forthcoming',        zh: '即将发表', cls: 'badge-pub' }
  };

  function renderPapers(papers) {
    var container = document.getElementById('papers-list');
    if (!container) return;
    if (!papers.length) {
      container.innerHTML = '<p style="color:var(--color-muted);font-size:0.875rem;">No papers yet.</p>';
      return;
    }

    var workingStatuses = ['job_market_paper', 'working_paper', 'revise_resubmit', 'forthcoming'];
    var sortFn = function (a, b) {
      return (parseInt(b.year) || 0) - (parseInt(a.year) || 0);
    };

    var workingPapers  = papers.filter(function (p) { return workingStatuses.indexOf(p.status) !== -1; }).sort(sortFn);
    var publishedPapers = papers.filter(function (p) { return workingStatuses.indexOf(p.status) === -1; }).sort(sortFn);

    var idx = 0;
    function renderGroup(groupPapers, labelEn, labelZh) {
      if (!groupPapers.length) return;
      var heading = document.createElement('h3');
      heading.className = 'papers-subheading';
      heading.setAttribute('data-en', labelEn);
      heading.setAttribute('data-zh', labelZh);
      heading.textContent = labelEn;
      container.appendChild(heading);
      groupPapers.forEach(function (paper) {
        container.appendChild(buildPaperEl(paper, idx));
        idx++;
      });
    }

    renderGroup(workingPapers,   'Working Papers', '工作论文');
    renderGroup(publishedPapers, 'Published',      '已发表');
  }

  function buildPaperEl(paper, idx) {
    var div = document.createElement('div');
    div.className = 'paper-item';

    // Header row: title + badge
    var header = document.createElement('div');
    header.className = 'paper-header';

    var titleEl = document.createElement('div');
    titleEl.className = 'paper-title';
    titleEl.textContent = paper.title || '(Untitled)';
    header.appendChild(titleEl);

    if (paper.status && STATUS_LABELS[paper.status]) {
      var info = STATUS_LABELS[paper.status];
      var badge = document.createElement('span');
      badge.className = 'status-badge ' + info.cls;
      badge.setAttribute('data-en', info.en);
      badge.setAttribute('data-zh', info.zh);
      badge.textContent = info.en;
      header.appendChild(badge);
    }

    div.appendChild(header);

    // Meta: year, coauthors, journal
    var metaParts = [];
    if (paper.year) metaParts.push(paper.year);

    var metaEl = document.createElement('div');
    metaEl.className = 'paper-meta';

    var metaHtml = '';
    if (paper.year) metaHtml += '<span class="year">' + escHtml(paper.year) + '</span>';

    if (paper.coauthors && paper.coauthors.length) {
      if (metaHtml) metaHtml += ' &middot; ';
      metaHtml += '<span class="coauthors">' + paper.coauthors.map(escHtml).join(', ') + '</span>';
    }

    if (paper.journal) {
      if (metaHtml) metaHtml += ' &middot; ';
      metaHtml += '<span class="paper-journal">' + escHtml(paper.journal) + '</span>';
    }

    metaEl.innerHTML = metaHtml;
    div.appendChild(metaEl);

    // Actions row
    var actions = document.createElement('div');
    actions.className = 'paper-actions';

    // Abstract toggle
    if (paper.abstract_en || paper.abstract_zh) {
      var abstractId = 'abstract-' + idx;
      var toggleBtn = document.createElement('button');
      toggleBtn.className = 'abstract-toggle';
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.setAttribute('aria-controls', abstractId);
      toggleBtn.innerHTML =
        '<span class="toggle-arrow">&#9658;</span>' +
        '<span data-en="Abstract" data-zh="摘要">Abstract</span>';
      toggleBtn.addEventListener('click', function () {
        var expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
        toggleBtn.setAttribute('aria-expanded', String(!expanded));
        var body = document.getElementById(abstractId);
        if (body) body.classList.toggle('open', !expanded);
      });
      actions.appendChild(toggleBtn);
    }

    // PDF link
    if (paper.pdf) {
      var pdfLink = document.createElement('a');
      pdfLink.href = paper.pdf;
      pdfLink.className = 'pdf-link';
      pdfLink.target = '_blank';
      pdfLink.rel = 'noopener noreferrer';
      pdfLink.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M4 4a2 2 0 0 1 2-2h4.586A2 2 0 0 1 12 2.586L15.414 6A2 2 0 0 1 16 7.414V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Z" clip-rule="evenodd"/></svg>' +
        'PDF';
      actions.appendChild(pdfLink);
    }

    // Replication file link
    if (paper.replication) {
      var replLink = document.createElement('a');
      replLink.href = paper.replication;
      replLink.className = 'pdf-link';
      replLink.target = '_blank';
      replLink.rel = 'noopener noreferrer';
      replLink.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M2 3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H2Z"/><path fill-rule="evenodd" d="M2 7.5h16l-.811 7.71a2 2 0 0 1-1.99 1.79H4.802a2 2 0 0 1-1.99-1.79L2 7.5ZM7 11a1 1 0 0 1 1-1h4a1 1 0 0 1 0 2H8a1 1 0 0 1-1-1Z" clip-rule="evenodd"/></svg>';
      var replSpan = document.createElement('span');
      replSpan.setAttribute('data-en', 'Replication');
      replSpan.setAttribute('data-zh', '复现文件');
      replSpan.textContent = 'Replication';
      replLink.appendChild(replSpan);
      actions.appendChild(replLink);
    }

    // DOI link
    if (paper.doi) {
      var doiLink = document.createElement('a');
      doiLink.href = 'https://doi.org/' + paper.doi;
      doiLink.className = 'doi-link';
      doiLink.target = '_blank';
      doiLink.rel = 'noopener noreferrer';
      doiLink.textContent = 'DOI';
      actions.appendChild(doiLink);
    }

    div.appendChild(actions);

    // Abstract panel
    if (paper.abstract_en || paper.abstract_zh) {
      var abstractId2 = 'abstract-' + idx;
      var body = document.createElement('div');
      body.className = 'abstract-body';
      body.id = abstractId2;
      body.setAttribute('role', 'region');

      var inner = document.createElement('div');
      inner.className = 'abstract-inner';
      inner.setAttribute('data-en', paper.abstract_en || '');
      inner.setAttribute('data-zh', paper.abstract_zh || paper.abstract_en || '');
      inner.textContent = paper.abstract_en || '';
      body.appendChild(inner);

      div.appendChild(body);
    }

    return div;
  }

  // ── Lectures ───────────────────────────────────────────
  function renderLectures(courses) {
    var container = document.getElementById('lectures-list');
    if (!container) return;
    if (!courses.length) {
      container.innerHTML = '<p style="color:var(--color-muted);font-size:0.875rem;">No lecture notes yet.</p>';
      return;
    }
    courses.forEach(function (course) {
      container.appendChild(buildCourseEl(course));
    });
  }

  function buildCourseEl(course) {
    var block = document.createElement('div');
    block.className = 'course-block';

    // Course header
    var header = document.createElement('div');
    header.className = 'course-header';

    var nameEl = document.createElement('div');
    nameEl.className = 'course-name';
    nameEl.setAttribute('data-en', course.course_en || '');
    nameEl.setAttribute('data-zh', course.course_zh || course.course_en || '');
    nameEl.textContent = course.course_en || '';
    header.appendChild(nameEl);

    var metaEl = document.createElement('div');
    metaEl.className = 'course-meta';

    var roleParts = [];
    var roleSpan = document.createElement('span');
    roleSpan.setAttribute('data-en', course.role_en || '');
    roleSpan.setAttribute('data-zh', course.role_zh || course.role_en || '');
    roleSpan.textContent = course.role_en || '';
    metaEl.appendChild(roleSpan);

    if (course.institution) {
      var sep1 = document.createElement('span');
      sep1.className = 'sep';
      sep1.textContent = '·';
      metaEl.appendChild(sep1);
      var instSpan = document.createElement('span');
      instSpan.textContent = course.institution;
      metaEl.appendChild(instSpan);
    }

    if (course.term) {
      var sep2 = document.createElement('span');
      sep2.className = 'sep';
      sep2.textContent = '·';
      metaEl.appendChild(sep2);
      var termSpan = document.createElement('span');
      termSpan.textContent = course.term;
      metaEl.appendChild(termSpan);
    }

    header.appendChild(metaEl);
    block.appendChild(header);

    // Notes list
    var ul = document.createElement('ul');
    ul.className = 'course-notes';

    var notes = course.notes || [];
    if (!notes.length) {
      var empty = document.createElement('li');
      empty.className = 'note-item';
      empty.style.color = 'var(--color-muted)';
      empty.style.fontSize = '0.82rem';
      empty.textContent = 'No notes uploaded yet.';
      ul.appendChild(empty);
    } else {
      notes.forEach(function (note) {
        ul.appendChild(buildNoteItem(note));
      });
    }

    block.appendChild(ul);
    return block;
  }

  function buildNoteItem(note) {
    var li = document.createElement('li');
    li.className = 'note-item';

    var titleEl = document.createElement('span');
    titleEl.className = 'note-title';
    titleEl.setAttribute('data-en', note.title_en || '');
    titleEl.setAttribute('data-zh', note.title_zh || note.title_en || '');
    titleEl.textContent = note.title_en || '';
    li.appendChild(titleEl);

    // Support new "files" array; fall back to legacy "pdf" string field
    var files = note.files || [];
    if (!files.length && note.pdf) {
      files = [{ label_en: 'PDF', label_zh: 'PDF', url: note.pdf }];
    }

    files.forEach(function (file) {
      if (!file.url) return;
      var a = document.createElement('a');
      a.href = file.url;
      a.className = 'note-pdf-link';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.innerHTML = getNoteFileIcon(file.url);
      var labelSpan = document.createElement('span');
      labelSpan.setAttribute('data-en', file.label_en || 'File');
      labelSpan.setAttribute('data-zh', file.label_zh || file.label_en || 'File');
      labelSpan.textContent = file.label_en || 'File';
      a.appendChild(labelSpan);
      li.appendChild(a);
    });

    return li;
  }

  function getNoteFileIcon(url) {
    var ext = (url || '').split('.').pop().toLowerCase().split('?')[0];
    if (ext === 'pdf') {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M4 4a2 2 0 0 1 2-2h4.586A2 2 0 0 1 12 2.586L15.414 6A2 2 0 0 1 16 7.414V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Z" clip-rule="evenodd"/></svg>';
    }
    // Download icon for other file types (Excel, ZIP, etc.)
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z"/><path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z"/></svg>';
  }

  // ── Language toggle ────────────────────────────────────
  function setupLangToggle() {
    var btn        = document.getElementById('lang-toggle');
    var btnMobile  = document.getElementById('lang-toggle-mobile');

    function toggle() {
      currentLang = currentLang === 'en' ? 'zh' : 'en';
      applyLang(currentLang);
    }

    if (btn)       btn.addEventListener('click', toggle);
    if (btnMobile) btnMobile.addEventListener('click', toggle);
  }

  function applyLang(lang) {
    document.body.setAttribute('data-lang', lang);

    // All elements with data-en / data-zh
    document.querySelectorAll('[data-en], [data-zh]').forEach(function (el) {
      var text = el.getAttribute('data-' + lang) || el.getAttribute('data-en') || '';
      // Don't overwrite nav links that have no text set yet (they use data attrs)
      if (el.tagName === 'A' && el.classList.contains('nav-link')) {
        el.textContent = text;
      } else if (el.tagName === 'SPAN' || el.tagName === 'P' || el.tagName === 'DIV' || el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3') {
        // Only set textContent for leaf-like elements or known text containers
        if (!el.children.length || el.classList.contains('fields-label')) {
          el.textContent = text;
        }
      }
    });

    // Section headings (handled by data-en/data-zh above but let's make sure)
    document.querySelectorAll('.section-heading[data-en]').forEach(function (el) {
      el.textContent = el.getAttribute('data-' + lang) || el.getAttribute('data-en');
    });

    // Status badges
    document.querySelectorAll('.status-badge[data-en]').forEach(function (el) {
      el.textContent = el.getAttribute('data-' + lang) || el.getAttribute('data-en');
    });

    // CV link span
    document.querySelectorAll('.cv-link span[data-en]').forEach(function (el) {
      el.textContent = el.getAttribute('data-' + lang) || el.getAttribute('data-en');
    });

    // Abstract inner text
    document.querySelectorAll('.abstract-inner[data-en]').forEach(function (el) {
      el.textContent = el.getAttribute('data-' + lang) || el.getAttribute('data-en') || '';
    });

    // Abstract toggle label
    document.querySelectorAll('.abstract-toggle span[data-en]').forEach(function (el) {
      el.textContent = el.getAttribute('data-' + lang) || el.getAttribute('data-en');
    });

    // Bio paragraph
    var bioEl = document.getElementById('bio-text');
    if (bioEl) {
      bioEl.textContent = bioEl.getAttribute('data-' + lang) || bioEl.getAttribute('data-en') || '';
    }

    // Dual-text elements (sidebar name, title, etc.)
    ['sidebar-name','sidebar-title','sidebar-dept','sidebar-institution',
     'mobile-name','mobile-title'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        var val = el.getAttribute('data-' + lang) || el.getAttribute('data-en') || '';
        el.textContent = val;
      }
    });
  }

  // Helper to set both en/zh as data attributes and initial text
  function setDualText(id, en, zh) {
    var el = document.getElementById(id);
    if (!el) return;
    el.setAttribute('data-en', en || '');
    el.setAttribute('data-zh', zh || en || '');
    el.textContent = en || '';
  }

  // ── Scroll spy ─────────────────────────────────────────
  function setupScrollSpy() {
    var sections = ['about', 'papers', 'lectures'];
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          document.querySelectorAll('.nav-link').forEach(function (link) {
            var href = link.getAttribute('href');
            if (href === '#' + id) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    }, { rootMargin: '-30% 0px -65% 0px', threshold: 0 });

    sections.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  }

  // ── Mobile menu ────────────────────────────────────────
  function setupMobileMenu() {
    var btn = document.getElementById('mobile-menu-btn');
    var nav = document.getElementById('mobile-nav');
    if (!btn || !nav) return;

    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('open', !open);
      nav.setAttribute('aria-hidden', String(open));
    });

    // Close when a nav link is clicked
    nav.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        btn.setAttribute('aria-expanded', 'false');
        nav.classList.remove('open');
        nav.setAttribute('aria-hidden', 'true');
      });
    });
  }

  // ── Utilities ──────────────────────────────────────────
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

})();
