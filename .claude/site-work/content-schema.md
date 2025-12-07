# Content Schema for edwardjensen.net

This document outlines the different content types that power the site, including their YAML front matter structure and how each is used throughout the site. It consolidates metadata documentation for all content collections: Posts, Working Notes, Photography, Portfolio, and Pages.

## Overview of Content Types

The site uses Jekyll's collections feature to organize five distinct content types:

| Type | Directory | URL Pattern | Use Case |
|------|-----------|-----------|----------|
| **Posts** | `_posts/` | `/year/month/title` | Full essays, articles, and longer-form writing |
| **Working Notes** | `_working_notes/` | `/notes/yyyy-mm-dd/title` | Short-form updates, micro-thoughts, less polished ideas |
| **Photography** | `_photography/` | `/photos/year/month/title` | Photo essays and image galleries with captions |
| **Portfolio** | `_portfolio/` | `/portfolio/title` | Showcase of projects, presentations, and publications |
| **Pages** | `_pages/` | Custom (varies) | Static content like About, Biography, Writing archive |

---

## 1. Posts (`_posts/`)

**Purpose**: Full-length essays, articles, and thought pieces. These are the primary content type and appear in the main blog feed, homepage featured section, and RSS feeds.

**Default Layout**: `single-post`

### Output & Permalink

- **Permalink**: `/:collection/:year/:year-:month/:title` → `/posts/2020/2020-04/friday-five-improving-video-calls`
- **Output**: Published as individual pages

### YAML Front Matter Structure

```yaml
---
title: "The Friday Five: Improving Your Video Calls"
date: 2020-04-24
categories:
  - friday-five
tags:
  - friday-five
  - video-calls
image: /assets/images/posts/202310_QRCodePhishingHeader.jpg
image_alt: "Photo showing security concept"
show_image: true
excerpt: "As video calls have taken a bigger spot in our lives, here are some cheap and easy ways to up your video call game."
description: "Practical tips for improving video call quality"
landing_featured: true
featured: true
render_with_liquid: true
post_credits:
  - "Post image based on a photo by [Author Name](https://example.com)"
redirect_from: 
  - /friday-five/improving-your-video-calls/6109/
---
```

### Core Required Fields

**`title`**
- **Type**: String
- **Required**: Yes
- **Description**: The post title displayed in the browser, listings, and feeds
- **Example**: `"The Friday Five: Improving Your Video Calls"`

**`date`**
- **Type**: String (ISO date format)
- **Required**: Yes
- **Description**: Publication date in YYYY-MM-DD format (both quoted strings and unquoted formats are used)
- **Examples**: `date: "2023-12-22"` or `date: 2025-03-07`

**`categories`**
- **Type**: Array or String
- **Required**: Typically yes
- **Description**: Primary categorization for the post
- **Common Values**: `dispatches`, `essays`, `tech`, `friday-five`
- **Examples**:
  ```yaml
  categories: [dispatches]
  categories:
    - essays
  categories: [dispatches]
  ```

### Optional Metadata Fields

**`tags`**
- **Type**: Array
- **Required**: Optional
- **Description**: Specific topic tags for the post
- **Examples**:
  ```yaml
  tags: [site-meta]
  tags:
    - blogging
    - the-internet
  ```

**`image`**
- **Type**: String (path)
- **Required**: Optional but common
- **Description**: Path to the post's featured image (relative to site root)
- **Path Patterns**: `/assets/images/posts/[filename]` or `/images/[filename]`
- **Examples**:
  ```yaml
  image: /assets/images/posts/202503-uncertainty.jpeg
  image: /images/202511-testing-20251109T044223-0d3166a6.jpeg
  ```

**`image_alt`**
- **Type**: String
- **Required**: Required when `image` is present
- **Description**: Alt text for the featured image (accessibility)
- **Example**:
  ```yaml
  image_alt: "Moody atmospheric image of a foggy forest road disappearing into mist"
  ```

**`show_image`**
- **Type**: Boolean
- **Required**: Optional
- **Description**: Controls whether the featured image is displayed on the post page
- **Default**: `true`
- **Example**: `show_image: true`

**`excerpt`**
- **Type**: String
- **Required**: Optional
- **Description**: Short summary text displayed in post listings and previews. Also used as a meta description for SEO purposes
- **Example**: `"Confused by uncertainty? Focus on what you can control with five strategies for professional resilience."`

