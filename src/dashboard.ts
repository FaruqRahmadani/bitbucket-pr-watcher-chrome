interface BitbucketPR {
  id: number;
  title: string;
  links: {
    html: {
      href: string;
    };
    self: {
      href: string;
    };
  };
  author: {
    display_name: string;
    links: {
      avatar: { href: string };
    };
  };
  source: {
    repository: {
      full_name: string;
      links: {
        html: { href: string };
      };
    };
  };
  participants: Participant[];
  created_on: string;
}

interface Participant {
  user: {
    account_id: string;
    uuid: string;
    display_name: string;
    nickname?: string;
  };
  role: "REVIEWER" | "PARTICIPANT";
  approved: boolean;
  state: "approved" | "changes_requested" | null;
}

const loadingEl = document.getElementById("loading")!;
const errorEl = document.getElementById("error")!;
const contentEl = document.getElementById("dashboard-content")!;
const pendingListEl = document.getElementById("pending-list")!;
const reviewedListEl = document.getElementById("reviewed-list")!;
const refreshBtn = document.getElementById("refresh") as HTMLButtonElement;
const settingsBtn = document.getElementById("settings") as HTMLButtonElement;
const themeToggleBtn = document.getElementById("theme-toggle") as HTMLButtonElement;

// Modal Elements
const settingsModal = document.getElementById("settings-modal") as HTMLDivElement;
const closeModalBtn = document.getElementById("close-modal") as HTMLButtonElement;
const saveSettingsBtn = document.getElementById("save-settings") as HTMLButtonElement;
const usernameInput = document.getElementById("username") as HTMLInputElement;
const tokenInput = document.getElementById("token") as HTMLInputElement;
const refreshIntervalInput = document.getElementById("refreshInterval") as HTMLInputElement;
const refreshValueEl = document.getElementById("refreshValue") as HTMLSpanElement;
const settingsStatus = document.getElementById("settings-status") as HTMLDivElement;

let currentUser: any = null;
let authHeader: string = "";
let refreshIntervalId: any = null;

// Theme Logic
function initTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    updateThemeIcon(true);
  } else if (savedTheme === "light") {
    document.documentElement.removeAttribute("data-theme");
    updateThemeIcon(false);
  } else {
    // Check system preference
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (systemDark) {
      document.documentElement.setAttribute("data-theme", "dark");
      updateThemeIcon(true);
    } else {
      updateThemeIcon(false);
    }
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  if (currentTheme === "dark") {
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("theme", "light");
    updateThemeIcon(false);
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
    updateThemeIcon(true);
  }
}

function updateThemeIcon(isDark: boolean) {
  if (!themeToggleBtn) return;
  // Use simple SVG swap
  themeToggleBtn.innerHTML = isDark
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>` // Sun icon
    : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`; // Moon icon
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", toggleTheme);
}

// Initialize theme immediately
initTheme();

async function init() {
  setLoading(true);
  try {
    const { username, token, refreshInterval } = await chrome.storage.local.get(["username", "token", "refreshInterval"]);
    
    if (!username || !token) {
      throw new Error("Please configure your Bitbucket credentials in the extension options.");
    }

    authHeader = "Basic " + btoa(`${username}:${token}`);

    // Set auto-refresh from options (default 5 min if not set)
    const intervalMinutes = refreshInterval ? parseInt(String(refreshInterval)) : 5;
    updateAutoRefresh(intervalMinutes * 60 * 1000);

    // 1. Get Current User Details (to identify 'me')
    currentUser = await fetchUser();

    // 2. Fetch Repositories
    const repos = await fetchRepos();
    
    // 3. Fetch PRs
    const prs = await fetchAllPRs(repos, currentUser.username || currentUser.display_name); // Use username for query if available
    
    // 4. Render
    renderDashboard(prs);
    
  } catch (err: any) {
    showError(err.message);
  } finally {
    setLoading(false);
  }
}

async function fetchUser() {
  const res = await fetch("https://api.bitbucket.org/2.0/user", {
    headers: { Authorization: authHeader }
  });
  if (!res.ok) throw new Error("Failed to fetch user details");
  return await res.json();
}

async function fetchRepos() {
  const res = await fetch("https://api.bitbucket.org/2.0/repositories?role=member&pagelen=100", {
    headers: { Authorization: authHeader }
  });
  if (!res.ok) throw new Error("Failed to fetch repositories");
  const data = await res.json();
  return data.values || [];
}

