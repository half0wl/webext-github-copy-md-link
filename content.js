function getPRInfo() {
  const urlMatch = window.location.pathname.match(/\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!urlMatch) return null;
  const repo = urlMatch[2];
  const prNumber = urlMatch[3];

  const titleEl = document.querySelector('h1[data-component="PH_Title"] .markdown-title');
  if (!titleEl) return null;

  const title = titleEl.textContent.trim();
  const url = window.location.origin + window.location.pathname.replace(/\/(files|commits|checks|changes|conflicts).*$/, '');
  return { title, repo, prNumber, url };
}

function createCopyButton() {
  if (document.querySelector('.copy-pr-markdown-btn')) return;

  const info = getPRInfo();
  if (!info) return;

  const { title, repo, prNumber, url } = info;
  const markdown = `[${repo}/PR#${prNumber} - ${title}](${url})`;

  const btn = document.createElement('button');
  btn.className = 'prc-Button-ButtonBase-9n-Xk copy-pr-markdown-btn';
  btn.type = 'button';
  btn.title = 'Copy PR link as Markdown';
  btn.setAttribute('data-loading', 'false');
  btn.setAttribute('data-no-visuals', 'true');
  btn.setAttribute('data-size', 'small');
  btn.setAttribute('data-variant', 'default');
  btn.innerHTML = `
    <span data-component="buttonContent" data-align="center" class="prc-Button-ButtonContent-Iohp5">
      <span data-component="text" class="prc-Button-Label-FWkx3 btn-label">Copy MD Link</span>
    </span>
  `;

  btn.addEventListener('click', () => {
    const textarea = document.createElement('textarea');
    textarea.value = markdown;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    const label = btn.querySelector('.btn-label');
    label.textContent = 'Copied!';
    setTimeout(() => {
      label.textContent = 'Copy MD Link';
    }, 2000);
  });

  // Insert into the actions bar next to Edit/Code buttons, or fallback to title area
  const actions = document.querySelector('div[data-component="PH_Actions"] .d-flex.gap-1');
  if (actions) {
    actions.prepend(btn);
  } else {
    const titleArea = document.querySelector('[data-component="TitleArea"]');
    if (titleArea) {
      const wrapper = document.createElement('div');
      wrapper.className = 'd-flex flex-items-center gap-1';
      wrapper.appendChild(btn);
      titleArea.after(wrapper);
    }
  }
}

// Track URL changes for SPA navigation
let lastUrl = location.href;

function onPageChange() {
  // Remove old button when navigating to a different PR
  const old = document.querySelector('.copy-pr-markdown-btn');
  if (old) old.remove();
  createCopyButton();
}

// Poll until the button is successfully created (handles React hydration timing)
function waitForButton() {
  if (document.querySelector('.copy-pr-markdown-btn')) return;
  if (!window.location.pathname.match(/\/pull\/\d+/)) return;

  const info = getPRInfo();
  if (info) {
    createCopyButton();
  } else {
    setTimeout(waitForButton, 500);
  }
}

// Initial load
waitForButton();

// Detect SPA navigation and DOM updates
const observer = new MutationObserver(() => {
  if (!window.location.pathname.match(/\/pull\/\d+/)) return;

  if (location.href !== lastUrl) {
    lastUrl = location.href;
    onPageChange();
  } else {
    createCopyButton();
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// Also listen for GitHub's Turbo navigation events
document.addEventListener('turbo:load', waitForButton);
document.addEventListener('turbo:render', waitForButton);