**`landing_featured`**
- **Type**: Boolean
- **Required**: Optional
- **Description**: Whether the post appears as a post on the `/hi` landing page
- **Default**: `false`
- **Example**: `landing_featured: true`

**`render_with_liquid`**
- **Type**: Boolean
- **Required**: Optional
- **Description**: Controls whether Jekyll Liquid templating is processed in the post content
- **Default**: `true`
- **Example**: `render_with_liquid: false`

**`post_credits`**
- **Type**: String or Array
- **Required**: Optional
- **Description**: Credits for images, sources, or other attributions
- **Examples**:
  ```yaml
  post_credits: "<p>Post image derived by a photo by <a href=\"...\">Ryan Zazueta</a></p>"
  
  post_credits:
    - "Post image based on a photo by [Katie Moum](https://unsplash.com/@katiemoum)"
    - "[Prepared remarks of Sen. Elissa Slotkin](https://apnews.com/article/...)"
  ```

**`content_type`**
- **Type**: String
- **Required**: Optional
- **Description**: Specifies the type of content (seen in newer posts)
- **Example**: `content_type: essay`

**`has_youtube_video`**
- **Type**: Boolean
- **Required**: Optional
- **Description**: Indicates the post contains embedded YouTube video content
- **Default**: `false`
- **Example**: `has_youtube_video: true`

**`redirect_from`**
- **Type**: String or Array
- **Required**: Optional
- **Description**: Old URLs that should redirect to this post (for legacy content migration)
- **Examples**:
  ```yaml
  redirect_from: 
    - /dispatches/happy-new-year-2024/6784/
  
  redirect_from:
    - /tech/a-blogging-renaissance/6589/
  ```

### Field Usage Patterns

#### Minimal Post Example

```yaml
---
title: Happy New Year 2025
date: 2025-01-01
categories:
  - dispatches
tags:
  - happy-new-year-2025
image: /assets/images/posts/202501-happynewyear2025.jpg
image_alt: "Snowy winter scene with green cacti"
description: "With warm wishes and high hopes for the New Year 2025"
---
```

#### Full-Featured Post Example

```yaml
---
title: "Friday Five: Thriving Amid Uncertainty"
date: 2025-03-07
categories:
  - friday-five
tags:
  - together-it
  - professional-resilience
  - uncertainty
image: /assets/images/posts/202503-uncertainty.jpeg
image_alt: "Moody atmospheric image of a foggy forest road"
excerpt: "Confused by uncertainty? Focus on what you can control with five strategies."
show_image: true
render_with_liquid: false
landing_featured: true
post_credits:
  - "Post image based on a photo by [Katie Moum](https://unsplash.com/@katiemoum)"
redirect_from: 
  - /dispatches/thriving-amid-uncertainty/
---
```

### Usage Notes

- Posts are paginated 20 per page on the archive and feed pages
- Included in main RSS (`/feed.xml`) and JSON (`/feed.json`) feeds
- Can specify multiple `redirect_from` entries for legacy URL compatibility
- The `featured` flag surfaces important posts on the homepage

---

## 2. Working Notes (`_working_notes/`)

**Purpose**: Short-form updates, micro-thoughts, and work-in-progress ideas that don't warrant a full blog post. Positioned as a hybrid between social media and formal blog posts.

**Default Layout**: `single-working-note`

### Output & Permalink

- **Permalink**: `/notes/:year-:month-:day/:title` → `/notes/2025-10-23/welcome-to-working-notes`
- **Output**: Published as individual pages

### YAML Front Matter Structure

```yaml
---
title: Welcome to Working Notes
date: 2025-10-23
tags:
  - site-meta
---
```

### Core Required Fields

**`title`**
- **Type**: String
- **Required**: Yes
- **Description**: Title of the working note
- **Capitalization**: Sentence case or title case
- **Examples**:
  ```yaml
  title: Welcome to Working Notes
  title: Hole punching in metal
  title: On the World Series
  ```

**`date`**
- **Type**: String (ISO date format)
- **Required**: Yes
- **Description**: Publication date of the note
- **Format**: YYYY-MM-DD
- **Examples**:
  ```yaml
  date: 2025-10-23
  date: 2025-10-24
  date: 2025-11-02
  ```

