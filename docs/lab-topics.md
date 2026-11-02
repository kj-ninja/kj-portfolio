# Lab topics: research and proposed list

Status: accepted by Krzysztof on 2026-11-02, all items in §4–§6 as recommended (adds 06/07/13/14; drops BroadcastChannel and lazy loading; 12 merged; HTTP cache as a lane in 01; slot 14 = event propagation). Entries marked **proposed** below are therefore decided.

## 1. Method

Three signals, combined by hand:

1. **Demand**: the public question catalogue of frontendlead.com (405 coding, 72 system design, 77 trivia entries, read 2026-11-02). Only the coding section carries a per-question count of companies that asked it; system design and trivia show presence only. We use titles and counts as signals and copy no content.
2. **Direction for 2027**: State of JS 2025, State of React 2025, React Compiler 1.0 release, web platform baselines, and 2026 interview-prep guides. Each claim below has a source and a date; unverified items are marked.
3. **Lab fit**: the concept must be showable offline in a sandbox with counters, bars or a timeline. Pure algorithm puzzles (flatten, deep clone) fail this filter and go to "The code" sections instead.

## 2. Demand signal (frontendlead coding section, companies × questions)

| Concept                                  | Companies | Questions | Also present as                                        |
| ---------------------------------------- | --------- | --------- | ------------------------------------------------------ |
| Flatten (arrays/objects, recursion)      | 115       | 8         |                                                        |
| Debounce / throttle (incl. hooks)        | 110       | 7         | trivia "Debounce vs Throttle"                          |
| Data grid / table (sort, paginate, edit) | 46        | 7         | trivia "List Virtualization"                           |
| Carousel / slider / rotator (timers)     | 40        | 3         | system "Design a Photo Slider"                         |
| Event emitter / pub-sub / EventTarget    | 37        | 5         |                                                        |
| Async concurrency (pool, limit, queue)   | 31        | 5         |                                                        |
| File tree / nested navigation            | 30        | 6         |                                                        |
| Promise methods and polyfills            | 27        | 5         | trivia "Asynchronous calls"                            |
| Autocomplete / typeahead                 | 26        | 2         | system "Design Auto Complete Search"                   |
| Array methods / `this` / prototypes      | 25        | 3         | trivia "Call vs Apply", "Explain this"                 |
| Forms and validation                     | 21        | 5         |                                                        |
| DOM traversal / selectors / delegation   | 21        | 6         | trivia "Event Delegation", "Propagation", "Bubbling"   |
| Tabs / accordion                         | 20        | 6         |                                                        |
| Undo/redo (command stack)                | 19        | 3         |                                                        |
| Infinite scroll / IntersectionObserver   | 19        | 3         | trivia ×2 on virtualization, system "Virtualized Grid" |
| Memoize / TTL cache / request dedupe     | 18        | 5         | system "Image Caching Strategies"                      |
| Timers, clocks, interval drift           | 17        | 10        |                                                        |
| Grid games (Tic Tac Toe, Connect Four)   | 17        | 3         |                                                        |
| Virtual DOM / reconciliation             | 15        | 3         | trivia "React reconciliation"                          |
| Dialog / focus trap / a11y               | 14        | 5         | system "Accessible Dialog", trivia "Web Accessibility" |

Below the cut but relevant: reactivity / dependency graph (12 companies, 6 questions), retry/backoff (6 / 2), rate limiter (5 / 1), feature flag (4 / 1), optimistic update (3 / 1), AbortController / cancellation (0 / 3). No coding-section signal at all for: graceful degradation, lazy loading, HTTP caching, CORS, Core Web Vitals, BroadcastChannel (trivia/system presence only).

## 3. Direction signal for 2027

