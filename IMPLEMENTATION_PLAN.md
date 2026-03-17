# YouTube Cleaner Extension Implementation Plan

## 1. Concise Critique Of The Current Plan

The current plan is a good start, but it is still too broad and too optimistic in a few important areas.

Main weak points:

1. MVP scope is still too large.
   - Home, search, channel, watch, subscriptions, Shorts, ad skipping, muting, overlay cleanup, popup, debug mode, counters, and future cross-browser compatibility are too much for a first reliable release.

2. The architecture is not YouTube-SPA-specific enough.
   - The plan mentions SPA handling, but it does not define a real page router, page lifecycle, or how page-specific logic starts and stops during internal navigation.

3. A background service worker is assumed too early.
   - For this MVP, a background script is not required unless we add messaging, analytics, install-time setup, badge updates, or cross-tab orchestration. Keeping it out initially reduces complexity and MV3 lifecycle edge cases.

4. Shorts detection is underspecified.
   - "Links containing `/shorts/`" and "section title labeled Shorts" are useful signals, but not enough on their own. They can produce false positives or hide the wrong ancestor container if the DOM traversal is too naive.

5. Ad handling needs stronger realism.
   - The current plan correctly avoids promising perfection, but it still needs a clearer separation between:
     - clicking skippable buttons
     - muting during ad playback
     - closing overlays
     - network-level blocking
   - These have different reliability and policy implications.

6. Audio restore logic is risky as written.
   - "Save previous volume/mute state, mute player, restore after ad" sounds simple, but can break user state if:
     - the user changes volume during the ad
     - YouTube changes player objects
     - repeated ad checks overwrite the snapshot
   - This needs explicit ad-session state tracking.

7. Performance guidance is still generic.
   - The plan mentions debouncing and MutationObserver, but does not define:
     - what gets observed
     - when rescans are scheduled
     - how page visibility affects polling
     - how to avoid reprocessing the same containers repeatedly

8. Live settings propagation is missing.
   - It says popup settings persist, but not how already-open YouTube tabs react immediately without reload.

9. Debugging and maintenance need more structure.
   - "Debug mode" should not only print logs. It should expose selector hits, actions taken, counters, route changes, and reasons an element was ignored.

10. Permissions/store-readiness are too light.
   - The plan should explicitly minimize permissions, explain why each is needed, and avoid any store copy that implies guaranteed ad blocking.

## 2. Product Direction

### 2.1 Product Goal

Build a Chrome / Chromium Manifest V3 extension using plain HTML, CSS, and JavaScript that improves YouTube by:

- hiding or reducing distracting UI elements, especially Shorts surfaces
- detecting, skipping, muting, closing, or hiding ad experiences where possible
- giving users simple controls without adding background complexity

Design priorities:

- maintainable plain-JS code
- reliable operation on YouTube's SPA navigation
- minimal permissions
- realistic claims about what can be automated

Non-goals for v1:

- perfect ad blocking
- Firefox optimization
- broad browser compatibility work beyond basic Safari-aware abstractions
- deep per-page customization
- network interception systems

### 2.2 MVP Scope

The MVP should include only:

1. Compact popup with a few high-value toggles:
   - hide Shorts
   - auto-skip skippable ads
   - mute ads when skippable skip is not yet possible
   - close/hide simple player overlays where a close target is clearly available
   - debug mode

2. Shorts hiding on the most common surfaces:
   - home
   - watch recommendations
   - search
   - subscriptions
   - channel pages
   - left navigation entry

3. Watch-page-only ad behavior:
   - click skippable ad buttons when detectable
   - mute during active ad sessions when configured
   - restore audio safely after ad session ends
   - close simple overlay ad UI when a trusted close control exists

4. Robust SPA handling:
   - route detection
   - page-specific activation/deactivation
   - live settings updates in already-open tabs

### 2.3 Cut From MVP

Defer these to later phases:

- counters shown in UI
- per-page custom settings
- hiding arbitrary shelves beyond Shorts-related rules
- statistics/history
- badge text or toolbar state indicators
- sync storage unless it is specifically desired
- background service worker unless a concrete need appears

## 3. Recommended Implementation Order

Build in this order:

1. Manifest, popup, settings storage, content entry
2. Page router and lifecycle management
3. Shorts hiding on stable surfaces
4. Watch-page ad session detection
5. Skippable button clicking
6. Safe mute-and-restore logic
7. Overlay cleanup
8. Debug instrumentation
9. Packaging, store copy, maintenance notes

Why this order:

- page routing and lifecycle control are foundational on YouTube
- Shorts hiding is easier to validate than ad handling
- ad logic should be layered progressively so failures remain isolated