### Optional Fields

**`tags`**
- **Type**: Array
- **Required**: No
- **Description**: Topic tags for categorizing the note
- **Examples**:
  ```yaml
  tags:
    - site-meta
  
  tags:
    - other-duties-as-assigned
  
  tags:
    - world-series
    - baseball
  ```

### Content Format

Working notes include brief content in the body after the YAML front matter. Content is typically:

- One to several paragraphs
- Conversational tone
- May include lists, links, or brief instructions
- More casual than formal blog posts

#### Minimal Entry

```yaml
---
title: Welcome to Working Notes
date: 2025-10-23
tags:
  - site-meta
---

Welcome to the working notes feature on the site! This is a place where I'll share updates that aren't full blog posts in their own right.
```

#### How-to/Tips

```yaml
---
title: Hole punching in metal
date: 2025-10-24
tags:
  - other-duties-as-assigned
---

In the "and other duties as assigned" bit of my job, I had to punch a two-inch hole in a steel cabinet. Here are things I've learned:

* Go slow. Slow and steady wins the race.
* Make sure you have a hole saw that can cut through steel.
* When you're finished, protect the cut edges with electrical tape.
```

### Comparison to Posts

**Similarities**:
- Both use `title`, `date`, `tags`
- Both support Markdown content
- Both are timestamped and archived

**Differences**:

| Feature | Posts | Working Notes |
|---------|-------|---------------|
| Length | Full articles (500-2000+ words) | Brief updates (100-300 words) |
| Structure | Formal with sections | Casual, free-form |
| Images | Featured image required | No images (typically) |
| Categories | Yes | No (tags only) |
| Metadata | Extensive (excerpt, credits, etc.) | Minimal (title, date, tags) |
| Tone | Professional/formal | Conversational/casual |
| Feeds | Main RSS/JSON feeds | Separate feeds |

### Usage Notes

- Simpler than posts—focus on date and topic rather than elaborate metadata
- Have dedicated RSS (`/feed-notes.xml`) and JSON (`/feed-notes.json`) feeds separate from main blog
- Not included in the main blog RSS feed; users can subscribe to notes separately
- Layout typically shows minimal formatting—no featured image, no excerpt field
- Permalink includes full date (`yyyy-mm-dd`) for precise chronological reference

---

## 3. Photography (`_photography/`)

**Purpose**: Photo essays, image galleries, and visual storytelling with written context. Photography serves as a distinct content collection with its own feed and archive.

**Status**: Work in Progress

**Default Layout**: None specified (default Jekyll behavior)

### Output & Permalink

- **Permalink**: `/photos/:year/:year-:month/:title` → `/photos/2024/2024-11/first-snow-saint-paul-2024-25`
- **Output**: Published as individual pages

### YAML Front Matter Structure

```yaml
---
title: "first snow saint paul 2024-25"
date: "2024-11-23"
tags: 
  - "downtown-saint-paul"
image: /assets/photography/20241120-IMG_7685.jpg
image_alt: "Dramatic cityscape at sunset with swirling mammatus clouds"
redirect_from:
  - /photography/first-snow-saint-paul-2024-25/6908/
---

The first appreciable snowfall of the 2024-25 winter falls over downtown Saint Paul, taken from Capitol Hill.
```

### Core Required Fields

**`title`**
- **Type**: String
- **Required**: Yes
- **Description**: Title of the photograph or photo subject
- **Capitalization**: Varies (some all lowercase, some title case)
- **Examples**:
  ```yaml
  title: Lufthansa at MSP
  title: "first snow saint paul 2024-25"
  title: "light rail (not yet at the speed of light)"
  title: through the opening
  ```

**`date`**
- **Type**: String (ISO date/datetime format)
- **Required**: Yes
- **Description**: Date the photo was taken or published
- **Format**: Can include timestamp with timezone
- **Examples**:
  ```yaml
  date: "2025-02-03T03:00:00-06:00"
  date: "2024-11-23"
  date: "2022-01-19"
  date: 2020-07-11
  ```