async function fetchAllPRs(repos: any[], queryUsername: string) {
  // We want PRs where I am a reviewer and state is OPEN
  // Note: We use queryUsername for the API query, but we'll use account_id/uuid for filtering status locally
  const query = `reviewers.username="${queryUsername}" AND state="OPEN"`;
  
  const promises = repos.map(async (repo) => {
    const url = `${repo.links.self.href}/pullrequests?q=${encodeURIComponent(query)}&pagelen=50`;
    try {
      const res = await fetch(url, { headers: { Authorization: authHeader } });
      if (!res.ok) return [];
      const data = await res.json();
      const prs = data.values || [];
      
      // If participants are missing (which happens in list view sometimes), fetch details for each PR
      // But to avoid rate limits, we only do this if we really need to.
    // Actually, Bitbucket API v2 list response *should* contain participants if not filtered out.
    // Let's check if we need to fetch details.
    
    const detailedPRs = await Promise.all(prs.map(async (pr: BitbucketPR) => {
      if (!pr.participants) {
         try {
           const detailRes = await fetch(pr.links.self.href, { headers: { Authorization: authHeader } });
           if (detailRes.ok) {
             const detailData = await detailRes.json();
             return detailData;
           }
         } catch (e) {
           console.error("Failed to fetch PR details", e);
         }
      }
      return pr;
    }));

    return detailedPRs;
    } catch (e) {
      console.error(`Failed to fetch PRs for ${repo.full_name}`, e);
      return [];
    }
  });

  const results = await Promise.all(promises);
  return results.flat() as BitbucketPR[];
}

function renderDashboard(prs: BitbucketPR[]) {
  pendingListEl.innerHTML = "";
  reviewedListEl.innerHTML = "";
  
  const pendingPRs: BitbucketPR[] = [];
  const reviewedPRs: BitbucketPR[] = [];

  prs.forEach(pr => {
    // Debug: Log participant matching for troubleshooting
    
    const myParticipant = (pr.participants || []).find(p => {
      if (!p.user) return false;
      
      const matchAccountId = currentUser.account_id && p.user.account_id === currentUser.account_id;
      const matchUuid = currentUser.uuid && p.user.uuid === currentUser.uuid;
      const matchNickname = currentUser.nickname && p.user.nickname === currentUser.nickname;
      const matchDisplayName = currentUser.display_name && p.user.display_name === currentUser.display_name;

      // Note: Bitbucket API sometimes wraps uuid in curly braces in one place but not another.
      // Let's normalize UUIDs just in case.
      const normalize = (id: string) => id ? id.replace(/[{}]/g, "") : "";
      const matchUuidNormalized = normalize(currentUser.uuid) === normalize(p.user.uuid);

      return matchAccountId || matchUuid || matchUuidNormalized || matchNickname || matchDisplayName;
    });

    const hasReviewed = myParticipant && (myParticipant.approved || myParticipant.state === "changes_requested");
    
    if (hasReviewed) {
      reviewedPRs.push(pr);
    } else {
      pendingPRs.push(pr);
    }
  });

  updatePageMetadata(pendingPRs.length);

  renderGroupedList(pendingListEl, pendingPRs, false);
  renderGroupedList(reviewedListEl, reviewedPRs, true);
  
  if (pendingPRs.length === 0) {
    pendingListEl.innerHTML = "<div class='empty-state'>No pending PRs! Good job! 🎉</div>";
  }
  if (reviewedPRs.length === 0) {
    reviewedListEl.innerHTML = "<div class='empty-state'>No reviewed PRs found.</div>";
  }

  contentEl.style.display = "block";
}