## 4. Technical Architecture

### 4.1 Manifest

Use `manifest_version: 3`.

Minimal permissions for MVP:

- `storage`

Host permissions:

- `https://www.youtube.com/*`

Content script match patterns:

- `https://www.youtube.com/*`

Do not request `tabs`, `scripting`, `webRequest`, or `declarativeNetRequest` for MVP unless a real use case is added later.

### 4.2 Background Service Worker

Recommendation for MVP: do not include one yet.

Why:

- content scripts plus `chrome.storage` are enough for the MVP
- popup can write settings directly to storage
- content scripts can subscribe to `chrome.storage.onChanged`
- avoiding a service worker removes MV3 lifecycle complexity and a whole class of debugging issues

Add a service worker later only if needed for:

- badge updates
- cross-tab broadcast logic beyond storage change listeners
- install-time migrations
- centralized telemetry or diagnostics export

### 4.3 Folder Structure

```text
ytextension/
  manifest.json
  popup/
    popup.html
    popup.css
    popup.js
  src/
    content/
      main.js
      app-controller.js
      router.js
      dom-observer.js
      scheduler.js
      page-context.js
      features/
        shorts/
          shorts-controller.js
          shorts-detectors.js
          shorts-actions.js
        ads/
          ads-controller.js
          ad-session.js
          ad-detectors.js
          ad-actions.js
      youtube/
        page-types.js
        selectors.js
        player.js
        navigation.js
      shared/
        settings.js
        defaults.js
        storage.js
        logger.js
        utils.js
  styles/
    content.css
  icons/
    icon16.png
    icon48.png
    icon128.png
  IMPLEMENTATION_PLAN.md
```

### 4.4 Module Responsibilities

`main.js`

- bootstraps the content app
- loads settings
- wires storage listeners
- starts routing and page lifecycle

`app-controller.js`

- owns app startup/shutdown
- coordinates router, observer, and feature controllers
- reacts to live settings changes

`router.js`

- determines current YouTube surface
- emits route changes for:
  - home
  - watch
  - search
  - channel
  - subscriptions
  - shorts
  - unknown

`navigation.js`

- detects YouTube SPA navigation reliably
- combines URL checks with YouTube navigation events if available
- falls back to debounced URL comparison

`dom-observer.js`

- owns the shared MutationObserver
- limits what mutations trigger work
- schedules feature refreshes instead of running full logic inline

`scheduler.js`

- debounces and batches work
- coalesces repeated mutations
- avoids duplicate scans in the same frame/window

`shorts-controller.js`

- activates on non-Shorts pages where Shorts surfaces can appear
- requests targeted scans
- tracks handled nodes using `WeakSet`

`shorts-detectors.js`

- contains rules to identify Shorts entries/cards/shelves
- returns a confidence result and preferred ancestor target

`shorts-actions.js`

- applies hide operations consistently
- marks hidden containers with extension-owned attributes/classes

`ads-controller.js`

- activates only on watch pages
- manages watch-page polling lifecycle
- coordinates ad session state and ad actions

`ad-session.js`

- tracks one current ad session at a time
- stores whether the extension muted audio
- stores the original player state only once per session
- decides whether restore is allowed when the session ends

`ad-detectors.js`

- contains selectors and logic for:
  - active ad state
  - skippable button presence
  - overlay close targets

`ad-actions.js`

- clicks skip when appropriate
- mutes safely only when needed
- restores state conservatively
- closes or hides overlays with safeguards

`player.js`

- isolates interaction with the YouTube player/video element
- provides stable helpers for reading muted/volume state and applying changes

`settings.js`, `defaults.js`, `storage.js`

- define schema, defaults, validation, migration, and storage helpers

`logger.js`

- debug-only structured logging and counters

### 4.5 Page Router

The extension should not run all features equally on all pages. Use a page router with explicit route types:

- `home`
- `watch`
- `search`
- `channel`
- `subscriptions`
- `shorts`
- `unknown`

Routing inputs:

- `location.pathname`
- selected query parameters when needed
- presence of route-specific root containers as a secondary signal

Recommended behavior by route:

- `home`: enable Shorts surface hiding
- `search`: enable Shorts card/shelf hiding
- `channel`: enable Shorts tab/shelf hiding
- `subscriptions`: enable Shorts shelf/card hiding
- `watch`: enable Shorts recommendation hiding and ad handling
- `shorts`: optional minimal behavior only; do not aggressively mutate until later because this surface is volatile
- `unknown`: run only low-risk global cleanup such as sidebar Shorts entry checks

### 4.6 Live Settings Propagation