**`image`**
- **Type**: String (path)
- **Required**: Yes (essential for photography collection)
- **Description**: Path to the photograph file
- **Path Pattern**: `/assets/photography/[filename]`
- **Examples**:
  ```yaml
  image: /assets/photography/202502-LHA340MSP.jpg
  image: /assets/photography/20241120-IMG_7685.jpg
  image: /assets/photography/20220118-lightrailbridge-i17.jpg
  image: /assets/photography/202007-opening.jpg
  ```

### Optional Fields

**`image_alt`**
- **Type**: String
- **Required**: No (but recommended for accessibility)
- **Description**: Alt text describing the photograph
- **Example**:
  ```yaml
  image_alt: "Dramatic cityscape at sunset with swirling mammatus clouds in a golden sky. Urban buildings including a Banner Health facility are silhouetted"
  ```

**`tags`**
- **Type**: Array
- **Required**: No
- **Description**: Topic tags for categorizing the photograph
- **Examples**:
  ```yaml
  tags:
    - Lufthansa
    - A340
  
  tags:
    - "downtown-saint-paul"
  
  tags:
    - weather
  ```

**`redirect_from`**
- **Type**: String or Array
- **Required**: No
- **Description**: Legacy URLs that should redirect to this photo entry
- **Examples**:
  ```yaml
  redirect_from:
    - /photography/first-snow-saint-paul-2024-25/6908/
  
  redirect_from: /photography/through-the-opening/6210/
  ```

### File Naming Patterns

Photography images follow consistent naming patterns:

**Date-based with description**:
```
202502-LHA340MSP.jpg
202007-opening.jpg
```

**Date-timestamp from camera**:
```
20241120-IMG_7685.jpg
20220118-lightrailbridge-i17.jpg
```

### Content Format

Photography entries include a brief caption or description in the body content after the YAML front matter:

```markdown
---
title: Lufthansa at MSP
date: "2025-02-03T03:00:00-06:00"
tags:
  - Lufthansa
  - A340
image: /assets/photography/202502-LHA340MSP.jpg
---
From a cold day in January 2025, a Lufthansa A340 waits for takeoff at MSP
```

**Caption Characteristics**:
- Single sentence or short paragraph
- Describes context, location, or story behind the photo
- Written in present or past tense
- Often includes date/location context

### Field Usage Patterns

#### Minimal Entry

```yaml
---
title: through the opening
date: 2020-07-11
tags:
  - weather
image: /assets/photography/202007-opening.jpg
---
A glimpse of clouds–and rain–so near yet far away _(Midtown Phoenix weather photography, 11 July 2020)_
```

#### Full Entry with Alt Text

```yaml
---
title: through the opening
date: 2020-07-11
tags:
  - weather
image: /assets/photography/202007-opening.jpg
image_alt: "Dramatic cityscape at sunset with swirling mammatus clouds"
redirect_from: /photography/through-the-opening/6210/
---
A glimpse of clouds–and rain–so near yet far away
```

#### Entry with Timestamp

```yaml
---
title: Lufthansa at MSP
date: "2025-02-03T03:00:00-06:00"
tags:
  - Lufthansa
  - A340
image: /assets/photography/202502-LHA340MSP.jpg
---
From a cold day in January 2025, a Lufthansa A340 waits for takeoff at MSP
```

### Comparison to Posts

**Similarities**:
- Both use `title`, `date`, `image`, `tags`
- Both support `redirect_from`
- Both can have `image_alt`

**Differences**:
- Photography entries are simpler (fewer metadata fields)
- No `categories` field (uses `tags` only)
- No `excerpt`, `show_image`, `post_credits` fields
- Shorter content (caption vs. full article)
- Different image path (`/assets/photography/` vs. `/assets/images/posts/`)

### Usage Notes

- Photography collection has its own URL structure under `/photos/`
- Can include legacy redirects from old photo gallery numbering systems
- Body content is often a caption or essay accompanying the primary image
- Images are typically high-resolution photos and stored in `/assets/photography/`
- Can appear in homepage recent photos section
- Tags often emphasize location (e.g., `downtown-saint-paul`, `flagstaff`) rather than categories

### Work in Progress Notes

As this collection is currently being developed:

1. **Alt Text Coverage**: Not all entries have `image_alt` - consider adding during migration
2. **Consistency**: Title capitalization varies - may want to standardize
3. **Tag Taxonomy**: Tags are free-form - may want to create controlled vocabulary
4. **Display Format**: Final presentation format still being refined

