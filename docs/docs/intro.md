---
description: Create a doc page with rich content.
---

# Introduction

DaVinci is a generic framework, augmented by modules that implements specific functionalities.  
DaVinci has:

- App  
It's a generic container, that provides certain lifecycle phases that individual modules can hook into
for initializing and shutting down certain functionalities.

- Module  
A module is the place where all the heavy-lifting happens.  
Modules implements functionalities, like spinning up an HTTP server or a headless service that consumes from a RabbitMQ queue.
