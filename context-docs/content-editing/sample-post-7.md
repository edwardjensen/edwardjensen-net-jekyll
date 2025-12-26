---
layout: single-post
title: "The Build IV: Staying Sane While Shipping Fast"
date: "2025-12-26T16:00:00.000Z"
categories:
  - tech
tags:
  - ai
  - the-build
  - ai-development
  - friday-five
image: "https://assets.edwardjensen.net/media/202512-thebuild.jpeg"
image_alt: "Collage of dozens of open books arranged in a grid pattern showing cream-coloured pages filled with printed text, with the words \"the build\" overlaid in large black serif font with white outline in the lower right portion of the image."
excerpt: AI tools can dramatically accelerate development, but that acceleration creates new risks. The speed dividend is only valuable if you take it as space, not just as more speed.
post_credits:
  - Post graphic based on a photo by [Patrick Tomasso](https://unsplash.com/@impatrickt?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/photos/open-book-lot-Oaqk7qqNh_c?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText)
render_with_liquid: true
show_image: true
---

*[Editor's note: This is the fourth and final post[ in a quartet](https://www.edwardjensen.net/tags/the-build) that explains the process behind building the CMS for this website using AI tools.]*

There is a seductive promise in AI-assisted development: faster iteration, quicker wins, and consistent visible progress. But there were ways in this development where the speed created its own problems.

Building out the content management system and deploying it was a smooth process. Prior experience with similar deployment patterns meant that I had lessons and previous experience to draw on. The lack of friction I experienced throughout validated this approach: the documentation worked, the patterns held, my theories on AI management were confirmed. On the other hand, this smoothness fed a dopamine loop. When everything works, you keep going—success becomes its own trap.

Throughout this entire essay series, I’ve framed AI-assisted development as a management exercise, full of direction and delegation. I defined what needed to exist and how it should generally look; AI filled in the gaps and implemented the minutiae to make it all work. There was, however, one form of delegation I did not anticipate, which was delegating discipline to… no one. When AI makes every feature cheap to implement, the hardest skill is not directing what to build. It’s directing yourself to stop building!

Here are five lessons I’ve learned about staying sane while shipping fast.

**1. The “One More Feature” Trap.** When implementation takes minutes instead of hours, the friction that usually makes you say “I’ll do that later” disappears. A perfect example: I use Claude AI for content editing and to provide some direction on what to write, even though I do the writing. Mid-way through, I decided I needed an export-to-Markdown feature to make it easy for Claude to review my drafts along the way. It’s not a bad feature, and I use it regularly, but it was the textbook definition of scope creep disguised as productivity. The speed makes every detour feel cheap, but the detours add up. And each feature isn’t just the time spent in that particular implementation, but it’s now maintenance on the codebase I’ll have to do now and into the future.

**2. Take The Space, Not Just The Speed.** 

I heard a framing recently [on a podcast](https://www.youtube.com/watch?v=NpA2PJuA0Hs) that transformed how I think about AI tools in general: they offer a dividend, and you choose how to spend it.

Do you spend those hours on more tasks, chasing a productivity high? Or do you spend those hours on space for work that actually requires your judgment: strategic thinking, relationship-building, creative decisions that AI cannot make? The former leads to burnout; the latter leads to sustainable, high-quality impact work.

On this project, I didn't always choose wisely. The speed dividend is real, but only sustainable if you take it as space, not just speed.

**3. Your Body Does Not Care About Your Momentum.** That “one more thing” dopamine loop sometimes led to consecutive hours at the computer without breaks. That hyperfocus feels productive—I’m maximizing my personal time working on this important personal project!—but then you stand up and feel wrecked. AI tools enable longer uninterrupted stretches because you’re never truly stuck. Something can always be tried; Copilot can suggest a different approach. That’s a feature and a bug.

But the physical toll was real: eye strain, general discomfort from sitting too long, not drinking enough water. These aren’t abstract risks; these actually happened, and I feel I’m still paying a price for them a few weeks on. The productivity gains mean nothing if you hurt yourself doing them. Especially when this was a purely personal project with no deadline and no consequences if it was “late,” I treated it as though I was on a too-soon deadline.

Pomodoro sprints (25 minutes of focused work followed by a break) would have enforced the breaks I did not take naturally. Working in long shifts instead of short sprints was a choice, but not a good one.

**4. The Dopamine Loop Is Real.** Quick wins always feel good! AI-assisted development is a stream of quick wins, and the neurological reward pattern is genuinely addictive. New feature works? Dopamine. Get a bug fixed? Dopamine. New capability added? Dopamine. Get apps to communicate with each other? Dopamine. The smoothness paradox compounds this: when the project is going well, every success validates continuing and moving forward. This isn’t procrastination, this is productivity! But what is productivity without boundaries? It’s just compulsion.

Recognizing this pattern doesn’t make you immune to it. But it helps notice when you are chasing the next hit of dopamine rather than making deliberate choices on what to build. The question to ask becomes, “Am I adding this feature because it serves the project, or because implementing it will feel good?”

**5. Knowing When To Stop.** This operates on multiple scales, and the discipline is the same for each.

I had a nightly 11:00pm cutoff when working on this. This was a hard stop with no exceptions, because if I’m not sleeping by midnight, I’m a wreck the next day. Plus, a flimsy “oh, I’ll just finish this one thing” turns into debugging into the wee hours of the next morning. I’m not going to trade tomorrow’s energy on the things that matter to complete something tonight. This work will still be there in the morning. You will be sharper for having slept.

For feature development, sometimes the right answer is to abandon something entirely. In the last post, [I mentioned the category/tag auto-suggest feature I couldn’t get working](/posts/2025/2025-12/the-build-iii). After an hour of attempts, I made the judgment call to stop—not defer (oh, I’ll try again later), but abandon. The frustration signals matter here: if Copilot isn’t getting the patterns right after multiple attempts and you feel yourself getting frustrated, that’s the signal to stop and walk away. Frustration is not a good state for problem-solving.

And on the project itself, this is the hardest thing. When I wrote the first post in this series, my self-updating documentation file was at 837 lines of Markdown. It is now over 1,000. The project keeps pulling me back. The documentation grows because the work continues. But there has to be a point where “done enough” has to be “done.” The CMS works. It does what I need. What’s left is wants, not needs. Being my own client means no external deadlines, which sounds like freedom until you realize there is no deliverables document telling you when to stop!

***Finally…***

The productivity gains from AI-assisted development are real…but so are the risks to sustainable work. The goal is not to reject the tools altogether, but to use them in ways that leave you able to keep using them, and to focus on the high-quality work that you need to focus on. Throughout this series, I’ve talked about directing AI systems as though I was their manager and the AI was a direct report—giving AI clear instructions, recognizing when it was heading in the wrong way, and intervening when needed.

The lesson I did not expect was that the hardest thing to direct is not the AI, but me.

Speed without sustainability is just a faster path to burnout.

Take the space.