---

## 4. Portfolio (`_portfolio/`)

**Purpose**: Showcase of portfolio items, projects, and notable work including presentations, publications, and collaborative projects.

**Status**: Work in Progress

**Default Layout**: None specified (typically handled by `portfolio` page layout)

### Output & Permalink

- **Permalink**: `/portfolio/:title` → `/portfolio/a-brief-history-of-midtown-phoenix`
- **Output**: Published as individual pages (collections)

### YAML Front Matter Structure

```yaml
---
title: A Brief History of Midtown Phoenix
date: 2019-04-29
image: /assets/images/pages/20190429-midtownphx.png
redirect_from:
  - /portfolio/a-brief-history-of-midtown-phoenix/
---

This was an hour-long lecture that outlined the history of Midtown Phoenix and explored some of the wider contexts for Phoenix's post-World War II urban development. _A Brief History of Midtown Phoenix_ was originally delivered on 29 April 2019.
```

### Core Required Fields

**`title`**
- **Type**: String
- **Required**: Yes
- **Description**: Title of the portfolio item/project
- **Examples**:
  ```yaml
  title: A Brief History of Midtown Phoenix
  title: The Arizona State Fair
  title: Phoenix's Greater Encanto-Palmcroft Neighborhood
  ```

**`date`**
- **Type**: String (ISO date format)
- **Required**: Yes
- **Description**: Date of the project/publication/event
- **Format**: YYYY-MM-DD
- **Examples**:
  ```yaml
  date: 2019-04-29
  ```

**`image`**
- **Type**: String (path)
- **Required**: Yes (for visual portfolio items)
- **Description**: Featured image representing the portfolio item
- **Path Pattern**: `/assets/images/pages/[filename]`
- **Examples**:
  ```yaml
  image: /assets/images/pages/20190429-midtownphx.png
  image: /assets/images/pages/AZStateFairBookCover.jpg
  image: /assets/images/pages/EncantoPalmcroftCover.jpg
  ```

### Optional Fields

**`redirect_from`**
- **Type**: String or Array
- **Required**: No
- **Description**: Legacy URLs that should redirect to this portfolio item
- **Examples**:
  ```yaml
  redirect_from:
    - /portfolio/a-brief-history-of-midtown-phoenix/
  
  redirect_from:
    - /portfolio/the-arizona-state-fair/
  ```

### Content Format

Portfolio entries include a brief description in the body content after the YAML front matter:

```markdown
---
title: A Brief History of Midtown Phoenix
date: 2019-04-29
image: /assets/images/pages/20190429-midtownphx.png
redirect_from:
  - /portfolio/a-brief-history-of-midtown-phoenix/
---

This was an hour-long lecture that outlined the history of Midtown Phoenix...
```

**Description Characteristics**:
- One to three paragraphs
- Describes the project, role, or contribution
- May include context about collaborators or outcomes
- Written in past tense
- Often includes project date in description

### Field Usage Patterns

#### Presentation/Lecture Entry

```yaml
---
title: A Brief History of Midtown Phoenix
date: 2019-04-29
image: /assets/images/pages/20190429-midtownphx.png
redirect_from:
  - /portfolio/a-brief-history-of-midtown-phoenix/
---

This was an hour-long lecture that outlined the history of Midtown Phoenix and explored some of the wider contexts for Phoenix's post-World War II urban development. _A Brief History of Midtown Phoenix_ was originally delivered on 29 April 2019.
```

#### Book/Publication Entry

```yaml
---
title: The Arizona State Fair
date: 2019-04-29
image: /assets/images/pages/AZStateFairBookCover.jpg
redirect_from:
  - /portfolio/the-arizona-state-fair/
---

The follow-up book to _Phoenix's Greater Encanto-Palmcroft Neighborhood_, author and neighborhood advocate G.G. George chronicled the history of the Arizona State Fair from its territorial days up to the present. I supported the project by managing image assets as well as providing original photography.
```

#### Collaborative Project Entry