function updatePageMetadata(pendingCount: number) {
  // Update Title
  if (pendingCount > 0) {
    document.title = `(${pendingCount}) PR Need Review - Bitbucket Dashboard`;
  } else {
    document.title = "Bitbucket PR Dashboard";
  }

  // Update Favicon
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Draw background circle (blue if 0, red if > 0)
    ctx.fillStyle = pendingCount > 0 ? '#de350b' : '#0052cc';
    ctx.beginPath();
    ctx.arc(16, 16, 16, 0, 2 * Math.PI);
    ctx.fill();

    // Draw text (count or checkmark)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (pendingCount > 0) {
      const text = pendingCount > 99 ? '99+' : pendingCount.toString();
      // Adjust font size for larger numbers
      if (text.length > 2) ctx.font = 'bold 14px Arial';
      ctx.fillText(text, 16, 16);
    } else {
      // Draw a checkmark
      ctx.font = 'bold 20px Arial';
      ctx.fillText('✓', 16, 16);
    }

    const link = document.getElementById('dynamic-favicon') as HTMLLinkElement;
    if (link) {
      link.href = canvas.toDataURL('image/png');
    }
  }
}

function renderGroupedList(container: HTMLElement, prs: BitbucketPR[], isReviewedList: boolean) {
  // Group by Repo
  const groups: { [key: string]: BitbucketPR[] } = {};
  
  prs.forEach(pr => {
    const repoName = pr.source.repository.full_name;
    if (!groups[repoName]) groups[repoName] = [];
    groups[repoName].push(pr);
  });

  Object.keys(groups).sort().forEach(repoName => {
    const groupEl = document.createElement("div");
    groupEl.className = "repo-group";
    
    const header = document.createElement("div");
    header.className = "repo-header";
    header.textContent = repoName;
    groupEl.appendChild(header);

    const list = document.createElement("div");
    list.className = "pr-list";
    
    groups[repoName].forEach(pr => {
      const item = document.createElement("div");
      item.className = "pr-item";
      
      const content = document.createElement("div");
      content.className = "pr-content";
      
      const link = document.createElement("a");
      link.href = pr.links.html.href;
      link.className = "pr-title";
      link.textContent = pr.title;
      link.target = "_blank"; // Open in new tab
      
      const meta = document.createElement("div");
      meta.className = "pr-meta";
      meta.textContent = `#${pr.id} opened by ${pr.author.display_name} • ${new Date(pr.created_on).toLocaleDateString()}`;
      
      content.appendChild(link);
      content.appendChild(meta);
      
      // Status Badge Logic
      if (isReviewedList) {
        const myParticipant = (pr.participants || []).find(p => 
          (p.user?.account_id && p.user.account_id === currentUser.account_id) || 
          (p.user?.uuid && p.user.uuid === currentUser.uuid)
        );
        
        if (myParticipant) {
           const badge = document.createElement("span");
           badge.className = "status-badge";
           
           if (myParticipant.approved) {
             badge.classList.add("status-approved");
             badge.textContent = "APPROVED";
           } else if (myParticipant.state === "changes_requested") {
             badge.classList.add("status-changes");
             badge.textContent = "CHANGES REQUESTED";
           }
           
           // Only append if we have a valid status to show (which we should, given the filter logic)
           if (badge.textContent) {
             content.appendChild(badge);
           }
        }
      }

      const avatar = document.createElement("img");
      if (pr.author.links.avatar) {
          avatar.src = pr.author.links.avatar.href;
      }
      avatar.className = "author-avatar";
      avatar.title = pr.author.display_name;

      item.appendChild(avatar);
      item.appendChild(content);
      list.appendChild(item);
    });

    groupEl.appendChild(list);
    container.appendChild(groupEl);
  });
}

function updateAutoRefresh(intervalMs: number) {
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId);
    refreshIntervalId = null;
  }

  if (intervalMs > 0) {
    refreshIntervalId = setInterval(() => {
      silentRefresh();
    }, intervalMs);
  }
}

async function silentRefresh() {
  try {
     // 1. Fetch Repos (we already have user)
    const repos = await fetchRepos();
    
    // 2. Fetch PRs
    const prs = await fetchAllPRs(repos, currentUser.username || currentUser.display_name);
    
    // 3. Render
    renderDashboard(prs);
  } catch (err) {
    console.error("Silent refresh failed", err);
  }
}

// Listen for changes in options (still useful if changed from other tabs)
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.refreshInterval) {
    const newMinutes = parseInt(String(changes.refreshInterval.newValue));
    updateAutoRefresh(newMinutes * 60 * 1000);
  }
});

