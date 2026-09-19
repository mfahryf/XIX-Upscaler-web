# XIX Vectorizer Release Download Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Windows download buttons on the public Vectorizer page always point to the newest desktop release without changing the link for every version.

**Architecture:** Use GitHub’s stable `releases/latest/download/Vectorizer-latest-x64-setup.exe` URL for the public repository `mfahryf/XIX-Vectorizer-release`. The desktop release workflow publishes that stable asset name alongside the versioned installer. Keep `VITE_DOWNLOAD_URL` as an optional override.

**Tech Stack:** React/Vite, Vitest, existing Vectorizer public page, GitHub Releases.

## Global Constraints

- The button must point directly to the installer, never to a release page or a version-specific asset name.
- The release page must remain public and must not require a GitHub login to view/download the installer.
- Keep the existing `VITE_DOWNLOAD_URL` override for staging or a future CDN.
- Do not alter the preview/carousel components.

---

### Task 1: Add the stable release destination

**Files:**
- Modify: `src/content/site.js`
- Test: `src/components/VectorizerPage.test.jsx`

- [ ] **Step 1: Change the default download URL.**

  Define the default as:

  ```js
  const DEFAULT_DOWNLOAD_URL =
    "https://github.com/mfahryf/XIX-Vectorizer-release/releases/latest/download/Vectorizer-latest-x64-setup.exe";
  export const DOWNLOAD_URL =
    (import.meta.env?.VITE_DOWNLOAD_URL || DEFAULT_DOWNLOAD_URL).trim();
  ```

- [ ] **Step 2: Replace the disabled-link expectation.**

  Update the public page test to assert that “Download Windows installer” is an external link whose `href` is the stable direct installer URL. Keep a separate test proving `VITE_DOWNLOAD_URL` can override it in the build environment.

- [ ] **Step 3: Run the web test suite and build.**

  Run `npm test` and `npm run build` in `XIX-Vectorizer-web`. Expected: the download card is enabled and the generated page contains no version-specific installer URL.

### Task 2: Deploy the link after the public repository exists

**Files:**
- Inspect: Coolify environment for `frontend-vectorizer`
- Modify only if needed: Coolify `VITE_DOWNLOAD_URL`

- [ ] **Step 1: Publish the desktop repository and first release first.**

  Do not deploy a link to a repository that has no public release asset. Publish the signed `desktop-v0.1.1` draft after the updater workflow has generated `latest.json` and the Windows installer.

- [ ] **Step 2: Deploy the web page.**

  Use the source default, or set `VITE_DOWNLOAD_URL` to the same stable direct installer URL in Coolify. Rebuild `frontend-vectorizer`.

- [ ] **Step 3: Verify the live buttons.**

  Check the hero download button and the installer card at `https://xixlabs.net/vectorizer/`; both must start the latest Windows installer download. Confirm login, trial modal, and preview/carousel behavior remain unchanged.