```yaml
---
title: Phoenix's Greater Encanto-Palmcroft Neighborhood
date: 2019-04-29
image: /assets/images/pages/EncantoPalmcroftCover.jpg
redirect_from:
  - /portfolio/phoenixs-greater-encanto-palmcroft-neighborhood/
---

Authors G.G. George and Leigh Conrad collaborated to write the definitive history of _Phoenix's Greater Encanto-Palmcroft Neighborhood_. Their book shared the humble beginnings of one of Phoenix's first suburban enclaves, the adjacent State Fair Grounds, and the efforts of neighborhood advocates to prevent these neighborhoods from being trashed by highways in the 1960s and 1970s. Today, these neighborhoods are some of Phoenix's best. I provided technical assistance as well as provided some original photography for the book.
```

### Common Portfolio Types

**Presentations/Lectures**:
- Feature presentation title and date
- Description includes context and key topics
- Image often shows slide or event photo
- Example: "A Brief History of Midtown Phoenix"

**Publications/Books**:
- Feature book title and publication date
- Description includes role (photographer, editor, technical assistance)
- Image shows book cover
- May mention collaborators/authors
- Examples: "The Arizona State Fair", "Phoenix's Greater Encanto-Palmcroft Neighborhood"

**Projects/Events**:
- Feature project name and completion/event date
- Description outlines project scope and outcomes
- Image represents the project visually

### Minimal Schema

Current entries use only three fields consistently:

1. `title` - Project name
2. `date` - Project date
3. `image` - Featured image
4. `redirect_from` - Legacy URLs (optional)
5. Content body - Project description

**No additional metadata fields** are currently used (no tags, categories, etc.)

### Usage Notes

- Portfolio collection is a work in progress with only 4 entries currently
- Simple, consistent structure across all entries
- Expansion potential with additional metadata
- Display format still being refined

### Work in Progress Notes

As this collection is currently being developed:

1. **Limited Entries**: Only 4 entries currently exist
2. **Consistent Pattern**: All entries follow same simple structure
3. **Expansion Potential**: Schema could be expanded with additional metadata
4. **Display Format**: Final presentation format still being refined

---

## 5. Pages (`_pages/`)

**Purpose**: Static content that doesn't change frequently: About page, Biography, Portfolio archive, Writing archives, Search, etc. Pages are not timestamped and are generally not included in feeds.

**Default Layout**: Varies by page purpose (e.g., `page`, `portfolio`, `gallery-page`, `search-page`)

### Output & Permalink

- **Permalink**: Custom per page (often set explicitly in front matter)
- **Output**: Published as individual pages

### YAML Front Matter Structure - Standard Page

```yaml
---
title: "Biography"
date: "2013-03-25"
layout: page
permalink: /about/
redirect_from:
    - /biography/
searchable: false
---
```

### YAML Front Matter Structure - Portfolio Page

```yaml
---
title: Portfolio
layout: portfolio
permalink: /portfolio
searchable: false
---
```

### YAML Front Matter Structure - Landing Page

```yaml
---
title: "Let's Connect"
layout: landing-page
image: "/assets/images/bluebackground.png"
searchable: false
permalink: /hi
collection: landing_sections
---
```

### Core Required Fields

**`title`**
- **Type**: String
- **Required**: Yes
- **Description**: The page title displayed in the browser and on the page
- **Examples**:
  ```yaml
  title: "Biography"
  title: "Privacy Policy"
  title: "Let's Connect"
  ```

**`layout`**
- **Type**: String
- **Required**: Yes
- **Description**: Specifies which Jekyll layout template to use
- **Common Values**:
  - `page` - Standard page layout
  - `landing-page` - Full-width landing page layout
  - `writing-base` - Writing/blog archive layout
  - `portfolio` - Portfolio items display
  - `search-page` - Search functionality page
  - `gallery-page` - Image gallery page
- **Examples**:
  ```yaml
  layout: page
  layout: landing-page
  layout: portfolio
  ```

**`permalink`**
- **Type**: String
- **Required**: Usually yes
- **Description**: The URL path for the page (relative to site root)
- **Format**: Should start with `/` and typically doesn't include file extension
- **Examples**:
  ```yaml
  permalink: /about/
  permalink: /about/privacy/
  permalink: /writing/
  permalink: /hi
  ```

### Optional Metadata Fields

