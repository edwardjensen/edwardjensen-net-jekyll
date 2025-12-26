---
layout: single-post
title: "The Build II: I'm Not A Developer, But I Just Shipped A Production Application"
date: "2025-12-19T15:00:00.000Z"
categories:
  - tech
tags:
  - the-build
  - ai
  - ai-development
image: "https://assets.edwardjensen.net/media/202512-thebuild.jpeg"
image_alt: "Collage of dozens of open books arranged in a grid pattern showing cream-coloured pages filled with printed text, with the words \"the build\" overlaid in large black serif font with white outline in the lower right portion of the image."
excerpt: You do not need to become a software developer to benefit from understanding how software development works. Here is what an accidental software developer learned—and why it might be useful to you, too.
post_credits:
  - Post graphic based on a photo by [Patrick Tomasso](https://unsplash.com/@impatrickt?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/photos/open-book-lot-Oaqk7qqNh_c?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText)
featured: true
render_with_liquid: true
show_image: true
---

*[Editor's note: This is the [second post in a quartet](https://www.edwardjensen.net/tags/the-build) that explains the process behind building the CMS for this website using AI tools. [You're invited to read part 1 here](/posts/2025/2025-12/the-build-i-cms-meet-ai-and-directed-work). Parts 3 and 4 are coming next week.]*

Over the years, my job titles have varied in scope, usually something along the line of “systems administrator,” “IT manager,” or lately “Director of IT.” While writing scripts for various tasks has invariably been a part of my roles over the years, I’ve never considered myself a software developer. But yet, [**I just shipped a production application](/posts/2025/2025-12/the-build-i-cms-meet-ai-and-directed-work)—the CMS for my website**. This is not a brag, but rather a dissonance worth exploring. The question isn’t “how did I become a developer” (which I didn’t), but rather “what did I learn in this process that might carry over into my day-to-day work?”