Use `chrome.storage.local` for MVP.

Flow:

1. Popup writes updated settings to storage.
2. Every open YouTube content script listens to `chrome.storage.onChanged`.
3. On change, the content script:
   - validates the new settings object
   - updates in-memory state
   - re-runs only the affected features
   - starts or stops watch-page polling immediately if ad settings changed

This avoids needing a background worker for live updates.

## 5. Settings And UI

### 5.1 Popup vs Options Page

Recommendation:

- keep the popup compact for MVP
- do not build an options page yet

Popup is enough for:

- 4 feature toggles
- debug mode toggle
- one short note that behavior depends on YouTube page structure

Move advanced settings to an options page later only if you add:

- per-route controls
- selector diagnostics
- import/export
- experimental flags

### 5.2 Settings Schema

Use a versioned schema with defaults.

```js
const DEFAULT_SETTINGS = {
  version: 1,
  shorts: {
    enabled: true
  },
  ads: {
    autoSkip: true,
    muteWhenAdPlaying: true,
    closeOverlays: true
  },
  debug: {
    enabled: false
  }
};
```

Rules:

- store one normalized object instead of scattered keys
- validate missing/unknown fields on read
- merge stored values with defaults
- reserve schema migration support now even if v1 only uses `version: 1`

## 6. DOM Strategy

### 6.1 General Approach

Use a hybrid CSS + JavaScript approach.

Use CSS for:

- applying the actual hidden state via extension-owned classes/attributes
- keeping the visual behavior consistent once an element is identified

Use JavaScript for:

- detection
- confidence checks
- ancestor resolution
- route-specific logic

Do not rely on CSS-only selectors for MVP because YouTube DOM structure is too dynamic and context-sensitive.

### 6.2 Shorts Detection Strategy

Do not use a single rule like "contains `/shorts/`". Use multi-signal detection with route-aware logic.

Preferred signals:

1. Anchor URL points to `/shorts/`
2. Renderer/container type is associated with reel/Shorts UI
3. Nearby title/label text indicates Shorts
4. The card/shelf exists inside a route-specific region where Shorts commonly appear

Reduce false positives by requiring:

- at least 2 signals for broader shelf/container hiding
- 1 strong signal for clearly dedicated navigation items such as the left nav Shorts entry

### 6.3 Safer Ancestor Resolution

Do not hide an arbitrary parent with repeated `parentElement` climbing.

Instead:

1. For each detector rule, define a preferred set of acceptable container selectors.
2. Walk upward only until:
   - a known renderer/container boundary is found
   - a route root boundary is hit
   - a maximum climb depth is reached
3. If no safe container is found, do nothing rather than risk hiding unrelated content.

Example strategy:

- detect a Shorts anchor
- find the nearest known card/shelf renderer
- verify that the renderer contains the anchor and fits the current route context
- hide that renderer only

### 6.4 Shorts Surface Coverage For MVP

Prioritize:

- left navigation Shorts entry
- home Shorts shelf
- search result Shorts cards/shelves
- watch-page recommended Shorts cards
- channel Shorts tab or obvious Shorts shelf
- subscriptions Shorts shelf/card

Treat direct Shorts pages conservatively in MVP:

- do not try to rewrite the Shorts player experience
- optional behavior is redirect/block later, not in MVP

## 7. Ad-Handling Strategy

### 7.1 Realistic MV3 Position

In a Chrome MV3 extension without heavy network-blocking infrastructure, the most realistic approach is:

- detect ad states in the player DOM/UI
- click skip buttons when available
- mute during detected ad playback when configured
- close or hide simple overlay ad UI when safe

This can improve the experience, but it cannot guarantee:

- all ads are detected
- all ads are skipped
- all ad audio is muted instantly every time
- all overlays are removable

### 7.2 Distinguish The Ad Behaviors Clearly

Skippable ad button clicking:

- most reliable when a visible, enabled skip control appears
- should use a small watch-page-only polling loop because button availability can be time-sensitive
- should include fallback selectors and text checks

Mute-during-ad behavior:

- useful for non-skippable or not-yet-skippable ads
- should only trigger when ad playback confidence is high
- must preserve and restore user state conservatively

Overlay cleanup:

- limited to obvious close buttons or clearly identified ad overlays
- do not aggressively remove unknown player DOM, because it can break playback controls

Network-level blocking:

- not part of MVP
- should not be the main strategy
- raises more complexity, compatibility, and maintenance cost

### 7.3 Ad Session State Tracking

Ad handling should be session-based, not stateless polling.

Track:

