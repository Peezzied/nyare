/*
 * Dev audit trace console — record inspector (US2).
 * Vanilla JS, no dependencies. Walks references from an audit entry or a
 * course, renders resolved records into the inspector, and tracks the
 * breadcrumb trail back to the originating audit.
 */
(function () {
  'use strict';

  var API = '/dev/audit-trace';
  var MISSING = { missing: true };

  var inspectorBody = document.getElementById('inspectorBody');
  var errorDrawer = document.getElementById('errorDrawer');
  var errorDrawerBody = document.getElementById('errorDrawerBody');
  var breadcrumbNav = document.getElementById('breadcrumb');
  var breadcrumbList = breadcrumbNav ? breadcrumbNav.querySelector('.breadcrumb-list') : null;
  if (!inspectorBody) {
    return;
  }

  var nodeCache = new Map(); // 'kind:id' -> TraceNodeDto | MISSING
  var refsCache = new Map(); // eventId -> TraceNodeStubDto[]
  var trail = [];            // [{label, kind, id}] — kind 'audit' or a TraceKind
  var currentQuote = null;   // quotedText of the audit that opened this walk
  var requestSeq = 0;        // drops stale responses after a newer click

  /* ---------- fetch ---------- */

  async function fetchJson(url) {
    try {
      var res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (res.status === 404) {
        return { missing: true };
      }
      if (!res.ok) {
        console.error('[audit-trace] request failed', res.status, url);
        return { error: true };
      }
      return { ok: true, data: await res.json() };
    } catch (err) {
      console.error('[audit-trace] fetch error', err);
      return { error: true };
    }
  }

  /* ---------- DOM helpers ---------- */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (text != null) {
      node.textContent = text;
    }
    return node;
  }

  function clearBody() {
    inspectorBody.textContent = '';
  }

  /* ---------- audit card inspection ---------- */

  function auditLabel(card) {
    var message = card.querySelector('.card-message');
    var text = message ? message.textContent.trim() : 'audit entry';
    return text.length > 48 ? text.slice(0, 48) + '…' : text;
  }

  function auditAttrs(card) {
    return {
      category: card.dataset.category,
      severity: card.dataset.severity,
      timestamp: card.dataset.ts
    };
  }

  function auditStep(card) {
    return {
      label: auditLabel(card),
      kind: 'audit',
      id: card.dataset.eventId,
      attrs: auditAttrs(card),
      diag: cardErrorDiag(card)
    };
  }

  // Reads the error diagnostic rendered inside the card's .err-diag block.
  function cardErrorDiag(card) {
    var box = card.querySelector('.err-diag');
    if (!box) {
      return null;
    }
    var fields = box.querySelectorAll('.err-fields dd');
    var pre = box.querySelector('.stack-preview');
    return {
      exceptionClass: fields[0] ? fields[0].textContent : null,
      message: fields[1] ? fields[1].textContent : null,
      rootCause: fields[2] ? fields[2].textContent : null,
      stackPreview: pre ? pre.textContent : null
    };
  }

  // Populates the inspector error drawer for the selected audit; hides it otherwise.
  function renderErrorDrawer(diag) {
    if (!errorDrawer || !errorDrawerBody) {
      return;
    }
    errorDrawerBody.textContent = '';
    if (!diag) {
      errorDrawer.hidden = true;
      return;
    }
    var fields = el('dl', 'err-fields');
    [['Exception', diag.exceptionClass], ['Message', diag.message], ['Root cause', diag.rootCause]]
      .forEach(function (pair) {
        fields.appendChild(el('dt', null, pair[0]));
        fields.appendChild(el('dd', null, pair[1]));
      });
    errorDrawerBody.appendChild(fields);
    if (diag.stackPreview != null) {
      var stack = el('details', 'err-stack');
      stack.appendChild(el('summary', null, 'Stack trace'));
      stack.appendChild(el('pre', 'stack-preview', diag.stackPreview));
      errorDrawerBody.appendChild(stack);
    }
    errorDrawer.hidden = false;
    errorDrawer.open = true;
  }

  function cardQuote(card) {
    var span = card.querySelector('.quoted span:not(.quoted-label)');
    return span ? span.textContent : null;
  }

  async function inspectAudit(card) {
    var eventId = card.dataset.eventId;
    if (!eventId) {
      return;
    }
    var seq = ++requestSeq;
    var refs = refsCache.get(eventId);
    var failed = false;
    if (!refs) {
      var res = await fetchJson(API + '/refs/' + encodeURIComponent(eventId));
      if (seq !== requestSeq) {
        return;
      }
      if (res.error) {
        failed = true;
        refs = [];
      } else {
        refs = res.missing ? [] : res.data;
        refsCache.set(eventId, refs);
      }
    }
    currentQuote = cardQuote(card);
    var step = auditStep(card);
    setTrail([step]);
    renderAuditStep(step, refs, failed);
  }

  function renderAuditStep(step, refs, failed) {
    clearBody();
    var head = el('div', 'node-head');
    head.appendChild(el('h3', 'node-title', step.label));
    head.appendChild(el('div', 'node-kind', 'audit entry'));
    inspectorBody.appendChild(head);
    if (step.attrs) {
      inspectorBody.appendChild(buildAttrList(step.attrs, null));
    }
    inspectorBody.appendChild(buildRelationGroup(
      { groupName: 'Resolved references', totalCount: refs.length, items: refs }));
    if (failed) {
      inspectorBody.appendChild(el('p', 'relation-more', 'References could not be loaded.'));
    }
    renderErrorDrawer(step.diag);
  }

  /* ---------- node inspection ---------- */

  async function inspectNode(kind, id, label) {
    var key = kind + ':' + id;
    var node = nodeCache.get(key);
    if (node === undefined) {
      var seq = ++requestSeq;
      var res = await fetchJson(
        API + '/node/' + encodeURIComponent(kind) + '/' + encodeURIComponent(id));
      if (seq !== requestSeq) {
        return;
      }
      if (res.error) {
        renderLoadError(kind, id);
        return;
      }
      node = res.missing ? MISSING : res.data;
      nodeCache.set(key, node);
    }
    pushTrail({ label: nodeLabel(node, label, kind, id), kind: kind, id: id });
    if (node === MISSING) {
      renderMissing(kind, id);
    } else {
      renderNode(node);
    }
  }

  function nodeLabel(node, label, kind, id) {
    if (node && node !== MISSING && node.displayTitle) {
      return node.displayTitle;
    }
    return label || kind + ' ' + id;
  }

  function renderNode(node) {
    clearBody();
    var head = el('div', 'node-head');
    head.appendChild(el('h3', 'node-title', node.displayTitle || node.id));
    head.appendChild(el('div', 'node-kind',
      node.kind + (node.status ? ' · ' + node.status : '')));
    inspectorBody.appendChild(head);

    if (node.isDeleted) {
      var tomb = el('div', 'tombstone');
      tomb.appendChild(el('span', 'tombstone-label', 'Deleted record '));
      tomb.appendChild(document.createTextNode(
        node.deletedAt ? 'deleted at ' + node.deletedAt : 'deleted during this session'));
      inspectorBody.appendChild(tomb);
    }

    inspectorBody.appendChild(buildAttrList(node.attributes, node));
    (node.relations || []).forEach(function (group) {
      inspectorBody.appendChild(buildRelationGroup(group));
    });
  }

  function renderMissing(kind, id) {
    clearBody();
    var box = el('div', 'record-missing');
    box.appendChild(el('p', null, 'Record no longer exists.'));
    box.appendChild(el('p', 'rel-sub', kind + ' ' + id));
    inspectorBody.appendChild(box);
  }

  function renderLoadError(kind, id) {
    clearBody();
    var box = el('div', 'record-missing');
    box.appendChild(el('p', null, 'Could not load this record.'));
    box.appendChild(el('p', 'rel-sub', kind + ' ' + id));
    inspectorBody.appendChild(box);
  }

  /* ---------- attribute list + quote highlight ---------- */

  function buildAttrList(attrs, node) {
    var dl = el('dl', 'node-attrs');
    Object.keys(attrs || {}).forEach(function (key) {
      dl.appendChild(el('dt', null, key));
      var dd = document.createElement('dd');
      var text = attrText(attrs[key]);
      if (node && node.kind === 'note' && key === 'content' && currentQuote) {
        appendHighlighted(dd, text, currentQuote);
      } else {
        dd.textContent = text;
      }
      dl.appendChild(dd);
    });
    return dl;
  }

  function attrText(value) {
    if (value == null) {
      return '—';
    }
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  }

  // FR-017: wrap every occurrence of the audit's quoted text in <mark>.
  function appendHighlighted(parent, text, quote) {
    var needle = String(quote).toLowerCase();
    if (!needle) {
      parent.textContent = text;
      return;
    }
    var haystack = text.toLowerCase();
    var idx = 0;
    var found = false;
    for (;;) {
      var hit = haystack.indexOf(needle, idx);
      if (hit === -1) {
        break;
      }
      found = true;
      parent.appendChild(document.createTextNode(text.slice(idx, hit)));
      parent.appendChild(el('mark', 'quote-hl', text.slice(hit, hit + needle.length)));
      idx = hit + needle.length;
    }
    if (!found) {
      parent.textContent = text;
      return;
    }
    parent.appendChild(document.createTextNode(text.slice(idx)));
  }

  /* ---------- relation groups ---------- */

  function buildRelationGroup(group) {
    var items = group.items || [];
    var total = group.totalCount != null ? group.totalCount : items.length;
    var section = el('section', 'relation-group');

    var title = el('h4', 'relation-group-title');
    title.appendChild(document.createTextNode(group.groupName + ' '));
    title.appendChild(el('span', 'relation-count',
      items.length < total
        ? 'showing first ' + items.length + ' of ' + total
        : total + ' total'));
    section.appendChild(title);

    var list = el('ul', 'relation-items');
    items.forEach(function (stub) {
      list.appendChild(buildStub(stub));
    });
    if (items.length === 0) {
      var empty = el('li');
      empty.appendChild(el('span', 'relation-more', 'none'));
      list.appendChild(empty);
    } else if (items.length < total) {
      var more = el('li');
      more.appendChild(el('span', 'relation-more',
        (total - items.length) + ' more not shown'));
      list.appendChild(more);
    }
    section.appendChild(list);
    return section;
  }

  function buildStub(stub) {
    var li = document.createElement('li');
    var btn = el('button', 'relation-item');
    btn.type = 'button';
    btn.dataset.kind = stub.kind;
    btn.dataset.id = stub.id;
    btn.appendChild(el('span', 'rel-title', stub.title || stub.id));
    var sub = stub.kind + (stub.subtitle ? ' · ' + stub.subtitle : '');
    if (!stub.isExact) {
      sub += ' · inferred';
    }
    btn.appendChild(el('span', 'rel-sub', sub));
    li.appendChild(btn);
    return li;
  }

  /* ---------- breadcrumb trail (FR-018) ---------- */

  function setTrail(steps) {
    trail = steps;
    renderBreadcrumb();
  }

  function pushTrail(step) {
    var last = trail[trail.length - 1];
    if (last && last.kind === step.kind && last.id === step.id) {
      trail[trail.length - 1] = step;
    } else {
      trail.push(step);
    }
    renderBreadcrumb();
  }

  function renderBreadcrumb() {
    if (!breadcrumbNav || !breadcrumbList) {
      return;
    }
    breadcrumbNav.hidden = trail.length === 0;
    breadcrumbList.textContent = '';
    trail.forEach(function (step, i) {
      var li = document.createElement('li');
      var last = i === trail.length - 1;
      var crumb = el(last ? 'span' : 'button', last ? 'crumb-current' : null, step.label);
      if (!last) {
        crumb.type = 'button';
        crumb.addEventListener('click', function () {
          jumpToCrumb(i);
        });
      }
      li.appendChild(crumb);
      breadcrumbList.appendChild(li);
    });
  }

  // Jumps back to an earlier step. Re-renders from the caches; no refetch.
  function jumpToCrumb(index) {
    requestSeq++; // invalidate any in-flight fetch from a previous click
    trail = trail.slice(0, index + 1);
    renderBreadcrumb();
    var step = trail[index];
    if (step.kind === 'audit') {
      renderAuditStep(step, refsCache.get(step.id) || [], false);
      return;
    }
    var node = nodeCache.get(step.kind + ':' + step.id);
    if (node === MISSING) {
      renderMissing(step.kind, step.id);
    } else if (node) {
      renderNode(node);
    } else {
      // Cache miss: refetch. pushTrail replaces the tail crumb (same kind+id).
      inspectNode(step.kind, step.id, step.label);
    }
  }

  /* ---------- click routing ---------- */

  function onEntryClick(target) {
    var kind = target.dataset.kind;
    var id = target.dataset.id;
    if (!kind || !id) {
      return;
    }
    var titleEl = target.querySelector('.rel-title');
    var label = titleEl ? titleEl.textContent : target.textContent.trim();

    if (target.classList.contains('course-entry')) {
      currentQuote = null;
      setTrail([]);
      renderErrorDrawer(null);
    }
    var card = target.closest('.audit-card');
    if (target.classList.contains('ref-chip') && card) {
      currentQuote = cardQuote(card);
      var step = auditStep(card);
      setTrail([step]);
      renderErrorDrawer(step.diag);
    }
    inspectNode(kind, id, label);
  }

  document.addEventListener('click', function (e) {
    var entry = e.target.closest('.ref-chip, .relation-item, .course-entry');
    if (entry) {
      onEntryClick(entry);
      return;
    }
    if (e.target.closest('details')) {
      return; // drawers toggle without triggering an inspection
    }
    var card = e.target.closest('.audit-card');
    if (card) {
      inspectAudit(card);
    }
  });

  /* ---------- live feed (US3) ---------- */

  var feed = document.getElementById('feed');
  var pauseBtn = document.getElementById('pauseBtn');
  var liveState = document.getElementById('liveState');
  var liveLabel = liveState ? liveState.querySelector('.live-label') : null;

  var paused = false;
  var activeCategory = '';
  var activeSeverity = '';
  var feedIds = new Set(); // event ids currently rendered, for dedup

  function slug(name) {
    return String(name).toLowerCase().replace(/_/g, '-');
  }

  // Builds the same .audit-card markup the Thymeleaf template renders.
  function renderCard(ev) {
    var card = el('article', 'audit-card');
    card.classList.add('severity-' + slug(ev.severity), 'cat-' + slug(ev.category));
    card.dataset.eventId = ev.id;
    card.dataset.ts = ev.timestamp;
    card.dataset.category = ev.category;
    card.dataset.severity = ev.severity;

    var head = el('header', 'card-head');
    head.appendChild(el('span', 'badge badge-category', ev.category));
    head.appendChild(el('span', 'badge badge-severity sev-' + slug(ev.severity), ev.severity));
    var time = el('time', 'card-time', ev.timestamp);
    time.setAttribute('datetime', ev.timestamp);
    head.appendChild(time);
    card.appendChild(head);

    card.appendChild(el('p', 'card-message', ev.message));

    var meta = el('div', 'card-meta');
    if (ev.originUsername != null) {
      var user = el('span', 'badge badge-user');
      user.appendChild(el('span', 'badge-user-name', ev.originUsername));
      if (ev.originUserId != null) {
        user.appendChild(el('span', 'badge-user-id', '(ID: ' + ev.originUserId + ')'));
      }
      meta.appendChild(user);
    }
    if (ev.triggerSource != null) {
      meta.appendChild(el('span', 'badge badge-trigger trig-' + slug(ev.triggerSource), ev.triggerSource));
    }
    if (ev.mutationAction != null) {
      meta.appendChild(el('span', 'badge badge-action act-' + slug(ev.mutationAction), ev.mutationAction));
    }
    if (ev.lifecycleState != null) {
      meta.appendChild(el('span', 'badge badge-lifecycle lc-' + slug(ev.lifecycleState), ev.lifecycleState));
    }
    if (ev.durationMs != null) {
      meta.appendChild(el('span', 'badge badge-duration', ev.durationMs + ' ms'));
    }
    card.appendChild(meta);

    var refs = [];
    if (ev.entityKind != null && ev.entityId != null) {
      refs.push({ kind: ev.entityKind, id: ev.entityId, label: ev.entityKind });
    }
    [['note', ev.noteId], ['task', ev.taskId], ['event', ev.eventId],
     ['image', ev.imageId], ['course', ev.courseId], ['lifecycle', ev.runId]]
      .forEach(function (r) {
        if (r[1] != null) {
          refs.push({ kind: r[0], id: r[1], label: r[0] === 'lifecycle' ? 'run' : r[0] });
        }
      });
    if (refs.length) {
      var refList = el('ul', 'card-refs');
      refs.forEach(function (r) {
        var li = document.createElement('li');
        var chip = el('button', 'ref-chip', r.label);
        chip.type = 'button';
        chip.dataset.kind = r.kind;
        chip.dataset.id = r.id;
        li.appendChild(chip);
        refList.appendChild(li);
      });
      card.appendChild(refList);
    }

    if (ev.changeSummary != null) {
      card.appendChild(el('p', 'change-summary', ev.changeSummary));
    }
    if (ev.rationale != null) {
      var rationale = el('blockquote', 'rationale');
      rationale.appendChild(el('span', 'rationale-label', 'Rationale'));
      rationale.appendChild(el('span', null, ev.rationale));
      card.appendChild(rationale);
    }
    if (ev.quotedText != null) {
      var quoted = el('blockquote', 'quoted');
      quoted.appendChild(el('span', 'quoted-label', 'Quoted text'));
      quoted.appendChild(el('span', null, ev.quotedText));
      card.appendChild(quoted);
    }
    if (ev.extractedCounts && Object.keys(ev.extractedCounts).length) {
      var counts = el('ul', 'count-chips');
      Object.keys(ev.extractedCounts).forEach(function (key) {
        counts.appendChild(el('li', 'count-chip', key + ': ' + ev.extractedCounts[key]));
      });
      card.appendChild(counts);
    }
    var diag = ev.errorDiagnostic;
    if (diag != null) {
      var details = el('details', 'err-diag');
      details.appendChild(el('summary', null, 'Error diagnostic'));
      var fields = el('dl', 'err-fields');
      [['Exception', diag.exceptionClass], ['Message', diag.message], ['Root cause', diag.rootCause]]
        .forEach(function (pair) {
          fields.appendChild(el('dt', null, pair[0]));
          fields.appendChild(el('dd', null, pair[1]));
        });
      details.appendChild(fields);
      if (diag.stackPreview != null) {
        details.appendChild(el('pre', 'stack-preview', diag.stackPreview));
      }
      card.appendChild(details);
    }
    return card;
  }

  function matchesFilters(ev) {
    if (activeCategory && ev.category !== activeCategory) {
      return false;
    }
    if (activeSeverity && ev.severity !== activeSeverity) {
      return false;
    }
    return true;
  }

  // Prepends a streamed event; never touches the open inspector.
  function appendEvent(ev) {
    if (ev.id == null || feedIds.has(ev.id) || !matchesFilters(ev)) {
      return;
    }
    var empty = feed.querySelector('.empty-state');
    if (empty) {
      empty.remove();
    }
    feed.insertBefore(renderCard(ev), feed.firstChild);
    feedIds.add(ev.id);
  }

  function renderFeed(events) {
    feed.textContent = '';
    feedIds.clear();
    if (!events.length) {
      var empty = el('div', 'empty-state');
      empty.appendChild(el('p', 'empty-title', 'No audit events yet.'));
      empty.appendChild(el('p', 'empty-detail',
        'Run the study planner or browse a course above to start tracing records.'));
      feed.appendChild(empty);
      return;
    }
    events.forEach(function (ev) {
      if (ev && ev.id != null && !feedIds.has(ev.id)) {
        feedIds.add(ev.id);
        feed.appendChild(renderCard(ev));
      }
    });
  }

  async function loadFeed() {
    var params = new URLSearchParams();
    if (activeCategory) {
      params.set('category', activeCategory);
    }
    if (activeSeverity) {
      params.set('severity', activeSeverity);
    }
    var qs = params.toString();
    var res = await fetchJson(API + '/feed' + (qs ? '?' + qs : ''));
    if (res.ok && Array.isArray(res.data)) {
      renderFeed(res.data);
    }
  }

  function setLiveState(state) {
    if (!liveState) {
      return;
    }
    liveState.classList.toggle('is-live', state === 'live');
    liveState.classList.toggle('is-paused', state !== 'live');
    if (liveLabel) {
      liveLabel.textContent =
        state === 'live' ? 'Live' : (state === 'paused' ? 'Paused' : 'Disconnected');
    }
  }

  if (feed) {
    feed.querySelectorAll('.audit-card').forEach(function (card) {
      if (card.dataset.eventId) {
        feedIds.add(card.dataset.eventId);
      }
    });

    if (typeof EventSource === 'function') {
      var source = new EventSource(API + '/stream');
      source.addEventListener('audit', function (e) {
        var ev;
        try {
          ev = JSON.parse(e.data);
        } catch (err) {
          return;
        }
        if (!paused && ev) {
          appendEvent(ev);
        }
      });
      source.onerror = function () {
        setLiveState('disconnected');
      };
      source.onopen = function () {
        setLiveState(paused ? 'paused' : 'live');
      };
    } else {
      setLiveState('disconnected');
    }

    if (pauseBtn) {
      pauseBtn.addEventListener('click', function () {
        paused = !paused;
        pauseBtn.textContent = paused ? 'Resume' : 'Pause';
        pauseBtn.setAttribute('aria-pressed', String(paused));
        setLiveState(paused ? 'paused' : 'live');
        if (!paused) {
          loadFeed(); // picks up events emitted while paused
        }
      });
    }

    ['category', 'severity'].forEach(function (attr) {
      var chips = document.querySelectorAll('.filter-chip[data-' + attr + ']');
      chips.forEach(function (chip) {
        chip.addEventListener('click', function () {
          var value = chip.dataset[attr] || '';
          if (attr === 'category' ? value === activeCategory : value === activeSeverity) {
            return;
          }
          if (attr === 'category') {
            activeCategory = value;
          } else {
            activeSeverity = value;
          }
          chips.forEach(function (c) {
            c.setAttribute('aria-pressed', String(c === chip));
          });
          loadFeed();
        });
      });
    });
  }
})();
