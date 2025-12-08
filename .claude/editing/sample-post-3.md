---
title: "Seriously Unserious: Bad AI In A Site"
date: 2025-07-26
categories:
  - tech
tags:
  - ai
  - vibe-coding
  - projects
  - bad-ai-in-a-site
image: /assets/images/posts/202507-seriouslyunserious.jpeg
image_alt: "Cartoon illustration of a distressed robot head with an X over one eye and a wavy mouth on a light blue background, with black text below reading 'seriously unserious'."
redirect_from: /badaiinasite
excerpt: Sometimes the best way to learn new deployment patterns is to build something completely ridiculous
show_image: true
render_with_liquid: true
post_credits:
---
Sometimes the most educational projects are the ones with absolutely no real-world purpose. Enter *Bad AI In A Site*, which is my web adaptation of the delightfully absurd ["Bad AI In A Box" (BAIIAB) project](https://github.com/lastcoolnameleft/baiiab/) that deliberately provides terrible advice through a chatbot interface.

The original BAIIAB was a physical device that printed hilariously bad AI responses on thermal paper. Since I don't have access to a spare Raspberry Pi, thermal printer, or soldering equipment to wire everything up, my version brings this concept to the web with a mobile-first interface that serves up intentionally unhelpful advice across categories like "Fake Facts," "Terrible Cocktail Recipes," and "Conspiracy Theories." You can find the complete project on [GitHub](https://github.com/edwardjensen/badaiinasite).

I know there's strong division in the world about "vibe coding", the practice of telling an AI system what you want to do and it spits out the code for you. I find I've been doing a bit of that lately, because it helps me deliver quick things for limited purposes. This seems like a perfect example - a couple hours on a weekend morning and we have something delightfully silly.

But this project is serious in its unseriousness: we have proper CI, deployment, and testing pipelines. On a push to the GitHub repo, GitHub Actions builds a Docker container and pushes it to a computer in my home over [Tailscale](https://tailscale.com/kb/1276/tailscale-github-action). I can access the site over the local network, and it works quite well. I've abstracted out the [menu](https://github.com/edwardjensen/BadAIInASite/blob/main/menu.json) so that I can make changes to that while not doing full version releases or dot releases.

I'm also working with doing local LLM development. On my home Mac Studio, I have [LM Studio](https://lmstudio.ai/) running, and the app communicates over the local network to the [LM Studio API](https://lmstudio.ai/docs/app/api) to run the inference when asked. There's a fallback to use one or two of the free models on [OpenRouter](https://openrouter.ai/) as well.

Does this app have any real-world purpose? Outside of bringing joy and humor...no. But I've built up something that can test local AI models, have a proper CI and deployment pipeline, and push from cloud to on-premises application servers. Those are all things that will have very serious applications in the future.