- **State of JS 2025** (13,002 responses, survey 2025-09-24 to 2025-11-10, published 2026-02-03): Signals is the most-missed feature (~29.5%, 3,339 of 11,315); Temporal the most-awaited proposal (~52.6%); WASM used by ~21%; Scheduler API used by ~2.8%. Source: https://2025.stateofjs.com/en-US/features/ (percentages computed from the published counts).
- **State of React 2025** (3,760 responses, 2025-11-19 to 2026-01-13): `useEffect` used by 98% with the lowest satisfaction; top hook complaints 37%, dependency arrays 21%; React Compiler is the most exciting item for 62%; 34% use no state library; React 19 at 48%, React 18 at 41%; caching is the top data-loading pain (24%); RSC and Server Functions rank 3rd and 4th most disliked. Sources: https://2025.stateofreact.com/en-US/features/, https://certificates.dev/blog/breaking-down-state-of-react-2025-results (2026-02-13). Unverified: "45% have used RSC, 37% Server Functions" (secondary blogs only).
- **React Compiler 1.0** stable 2025-10-07; default in new Expo projects; stable support in Next.js 16. Source: https://react.dev/blog/2025/10/07/react-compiler-1.
- **INP replaced FID** as a Core Web Vital on 2024-03-12. Source: https://web.dev/blog/inp-cwv-launch. 2026 interview guides (Scrimba 2026-07-29, https://scrimba.com/articles/frontend-interview-prep-guide-2026/; MockExperts 2026-05-01) name INP, list virtualization, critical rendering path, CORS preflight, cache headers, IntersectionObserver, AbortController, focus traps, `useTransition`/`useDeferredValue`, and "is `useMemo` still needed with the Compiler" as live interview topics.
- **`scheduler.yield`**: Chrome 129 (2024-09-17), Firefox 142 (2025-08-19), no Safari; Baseline blocked by Safari. Source: https://web-platform-dx.github.io/web-features-explorer/features/scheduler.
- **Navigation API**: Baseline newly available 2026-01 (Safari 26.2 on 2025-12-12, Firefox 147 on 2026-01-13). Source: https://web-platform-dx.github.io/web-features-explorer/features/navigation.
- **View Transitions**: same-document is Baseline 2025; cross-document support Chrome 123 / Firefox 147 / Safari 26.2 per https://developer.chrome.com/docs/web-platform/view-transitions/cross-document (unverified against Mozilla/Apple release notes).
- **Speculation Rules**: Chrome/Edge 109 only; Firefox none; Safari behind a flag (Chrome blog, updated 2026-01-23).
- **CSS anchor positioning**: Chrome 125, Firefox 147, Safari 26 (https://web.dev/blog/interop-2025). Container queries and `:has()` are widely supported.
- **TC39 Signals**: Stage 1; no verified advancement in 2025–2026.
- **WebGPU / WASM** in frontend interviews: no reliable signal outside niches. Not for Lab.
- GreatFrontEnd 2026 roadmap: not reachable (HTTP 429), unverified.

Reading of the signals: interviews in 2027 move toward **responsiveness (INP, long tasks)**, **knowing when memoization is unnecessary (Compiler)**, **async cancellation and races**, and **system-level UI prompts** (autocomplete, infinite feed). New platform APIs matter less for interviews until they are Baseline outside Chrome.

## 4. Proposed list (14 entries)

Order 01–03 is fixed. The rest is ordered by demand and sandbox value. "Change" compares with the list in the mockup (2026-11-02).

| #   | Entry                                     | Opening question                                                                          | Demand                                            | Sandbox idea                                                                                                                                                                      | Change                                                   |
| --- | ----------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| 01  | Client-side cache                         | Why does one screen fetch the same data five times, and what does staleTime change?       | memoize/TTL 18 / 5; SoR caching pain 24%          | Two panels (`useEffect`+fetch vs `useQuery`), staleTime chips, request counters, timeline. **Proposed**: second lane "HTTP cache" (`max-age`, ETag/304, `stale-while-revalidate`) | **proposed**: absorbs "HTTP caching headers"             |
| 02  | Re-renders and memoization                | Which components re-render on a click, and does `useMemo` still matter with the Compiler? | hooks ~11 / 36; Compiler 62% excitement           | Render counters per component, highlight flashes, toggles for `memo`/`useMemo`/Compiler-mode                                                                                      | **proposed**: add the Compiler angle                     |
| 03  | Event loop                                | In what order do `setTimeout(0)`, `Promise.then` and the next paint run?                  | trivia "Event Loop", "Micro vs Macro"             | Queue visualiser (macrotask / microtask / render), step mode. **Proposed**: timer drift mini-scenario                                                                             | **proposed**: absorbs "timers and drift" (17 / 10)       |
| 04  | Debounce vs throttle                      | Why does autocomplete fire 40 times when the user typed 8 letters?                        | 110 / 7 (#2 in catalogue)                         | Keystroke timeline, `wait` slider, leading/trailing/maxWait toggles, counter "calls vs events", `cancel` on unmount                                                               | kept                                                     |
| 05  | Closures and stale state in hooks         | Why does the counter inside `setInterval` always show 0?                                  | trivia "Closures"; useEffect 98% / 37% complaints | Tick timeline showing the value each tick sees in three variants (stale / ref / functional update); carousel as the real-world case                                               | kept                                                     |
| 06  | Async concurrency pool                    | 200 uploads, the server survives 4 at a time: how, without a library?                     | 31 / 5 (+ Promise methods 27 / 5)                 | N tasks with random duration, limit slider, lanes on a timeline, in-flight counter, "one fails" toggle: `all` vs `allSettled`                                                     | **proposed add**                                         |
| 07  | Cancellation and race conditions          | You typed "re", then "react": why do you see results for "re"?                            | AbortController 0 / 3; autocomplete 26 / 2        | Requests with random latency on a timeline, abort vs ignore-stale toggle, counter "stale responses shown"                                                                         | **proposed add**                                         |
| 08  | Long tasks and INP                        | Why does the click react after 400 ms although the code "works"?                          | system "Core Web Vitals"; INP since 2024-03       | 500 ms of simulated work vs chunked; input-delay bar; main-thread timeline; `scheduler.yield` with `setTimeout(0)` fallback                                                       | **proposed**: reframe of "Core Web Vitals"               |
| 09  | Virtualized lists and infinite scroll     | How do you render 100,000 rows without killing the tab?                                   | 19 / 3 + trivia ×2 + system                       | DOM node counter, overscan slider, variable heights, IntersectionObserver sentinel                                                                                                | kept (merged with infinite scroll)                       |
| 10  | Event emitter and leaks                   | Who is still listening when the component is gone?                                        | 37 / 5; trivia "Memory Leaks"                     | Subscriber counter, emit log, `once`, "forgot to unsubscribe" toggle → growing bar; `AbortSignal` as unsubscribe                                                                  | kept, extended                                           |
| 11  | Optimistic updates                        | How does a like appear instantly and roll back when the server says no?                   | 3 / 1; `useOptimistic` on SoR reading list        | Latency slider, failure toggle, timeline optimistic → response → rollback; out-of-order responses                                                                                 | kept                                                     |
| 12  | Failure isolation: boundaries and backoff | Chat dies: why does video keep playing, and why don't you DDoS your own API?              | trivia PE vs GD; retry 6 / 2                      | Three widgets, "kill one", error boundary on/off, blast-radius counter; backend "500 for 30 s", retry timeline, RPS × N clients, jitter                                           | **proposed merge**: graceful degradation + retry/backoff |
| 13  | Reactivity graph (signals)                | Why does a spreadsheet recompute 3 cells while React re-renders the component?            | 12 / 6; Signals ~29.5% most-missed (SoJS 2025)    | Cells A→B→C, recompute counter, push vs pull, side-by-side with entry 02                                                                                                          | **proposed add**                                         |
| 14  | Event propagation and delegation          | One listener for 1,000 rows: how, and why?                                                | 21 / 6 + 3 trivia                                 | Nested boxes, capture → target → bubble timeline, `stopPropagation`, listener counter                                                                                             | **proposed add**                                         |

## 5. Proposed drops and backlog

- **BroadcastChannel**: no coding-section signal, no 2026 guide mentions it. Backlog.
- **Lazy loading / code splitting**: not in the catalogue; an offline sandbox would have to fake a network waterfall; Speculation Rules are Chrome-only. Backlog.
- **CORS**: common question, but decision-tree shaped (simple vs preflight), few counters to animate. Backlog, candidate to swap in for 14 if Krzysztof prefers it over propagation.
- **Undo/redo (command stack)** 19 / 3, **reflow/repaint** (trivia CRP), **focus trap / dialog a11y** 14 / 5, **View Transitions / Navigation API**: backlog, in that order.
- **Flatten / deep clone / Promise polyfills**: strong demand, no sandbox. They appear as code samples inside entries (03, 06), not as entries.
- **Data grid, carousel, file tree, autocomplete**: composite tasks, used as the worked examples inside 04, 05, 07 and 09, not standalone.

## 6. Decisions (all accepted 2026-11-02 as recommended)

1. Accept the four adds (06, 07, 13, 14) and the two drops (BroadcastChannel, lazy loading)?
2. Merge graceful degradation with retry/backoff into one entry (12), or keep two entries?
3. HTTP caching as a second lane inside 01, or a separate entry 01b?
4. Slot 14: event propagation (sandbox-friendly) or CORS (more often asked)?

## 7. Open unknowns

RSC / Server Functions production adoption (no primary data); TC39 Signals status after 2025; GreatFrontEnd 2026 roadmap content.