function setLoading(isLoading: boolean) {
  const refreshIcon = refreshBtn.querySelector("svg");
  
  if (isLoading) {
    loadingEl.style.display = "none"; // Hide old text loader
    errorEl.style.display = "none";
    contentEl.style.display = "block"; // Keep content visible (for skeletons)
    
    // Render Skeletons
    renderSkeleton();

    refreshBtn.disabled = true;
    if (refreshIcon) refreshIcon.classList.add("spin");
  } else {
    loadingEl.style.display = "none";
    refreshBtn.disabled = false;
    if (refreshIcon) refreshIcon.classList.remove("spin");
  }
}

function renderSkeleton() {
  const skeletonItem = `
    <div class="pr-item">
      <div class="skeleton" style="width: 28px; height: 28px; border-radius: 50%; margin-right: 16px;"></div>
      <div class="pr-content">
        <div class="skeleton" style="width: 60%; height: 16px; margin-bottom: 6px;"></div>
        <div class="skeleton" style="width: 40%; height: 12px;"></div>
      </div>
    </div>
  `;
  
  const groupHTML = `
    <div class="repo-group">
      <div class="repo-header">
        <div class="skeleton" style="width: 120px; height: 14px;"></div>
      </div>
      <div class="pr-list">
        ${skeletonItem}
        ${skeletonItem}
        ${skeletonItem}
      </div>
    </div>
  `;

  pendingListEl.innerHTML = groupHTML;
  reviewedListEl.innerHTML = groupHTML;
}

function showError(msg: string) {
  errorEl.textContent = msg;
  errorEl.style.display = "block";
}

refreshBtn.addEventListener("click", () => {
  init();
});

// --- Modal Logic ---

function openSettingsModal() {
  settingsModal.classList.add("open");
  
  // Load current settings into inputs
  chrome.storage.local.get(["username", "token", "refreshInterval"], (result) => {
    if (result.username) usernameInput.value = String(result.username);
    if (result.token) tokenInput.value = String(result.token);
    
    const interval = result.refreshInterval || 5;
    refreshIntervalInput.value = String(interval);
    if (refreshValueEl) refreshValueEl.textContent = String(interval);
  });
  
  settingsStatus.textContent = "";
}

if (refreshIntervalInput && refreshValueEl) {
  refreshIntervalInput.addEventListener("input", () => {
    refreshValueEl.textContent = refreshIntervalInput.value;
  });
}

function closeSettingsModal() {
  settingsModal.classList.remove("open");
}

if (settingsBtn) {
  settingsBtn.addEventListener("click", openSettingsModal);
}

if (closeModalBtn) {
  closeModalBtn.addEventListener("click", closeSettingsModal);
}

// Close on outside click
settingsModal.addEventListener("click", (e) => {
  if (e.target === settingsModal) {
    closeSettingsModal();
  }
});

if (saveSettingsBtn) {
  saveSettingsBtn.addEventListener("click", async () => {
    const username = usernameInput.value.trim();
    const token = tokenInput.value.trim();
    const refreshInterval = parseInt(refreshIntervalInput.value) || 5;

    if (!username || !token) {
      settingsStatus.textContent = "Please fill in all fields.";
      settingsStatus.style.color = "var(--status-changes-text)";
      return;
    }

    settingsStatus.textContent = "Verifying credentials...";
    settingsStatus.style.color = "var(--text-secondary)";
    saveSettingsBtn.disabled = true;

    try {
      // Verify credentials
      const res = await fetch("https://api.bitbucket.org/2.0/user", {
        headers: {
          Authorization: "Basic " + btoa(`${username}:${token}`)
        }
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Invalid username or password.");
        }
        throw new Error(`Verification failed (Status: ${res.status})`);
      }

      const data = await res.json();
      const realUsername = data.username || data.display_name;

      // Save settings
      await chrome.storage.local.set({ 
        username, 
        token, 
        apiUsername: realUsername, 
        refreshInterval 
      });

      settingsStatus.textContent = `Verified! Saved as: ${realUsername}`;
      settingsStatus.style.color = "var(--status-approved-text)";
      
      // Close modal after short delay and refresh dashboard
      setTimeout(() => {
        closeSettingsModal();
        init(); // Refresh dashboard with new settings
      }, 1000);

    } catch (error: any) {
      settingsStatus.textContent = "Error: " + error.message;
      settingsStatus.style.color = "var(--status-changes-text)";
      console.error(error);
    } finally {
      saveSettingsBtn.disabled = false;
    }
  });
}

// Start
init();