There were two big tasks at hand in this project: configuring a CMS to be able to output content in a Jekyll-friendly format, and configuring Jekyll to be receptive to an external CMS. Jekyll is not built that way, and [Payload CMS needed to be restructured to work](https://payloadcms.com/docs/graphql/overview) with the Jekyll site setup I have. Plus, I had to think about the other things to make this deployment work well: a way to trigger site building with webhooks, a backup infrastructure, handling VPN traffic as the CMS lives in my internal network, and how to store media. **These were things I could not delegate to the AI coding assistants to do without having an idea how they should work.**

This was a common pattern throughout this entire project, as well as ongoing building that has occurred since the initial deployment. **I had to define *what* needed to exist and the general patterns thereof, and then the AI systems could implement *how* it will exist in code.** I knew media couldn’t just live on my CMS on my local network server, so I had the AI assistants customize the S3 adapter to work with a content CDN. I knew the site needed to rebuild when a post was due to be published, so I had AI assistants create the systems to trigger republishing of the website through GitHub Actions agents. I knew the configuration documentation needed to remain current so that GitHub Copilot and Claude Code would have the latest information when building out specifics on the CMS, so I had them update their own documentation as features evolved.

Some decisions, however, required more than delegation. Some architectural decisions were straightforward: here’s what I want, now go do it. Sometimes, the decision *not* to implement something was a major decision. When I was writing this very post, the original draft had a table to illustrate a pattern. My instance of Payload CMS doesn’t yet support tables. I could have spent an hour on a brief implementation sprint, but I decided against that. In years of blogging, this would have been the first post with a table in it, and probably this wouldn’t be an issue for another few years. I decided against the implementation of tables, because there were usable workarounds. **Knowing what *not* to implement is just as important as knowing what to implement.**

While, certainly, the project was successful because of the use of AI coding assistants, the project was made successful because I knew what had to be done and could use all of the experience I have leading up to this point to understand specific requirements and make sure that they were included in a way that made sense. Here are a few illustrations.

---

**Item 1: Determining My Risk Tolerance**

I have written scripts and done many configurations over my years in IT. Earlier this year, I started playing with AI-assisted programming. By far, this project has been the most involved project, and the first project that has mission-critical data in it. If the data goes away, my blog fails to exist. It was therefore imperative that I built out a backup system for the database that powers the application.

This application lives on a server in my homelab environment. Because it’s a homelab, I don’t have the enterprise redundancies or budget for thinking about backup or replacement hardware should my server fail. If my server fails, it’ll be some time before it’s replaced! That limitation forced a serious reckoning of my appetite for risk tolerance. If this server fails, what’s Plan B? Even though the server VM is backed up through a proper 3-2-1 backup regimen, it’s still primarily a local path. I determined the best approach was to build out a separate backup system that backs the database up to a cloud provider throughout the day.

With the scope in hand, which satisfied my risk tolerance, I had the AI assistants build out the backup system for the database. I tested the output in many ways, including using the backup to rebuild the CMS on a different virtual machine from scratch. This wasn’t a one-and-done thing; this involved definition of scope, defining my risk tolerance, and determining how to back this up. Now, if something happens to my home server, I can easily spin something up on a public cloud.

---

**Item 2: Getting Pieces To Play Together Nicely**

Jekyll is not set up to pull content from anything but [Markdown files in the site code repository](https://jekyllrb.com/docs/collections/). While that’s great for most use cases, it’s not the most scalable of approaches, and not for where I am envisioning my website going. But Jekyll is very modular and capable of being bent and working in new ways, so getting Jekyll to work with GraphQL was a simple task for the AI coding agents. (For the record, [there is a Jekyll-GraphQL connector](https://github.com/Crunch09/jeql). It had, however, not been updated in some time, so I wasn’t sure what risk I was putting into my code when running that.)

All along, I knew that the CMS application would live on my homelab server. This isn’t the limiting factor it may seem to be, because I have a solid and secure VPN system that enables access from wherever. It even integrates with GitHub Actions, so I can have GitHub Actions temporarily connect to my VPN to perform what it needs to do, and then disconnect.

This also involved a better understanding of how DNS works in this mixed environment. Even in my homelab environment, I serve applications over valid domain names so I can take advantage of Let’s Encrypt SSL certificates. Those certificates don’t work over IP addresses, so I had to make sure that my VPN was passing along DNS server information. But in my VPN environment, I’ve clamped down how GitHub Actions runners can communicate with the rest of my network. Resolving things via DNS domain name was trivial to set up, but configuring my network to allow for DNS name resolution involved setting some connection flags and making it so the GitHub Actions runners could communicate with the DNS servers in my network over the DNS ports, but nothing more.

---

**Item 3: Read-Only or Read-Write?**

This is an example of correcting my own gaps and how I initially got things wrong, but prevailed in the end. When I migrated the CMS from one server to another, I had to set up the database from scratch. The database infrastructure revolves on the principle of least privileges, which means certain users only have access to certain things, and nothing more.

I have a staging version of my CMS application, which is a place I test features before I’m ready to send them into the next production version of the application. Every week, I have an automatic routine to copy the production database to the staging database. For that to work, the staging database user needs to have read-only access to the production database, including to tables that may not yet exist. A database migration failed because the latest version of the production database did not have all of the permissions. The AI never wrote database permissions nor did it err on the side of giving itself too many permissions.

This is something that you only find out after the fact by getting it wrong. After determining what failed, I could implement the fix, have the AI coding agents revise their code and approach, and then all worked. In fact, none of these challenges (including the scores of challenges that I didn’t list here) required me to become a software developer. But they did require me to be the IT practitioner that I already am, but in new territory. The knowledge that made this project work was not new knowledge; it was knowledge applied differently.

---

You’re probably asking “ok, so what?” As a nonprofit IT program director, I’m not doing software development, nor am I interacting with software development teams. This whole experience was not about becoming a software developer. **This was about building and reinforcing the technical judgment that we need to exercise constantly, albeit in a new domain.**

Think about it: We have many different disciplines we have to think about in our day-to-day work and the special projects we undertake. The same mental models I think of in my daily work applied here: risk management, backup, privileges, and making sure disparate infrastructures can play together. Side projects are wonderful and low-stakes ways to stretch into unfamiliar territory. **We grow when we are uncomfortable**, and I am sure that there are takeaways from this project at the end of the year in 2025 I will apply in my work in 2026 and beyond.

**Understanding how software works, even at a surface level such as this, helps when we’re evaluating vendors, troubleshooting integrations, or explaining technical constructs to leadership.** I had to understand how Payload CMS worked (even if on a fundamental level), what was possible, and the general patterns of the latest version of that software. By knowing how the rest of my environment worked, I could be reasonably confident that an implementation would be successful.

I also knew that I had to prioritize what I needed against what would be nice to have. Scope and momentum are important in a project such as this, and knowing what to build vs. what not to build is a key thread throughout this project. That is for Part 3, coming next week.