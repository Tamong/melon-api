# Melon Music Charts API

An API for retrieving music data from Melon, a South Korean music streaming service, with web scraping.

## Setup and Installation

To install dependencies:

```sh
bun install
```

To run:

```sh
bun run dev
```

Open http://localhost:3000

## API Documentation

### Base Endpoint

- `GET /` - Returns basic API information and available endpoints

### Chart Endpoints

- `GET /api/chart/top100` - Returns the Top 100 chart
- `GET /api/chart/hot100` - Returns the Hot 100 chart
- `GET /api/chart/day` - Returns the Daily chart
- `GET /api/chart/week` - Returns the Weekly chart
- `GET /api/chart/month` - Returns the Monthly chart

### Song Endpoint

- `GET /api/song/:songId` - Returns detailed information about a specific song

### Album Endpoint

- `GET /api/album/:albumId` - Returns detailed information about a specific album

### Response Format

Each chart endpoint returns an array of track objects with the following structure:

```json
{
  "rank": "1",
  "songId": "12345678",
  "title": "Song Title",
  "artists": ["Artist Name"],
  "album": "Album Name",
  "albumId": "87654321",
  "imageUrl": "https://example.com/image.jpg",
  "rankChange": {
    "direction": "up",
    "value": 2
  }
}
```

The song endpoint returns detailed information about a specific song:

```json
{
  "title": "Song Title",
  "artists": [
    {
      "name": "Artist Name",
      "id": "12345"
    }
  ],
  "album": {
    "name": "Album Name",
    "id": "67890"
  },
  "releaseDate": "2023.01.01",
  "genre": "댄스",
  "lyrics": "Song lyrics here...",
  "producers": [
    {
      "name": "Producer Name",
      "id": "54321",
      "roles": ["작사", "작곡"]
    }
  ]
}
```

The album endpoint returns detailed information about a specific album:

```json
{
  "albumId": "67890",
  "type": "정규",
  "title": "Album Title",
  "artists": [
    {
      "name": "Artist Name",
      "id": "12345"
    }
  ],
  "releaseDate": "2023.01.01",
  "genre": "K-POP",
  "publisher": "Example Entertainment",
  "agency": "Example Agency",
  "imageUrl": "https://example.com/album-cover.jpg",
  "songs": [
    {
      "songId": "56789",
      "title": "First Track",
      "artists": [
        {
          "name": "Artist Name",
          "id": "12345"
        }
      ],
      "isTitle": true
    },
    {
      "songId": "56790",
      "title": "Second Track (feat. Another Artist)",
      "artists": [
        {
          "name": "Artist Name",
          "id": "12345"
        },
        {
          "name": "Another Artist",
          "id": "67890"
        }
      ],
      "isTitle": false
    }
  ],
  "introduction": "This is an example album introduction text.\nIt can contain multiple lines describing the album."
}
```

## Features

### Caching

Chart data is cached for 1 minute to improve performance and reduce load on the Melon website.

### Analytics

The API includes an analytics middleware that tracks:

- Request ID
- HTTP method
- Path
- Full URL
- IP address
- User agent
- Referer
- Accept language
- Response status code
- Response time

Analytics data is currently logged to the console but can be configured to send to a database or logging service.

### Direct Data Access

You can use the chart and song scraping functionality directly without running the API server. This is useful for integrating the data into your own applications:

```ts
// For chart data
import { getMelonChart } from "./src/services/chart";

// Usage in an async function
async function fetchTopChart() {
  const chartData = await getMelonChart("top100");
  console.log(chartData);
}
```

Available chart types: `top100`, `hot100`, `day`, `week`, `month`

```ts
// For song data
import { getSongData } from "./src/services/song";

// Usage in an async function
async function fetchSongDetails() {
  const songData = await getSongData("12345678");
  console.log(songData);
}
```

```ts
// For album data
import { getAlbumData } from "./src/services/album";

// Usage in an async function
async function fetchAlbumDetails() {
  const albumData = await getAlbumData("12345678");
  console.log(albumData);
}
```

## Technical Details

- Built with Hono.js - a lightweight web framework
- Uses Cheerio for HTML parsing and web scraping
- Written in TypeScript
- Runs on Bun runtime for optimal performance
