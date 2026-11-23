/* 社区项目站 Demo · 交互脚本（无依赖）
   1) 导航栏滚动状态（is-scrolled）
   2) 移动端汉堡菜单开关（nav-open）
   3) 「关于」下拉菜单开关
   4) 项目详情页视频播放器占位按钮（仅视觉反馈，无真实播放）
*/
(function () {
  'use strict';

  var header = document.getElementById('siteHeader');

  /* 1) 滚动状态 */
  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 10);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* 2) 汉堡菜单 */
  var toggle = document.querySelector('.nav-toggle');
  if (toggle && header) {
    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    });
  }

  /* 3) 下拉菜单 */
  var dropdownBtns = document.querySelectorAll('.nav-link--has-child');
  Array.prototype.forEach.call(dropdownBtns, function (btn) {
    btn.addEventListener('click', function (event) {
      event.preventDefault();
      var item = btn.closest('.nav-item--has-child');
      if (!item) return;
      var willOpen = !item.classList.contains('is-open');
      document.querySelectorAll('.nav-item--has-child.is-open').forEach(function (el) {
        el.classList.remove('is-open');
        var b = el.querySelector('.nav-link--has-child');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
      item.classList.toggle('is-open', willOpen);
      btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });
  });
  document.addEventListener('click', function (event) {
    if (!event.target.closest('.nav-item--has-child')) {
      document.querySelectorAll('.nav-item--has-child.is-open').forEach(function (el) {
        el.classList.remove('is-open');
        var b = el.querySelector('.nav-link--has-child');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
    }
  });

  /* 4) 视频占位播放按钮（纯视觉反馈） */
  var play = document.querySelector('.video-box__play');
  if (play) {
    play.addEventListener('click', function () {
      play.classList.toggle('is-playing');
      var note = document.querySelector('.video-box__note');
      if (note) {
        note.textContent = play.classList.contains('is-playing')
          ? 'Demo 提示：视频播放功能未实现（来源与控件待确认）'
          : '视频占位 · 播放控件与视频来源待确认';
      }
    });
  }
})();
