---
title: "Saint Paul Live"
date: "2015-02-15"
layout: page
permalink: /saintpaullive/
redirect_from:
    - /stpaullive/
searchable: false
---

Occasionally live feed from a few floors above downtown Saint Paul:

**Where is this camera?** The camera is located at the [Galtier Plaza complex](https://en.wikipedia.org/wiki/Cray_Plaza) in downtown Saint Paul. It looks south over the Mississippi River, the St Paul Downtown Airport, and the West Side neighborhood of Saint Paul.

**What powers this camera?** The camera is a [TP-Link Tapo C120 camera](https://www.tp-link.com/us/home-networking/cloud-camera/tapo-c120/) that has been converted to a local-only camera not requiring any Internet connectivity. It's connected to [OBS](https://obsproject.com/) on a computer, which broadcasts the stream (when it's running) to Cloudflare, which provides the bandwidth to the stream. A HTML webpage overlay provides the current time and temperature from the St Paul Downtown Airport.

**Why so complicated? Couldn't you just use whatever tools are in the camera to power this live stream?** I'm not sure a $25 camera would have the horsepower to do so. That said, I'm not keen on IoT devices being able to connect directly to the Internet if it's at all possible.

**The stream's running, but the video is kind of glitchy. Who do I contact?** The stream is provided on a best-effort basis. I'm occasionally checking it when it's running, but no guarantees are made for the performance of the camera or stream.

**Why can't I hear anything?** Out of respect for the privacy of the person whose patio is hosting this camera, there is no audio.

**Why is it not a 24/7 stream?** Having a camera streaming 24/7 consumes limited internet bandwidth. The stream will be turned on during interesting activities or periods of inclement weather. Otherwise, it's turned off.