- `isAdActive`
- `sessionId`
- `startedAt`
- `skipAttempted`
- `mutedByExtension`
- `originalMuted`
- `originalVolume`
- `restorePending`
- `userChangedAudioDuringSession`

Session rules:

1. When ad state transitions from inactive to active:
   - create a new session
   - snapshot audio state once

2. During the same session:
   - do not overwrite the original snapshot
   - attempt skip when skip control becomes available
   - mute only if enabled and not already muted by the user

3. If the user changes mute or volume during the ad:
   - mark `userChangedAudioDuringSession = true`
   - do not force-restore old values at the end

4. When ad state ends:
   - restore only if the extension changed the state and the user did not override it

### 7.4 Audio Restore Safeguards

Safeguards are required to avoid breaking user audio preferences.

Rules:

- restore only if the extension was the component that muted
- never restore if the user interacted with volume or mute during the ad session
- never repeatedly apply restore logic after the session has ended
- if player state cannot be read confidently, skip restore rather than guess

### 7.5 Watch-Page Polling Model

Ad polling should exist only on `watch` pages and only while at least one ad feature is enabled.

Recommended loop:

- interval: around 500ms to 1000ms
- paused when:
  - tab/document is hidden, if practical via `document.visibilityState`
  - current route is not `watch`
  - all ad features are disabled

This polling loop should be small and focused:

- detect ad-active state changes
- find skip buttons
- detect simple overlay close targets

## 8. Performance Plan

### 8.1 Core Rules

- do not rescan the whole document on every mutation
- do not run ad logic outside watch pages
- do not do synchronous heavy work inside MutationObserver callbacks

### 8.2 MutationObserver Strategy

Use one shared observer on `document.body` after it becomes available.

Observe:

- `childList: true`
- `subtree: true`

Do not observe attributes broadly in MVP unless needed for a specific ad signal.

Observer behavior:

- inspect mutation batches cheaply
- infer which feature needs a refresh
- schedule a debounced feature pass instead of rescanning immediately

Example:

- new feed shelf inserted -> schedule Shorts scan for current route
- watch-page player subtree changed -> schedule ad check soon

### 8.3 Debouncing And Scheduling

Use:

- a short debounce window for route-level rescans
- `requestAnimationFrame` or a tiny task scheduler for DOM writes

This helps coalesce bursts from YouTube re-rendering.

### 8.4 WeakSet And Attribute Caching

Use `WeakSet` to remember:

- nodes already evaluated
- nodes already hidden
- nodes already processed by a detector pass

Also mark hidden nodes with an extension attribute such as:

- `data-ytc-hidden="shorts"`

That makes later debug and maintenance easier.

### 8.5 Visibility Awareness

Use `document.visibilityState` to reduce unnecessary activity.

At minimum:

- suspend or slow ad polling when the page is hidden
- allow scheduled Shorts scans to finish, but avoid repeated hidden-tab rescans

## 9. Reliability And Debugging

### 9.1 Debug Mode

Debug mode should be useful, not noisy.

When enabled, log:

- app startup
- route changes
- settings changes
- detector matches
- chosen ancestor/container
- hide actions
- ad session start/end
- skip attempts
- mute/restore decisions
- reasons restore was skipped

Add in-memory counters for:

- route changes seen
- Shorts containers hidden
- skip clicks attempted
- ad sessions detected
- overlay closes attempted
- restore operations performed
- restore operations skipped for safety

### 9.2 Selector Organization

Keep selectors grouped by feature and intent, not dumped into one flat file.

Suggested organization:

- route/container selectors
- Shorts signals
- ad-active signals
- skip-button selectors
- overlay selectors

For each selector group:

- keep primary selectors first
- keep fallback selectors separate
- document the purpose briefly

### 9.3 Fallback Logic

Do not rely on one brittle selector.

Pattern:

1. try strong selector
2. try fallback selectors
3. validate context before acting
4. abort safely if confidence is too low

### 9.4 Maintenance Strategy

When YouTube changes DOM structure:

1. reproduce with debug mode on
2. check which detection stage failed:
   - route detection
   - selector match
   - ancestor resolution
   - action execution
3. update selectors in isolated detector modules
4. rerun manual regression checklist across routes

This is another reason to keep detection, routing, and actions separate.

## 10. Testing Plan

### 10.1 Manual Test Matrix

Test these routes:

- home
- watch
- search
- channel
- subscriptions
- direct Shorts page

For each route, test:

- initial full page load
- internal SPA navigation from another route
- repeated navigation back and forth
- settings changes while the tab stays open

### 10.2 Shorts Regression Scenarios

Check:

