# Zettelgarden

**Zettelgarden** is a personal knowledge management system implemented with React and Go, inspired by the idea of the [zettelkasten](https://zettelkasten.de/introduction/).

**Zettelgarden** started out as a digital implementation of Nick Savage's personal analog (i.e. on paper) zettelkasten and as a personal learning project.

## Architecture

- `zettelkasten-front`: Frontend, using React and Typescript
- `go-backend`: Backend, using Go with `net/http`
- `backend`: Original backend, using Python with Flask. Continues as a proxy layer between the frontend and backend until the rewrite is complete
- `ios-app`: Experimental iOS app
