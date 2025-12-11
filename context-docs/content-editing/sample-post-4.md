---
title: "Site meta: More New Features"
date: 2025-10-22
categories:
  - dispatches
tags:
  - edwardjensen-net
  - site-meta
image: "/assets/images/posts/202502-importingoldposts.jpeg"
image_alt: Terminal screenshot showing npm package installation output with version 8.2.1 and dependency tree displaying various rollup plugins including rollup-plugin-commonjs, rollup-plugin-node-resolve, rollup-plugin-livereload, rollup-plugin-svelte, and svelte packages with their version numbers displayed in yellow and purple text on a dark background
redirect_from:
excerpt: Some new ideas and new features emerge on the site, just in time for the fall
show_image: true
render_with_liquid: true
post_credits:
---
I know there are strong feelings about using AI tools. But I have enjoyed using them to quickly set up new features on this site! Each new idea/feature I've spun out on this site has taken about 30-45 minutes in GitHub Copilot in Visual Studio Code to iterate back and forth until we have something that's workable. I guess this is what they call "vibe coding," and I have to say that it can be useful. And addicting! I've found that if you give Copilot clear and concise instructions, it is generally pretty good. I also consider the code in this site pretty low risk, since it's a static website. The bigger concerns [I have are with npm dependencies](https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem)!

The big visual element is that we have a new layout. Instead of an awkward main column and sidebar layout, everything is now in a single column. I've added a hero section that I can change out based on the top-level `Index.md` Markdown file. This was also made possible by rearranging the layout templates and components so they are more logical. That means I have predictable templates I can use throughout the site.

The other new feature on the site is a [search feature](/search)! "But wait," I hear you ask. "This is a static site. How does that work?" When you go to the search page, you download a 59 KB `search-index.json` file that is queried by [Lunr, a lightweight JavaScript search framework](https://lunrjs.com/). The `search-index.json` file regenerates each time new content is added to the site, and I can force items not to be included in there by putting a `searchable: false` tag in the YAML front matter for a page or post.

You'll notice that the photography on the home page now shows a lightbox gallery of the photos, rather than taking you to micro.edwardjensen.net to see the photos there. Good news: the alt text I put in there still shows up. I'm working on a way to script bringing the photos to the site so everything lives here, but that's a work in progress. I like the [Micro.blog service](https://micro.blog/) because there's an [iPhone app for it](https://apps.apple.com/us/app/sunlit/id1334727769) that works with my iPhone photography workflow, and also because it pushes to [Bluesky](https://bsky.app/profile/edwardjensen.net) after I post. Post once, share everywhere?

Two more other highlights: I've also put some code in where I can put a YouTube video URL in the body of a post or page, and the video will be embedded into the body. The top navbar now supports nested items, which I think will be good for long-term organization of the site. It's powered by a YAML file that Jekyll reads when it generates the site.

I know that Jekyll is not the most modern SSG and that there are other SSG frameworks that can handle these tasks natively without the faff of coding in workarounds. But I like Jekyll because it is simple. It works, and it's very modular and templateable. Because I know where things are, I can make the additions to the code that I need to make. Plus, it costs me pennies a month to maintain on Cloudflare Pages, rather than the $150 and more a year [to maintain a WordPress site](/posts/2025/2025-02/something-old-something-new).
