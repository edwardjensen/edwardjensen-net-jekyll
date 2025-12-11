---
title: Meet Me in the AI Middle
date: 2025-11-14
categories:
  - essays
tags:
  - ai
  - ai-observations
image: /assets/images/posts/202511-meet-me-in-the-middle.jpeg
image_alt: Handwritten text on a whiteboard or light grey surface reading \"AI?\".
redirect_from:
excerpt: There is no shortage of opinions about AI, and those opinions meet operational realities in mission-driven nonprofit work. But where do aspirations, fears, and realities meet?
show_image: true
render_with_liquid: true
post_credits:
  - Post photo derived from a photo by [Nahrizul Kadri](https://unsplash.com/@nahrizuladib?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/photos/a-sign-with-a-question-mark-and-a-question-mark-drawn-on-it-OAsF0QMRWlA?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText)
  - Scott Hanselman's [opening keynote](https://www.youtube.com/watch?v=kYUicaho5k8) to the NDC London 2025 conference
landing_featured: true
---
As an IT Director for a reasonably sized nonprofit organization, I get asked a lot about my observations on AI and how my organization is using it. Especially in the mission-driven nonprofit world, there’s an interest to find something that can be a force- and mission-multiplier in these times, but there’s the question about if it’s the right thing to do. In the many conversations I’ve had with nonprofit IT peers and other nonprofit staff, it is a topic that causes angst within organizations.

*Before I go on, obviously, the thoughts and opinions in this essay are mine and not those of my employer or anyone with whom I or they are affiliated. (I know there’s the disclaimer text on the site, and it's implied, but it bears repeating.)* 

The use of AI is one of those things for which it seems there’s no middle ground. There are those who are all in and believe that this will be the next best thing—be a part of it or be left behind as the economy moves forward—or those who want nothing to do with it because of negative externalities or because certain groups of people have gone all in on it. 

Like every technical evolution, there has been concern and backlash, but life goes on. This is the [Luddite fallacy](https://www.economicshelp.org/blog/6717/economics/the-luddite-fallacy/) in action: the belief that technological advancement inevitably leads to permanent job loss and increased unemployment, rather than recognizing that labor markets have adapted by creating new types of work. Historically, we have not seen major disruptions in labor markets with persistent high unemployment after a new potentially disruptive technology has been introduced.

Philosophically, I’m in neither camp. AI’s not going to be the revolutionary savior that its proponents claim that it’s going to be, nor is it going to be this apocalyptic threat that its detractors fear. Remember that at its core, [AI systems use various tools and algorithms to predict statistically probable responses](/posts/2025/2025-06/ai-confidence-probabilities) based on what it's seen in its training data. While this is the fundamental technology of AI systems, what separates different AI providers and systems is how they process that output and perhaps act upon it.

Like most things, the success of AI will lie in the middle, and these are areas that I have found great success with these tools. AI exceeds at specific well-defined tasks with specific outputs. It doesn’t have critical thinking skills, nor does it have the creativity to accomplish ambiguous and complex work. In that sense, if you think of AI as an enthusiastic intern, that will help level set your expectations for the work to give it and the quality of the results you should receive. It can't read minds, which is why precision in your inputs is vitally important.

I look at the tool in the context of getting quick wins. Through trial-and-error, iteration, dialogue, and clearly explaining what I want (and understanding when I haven't been as precise as I should have been), I have achieved some quick wins over the past couple of years that I have been using AI tools.

The two biggest areas where I have used AI tools are content editing and code generation. If I'm wondering if a personal email I'm about to send is logically consistent or a social media post makes sense for the audience I'm wanting, I'll throw it through Claude to get its take. It's not come up with the email or the social media post, but it's helping me to get it more polished. Often times, my interactions with Claude are, "I've written X, but it seems like it's missing Y. How can I combine these ideas together?" This works because I have given clear inputs and defined a process for how to work.

Another quick win is having AI write image alt text tags, whether it's for social media or for images I use on this site. [Inspired by Simon Willison](https://simonwillison.net/2025/Mar/2/accessibility-and-gen-ai/), I have Claude create alt text and return it to me in a specific format. Clear inputs, defined process, good outcomes.

If you've been paying attention to my website lately, you'll have noticed it's received a [number of major changes](/posts/2025/2025-10/site-meta-more-new-features). I had the original idea, and sent GitHub Copilot on its way with what I wanted to accomplish. With each feature in its own GitHub branch (just in case things went awry...*which they sometimes did!*), I was able to implement some features to this site that had eluded me on how I would implement them. My goal with this website is to get back into a regular writing cadence, not bother with the drama of website maintenance or development!

In all of these examples, I'm not turning over the keys for content creation or creativity to the AI system. Nor do I ever intend to do that: writing, whether email or code, is fun! Plus, I have tried that. The result was inauthentic and often missed the nuance that I wanted to share. As the disclaimers on all of the AI systems say, "AI can make mistakes. Check our work!", it's not just to release them from liability. Just as you're not going to accept without reviewing the work of that intern, it would be foolish to accept what AI's generated without doing a review of its work.

We've also started to dip our toes into the AI world where I work. To create summaries for mission impact reporting, we're using AI tools to distill thousands of natural language records in our CRM of client interactions. We're building out some tools to use AI-enabled document recognition in our processes with Microsoft Power Platform tools. These aren't earth-shattering tasks that are going to bring the tech press to north Minneapolis, but these are tasks that we're sending out to AI to do because we know it can do these things.

Also, this is an iterative process filled with trial and error. The good news is that with AI, you get an almost immediate result to see if you had given the AI system the right marching orders or not. This is going to assume that you have a preconceived notion what the outcome or output should be. If you send an AI system to do X, but it becomes evident that it's returning Y, then it's important to revisit your original prompt to see why Y was returned instead of X. Like most things technology and data, AI follows the *garbage in, garbage out* model.

Finally, one of the things that excites me is the ability to run AI models locally, without needing to use global platforms like Microsoft Copilot, ChatGPT, or Claude. The fact that I can run a reasonably sized LLM on my iPhone and have it work is impressive. I'm expecting that we will see a focus of putting local AI models on local hardware. 

Remember that CRM AI summary project I mentioned earlier? That inference ran on an entry-level Mac Studio, not a major global AI tool. It helped because we didn't have to think about third-party data providers retaining possibly confidential data, because we were running this all in house on our own network.

So where does this leave us? By thinking of AI as a tool in the toolbox, not as hype or doom, it leaves us in a pretty good spot. Personal and organizational improvements using AI tools aren't often going to be grand pronouncements or controversial decisions. Our improvements are going to be incremental and iterative.

Especially in the nonprofit world, where we have to balance mission ambitions with financial and operational realities, we have to think about a middle road when contemplating how to engage with AI. The middle ground isn't a position of weakness or indecision: It's a thoughtful place where we can find what works to make incremental--and sustainable--change. It's a place where we can see the hype machine and the doomsayers, but recognize that reality is more nuanced and complex than binary extremes.

The organizations that will thrive will be curious but critical, enthusiastic but cautious, but always focused on mission outcomes rather than the technology trends of the day. The only right way to do this, whether it's AI or whatever technology we're talking about in the future, is to do it in a way that's true to yourself and your mission.

That's how sustainable change happens.

*Epilogue: If you're looking for another good middle-of-the-road take on AI, I highly recommend this opening keynote by Scott Hanselman. It's an hour well spent.*

https://www.youtube.com/watch?v=kYUicaho5k8