- left nav Shorts entry hides correctly
- home Shorts shelf hides without removing unrelated shelves
- search Shorts cards hide without hiding normal videos
- watch recommendations hide Shorts cards only
- channel page hides obvious Shorts-specific section/tab only
- subscriptions route hides Shorts-related cards/shelves only

### 10.3 Ad Regression Scenarios

Check:

- skippable ad: skip is clicked once available
- non-skippable ad: extension mutes only during active ad session
- audio restores only when the extension changed it
- user-muted video stays muted after ad
- user volume change during ad is not overwritten at session end
- overlay closes only when a clear close target exists
- no ad logic runs on non-watch pages

### 10.4 SPA Navigation Scenarios

Check:

- home -> watch -> search -> watch -> channel
- watch video A -> watch video B without full reload
- search -> open result -> back to search
- channel -> home -> subscriptions

Validate:

- route updates correctly
- feature controllers start/stop correctly
- no duplicate intervals or observers remain active

### 10.5 Live Settings Scenarios

With a YouTube tab already open:

- disable Shorts hiding and verify previously hidden new content is no longer processed
- disable auto-skip and verify skip clicking stops without reload
- disable mute-on-ad and verify future ad sessions are not muted
- enable debug mode and verify logging starts immediately

### 10.6 General Reliability Checks

Check:

- normal video playback still works
- controls remain usable
- scrolling remains smooth on home/search
- console is quiet when debug mode is off
- no runaway intervals after long browsing sessions

## 11. Permissions And Store Readiness

### 11.1 Minimal Permissions Rationale

`storage`

- required for user settings and debug flag persistence

`https://www.youtube.com/*`

- required so the content script can operate on YouTube pages

Avoid extra permissions in MVP because they:

- increase review risk
- make user trust harder
- are not needed for the current architecture

### 11.2 Store Listing Guidance

Use transparent language.

Good framing:

- hides Shorts surfaces on YouTube
- detects, skips, mutes, closes, or hides some ad experiences where possible
- works best on Chrome / Chromium

Avoid misleading claims:

- "blocks all YouTube ads"
- "removes every ad"
- "works on all ads forever"
- "perfect ad blocker"

## 12. Recommended MVP Milestones

### Milestone 1: Shell

- manifest
- popup
- settings schema
- content script bootstrap
- route detection

Definition of done:

- extension loads in Chrome
- popup toggles persist
- route changes are detected on YouTube SPA navigation

### Milestone 2: Shorts

- left nav Shorts hide
- home/search/watch/subscriptions/channel Shorts detection
- safe ancestor resolution
- debounced route-aware rescans

Definition of done:

- common Shorts surfaces are hidden without obvious false positives

### Milestone 3: Watch Ad Detection

- watch-page-only controller
- ad-active detection
- ad session state model
- polling lifecycle

Definition of done:

- ad session start/end is detected with debug visibility

### Milestone 4: Ad Actions

- skip button click
- mute-during-ad
- safe restore
- simple overlay cleanup

Definition of done:

- skippable ads are often skipped
- non-skippable ads are often muted
- player audio state is not obviously broken

### Milestone 5: Hardening

- debug counters
- selector fallback cleanup
- regression checklist pass
- packaging/store text cleanup

Definition of done:

- extension is maintainable enough for iterative updates when YouTube changes

## 13. Safari Later

Safari support should not drive the MVP, but a few abstractions now will help later.

Abstract now:

1. Browser API access
   - wrap `chrome.storage` and any future extension APIs behind tiny adapters

2. Route and DOM feature logic
   - keep YouTube detection and DOM actions independent from browser API calls

3. Settings layer
   - centralize reads/writes through one module

4. Manifest-sensitive features
   - avoid depending on Chrome-only extras that are not needed

5. Player interaction helpers
   - isolate DOM/player access in one module in case Safari needs slightly different timing or event handling

Practical note:

- Safari Web Extensions can be made easier by keeping the codebase plain JS, minimizing permissions, and avoiding unnecessary background complexity.
- Do not spend MVP effort on Safari packaging, conversion, or testing yet.

## 14. What Is Not Realistic To Guarantee

This extension should not claim or assume any of the following:

- all YouTube ads can be detected
- all ads can be skipped
- all non-skippable ads can always be muted instantly
- every overlay ad can be closed safely
- YouTube DOM selectors will remain stable
- one set of selectors will work permanently without maintenance
- direct Shorts pages can be rewritten safely in MVP
- network-level ad blocking is part of this MVP

The honest product promise is:

- improve YouTube by hiding Shorts surfaces and detecting, skipping, muting, closing, or hiding ad experiences where possible, while keeping the extension small, maintainable, and resilient on YouTube's SPA UI
