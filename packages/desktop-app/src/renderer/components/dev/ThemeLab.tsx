import React, { useMemo, useState } from 'react';
import {
  Boxes,
  CheckCircle2,
  ChevronDown,
  Circle,
  FileText,
  FolderTree,
  GitBranch,
  MoreHorizontal,
  Network,
  PanelLeft,
  Search,
  Settings,
  Sparkles,
  Terminal,
  Waypoints,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

type ThemeVars = Record<`--${string}`, string>;

interface LabTheme {
  id: string;
  name: string;
  reference: string;
  intent: string;
  sourceUrl?: string;
  vars: ThemeVars;
}

const sharedStateVars: ThemeVars = {
  '--surface-overlay': 'rgba(0, 0, 0, 0.66)',
  '--text-on-accent': '#ffffff',
  '--status-success': '#3fb950',
  '--status-warning': '#d29922',
  '--status-error': '#f85149',
  '--status-info': '#58a6ff',
};

const labThemes: LabTheme[] = [
  {
    id: 'vscode-dark-modern',
    name: '워크벤치 다크',
    reference: 'VS Code / Dark Modern',
    sourceUrl: 'https://code.visualstudio.com/api/references/theme-color',
    intent: '평평한 작업 공간. 편집기는 조용하게. hover는 튀지 않게. 파란색은 현재 선택과 focus에만 쓴다.',
    vars: {
      ...sharedStateVars,
      '--surface-editor': '#1f1f1f',
      '--surface-panel': '#181818',
      '--surface-card': '#252526',
      '--state-hover-bg': '#2a2d2e',
      '--surface-floating': '#252526',
      '--surface-rail': '#181818',
      '--text-default': '#cccccc',
      '--text-secondary': '#a7a7a7',
      '--text-muted': '#808080',
      '--border-subtle': '#2b2b2b',
      '--border-default': '#3c3c3c',
      '--border-strong': '#5a5a5a',
      '--surface-input': '#1f1f1f',
      '--input-border': '#3c3c3c',
      '--accent': '#0078d4',
      '--accent-hover': '#1688dc',
      '--accent-muted': 'rgba(0, 120, 212, 0.18)',
    },
  },
  {
    id: 'github-dark',
    name: '문서형 다크',
    reference: 'GitHub dark / Primer-shaped',
    sourceUrl: 'https://primer.style/',
    intent: '문서 가독성 우선. border는 또렷하게. 링크/선택은 분명하게. 패널은 실제 명도 차이로 분리한다.',
    vars: {
      ...sharedStateVars,
      '--surface-editor': '#0d1117',
      '--surface-panel': '#161b22',
      '--surface-card': '#21262d',
      '--state-hover-bg': '#30363d',
      '--surface-floating': '#161b22',
      '--surface-rail': '#0d1117',
      '--text-default': '#e6edf3',
      '--text-secondary': '#afb8c1',
      '--text-muted': '#7d8590',
      '--border-subtle': '#30363d',
      '--border-default': '#484f58',
      '--border-strong': '#6e7681',
      '--surface-input': '#0d1117',
      '--input-border': '#30363d',
      '--accent': '#2f81f7',
      '--accent-hover': '#58a6ff',
      '--accent-muted': 'rgba(47, 129, 247, 0.18)',
    },
  },
  {
    id: 'figma-gray-dark',
    name: '선택됨: 피그마 그레이',
    reference: 'Figma dark UI / neutral gray workbench',
    sourceUrl: 'https://www.figma.com/blog/illuminating-dark-mode/',
    intent: '검정으로 가라앉히지 않는 회색 작업대. 캔버스는 한 단계 낮추고, 패널/카드/hover는 눈에 보이는 계단으로 쌓는다.',
    vars: {
      ...sharedStateVars,
      '--surface-editor': '#242424',
      '--surface-panel': '#2c2c2c',
      '--surface-card': '#363636',
      '--state-hover-bg': '#454545',
      '--surface-floating': '#303030',
      '--surface-rail': '#262626',
      '--text-default': '#f0f0f0',
      '--text-secondary': '#c7c7c7',
      '--text-muted': '#9a9a9a',
      '--border-subtle': '#404040',
      '--border-default': '#545454',
      '--border-strong': '#707070',
      '--surface-input': '#242424',
      '--input-border': '#545454',
      '--accent': '#0d99ff',
      '--accent-hover': '#57b8ff',
      '--accent-muted': 'rgba(13, 153, 255, 0.18)',
    },
  },
  {
    id: 'figma-light',
    name: '선택됨: 라이트 캔버스',
    reference: 'Figma-ish neutral light',
    sourceUrl: 'https://help.figma.com/hc/en-us/articles/14563969806359-Variable-modes-for-prototypes',
    intent: '밝은 캔버스. 흰색 도구 패널. 중립 divider. 모든 아이콘 버튼에서 hover가 보여야 한다.',
    vars: {
      ...sharedStateVars,
      '--surface-overlay': 'rgba(31, 35, 40, 0.42)',
      '--status-success': '#1a7f37',
      '--status-warning': '#9a6700',
      '--status-error': '#cf222e',
      '--status-info': '#0969da',
      '--surface-editor': '#f5f5f5',
      '--surface-panel': '#ffffff',
      '--surface-card': '#ffffff',
      '--state-hover-bg': '#f0f0f0',
      '--surface-floating': '#ffffff',
      '--surface-rail': '#ffffff',
      '--text-default': '#1f2328',
      '--text-secondary': '#59636e',
      '--text-muted': '#818b98',
      '--border-subtle': '#d8dee4',
      '--border-default': '#c8d1da',
      '--border-strong': '#8c959f',
      '--surface-input': '#ffffff',
      '--input-border': '#c8d1da',
      '--accent': '#0c8ce9',
      '--accent-hover': '#0969da',
      '--accent-muted': 'rgba(12, 140, 233, 0.14)',
    },
  },
  {
    id: 'figma-light-ui-layered',
    name: 'Figma Light UI',
    reference: 'Figma light UI / layered neutral panels',
    sourceUrl: 'https://help.figma.com/hc/en-us/articles/14563969806359-Variable-modes-for-prototypes',
    intent: 'Light-mode comparison candidate. White panels sit on a soft gray editor/canvas; cards and controls use a tinted gray so inspector cards remain visible.',
    vars: {
      ...sharedStateVars,
      '--surface-overlay': 'rgba(31, 35, 40, 0.42)',
      '--status-success': '#1a7f37',
      '--status-warning': '#9a6700',
      '--status-error': '#cf222e',
      '--status-info': '#0969da',
      '--surface-editor': '#f5f5f5',
      '--surface-panel': '#ffffff',
      '--surface-card': '#f7f7f7',
      '--state-hover-bg': '#eeeeee',
      '--surface-floating': '#ffffff',
      '--surface-rail': '#ffffff',
      '--text-default': '#1f2328',
      '--text-secondary': '#59636e',
      '--text-muted': '#818b98',
      '--border-subtle': '#e0e0e0',
      '--border-default': '#d1d1d1',
      '--border-strong': '#9a9a9a',
      '--surface-input': '#ffffff',
      '--input-border': '#d1d1d1',
      '--accent': '#0d99ff',
      '--accent-hover': '#007be5',
      '--accent-muted': 'rgba(13, 153, 255, 0.14)',
    },
  },
];

const objectDots = ['#4dabf7', '#69db7c', '#ffd43b', '#ff8787'];

export function ThemeLab(): JSX.Element {
  const [activeThemeId, setActiveThemeId] = useState(labThemes[0].id);
  const activeTheme = useMemo(
    () => labThemes.find((theme) => theme.id === activeThemeId) ?? labThemes[0],
    [activeThemeId],
  );

  return (
    <div className="h-full overflow-auto bg-[#101010] text-[#f1f1f1]">
      <div className="sticky top-0 z-20 border-b border-[#303030] bg-[#101010]/95 px-5 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-sm font-semibold">Netior 테마 실험실</h1>
            <p className="mt-0.5 text-xs text-[#a0a0a0]">
              먼저 같은 화면을 비교한다. 토큰 교체는 나중에 한다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {labThemes.map((theme) => (
              <button
                key={theme.id}
                className={`rounded border px-3 py-1.5 text-xs transition-colors ${
                  activeTheme.id === theme.id
                    ? 'border-[#f1f1f1] bg-[#f1f1f1] text-[#101010]'
                    : 'border-[#3a3a3a] text-[#d0d0d0] hover:bg-[#242424]'
                }`}
                onClick={() => setActiveThemeId(theme.id)}
              >
                {theme.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex flex-col gap-5 p-5">
        <ReferenceNotes />

        <ThemeFrame theme={activeTheme}>
          <FullWorkbenchFixture theme={activeTheme} />
        </ThemeFrame>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase text-[#a0a0a0]">같은 상태, 모든 후보</h2>
            <span className="text-xs text-[#737373]">hover / 선택 / 보조 텍스트 / focus / 경고</span>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {labThemes.map((theme) => (
              <ThemeFrame key={theme.id} theme={theme} compact>
                <StateStressFixture theme={theme} />
              </ThemeFrame>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function ThemeFrame({ theme, compact, children }: {
  theme: LabTheme;
  compact?: boolean;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <section className="overflow-hidden rounded-lg border border-[#303030] bg-[#151515]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#303030] px-4 py-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold">{theme.name}</h2>
            <span className="rounded border border-[#3a3a3a] px-1.5 py-0.5 text-[10px] uppercase text-[#a0a0a0]">
              {theme.reference}
            </span>
          </div>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-[#a0a0a0]">{theme.intent}</p>
        </div>
        {theme.sourceUrl && (
          <span className="text-[11px] text-[#737373]">{theme.sourceUrl}</span>
        )}
      </div>
      <div style={theme.vars as React.CSSProperties} className={compact ? 'p-3' : 'p-4'}>
        {children}
      </div>
    </section>
  );
}

function FullWorkbenchFixture({ theme }: { theme: LabTheme }): JSX.Element {
  return (
    <div className="overflow-hidden rounded-lg border border-subtle bg-surface-editor text-default shadow-2xl">
      <FakeTitleBar />
      <div className="flex h-[620px] min-h-0">
        <FakeActivityBar />
        <FakeSidebar />
        <main className="flex min-w-0 flex-1 flex-col">
          <FakeTabs />
          <div className="flex min-h-0 flex-1">
            <FakeCanvas theme={theme} />
            <FakeEditor />
          </div>
        </main>
      </div>
    </div>
  );
}

function StateStressFixture({ theme }: { theme: LabTheme }): JSX.Element {
  return (
    <div className="rounded-lg border border-subtle bg-surface-editor p-3 text-default">
      <div className="mb-3 flex items-center justify-between border-b border-subtle pb-2">
        <div>
          <div className="text-xs font-semibold">{theme.reference}</div>
          <div className="text-[11px] text-muted">상태 비교</div>
        </div>
        <div className="h-5 w-5 rounded bg-accent" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <FakeListRow active title="선택된 네트워크" meta="선택 배경과 accent가 과한지 본다" />
          <FakeListRow hover title="강제로 켠 hover 행" meta="hover에서도 글자가 선명해야 한다" />
          <FakeListRow title="비활성 행" meta="아이콘, 제목, 보조 정보가 구분되는지 본다" />
          <FakeListRow warning title="누락된 파일" meta="경고색이 팔레트 전체를 먹지 않아야 한다" />
        </div>
        <div className="space-y-3">
          <Input placeholder="개념 검색" inputSize="sm" />
          <div className="flex gap-2">
            <Button size="sm">Primary</Button>
            <Button size="sm" variant="secondary">Secondary</Button>
            <Button size="sm" variant="ghost">Ghost</Button>
          </div>
          <div className="rounded-lg border border-default bg-surface-floating p-3 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-medium">떠 있는 메뉴</div>
              <MoreHorizontal size={14} className="text-muted" />
            </div>
            <div className="rounded bg-state-hover px-2 py-1 text-xs text-default">에디터에서 열기</div>
            <div className="px-2 py-1 text-xs text-secondary">폴더에서 보기</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReferenceNotes(): JSX.Element {
  return (
    <section className="rounded-lg border border-[#303030] bg-[#151515] p-4">
      <h2 className="text-sm font-semibold">이 페이지에서 볼 것</h2>
      <div className="mt-3 grid gap-3 text-xs leading-5 text-[#b8b8b8] lg:grid-cols-4">
        <p>1. 위의 버튼으로 후보를 바꾼다. titlebar/sidebar/tab/canvas/editor가 한 덩어리로 어울리는지 본다.</p>
        <p>2. hover가 너무 튀거나 너무 안 보이면 탈락. sidebar, 카드, 메뉴, 탭에서 모두 확인한다.</p>
        <p>3. 보조 텍스트가 죽으면 탈락. 노드 subtitle, 목록 meta, 에디터 설명문을 먼저 읽어본다.</p>
        <p>4. 개념색은 stripe/dot/icon 정도에서만 버텨야 한다. 카드/패널 전체를 물들이는 방향은 피한다.</p>
      </div>
    </section>
  );
}

function FakeTitleBar(): JSX.Element {
  return (
    <header className="flex h-9 items-center justify-between border-b border-subtle bg-surface-panel px-3">
      <div className="flex items-center gap-2 text-secondary">
        <Network size={15} className="text-accent" />
        <span className="text-xs font-medium">Netior</span>
        <span className="text-muted">/</span>
        <button className="rounded px-1.5 py-0.5 text-xs text-default hover:bg-state-hover">
          리서치 보관함 <ChevronDown size={11} className="ml-1 inline" />
        </button>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted">
        <GitBranch size={13} />
        <span>캔버스 / 테마 개편</span>
      </div>
    </header>
  );
}

function FakeActivityBar(): JSX.Element {
  const icons = [Waypoints, Boxes, FolderTree, Sparkles, Terminal, Settings];

  return (
    <nav className="flex w-10 shrink-0 flex-col items-center justify-between border-r border-subtle bg-surface-rail py-2">
      <div className="flex flex-col gap-1">
        {icons.slice(0, 3).map((Icon, index) => (
          <button
            key={index}
            className={`flex h-8 w-8 items-center justify-center rounded ${
              index === 0 ? 'bg-accent-muted text-accent' : 'text-secondary hover:bg-state-hover hover:text-default'
            }`}
          >
            <Icon size={17} />
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-1">
        {icons.slice(3).map((Icon, index) => (
          <button
            key={index}
            className="flex h-8 w-8 items-center justify-center rounded text-secondary hover:bg-state-hover hover:text-default"
          >
            <Icon size={17} />
          </button>
        ))}
      </div>
    </nav>
  );
}

function FakeSidebar(): JSX.Element {
  return (
    <aside className="w-64 shrink-0 border-r border-subtle bg-surface-panel">
      <div className="border-b border-subtle p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase text-secondary">네트워크</span>
          <button className="rounded p-1 text-muted hover:bg-state-hover hover:text-default">
            <PanelLeft size={14} />
          </button>
        </div>
        <label className="flex items-center gap-2 rounded border border-input bg-surface-input px-2 py-1.5 text-xs">
          <Search size={13} className="text-muted" />
          <span className="text-muted">네트워크 검색</span>
        </label>
      </div>
      <div className="space-y-1 p-2">
        <FakeListRow active title="테마 시스템" meta="루트 네트워크" />
        <FakeListRow hover title="팔레트 레퍼런스" meta="개념 7개 / 파일 18개" />
        <FakeListRow title="토큰 인벤토리" meta="surface / text / border" />
        <FakeListRow title="캔버스 fixture" meta="노드, 엣지, 메뉴" />
      </div>
      <div className="mx-2 mt-3 rounded-lg border border-subtle bg-surface-card p-3">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles size={14} className="text-accent" />
          <span className="text-xs font-medium">Narre</span>
        </div>
        <p className="text-xs leading-5 text-secondary">
          전역 토큰을 바꾸기 전에 같은 작업 화면을 먼저 비교한다.
        </p>
      </div>
    </aside>
  );
}

function FakeTabs(): JSX.Element {
  const tabs = ['토큰 맵.md', 'ThemeLab.tsx', '팔레트 메모'];

  return (
    <div className="flex h-9 items-end border-b border-default bg-surface-panel px-2">
      {tabs.map((tab, index) => (
        <button
          key={tab}
          className={`relative h-8 min-w-36 border-x border-t px-3 text-left text-xs ${
            index === 1
              ? 'border-default bg-surface-editor text-default'
              : 'border-transparent text-secondary hover:bg-state-hover hover:text-default'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function FakeCanvas({ theme }: { theme: LabTheme }): JSX.Element {
  return (
    <section className="relative min-w-0 flex-1 overflow-hidden bg-surface-editor">
      <div
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--border-subtle) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
        <path d="M 170 165 C 280 80, 400 95, 510 205" fill="none" stroke="var(--border-strong)" strokeWidth="2" />
        <path d="M 215 345 C 320 410, 430 370, 540 300" fill="none" stroke="var(--accent)" strokeOpacity="0.7" strokeWidth="2" strokeDasharray="6 6" />
      </svg>
      <FakeNode x={80} y={100} color={objectDots[0]} title="테마 시스템" subtitle={theme.name} selected />
      <FakeNode x={440} y={180} color={objectDots[1]} title="레퍼런스 메모" subtitle="VS Code / GitHub / Obsidian" />
      <FakeNode x={150} y={330} color={objectDots[2]} title="토큰 인벤토리" subtitle="surface / text / border" />
      <FakeNode x={500} y={300} color={objectDots[3]} title="상태 스트레스" subtitle="hover / active / focus" warning />
      <div className="absolute left-4 top-4 rounded-lg border border-subtle bg-surface-floating px-3 py-2 text-xs shadow-lg">
        <div className="font-medium text-default">캔버스 도구</div>
        <div className="mt-1 text-muted">탐색 / 편집 / 연결</div>
      </div>
    </section>
  );
}

function FakeEditor(): JSX.Element {
  return (
    <aside className="hidden w-[390px] shrink-0 border-l border-subtle bg-surface-panel lg:flex lg:flex-col">
      <div className="border-b border-subtle px-4 py-3">
        <div className="mb-1 flex items-center gap-2">
          <FileText size={15} className="text-accent" />
          <span className="text-sm font-semibold">팔레트 메모</span>
        </div>
        <p className="text-xs text-muted">말로만 판단하지 않는다. 모든 주장은 같은 fixture에 얹어본다.</p>
      </div>
      <div className="flex-1 space-y-4 p-4 text-sm leading-6 text-secondary">
        <p className="text-default">작업 공간은 그래프와 문서보다 앞으로 튀어나오면 안 된다.</p>
        <div className="rounded-lg border border-subtle bg-surface-card p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-default">
            <CheckCircle2 size={14} className="text-[var(--status-success)]" />
            대비 체크포인트
          </div>
          <p className="text-xs leading-5 text-secondary">
            카드, 메뉴, 탭, 선택된 행 안에서도 보조 텍스트가 읽혀야 한다.
          </p>
        </div>
        <div className="space-y-2">
          <Input placeholder="개념 이름 바꾸기" />
          <div className="flex gap-2">
            <Button size="sm">적용</Button>
            <Button size="sm" variant="secondary">미리보기</Button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function FakeNode({ x, y, color, title, subtitle, selected, warning }: {
  x: number;
  y: number;
  color: string;
  title: string;
  subtitle: string;
  selected?: boolean;
  warning?: boolean;
}): JSX.Element {
  return (
    <div
      className={`absolute w-52 rounded-lg border bg-surface-card p-3 shadow-lg ${
        selected ? 'border-accent ring-2 ring-[var(--accent-muted)]' : 'border-subtle'
      }`}
      style={{ left: x, top: y }}
    >
      <div className="absolute inset-y-3 left-0 w-1 rounded-r" style={{ background: color }} />
      <div className="pl-2">
        <div className="mb-1 flex items-center gap-2">
          <Circle size={10} fill={color} color={color} />
          <span className="truncate text-sm font-semibold text-default">{title}</span>
        </div>
        <p className="truncate text-xs text-secondary">{subtitle}</p>
        {warning && <p className="mt-2 text-[11px] text-[var(--status-warning)]">hover/대비 검토 필요</p>}
      </div>
    </div>
  );
}

function FakeListRow({ title, meta, active, hover, warning }: {
  title: string;
  meta: string;
  active?: boolean;
  hover?: boolean;
  warning?: boolean;
}): JSX.Element {
  const bgClass = active
    ? 'bg-accent-muted text-accent'
    : hover
      ? 'bg-state-hover text-default'
      : 'text-default';

  return (
    <div className={`flex items-center gap-2 rounded-md px-2 py-2 ${bgClass}`}>
      <Waypoints size={14} className={warning ? 'text-[var(--status-warning)]' : active ? 'text-accent' : 'text-muted'} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium">{title}</div>
        <div className="truncate text-[11px] text-muted">{meta}</div>
      </div>
    </div>
  );
}