**`date`**
- **Type**: String (ISO date format)
- **Required**: No
- **Description**: Date associated with the page (often used for "last updated" purposes)
- **Examples**:
  ```yaml
  date: 2025-02-06
  date: "2013-03-25"
  ```

**`subtitle`**
- **Type**: String
- **Required**: No
- **Description**: Additional descriptive text displayed below the title
- **Example**:
  ```yaml
  subtitle: Essays, thoughts, and observations
  ```

**`searchable`**
- **Type**: Boolean
- **Required**: No
- **Default**: `true` (assumed)
- **Description**: Controls whether the page appears in search results
- **Example**:
  ```yaml
  searchable: false
  ```

**`image`**
- **Type**: String (path)
- **Required**: No
- **Description**: Featured image for the page (used for social sharing or page header)
- **Example**:
  ```yaml
  image: "/assets/images/bluebackground.png"
  ```

**`collection`**
- **Type**: String
- **Required**: No (specific to landing pages)
- **Description**: Specifies which collection to use for sections
- **Example**:
  ```yaml
  collection: landing_sections
  ```

**`header_icon`**
- **Type**: String
- **Required**: No
- **Description**: Bootstrap icon class for header decoration
- **Example**:
  ```yaml
  header_icon: "bi-pen"
  ```

**`header_gradient`**
- **Type**: String
- **Required**: No
- **Description**: Tailwind gradient classes for header styling
- **Example**:
  ```yaml
  header_gradient: "from-blue-500 to-purple-600"
  ```

**`redirect_from`**
- **Type**: String or Array
- **Required**: No
- **Description**: Old URLs that should redirect to this page
- **Examples**:
  ```yaml
  redirect_from:
    - /privacy-policy/
    - /privacy/
  
  redirect_from:
    - /biography/
  ```

### Common Page Types

**Writing Archive**
- Directory: `_pages/writing.md`
- Displays list of all blog posts
- Usually uses `writing-base` or similar layout
- Sets `searchable: false` to avoid duplication in search

**Search Page**
- Directory: `_pages/search.html`
- Provides search functionality
- Uses `search-page` layout
- Usually an `.html` file with JavaScript for client-side search

**Portfolio**
- Directory: `_pages/portfolio.md`
- Displays portfolio items from `_portfolio/` collection
- Uses `portfolio` layout
- Often minimal front matter with layout handling content display

**Biography/About**
- Directory: `_pages/biography.md`
- Static biographical content
- Uses standard `page` layout
- Usually has long-form HTML/Markdown content

**Landing Pages**
- Use `layout: landing-page`
- May include `collection` for dynamic sections
- Often have `searchable: false`
- Example: "Let's Connect" (/hi)

**Legal/Policy Pages**
- Use `layout: page`
- Include date for "last updated" tracking
- Often have multiple `redirect_from` entries
- Example: Privacy Policy

### Field Usage Patterns

#### Minimal Page Example

```yaml
---
title: Portfolio
layout: portfolio
permalink: /portfolio
searchable: false
---
```

#### Standard Page Example

```yaml
---
title: "Biography"
date: "2013-03-25"
layout: page
permalink: /about/
redirect_from:
  - /biography/
---
```

#### Landing Page Example

```yaml
---
title: "Let's Connect"
layout: landing-page
image: "/assets/images/bluebackground.png"
searchable: false
permalink: /hi
collection: landing_sections
---
```

#### Archive/List Page Example

```yaml
---
title: Writing
subtitle: Essays, thoughts, and observations
layout: writing-base
permalink: /writing/
searchable: false
---
```

---

## Collection Configuration Reference

Below is how these collections are configured in `_config.yml`:

```yaml
collections:
  posts:
    output: true
    permalink: /:collection/:year/:year-:month/:title
  photography:
    output: true
    permalink: /photos/:year/:year-:month/:title
  portfolio:
    output: true
    permalink: /portfolio/:title
  working_notes:
    output: true
    permalink: /notes/:year-:month-:day/:title
  historic_posts:
    output: true
    permalink: /archive/posts/:title
```

And default layouts are assigned via:

```yaml
defaults:
  - scope: 
      path: "_posts"
    values:
      layout: single-post
  - scope:
      path: "_working_notes"
    values:
      layout: single-working-note
      future: false
```

---

## Front Matter Field Reference (All Types)

