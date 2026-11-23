'use client';

import { useRef, useState } from 'react';

/** 视频播放器：使用 <video> + API Range 流，带播放/暂停/停止与进度条 */
export function VideoPlayer({ src, title }: { src: string; title: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  return (
    <div className="card p-5">
      <div className="repo-panel__head" style={{ borderBottom: '1px solid var(--color-line, #eee)', marginBottom: '1rem' }}>
        <h2 className="repo-panel__title">视频播放</h2>
        <span className="file-meta">支持边下边播（HTTP Range）</span>
      </div>
      <div className="video-frame">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={ref}
          src={src}
          controls={false}
          preload="metadata"
          playsInline
          onTimeUpdate={() => {
            const v = ref.current;
            if (!v || !v.duration) return;
            setProgress((v.currentTime / v.duration) * 100);
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            setProgress(100);
          }}
          onError={() => setError('视频加载失败，请尝试下载后查看。')}
        />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={() => {
            const v = ref.current;
            if (!v) return;
            void v.play().catch(() => setError('浏览器阻止了自动播放，请再点一次播放。'));
          }}
        >
          ▶ 播放
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => ref.current?.pause()}
        >
          ⏸ 暂停
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => {
            const v = ref.current;
            if (!v) return;
            v.pause();
            v.currentTime = 0;
            setProgress(0);
          }}
        >
          ⏹ 停止
        </button>
        <div
          style={{
            flex: 1,
            height: 6,
            borderRadius: 999,
            background: 'rgba(123,95,226,.15)',
            overflow: 'hidden',
          }}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="播放进度"
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: 'var(--color-primary, #7b5fe2)',
              transition: 'width .2s linear',
            }}
          />
        </div>
        <span className="file-meta">{Math.round(progress)}%</span>
      </div>
      <p className="form-note mt-3">
        {playing ? '正在播放' : '未播放'} · {title}
      </p>
      {error && (
        <p className="notice notice--danger mt-3" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
