# Zettelgarden

**NOTE: This is pretty experimental and designed for me to use. Things might break and change based on my whim, so be warned**

**Zettelgarden** is a personal knowledge management system implemented with React and Go, inspired by the idea of the [zettelkasten](https://zettelkasten.de/introduction/).

**Zettelgarden** started out as a digital implementation of Nick Savage's personal analog (i.e. on paper) zettelkasten and as a personal learning project.

## Features

- **Cards**: Create 'cards', which are meant to be individual, atomic pieces of information. They are arranged in a tree that can be traversed.
- **Tasks**: You can track all of your tasks, and link them with different cards
- **Files**: Upload files and link them to cards, to keep all of your information in the same place

## Architecture

- `zettelkasten-front`: Frontend, using React and Typescript
- `go-backend`: Backend, using Go with `net/http`
- `ios-app`: Experimental iOS app. It's pretty ugly, I wouldn't recommend using it yet.