### Universal Fields (Used Across Multiple Types)

| Field | Type | Description |
|-------|------|-------------|
| `title` | String | Content title; always required |
| `date` | Date | Publication/creation date; required for posts/working-notes/photography, optional for pages |
| `tags` | Array | Keyword tags for organization and filtering |
| `image` | URL Path | Featured image; used in previews and social sharing |
| `redirect_from` | Array | Legacy URLs that should redirect to this content |
| `layout` | String | Template/layout to use for rendering (optional; defaults apply via config) |
| `permalink` | URL Path | Custom URL; if omitted, Jekyll derives from filename/collection rules |

### Type-Specific Fields

| Field | Types | Description |
|-------|-------|-------------|
| `categories` | Posts | Topic groupings for organizational hierarchy |
| `excerpt` | Posts | Custom summary for feeds; if omitted, auto-truncated to ~100 words |
| `featured` | Posts | When `true`, highlights post on homepage featured section |
| `image_alt` | Posts, Photography | Alt text for featured images (accessibility) |
| `show_image` | Posts | Controls whether featured image displays on post page |
| `landing_featured` | Posts | When `true`, shows post on `/hi` landing page |
| `post_credits` | Posts | Attribution for images, sources, collaborators |
| `render_with_liquid` | Posts | Whether to process Liquid templating in post content |
| `has_youtube_video` | Posts | Indicates post contains YouTube video embeds |
| `content_type` | Posts | Type of content (e.g., "essay") |
| `description` | Posts | Meta description for SEO |
| `searchable` | Pages | When `false`, excludes from site search index |
| `header_icon` | Pages | Bootstrap icon class for page header styling |
| `header_gradient` | Pages | Tailwind gradient utilities for header background |
| `collection` | Pages | Collection reference for dynamic page sections |
| `subtitle` | Pages | Secondary description below title |

---

## Best Practices

### Posts

- Include a featured image for better social sharing
- Use an excerpt if auto-generation produces poor results
- Mark important posts with `featured: true`
- Use categories for broad topics, tags for specific keywords
- Add `redirect_from` when migrating from legacy URLs
- Use proper alt text with `image_alt` for accessibility
- Set `show_image: true` to display featured images prominently

### Working Notes

- Keep titles concise and descriptive
- Use tags to group related notes
- Omit excerpt and featured fields—not used for this type
- Use for quick thoughts, updates, or WIP ideas before converting to full posts
- Minimize metadata; focus on content

### Photography

- Use descriptive titles that indicate subject/location
- Tag with location names for searchability
- Include caption text in the body
- Store high-resolution images in `/assets/photography/`
- Add `image_alt` text for all photos (accessibility)
- Consider timestamps when exact date is important

### Portfolio

- Keep project descriptions concise (1-3 paragraphs)
- Use clear project titles
- Include relevant date (completion or publication)
- Add featured image representing the work
- Consider adding collaborator information in description

### Pages

- Set explicit `permalink` values
- Use `searchable: false` for archive/collection pages to avoid search duplication
- Set `layout` to appropriate template (e.g., `portfolio`, `search-page`)
- Date can be omitted for evergreen pages
- Use header decorations (`header_icon`, `header_gradient`) sparingly for visual interest
- Organize related pages with consistent permalink structures

---

## Notes for CMS Migration

When migrating to a Headless CMS like Payload:

**Posts**: Map categories/tags to taxonomy relationships, create content blocks for credits and rich text
**Working Notes**: Simplify to essential fields (title, date, content, tags)
**Photography**: Focus on image upload/management, simple caption field, searchable tags
**Portfolio**: Add project type selection, optional fields for collaborators and external links
**Pages**: Template selection dropdown, dynamic section support for landing pages

### Field Priority Hierarchy

**High Priority (Core - Essential)**
- `title` (all), `date` (posts/notes/photos), `layout` (pages), `permalink` (pages), `content` (all), `image` (posts/photos/portfolio)

**Medium Priority (Common Display)**
- `categories`/`tags` (all), `excerpt`/`description` (posts), `image_alt` (posts/photos), `featured` (posts)

**Lower Priority (Optional/Special Features)**
- `post_credits`, `redirect_from`, `landing_featured`, `render_with_liquid`, `header_icon`, `header_gradient`, `collection`
