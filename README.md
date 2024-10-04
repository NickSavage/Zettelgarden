# Zettelgarden

**NOTE: This is pretty experimental and designed for me to use. Things might break and change based on my whim, so be warned**

**Zettelgarden** is a personal knowledge management system implemented with React and Go, inspired by the idea of the [zettelkasten](https://zettelkasten.de/introduction/).

**Zettelgarden** started out as a digital implementation of Nick Savage's personal analog (i.e. on paper) zettelkasten and as a personal learning project.

## Features

- **Store Information**: Zettelgarden can hold many different types of information, from long-term "Cards" (individual, atomic pieces of information), "Tasks" (short-term to-do items), and "Files" (upload your PDFs). Upload everything you have and link it together, creating a digital garden of thoughts.
- **Connect Information**: Effortlessly link your content together to form a network of related ideas. Zettelgarden empowers you to create a web of knowledge where concepts and tasks are interconnected, ensuring you never lose context or insight.
- **Find Information**: Utilize Zettelgarden's advanced retrieval-augmented generation (RAG) to efficiently locate items within your data. The app intelligently suggests links and helps you uncover meaningful connections between seemingly disparate pieces of information.

## Why Zettelgarden?

Zettelgarden is an opinionated implementation of the zettelkasten technique, designed to facilitate a structured and interconnected database of information. It specializes in handling small, atomic notes that encapsulate discrete pieces of information - akin to index cards in a traditional setup. The core philosophy of Zettelgarden is that the true value emerges from linking these cards together.

There are two main benefits to keeping notes small: one, it enables you to curate information yourself. The point is not to dump articles in, but to read **and write** atomic thoughts that matter to the user. Then, using embeddings and retrival-augmented generation (RAG), information in Zettelgarden comes **pre-chunked**. This gives good results out of the box, and links you add only make it better.

## Architecture

- `zettelkasten-front`: Frontend, using React and Typescript
- `go-backend`: Backend, using Go with `net/http`
- `ios-app`: Experimental iOS app. It's pretty ugly, I wouldn't recommend using it yet.
- `python-mail`: Basic SMTP service. Written in python instead of Go because Go's SMTP services do not seem functional enough.
