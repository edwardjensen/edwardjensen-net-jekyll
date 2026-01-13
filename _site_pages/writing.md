---
title: Writing
subtitle: Essays, thoughts, and observations
layout: page
permalink: /writing/
header_icon: pen
header_gradient: bg-brand-orange
searchable: false
prose: false
---

{% assign unique_posts = site.posts | uniq: 'title' | sort: 'date' | reverse %}
{% include sections/item-list.html items=unique_posts group_by_year=true show_archive_link=true italic_ejnet=true %}
