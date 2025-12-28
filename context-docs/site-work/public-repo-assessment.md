# Public Repository Assessment

This document assesses items that would need to be addressed before making this Jekyll site repository public on GitHub.

**Assessment Date**: December 2025

## Summary

**Overall Status**: The codebase is reasonably well-prepared for public release. Most sensitive items are properly handled via GitHub Secrets and `.gitignore`. No critical issues require remediation.

---

## Items Reviewed

### 1. Cloudflare Stream Identifiers

**File**: `_camerastream_sections/livestream.html` (line 14)

```html
src="https://customer-f4c1b9l604wu063w.cloudflarestream.com/233d07a0197ef8e78a217ce824aa80ba/iframe..."
```

**What's Exposed**: Cloudflare account identifier and stream video ID.

**Risk Level**: Low - These IDs are already exposed in the public HTML of the live site. Cloudflare Stream access control is managed separately. No additional exposure from making the repo public.

**Action Required**: None.

**Optional Mitigation**: If desired, the stream URL could be proxied through a Cloudflare Worker (similar to the existing Google Maps proxy pattern), keeping the account and stream IDs server-side. This would remove the identifiers from both the repository and the rendered HTML.

---

### 2. Internal Infrastructure URLs

**Files**:
- `_data/staging-config.yml` (lines 37, 42, 55)
- `_config.yml` (line 11)

**URLs Exposed**:
| URL | Purpose |
|-----|---------|
| `https://stagingsite.edwardjensencms.com` | Staging server |
| `https://staging-tailscale.edwardjensencms.com/api/graphql` | Staging CMS (VPN-gated) |
| `https://www-ts.edwardjensencms.com/api/graphql` | Production CMS (VPN-gated) |
| `https://staging.edwardjensen.net` | Cloudflare staging |

**Risk Level**: Low - The Tailscale endpoints require VPN authentication. The staging URLs reveal infrastructure but don't provide access.

**Action Required**: None. Consider adding a comment noting VPN requirements if clarity is desired.

---

### 3. Cloudflare Worker Domain

**File**: `cloudflare-workers/maps-proxy/wrangler.toml` (line 11)

```yaml
routes = [
  { pattern = "ejnetmaps.edwardjensenprojects.com", custom_domain = true }
]
```

**Risk Level**: Low - This is a public endpoint already. The actual API key is stored server-side via `wrangler secret`.

**Action Required**: None.

---

### 4. Private Demo Redirect

**File**: `_data/redirects.yml` (lines 4-5)

```yaml
- source: /demo
  destination: https://confidencedemo.edwardjensen.net/
```

**Risk Level**: Low - Reveals existence of a demo subdomain.

**Action Required**: None required. If the demo URL should remain private, remove this redirect.

---

### 5. GitHub Workflow Secret References

**Files**: All `.github/workflows/*.yml`

**Secrets Referenced**:
- `GOOGLE_MAPS_API_KEY`
- `TS_OAUTH_CLIENT_ID` / `TS_OAUTH_CLIENT_SECRET`
- `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` / `CF_PAGES_PROJECT`
- `DEPLOY_SSH_KEY` / `DEPLOY_USER` / `DEPLOY_HOST` / `DEPLOY_PATH`

**Risk Level**: None - The secret *names* are visible but values are protected by GitHub. This is standard practice for public repositories.

**Action Required**: None. This is expected for public repos with CI/CD.

---

### 6. Local Runtime Config

**File**: `_config.runtime.yml` (local only)

Contains Google Maps API key locally. This file is:
- Listed in `.gitignore` (line 40)
- Not in git history (verified)
- Generated only during CI/CD builds

**Action Required**: None - properly handled.

---

## Items Correctly Excluded via .gitignore

The following sensitive items are correctly excluded from version control:

| Pattern | Description |
|---------|-------------|
| `_posts/` | CMS-sourced blog posts |
| `_working_notes/` | CMS-sourced working notes |
| `_historic_posts/` | CMS-sourced historic posts |
| `_photography/` | Photography content |
| `assets/photography/` | Photography assets |
| `assets/images/posts/` | Post images |
| `_config.local.yml` | Local config overrides |
| `_config.runtime.yml` | Runtime secrets |
| `_data/microphotos.json` | CMS-fetched data |

---

## Non-Security Considerations

### Documentation Exposure

Making the repo public exposes:
- `CLAUDE.md` - Comprehensive codebase documentation
- `.github/copilot-instructions.md` - AI assistant instructions
- `context-docs/` - Detailed technical documentation

This is educational and could help others learn from the setup.

### context-docs/ Directory Consideration

The `context-docs/` directory contains detailed technical documentation intended to provide context to two separate Claude AI projects:

- **Content editing project** - Used for drafting and editing site content, as well as providing strategic content guidance
- **Site work project** - Used for site development and implementation

**Contents of `context-docs/`**:

- `site-work/` - Technical planning documents, content schemas, and implementation notes
- Detailed architectural decisions and workflow documentation

**Reasons to move to a separate repository if going public**:
- Contains internal planning and decision-making context not intended for public consumption
- Includes AI assistant context that is specific to personal workflows
- May include notes about future features or infrastructure changes
- Keeps the public repository focused on the actual site implementation
- Allows continued private collaboration on planning documents

**If moving `context-docs/`**:
1. Create a new private repository (e.g., `edwardjensen-site-docs`)
2. Move the `context-docs/` directory contents to the new repository
3. Add `context-docs/` to `.gitignore` in this repository
4. Update `CLAUDE.md` to note that detailed planning docs are in a separate repository
5. Update both Claude AI projects to reference the new repository location

### Architecture Visibility

Making the repo public reveals:
- Deployment architecture (Cloudflare Pages, self-hosted staging)
- CMS integration approach (Payload CMS with GraphQL)
- CI/CD patterns (GitHub Actions with Tailscale VPN)

This could be educational for others. It also informs potential attackers about infrastructure, though all critical endpoints are protected by authentication.

---

## Assessment Summary

| Category | Count | Details |
|----------|-------|---------|
| Critical (must fix) | 0 | None found |
| Medium (consider) | 1 | Cloudflare Stream IDs (already public in rendered HTML) |
| Low (optional) | 4 | Infrastructure URLs, demo redirect |
| Properly handled | 6+ | Secrets, local configs, CMS content |

---

## Optional Cleanup Checklist

If extra caution is desired before going public:

- [ ] Remove demo redirect from `_data/redirects.yml` (lines 4-5)
- [ ] Add comment in `_data/staging-config.yml` noting Tailscale URLs require VPN
- [ ] Review `CLAUDE.md` for comfort level with architectural detail exposure
- [ ] Consider if `context-docs/` should remain or be moved to a private location

---

## Conclusion

The repository is ready to be made public. The exposed URLs and identifiers are either already public in the rendered site or protected by authentication (Tailscale VPN, Cloudflare access controls). All sensitive credentials are properly stored in GitHub Secrets or excluded via `.gitignore`.
